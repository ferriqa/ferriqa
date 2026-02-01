/**
 * @ferriqa/adapters-db - Database Adapter Interface
 *
 * Universal database adapter interface for cross-runtime compatibility
 * Supports Bun (bun:sqlite), Node.js (better-sqlite3), and Deno (sqlite)
 */

/**
 * Query result row
 */
export interface QueryResult<T = unknown> {
  rows: T[];
  rowCount: number;
  lastInsertId?: number | bigint;
}

/**
 * Database connection configuration
 */
export interface DatabaseConfig {
  /** Database file path or :memory: for in-memory */
  path: string;
  /** Enable WAL mode (Write-Ahead Logging) */
  walMode?: boolean;
  /** Enable foreign keys */
  foreignKeys?: boolean;
  /** Busy timeout in milliseconds */
  busyTimeout?: number;
  /** Maximum connections for pooling */
  maxConnections?: number;
}

/**
 * Transaction isolation level
 */
export type IsolationLevel =
  | "READ_UNCOMMITTED"
  | "READ_COMMITTED"
  | "REPEATABLE_READ"
  | "SERIALIZABLE";

/**
 * Database transaction interface
 */
export interface DatabaseTransaction {
  /** Execute query within transaction */
  query<T = unknown>(sql: string, params?: unknown[]): Promise<QueryResult<T>>;
  /** Execute statement within transaction (INSERT, UPDATE, DELETE) */
  execute(
    sql: string,
    params?: unknown[],
  ): Promise<{ changes: number; lastInsertId?: number | bigint }>;
  /** Commit transaction */
  commit(): Promise<void>;
  /** Rollback transaction */
  rollback(): Promise<void>;
}

/**
 * Universal database adapter interface
 * All runtime-specific adapters implement this interface
 */
export interface DatabaseAdapter {
  /** Adapter name */
  readonly name: string;

  /** Runtime type */
  readonly runtime: "bun" | "node" | "deno";

  /** Connection configuration */
  readonly config: DatabaseConfig;

  /**
   * Connect to database
   * Initializes the database connection
   */
  connect(): Promise<void>;

  /**
   * Close database connection
   * Cleans up resources
   */
  close(): Promise<void>;

  /**
   * Execute a query
   * @param sql - SQL query string
   * @param params - Query parameters
   * @returns Query result with rows
   */
  query<T = unknown>(sql: string, params?: unknown[]): Promise<QueryResult<T>>;

  /**
   * Execute a single query (INSERT, UPDATE, DELETE)
   * @param sql - SQL statement
   * @param params - Statement parameters
   * @returns Rows affected and last insert ID
   */
  execute(
    sql: string,
    params?: unknown[],
  ): Promise<{ changes: number; lastInsertId?: number | bigint }>;

  /**
   * Execute multiple queries in a batch
   * @param statements - Array of SQL statements
   * @returns Batch results
   */
  batch<T = unknown>(
    statements: { sql: string; params?: unknown[] }[],
  ): Promise<QueryResult<T>[]>;

  /**
   * Begin a transaction
   * @param isolationLevel - Transaction isolation level
   * @returns Transaction handle
   */
  beginTransaction(
    isolationLevel?: IsolationLevel,
  ): Promise<DatabaseTransaction>;

  /**
   * Run callback within a transaction
   * Automatically commits or rolls back
   * @param callback - Function to execute within transaction
   * @param isolationLevel - Transaction isolation level
   */
  transaction<T>(
    callback: (trx: DatabaseTransaction) => Promise<T>,
    isolationLevel?: IsolationLevel,
  ): Promise<T>;

  /**
   * Check if connected
   */
  isConnected(): boolean;

  /**
   * Get database version
   */
  getVersion(): Promise<string>;

  /**
   * Execute PRAGMA command
   * @param pragma - PRAGMA name
   * @param value - Optional value to set
   * Note: Returns Promise<T> for cross-runtime consistency. Some underlying libraries
   * have synchronous pragma methods, but we wrap them to provide a uniform async interface.
   */
  pragma<T = unknown>(pragma: string, value?: unknown): Promise<T>;
}

/**
 * Database adapter factory options
 */
export interface AdapterFactoryOptions {
  /** Database configuration */
  config: DatabaseConfig;
  /** Force specific adapter (for testing) */
  forceAdapter?: "bun" | "better-sqlite3" | "deno-sqlite";
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Adapter connection state
 */
export enum AdapterState {
  DISCONNECTED = "disconnected",
  CONNECTING = "connecting",
  CONNECTED = "connected",
  ERROR = "error",
  CLOSED = "closed",
}

/**
 * Database error types - mapped to Ferriqa ErrorCode
 */
export enum DatabaseErrorType {
  CONNECTION_ERROR = "CONNECTION_ERROR",
  QUERY_ERROR = "QUERY_ERROR",
  TRANSACTION_ERROR = "TRANSACTION_ERROR",
  TIMEOUT_ERROR = "TIMEOUT_ERROR",
  CONSTRAINT_VIOLATION = "CONSTRAINT_VIOLATION",
  NOT_FOUND = "NOT_FOUND",
  UNKNOWN = "UNKNOWN",
}

// Re-export FerriqaDatabaseError and ErrorCode from @ferriqa/core
export { FerriqaDatabaseError, ErrorCode } from "@ferriqa/core";
