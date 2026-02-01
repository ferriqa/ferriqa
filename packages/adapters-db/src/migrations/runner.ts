/**
 * @ferriqa/adapters-db - Migration Runner
 *
 * Runtime-agnostic migration runner
 * Manages migration execution and rollback
 */

import type { DatabaseAdapter, QueryResult } from "../types.js";
import { FerriqaDatabaseError, ErrorCode } from "../types.js";
import type {
  Migration,
  MigrationRecord,
  MigrationStatus,
  MigrationResult,
  RollbackResult,
  MigrationRunnerOptions,
} from "./types.js";

/**
 * Migration runner
 * Manages database migrations
 */
export class MigrationRunner {
  private adapter: DatabaseAdapter;
  // Security: This value is hardcoded and private. SQLite doesn't support parameterized table names,
  // so other queries using this value use string interpolation. This is safe because the value is
  // controlled internally and not derived from user input. If making this configurable in the future,
  // ensure the value is validated against a whitelist (alphanumeric + underscore only).
  private migrationsTable = "migrations";

  constructor(adapter: DatabaseAdapter) {
    this.adapter = adapter;
  }

  /**
   * Initialize migrations table
   * Creates table if it doesn't exist
   */
  async initialize(): Promise<void> {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${this.migrationsTable} (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        executed_at INTEGER NOT NULL,
        execution_time_ms INTEGER
      )
    `;

    await this.adapter.execute(createTableSQL);
  }

  /**
   * Get all applied migrations from database
   */
  async getAppliedMigrations(): Promise<MigrationRecord[]> {
    const result = await this.adapter.query<{
      id: string;
      name: string;
      executed_at: number;
      execution_time_ms: number;
    }>(`
      SELECT id, name, executed_at, execution_time_ms
      FROM ${this.migrationsTable}
      ORDER BY id ASC
    `);

    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      executedAt: new Date(row.executed_at),
      executionTimeMs: row.execution_time_ms,
    }));
  }

  /**
   * Get migration status for all migrations
   */
  async getStatus(
    availableMigrations: Migration[],
  ): Promise<MigrationStatus[]> {
    const applied = await this.getAppliedMigrations();
    const appliedMap = new Map(applied.map((m) => [m.id, m]));

    return availableMigrations.map((migration) => {
      const record = appliedMap.get(migration.id);
      return {
        id: migration.id,
        name: migration.name,
        applied: !!record,
        executedAt: record?.executedAt,
        executionTimeMs: record?.executionTimeMs,
      };
    });
  }

  /**
   * Run pending migrations
   */
  async migrate(
    migrations: Migration[],
    options: MigrationRunnerOptions = {},
  ): Promise<MigrationResult> {
    const { transactional = true, stopOnError = true, logger } = options;

    const startTime = Date.now();
    const applied: string[] = [];
    const skipped: Array<{ id: string; error: string }> = [];

    // Get already applied migrations
    const appliedIds = new Set(
      (await this.getAppliedMigrations()).map((m) => m.id),
    );

    // Filter pending migrations
    const pending = migrations.filter((m) => !appliedIds.has(m.id));

    if (pending.length === 0) {
      logger?.("No pending migrations");
      return {
        success: true,
        applied: [],
        totalTimeMs: 0,
      };
    }

    logger?.(`Running ${pending.length} migration(s)...`);

    // Transaction behavior: When transactional=true and stopOnError=false, we skip
    // transactions to allow partial migrations (best effort mode). This ensures that
    // if one migration fails, subsequent migrations can still run. If both are true,
    // we use transactions for atomic all-or-nothing behavior.
    const useTransaction = transactional && stopOnError;

    // Execute migrations
    if (useTransaction) {
      // Run in transaction
      let currentMigrationId: string | null = null;
      try {
        await this.adapter.transaction(async (trx) => {
          for (const migration of pending) {
            currentMigrationId = migration.id;
            logger?.(`Applying migration: ${migration.id} - ${migration.name}`);

            const migrationStart = Date.now();

            try {
              await migration.up(trx);

              const executionTime = Date.now() - migrationStart;

              // Record migration (Drizzle converts Date to timestamp automatically)
              await trx.execute(
                `
                INSERT INTO ${this.migrationsTable} (id, name, executed_at, execution_time_ms)
                VALUES (?, ?, ?, ?)
              `,
                [migration.id, migration.name, new Date(), executionTime],
              );

              applied.push(migration.id);
              logger?.(`✓ Applied ${migration.id} (${executionTime}ms)`);
            } catch (error) {
              if (stopOnError) {
                throw error;
              }
              logger?.(`✗ Failed ${migration.id}: ${(error as Error).message}`);
            }
          }
        });
      } catch (error) {
        return {
          success: false,
          applied,
          failed: {
            id: currentMigrationId || "unknown",
            error: (error as Error).message,
          },
          totalTimeMs: Date.now() - startTime,
        };
      }
    } else {
      // Run without transaction (either transactional=false or stopOnError=false)
      for (const migration of pending) {
        logger?.(`Applying migration: ${migration.id} - ${migration.name}`);

        const migrationStart = Date.now();

        try {
          await migration.up(this.adapter);

          const executionTime = Date.now() - migrationStart;

          // Record migration
          await this.adapter.execute(
            `
            INSERT INTO ${this.migrationsTable} (id, name, executed_at, execution_time_ms)
            VALUES (?, ?, ?, ?)
          `,
            [migration.id, migration.name, new Date(), executionTime],
          );

          applied.push(migration.id);
          logger?.(`✓ Applied ${migration.id} (${executionTime}ms)`);
        } catch (error) {
          if (stopOnError) {
            return {
              success: false,
              applied,
              failed: {
                id: migration.id,
                error: (error as Error).message,
              },
              totalTimeMs: Date.now() - startTime,
            };
          }
          // Track failed migration in best-effort mode
          skipped.push({
            id: migration.id,
            error: (error as Error).message,
          });
          logger?.(`✗ Failed ${migration.id}: ${(error as Error).message}`);
        }
      }
    }

    return {
      success: true,
      applied,
      ...(skipped.length > 0 && { skipped }),
      totalTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Rollback migrations
   * @param count Number of migrations to rollback (default: 1)
   */
  async rollback(
    migrations: Migration[],
    count = 1,
    options: MigrationRunnerOptions = {},
  ): Promise<RollbackResult> {
    const { transactional = true, stopOnError = true, logger } = options;

    const startTime = Date.now();
    const rolledBack: string[] = [];

    // Get applied migrations
    const applied = await this.getAppliedMigrations();

    if (applied.length === 0) {
      logger?.("No migrations to rollback");
      return {
        success: true,
        rolledBack: [],
        totalTimeMs: 0,
      };
    }

    // Get migrations to rollback (most recent first)
    const toRollback = applied.slice(-count).reverse();

    logger?.(`Rolling back ${toRollback.length} migration(s)...`);

    // Create migration map for quick lookup
    const migrationMap = new Map(migrations.map((m) => [m.id, m]));

    if (transactional) {
      let currentMigrationId: string | null = null;
      try {
        await this.adapter.transaction(async (trx) => {
          for (const record of toRollback) {
            const migration = migrationMap.get(record.id);

            if (!migration) {
              throw new FerriqaDatabaseError(
                ErrorCode.DB_MIGRATION_FAILED,
                `Migration ${record.id} not found in available migrations`,
              );
            }

            currentMigrationId = migration.id;
            logger?.(`Rolling back: ${migration.id} - ${migration.name}`);

            try {
              await migration.down(trx);

              // Remove migration record
              await trx.execute(
                `DELETE FROM ${this.migrationsTable} WHERE id = ?`,
                [migration.id],
              );

              rolledBack.push(migration.id);
              logger?.(`✓ Rolled back ${migration.id}`);
            } catch (error) {
              if (stopOnError) {
                throw error;
              }
              logger?.(
                `✗ Failed to rollback ${migration.id}: ${(error as Error).message}`,
              );
            }
          }
        });
      } catch (error) {
        return {
          success: false,
          rolledBack,
          failed: {
            id: currentMigrationId || "unknown",
            error: (error as Error).message,
          },
          totalTimeMs: Date.now() - startTime,
        };
      }
    } else {
      for (const record of toRollback) {
        const migration = migrationMap.get(record.id);

        if (!migration) {
          if (stopOnError) {
            return {
              success: false,
              rolledBack,
              failed: {
                id: record.id,
                error: `Migration not found in available migrations`,
              },
              totalTimeMs: Date.now() - startTime,
            };
          }
          continue;
        }

        logger?.(`Rolling back: ${migration.id} - ${migration.name}`);

        try {
          await migration.down(this.adapter);

          // Remove migration record
          await this.adapter.execute(
            `DELETE FROM ${this.migrationsTable} WHERE id = ?`,
            [migration.id],
          );

          rolledBack.push(migration.id);
          logger?.(`✓ Rolled back ${migration.id}`);
        } catch (error) {
          if (stopOnError) {
            return {
              success: false,
              rolledBack,
              failed: {
                id: migration.id,
                error: (error as Error).message,
              },
              totalTimeMs: Date.now() - startTime,
            };
          }
          logger?.(
            `✗ Failed to rollback ${migration.id}: ${(error as Error).message}`,
          );
        }
      }
    }

    return {
      success: true,
      rolledBack,
      totalTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Check if migration table exists
   */
  async isInitialized(): Promise<boolean> {
    // Use sqlite_master to check table existence instead of error message matching.
    // Note: Table name is parameterized here (comparing as value), unlike DDL/DML queries
    // where table names appear as identifiers and cannot be parameterized in SQLite.
    const result = await this.adapter.query<{ name: string }>(
      `SELECT name FROM sqlite_master WHERE type='table' AND name = ? LIMIT 1`,
      [this.migrationsTable],
    );
    return result.rows.length > 0;
  }
}

/**
 * Create migration runner helper
 */
export async function createMigrationRunner(
  adapter: DatabaseAdapter,
): Promise<MigrationRunner> {
  const runner = new MigrationRunner(adapter);
  await runner.initialize();
  return runner;
}
