/**
 * @ferriqa/adapters-db - Better SQLite3 Adapter (Node.js)
 *
 * Node.js runtime database adapter using better-sqlite3
 * Synchronous API, high performance for Node.js
 */

import type {
  DatabaseAdapter,
  DatabaseConfig,
  DatabaseTransaction,
  IsolationLevel,
  QueryResult,
} from "../types.js";
import { AdapterState, FerriqaDatabaseError, ErrorCode } from "../types.js";

// better-sqlite3 types
type BetterSQLite3Database = {
  prepare<T>(sql: string): {
    all(...params: unknown[]): T[];
    get(...params: unknown[]): T | undefined;
    run(...params: unknown[]): {
      changes: number;
      lastInsertRowid: number | bigint;
    };
  };
  exec(sql: string): void;
  close(): void;
  /**
   * Note: better-sqlite3 pragma is synchronous (returns T, not Promise<T>),
   * but this adapter wraps it in async to match the DatabaseAdapter interface
   * for cross-runtime consistency
   */
  pragma<T>(pragma: string, options?: { simple?: boolean }): T;
  transaction<T>(fn: () => T): () => T;
};

/**
 * Better SQLite3 Adapter for Node.js
 * Uses better-sqlite3 package (synchronous, high performance)
 */
export class BetterSQLiteAdapter implements DatabaseAdapter {
  readonly name = "better-sqlite3";
  readonly runtime = "node" as const;
  readonly config: DatabaseConfig;

  private db: BetterSQLite3Database | null = null;
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
   * Check if better-sqlite3 is available
   */
  static async isSupported(): Promise<boolean> {
    try {
      // Check if we're in Node.js runtime
      if (typeof process === "undefined") {
        return false;
      }
      // Try to import better-sqlite3
      // @ts-ignore - better-sqlite3 has no type declarations, but we have custom types
      await import("better-sqlite3");
      return true;
    } catch {
      return false;
    }
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

    // Create and store connection promise to prevent race conditions
    this.connectionPromise = this.doConnect();
    return this.connectionPromise;
  }

  private async doConnect(): Promise<void> {
    try {
      this.state = AdapterState.CONNECTING;

      // Dynamic import better-sqlite3
      // @ts-ignore - better-sqlite3 has no type declarations, but we have custom types
      const Database = (await import("better-sqlite3")).default;
      this.db = new Database(this.config.path);

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
      // better-sqlite3 is synchronous - async keyword provides Promise wrapper
      const stmt = this.db!.prepare<T>(sql);
      const rows = params ? stmt.all(...params) : stmt.all();

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
      // better-sqlite3 is synchronous - async keyword provides Promise wrapper
      const stmt = this.db!.prepare(sql);
      const result = params ? stmt.run(...params) : stmt.run();

      return {
        changes: result.changes,
        lastInsertId: result.lastInsertRowid,
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
    this.db!.exec("BEGIN TRANSACTION;");

    return new BetterSQLiteTransaction(this.db!);
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
   * Note: This returns Promise<T> to match DatabaseAdapter interface for cross-runtime consistency.
   * The underlying better-sqlite3 pragma() is synchronous, but we wrap it in async.
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
 * Better SQLite3 Transaction
 */
class BetterSQLiteTransaction implements DatabaseTransaction {
  constructor(private db: BetterSQLite3Database) {}

  async query<T = unknown>(
    sql: string,
    params?: unknown[],
  ): Promise<QueryResult<T>> {
    try {
      // better-sqlite3 is synchronous - async keyword provides Promise wrapper
      const stmt = this.db.prepare<T>(sql);
      const rows = params ? stmt.all(...params) : stmt.all();

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
      // better-sqlite3 is synchronous - async keyword provides Promise wrapper
      const stmt = this.db.prepare(sql);
      const result = params ? stmt.run(...params) : stmt.run();

      return {
        changes: result.changes,
        lastInsertId: result.lastInsertRowid,
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
    this.db.exec("COMMIT;");
  }

  async rollback(): Promise<void> {
    this.db.exec("ROLLBACK;");
  }
}
