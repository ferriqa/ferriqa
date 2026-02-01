/**
 * @ferriqa/core - Mock Implementations
 *
 * Mock implementations for testing.
 * Provides mock versions of core services and adapters.
 */

// Local type definitions to avoid circular dependencies
// These are minimal type definitions for the mock implementations

export interface DatabaseConfig {
  path: string;
  walMode?: boolean;
  foreignKeys?: boolean;
  busyTimeout?: number;
}

export interface QueryResult<T> {
  rows: T[];
  rowCount: number;
}

export interface DatabaseTransaction {
  query<T>(sql: string, params?: unknown[]): Promise<QueryResult<T>>;
  execute(
    sql: string,
    params?: unknown[],
  ): Promise<{ changes: number; lastInsertId?: number | bigint }>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

export interface DatabaseAdapter {
  readonly name: string;
  readonly runtime: string;
  readonly config: DatabaseConfig;
  connect(): Promise<void>;
  close(): Promise<void>;
  isConnected(): boolean;
  query<T>(sql: string, params?: unknown[]): Promise<QueryResult<T>>;
  execute(
    sql: string,
    params?: unknown[],
  ): Promise<{ changes: number; lastInsertId?: number | bigint }>;
  batch<T>(
    statements: { sql: string; params?: unknown[] }[],
  ): Promise<QueryResult<T>[]>;
  beginTransaction(isolationLevel?: string): Promise<DatabaseTransaction>;
  transaction<T>(
    callback: (trx: DatabaseTransaction) => Promise<T>,
    isolationLevel?: string,
  ): Promise<T>;
  getVersion(): Promise<string>;
  pragma<T>(pragma: string, value?: unknown): Promise<T>;
}

export type IsolationLevel =
  | "READ_UNCOMMITTED"
  | "READ_COMMITTED"
  | "REPEATABLE_READ"
  | "SERIALIZABLE";

/**
 * Mock Database Adapter for testing
 * Implements DatabaseAdapter interface with in-memory storage
 */
export class MockDatabaseAdapter implements DatabaseAdapter {
  readonly name = "mock-sqlite";
  readonly runtime = "mock" as const;
  readonly config: DatabaseConfig;

  private connected = false;
  private data: Map<string, unknown[]> = new Map();
  private idCounter = 1;

  constructor(config: DatabaseConfig = { path: ":memory:" }) {
    this.config = config;
  }

  async connect(): Promise<void> {
    this.connected = true;
  }

  async close(): Promise<void> {
    this.connected = false;
    this.data.clear();
  }

  isConnected(): boolean {
    return this.connected;
  }

  async query<T = unknown>(
    sql: string,
    params?: unknown[],
  ): Promise<QueryResult<T>> {
    this.ensureConnected();

    // Simple query parsing for mock
    const lowerSql = sql.toLowerCase();

    if (lowerSql.includes("select")) {
      return this.mockSelect<T>(sql, params);
    }

    return { rows: [], rowCount: 0 };
  }

  async execute(
    sql: string,
    params?: unknown[],
  ): Promise<{ changes: number; lastInsertId?: number | bigint }> {
    this.ensureConnected();

    const lowerSql = sql.toLowerCase();

    if (lowerSql.includes("insert")) {
      return this.mockInsert(sql, params);
    } else if (lowerSql.includes("update")) {
      return this.mockUpdate(sql, params);
    } else if (lowerSql.includes("delete")) {
      return this.mockDelete(sql, params);
    }

    return { changes: 0 };
  }

  async batch<T = unknown>(
    statements: { sql: string; params?: unknown[] }[],
  ): Promise<QueryResult<T>[]> {
    const results: QueryResult<T>[] = [];
    for (const stmt of statements) {
      const result = await this.query<T>(stmt.sql, stmt.params);
      results.push(result);
    }
    return results;
  }

  async beginTransaction(
    _isolationLevel?: IsolationLevel,
  ): Promise<DatabaseTransaction> {
    return new MockTransaction(this);
  }

  async transaction<T>(
    callback: (trx: DatabaseTransaction) => Promise<T>,
    _isolationLevel?: IsolationLevel,
  ): Promise<T> {
    const trx = await this.beginTransaction();
    try {
      const result = await callback(trx);
      await trx.commit();
      return result;
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  async getVersion(): Promise<string> {
    return "mock-3.0.0";
  }

  async pragma<T = unknown>(_pragma: string, _value?: unknown): Promise<T> {
    return undefined as T;
  }

  private ensureConnected(): void {
    if (!this.connected) {
      throw new Error("Database not connected");
    }
  }

  private mockSelect<T>(sql: string, params?: unknown[]): QueryResult<T> {
    // Extract table name from simple SELECT statements
    const match = sql.match(/from\s+(\w+)/i);
    const tableName = match ? match[1] : "default";

    let rows = (this.data.get(tableName) || []) as T[];

    // Simple WHERE clause filtering
    if (params && params.length > 0 && sql.toLowerCase().includes("where")) {
      // Very basic filtering for testing
      rows = rows.filter((row) => {
        const rowObj = row as Record<string, unknown>;
        return params.some((param) => Object.values(rowObj).includes(param));
      });
    }

    return { rows, rowCount: rows.length };
  }

  private mockInsert(
    sql: string,
    params?: unknown[],
  ): { changes: number; lastInsertId?: number | bigint } {
    const match = sql.match(/into\s+(\w+)/i);
    const tableName = match ? match[1] : "default";

    const tableData = this.data.get(tableName) || [];
    const newRow: Record<string, unknown> = { id: this.idCounter++ };

    if (params) {
      // Note: Using generic column names (col0, col1, etc.) is intentional
      // This is a lightweight mock for testing basic INSERT operations
      // Full SQL parsing to extract actual column names would add unnecessary
      // complexity for a mock adapter. Tests should access data via the row ID
      // or use seedData() for more specific test data.
      params.forEach((param, index) => {
        newRow[`col${index}`] = param;
      });
    }

    tableData.push(newRow);
    this.data.set(tableName, tableData);

    return { changes: 1, lastInsertId: newRow.id as number };
  }

  private mockUpdate(sql: string, params?: unknown[]): { changes: number } {
    const match = sql.match(/update\s+(\w+)/i);
    const tableName = match ? match[1] : "default";

    const tableData = this.data.get(tableName) || [];
    // Mock update - just return 1 change for simplicity
    return { changes: params ? 1 : 0 };
  }

  private mockDelete(sql: string, params?: unknown[]): { changes: number } {
    const match = sql.match(/from\s+(\w+)/i);
    const tableName = match ? match[1] : "default";

    const tableData = this.data.get(tableName) || [];
    const initialLength = tableData.length;

    // Remove matching rows
    if (params && params.length > 0) {
      const filtered = tableData.filter((row) => {
        const rowObj = row as Record<string, unknown>;
        return !params.some((param) => Object.values(rowObj).includes(param));
      });
      this.data.set(tableName, filtered);
      return { changes: initialLength - filtered.length };
    }

    return { changes: 0 };
  }

  // Helper method for tests to seed data
  seedData(tableName: string, data: unknown[]): void {
    this.data.set(tableName, [...data]);
  }

  // Helper method to get all data from a table
  getData(tableName: string): unknown[] {
    return this.data.get(tableName) || [];
  }

  // Helper to clear all data
  clearData(): void {
    this.data.clear();
    this.idCounter = 1;
  }
}

/**
 * Mock Transaction for testing
 */
class MockTransaction implements DatabaseTransaction {
  constructor(private adapter: MockDatabaseAdapter) {}

  async query<T = unknown>(
    sql: string,
    params?: unknown[],
  ): Promise<QueryResult<T>> {
    return this.adapter.query(sql, params);
  }

  async execute(
    sql: string,
    params?: unknown[],
  ): Promise<{ changes: number; lastInsertId?: number | bigint }> {
    return this.adapter.execute(sql, params);
  }

  async commit(): Promise<void> {
    // Mock commit - in real implementation this would persist changes
  }

  async rollback(): Promise<void> {
    // Mock rollback - in real implementation this would discard changes
  }
}

/**
 * Mock Error Transport for testing
 * Captures errors instead of sending them
 */
export class MockErrorTransport {
  name = "mock";
  level = "error";
  capturedErrors: Array<{
    error: Error;
    context: Record<string, unknown>;
    timestamp: Date;
  }> = [];

  async send(error: Error, context: Record<string, unknown>): Promise<void> {
    this.capturedErrors.push({
      error,
      context,
      timestamp: new Date(),
    });
  }

  getCapturedErrors(): Array<{
    error: Error;
    context: Record<string, unknown>;
    timestamp: Date;
  }> {
    return this.capturedErrors;
  }

  clear(): void {
    this.capturedErrors = [];
  }

  hasErrors(): boolean {
    return this.capturedErrors.length > 0;
  }
}

/**
 * Mock Logger for testing
 * Captures log messages instead of outputting them
 */
export class MockLogger {
  logs: Array<{
    level: string;
    message: string;
    metadata?: Record<string, unknown>;
    timestamp: Date;
  }> = [];

  debug(message: string, metadata?: Record<string, unknown>): void {
    this.log("debug", message, metadata);
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    this.log("info", message, metadata);
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    this.log("warn", message, metadata);
  }

  error(message: string, metadata?: Record<string, unknown>): void {
    this.log("error", message, metadata);
  }

  private log(
    level: string,
    message: string,
    metadata?: Record<string, unknown>,
  ): void {
    this.logs.push({
      level,
      message,
      metadata,
      timestamp: new Date(),
    });
  }

  getLogs(level?: string): typeof this.logs {
    if (level) {
      return this.logs.filter((log) => log.level === level);
    }
    return this.logs;
  }

  clear(): void {
    this.logs = [];
  }

  hasLogs(level?: string): boolean {
    return this.getLogs(level).length > 0;
  }
}

/**
 * Mock File System for testing
 * Provides in-memory file operations
 */
export class MockFileSystem {
  private files: Map<string, string> = new Map();
  private directories: Set<string> = new Set();

  async readFile(path: string): Promise<string> {
    const content = this.files.get(path);
    if (content === undefined) {
      throw new Error(`ENOENT: no such file or directory, open '${path}'`);
    }
    return content;
  }

  async writeFile(path: string, content: string): Promise<void> {
    this.files.set(path, content);
    // Add parent directories
    const parts = path.split("/");
    let currentPath = "";
    for (let i = 0; i < parts.length - 1; i++) {
      currentPath += parts[i] + "/";
      this.directories.add(currentPath);
    }
  }

  async exists(path: string): Promise<boolean> {
    return this.files.has(path) || this.directories.has(path);
  }

  async mkdir(path: string, _options?: { recursive?: boolean }): Promise<void> {
    this.directories.add(path.endsWith("/") ? path : path + "/");
  }

  async readdir(path: string): Promise<string[]> {
    const entries: string[] = [];
    const prefix = path.endsWith("/") ? path : path + "/";

    for (const [filePath] of this.files) {
      if (filePath.startsWith(prefix)) {
        const relativePath = filePath.slice(prefix.length);
        const firstPart = relativePath.split("/")[0];
        if (firstPart && !entries.includes(firstPart)) {
          entries.push(firstPart);
        }
      }
    }

    return entries;
  }

  async rm(path: string, _options?: { recursive?: boolean }): Promise<void> {
    // Note: _options parameter is prefixed because recursive handling is automatic
    // This implementation always recursively removes the path and all children
    // The _options.recursive flag is accepted for API compatibility but ignored
    // because this mock always behaves as if recursive: true
    this.files.delete(path);
    this.directories.delete(path.endsWith("/") ? path : path + "/");

    // Remove files and directories inside (recursive deletion)
    for (const [filePath] of this.files) {
      if (filePath.startsWith(path)) {
        this.files.delete(filePath);
      }
    }
    for (const dirPath of this.directories) {
      if (dirPath.startsWith(path)) {
        this.directories.delete(dirPath);
      }
    }
  }

  reset(): void {
    this.files.clear();
    this.directories.clear();
  }

  getFiles(): Map<string, string> {
    return new Map(this.files);
  }
}

/**
 * Mock Timer for testing
 * Controls time in tests
 */
export class MockTimer {
  private currentTime: number;
  private timers: Array<{
    id: number;
    callback: () => void;
    delay: number;
    targetTime: number;
  }> = [];
  private nextTimerId = 1;

  constructor(initialTime = Date.now()) {
    this.currentTime = initialTime;
  }

  now(): number {
    return this.currentTime;
  }

  advance(ms: number): void {
    this.currentTime += ms;
    this.runTimers();
  }

  setTimeout(callback: () => void, delay: number): number {
    const id = this.nextTimerId++;
    this.timers.push({
      id,
      callback,
      delay,
      targetTime: this.currentTime + delay,
    });
    return id;
  }

  clearTimeout(id: number): void {
    const index = this.timers.findIndex((t) => t.id === id);
    if (index !== -1) {
      this.timers.splice(index, 1);
    }
  }

  private runTimers(): void {
    const dueTimers = this.timers.filter(
      (t) => t.targetTime <= this.currentTime,
    );
    for (const timer of dueTimers) {
      timer.callback();
    }
    this.timers = this.timers.filter((t) => t.targetTime > this.currentTime);
  }

  reset(): void {
    this.timers = [];
    this.nextTimerId = 1;
  }
}

/**
 * Create a mock function that tracks calls
 */
export function createMockFn<
  T extends (...args: unknown[]) => unknown,
>(): MockFn<T> {
  return new MockFn<T>();
}

class MockFn<T extends (...args: unknown[]) => unknown> {
  calls: Array<{ args: Parameters<T>; returnValue: ReturnType<T> }> = [];
  returnValue: ReturnType<T> | undefined;
  implementation: T | undefined;

  call(...args: Parameters<T>): ReturnType<T> {
    let result: ReturnType<T>;

    if (this.implementation) {
      result = this.implementation(...args) as ReturnType<T>;
    } else if (this.returnValue !== undefined) {
      result = this.returnValue;
    } else {
      result = undefined as ReturnType<T>;
    }

    this.calls.push({ args, returnValue: result });
    return result;
  }

  mockReturnValue(value: ReturnType<T>): this {
    this.returnValue = value;
    return this;
  }

  mockImplementation(fn: T): this {
    this.implementation = fn;
    return this;
  }

  getCalls(): typeof this.calls {
    return this.calls;
  }

  getCallCount(): number {
    return this.calls.length;
  }

  wasCalled(): boolean {
    return this.calls.length > 0;
  }

  wasCalledWith(...args: Parameters<T>): boolean {
    return this.calls.some((call) => this.arraysEqual(call.args, args));
  }

  private arraysEqual(a: unknown[], b: unknown[]): boolean {
    if (a.length !== b.length) return false;
    return a.every((val, index) => val === b[index]);
  }

  reset(): void {
    this.calls = [];
    this.returnValue = undefined;
    this.implementation = undefined;
  }
}

// Type export for mock function
export type { MockFn };
