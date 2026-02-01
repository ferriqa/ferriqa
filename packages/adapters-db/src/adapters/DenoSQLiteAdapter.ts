/**
 * @ferriqa/adapters-db - Deno SQLite Adapter
 *
 * Deno runtime database adapter using sqlite from deno.land/x
 */

import type {
  DatabaseAdapter,
  DatabaseConfig,
  DatabaseTransaction,
  IsolationLevel,
  QueryResult,
} from "../types.ts";
import { AdapterState, FerriqaDatabaseError, ErrorCode } from "../types.ts";

// Deno sqlite types
type DenoDatabase = {
  query<T>(sql: string, params?: unknown[]): T[];
  queryOne<T>(sql: string, params?: unknown[]): T | null;
  execute(
    sql: string,
    params?: unknown[],
  ): { rowsAffected: number; lastInsertId: number | bigint };
  close(): void;
};

/**
 * Deno SQLite Adapter
 * Uses sqlite module from deno.land/x
 */
export class DenoSQLiteAdapter implements DatabaseAdapter {
  readonly name = "deno-sqlite";
  readonly runtime = "deno" as const;
  readonly config: DatabaseConfig;

  private db: DenoDatabase | null = null;
  private state: AdapterState = AdapterState.DISCONNECTED;
  private connectionPromise: Promise<void> | null = null;

  constructor(config: DatabaseConfig) {
    this.config = {
      walMode: true,
      foreignKeys: true,
      busyTimeout: 5000,
      ...config,
    };
  }

  /**
   * Check if running in Deno runtime
   */
  static isSupported(): boolean {
    return typeof Deno !== "undefined";
  }

  /**
   * Connect to database
   */
  async connect(): Promise<void> {
    // Return immediately if already connected
    if (this.state === AdapterState.CONNECTED) {
      return;
    }

    // If connection is in progress, wait for it
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    if (!DenoSQLiteAdapter.isSupported()) {
      throw new FerriqaDatabaseError(
        ErrorCode.DB_CONNECTION_FAILED,
        "Deno runtime not detected. DenoSQLiteAdapter requires Deno runtime.",
      );
    }

    // Create and store connection promise to prevent race conditions
    this.connectionPromise = this.doConnect();
    return this.connectionPromise;
  }

  private async doConnect(): Promise<void> {
    try {
      this.state = AdapterState.CONNECTING;

      // Dynamic import with pinned version for reproducibility
      // @ts-ignore - Deno remote module, not resolvable by TypeScript/Node.js IDE
      const { DB } = await import("https://deno.land/x/sqlite@v3.9.1/mod.ts");
      this.db = new DB(this.config.path);

      // Configure pragmas
      await this.configurePragmas();

      this.state = AdapterState.CONNECTED;
    } catch (error) {
      this.state = AdapterState.ERROR;
      throw new FerriqaDatabaseError(
        ErrorCode.DB_CONNECTION_FAILED,
        `Failed to connect to SQLite database: ${(error as Error).message}`,
        { cause: error as Error },
      );
    } finally {
      // Clear connection promise to allow retry on failure
      this.connectionPromise = null;
    }
  }

  /**
   * Configure SQLite pragmas
   */
  private async configurePragmas(): Promise<void> {
    if (!this.db) return;

    // Enable WAL mode for better concurrency
    if (this.config.walMode) {
      await this.pragma("journal_mode", "WAL");
    }

    // Enable foreign keys
    if (this.config.foreignKeys) {
      await this.pragma("foreign_keys", "ON");
    }

    // Set busy timeout
    if (this.config.busyTimeout) {
      await this.pragma("busy_timeout", this.config.busyTimeout);
    }
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      try {
        this.db.close();
      } finally {
        // Always reset state even if close() throws
        this.db = null;
        this.state = AdapterState.CLOSED;
      }
    }
  }

  /**
   * Execute a query and return results
   */
  async query<T = unknown>(
    sql: string,
    params?: unknown[],
  ): Promise<QueryResult<T>> {
    this.ensureConnected();

    try {
      const rows = this.db!.query<T>(sql, params || []);

      return {
        rows,
        rowCount: rows.length,
      };
    } catch (error) {
      throw this.normalizeError(error as Error, sql);
    }
  }

  /**
   * Execute a statement (INSERT, UPDATE, DELETE)
   */
  async execute(
    sql: string,
    params?: unknown[],
  ): Promise<{ changes: number; lastInsertId?: number | bigint }> {
    this.ensureConnected();

    try {
      const result = this.db!.execute(sql, params || []);

      return {
        changes: result.rowsAffected,
        lastInsertId: result.lastInsertId,
      };
    } catch (error) {
      throw this.normalizeError(error as Error, sql);
    }
  }

  /**
   * Execute multiple statements in a batch
   */
  async batch<T = unknown>(
    statements: { sql: string; params?: unknown[] }[],
  ): Promise<QueryResult<T>[]> {
    this.ensureConnected();

    const results: QueryResult<T>[] = [];

    // Use transaction for batch
    await this.transaction(async (trx) => {
      for (const { sql, params } of statements) {
        const result = await trx.query<T>(sql, params);
        results.push(result);
      }
    });

    return results;
  }

  /**
   * Begin a transaction
   */
  async beginTransaction(
    isolationLevel?: IsolationLevel,
  ): Promise<DatabaseTransaction> {
    this.ensureConnected();

    // SQLite doesn't support varying isolation levels
    this.db!.execute("BEGIN TRANSACTION;");

    return new DenoSQLiteTransaction(this.db!);
  }

  /**
   * Run callback within a transaction
   */
  async transaction<T>(
    callback: (trx: DatabaseTransaction) => Promise<T>,
    isolationLevel?: IsolationLevel,
  ): Promise<T> {
    const trx = await this.beginTransaction(isolationLevel);

    try {
      const result = await callback(trx);
      await trx.commit();
      return result;
    } catch (error) {
      // Always attempt rollback to clean up transaction state
      try {
        await trx.rollback();
      } catch (rollbackError) {
        // Rollback failed - include in error but don't mask original error
        throw new FerriqaDatabaseError(
          ErrorCode.DB_TRANSACTION_FAILED,
          `Transaction failed and rollback also failed: ${(error as Error).message}. Rollback error: ${(rollbackError as Error).message}`,
        );
      }
      throw error;
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.state === AdapterState.CONNECTED && this.db !== null;
  }

  /**
   * Get SQLite version
   */
  async getVersion(): Promise<string> {
    const result = await this.query<{ version: string }>(
      "SELECT sqlite_version() as version",
    );
    return result.rows[0]?.version || "unknown";
  }

  /**
   * Execute PRAGMA command
   * Note: PRAGMA name is validated to prevent injection
   * Note: Returns Promise<T> to match DatabaseAdapter interface for cross-runtime consistency
   */
  async pragma<T = unknown>(pragma: string, value?: unknown): Promise<T> {
    // Validate pragma name - only allow alphanumeric and underscores, must start with letter
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(pragma)) {
      throw new FerriqaDatabaseError(
        ErrorCode.DB_QUERY_FAILED,
        `Invalid pragma name: ${pragma}`,
      );
    }

    if (value !== undefined) {
      await this.execute(`PRAGMA ${pragma} = ?;`, [value]);
    }

    // Query the actual value from database for consistency across all adapters
    const result = await this.query<T>(`PRAGMA ${pragma};`);
    return result.rows[0] as T;
  }

  /**
   * Ensure database is connected
   */
  private ensureConnected(): void {
    if (!this.isConnected()) {
      throw new FerriqaDatabaseError(
        ErrorCode.DB_CONNECTION_FAILED,
        "Database not connected. Call connect() first.",
      );
    }
  }

  /**
   * Normalize errors to FerriqaDatabaseError
   */
  private normalizeError(error: Error, sql?: string): FerriqaDatabaseError {
    const message = error.message.toLowerCase();

    if (message.includes("constraint") || message.includes("unique")) {
      return new FerriqaDatabaseError(
        ErrorCode.DB_UNIQUE_VIOLATION,
        error.message,
        { cause: error, metadata: { sql } },
      );
    }

    if (message.includes("timeout") || message.includes("busy")) {
      return new FerriqaDatabaseError(ErrorCode.DB_TIMEOUT, error.message, {
        cause: error,
        metadata: { sql },
      });
    }

    return new FerriqaDatabaseError(ErrorCode.DB_QUERY_FAILED, error.message, {
      cause: error,
      metadata: { sql },
    });
  }
}

/**
 * Deno SQLite Transaction
 */
class DenoSQLiteTransaction implements DatabaseTransaction {
  constructor(private db: DenoDatabase) {}

  async query<T = unknown>(
    sql: string,
    params?: unknown[],
  ): Promise<QueryResult<T>> {
    try {
      const rows = this.db.query<T>(sql, params || []);

      return {
        rows,
        rowCount: rows.length,
      };
    } catch (error) {
      throw new FerriqaDatabaseError(
        ErrorCode.DB_QUERY_FAILED,
        (error as Error).message,
        { cause: error as Error, metadata: { sql } },
      );
    }
  }

  async execute(
    sql: string,
    params?: unknown[],
  ): Promise<{ changes: number; lastInsertId?: number | bigint }> {
    try {
      const result = this.db.execute(sql, params || []);

      return {
        changes: result.rowsAffected,
        lastInsertId: result.lastInsertId,
      };
    } catch (error) {
      throw new FerriqaDatabaseError(
        ErrorCode.DB_QUERY_FAILED,
        (error as Error).message,
        { cause: error as Error, metadata: { sql } },
      );
    }
  }

  async commit(): Promise<void> {
    this.db.execute("COMMIT;");
  }

  async rollback(): Promise<void> {
    this.db.execute("ROLLBACK;");
  }
}
