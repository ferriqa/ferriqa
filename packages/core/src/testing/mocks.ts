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
  // Mock adapter reports as "bun" runtime since tests run with Bun
  // This satisfies DatabaseAdapter interface while still being identifiable by name
  readonly runtime = "bun" as const;
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
    const lowerSql = sql.toLowerCase();

    // Handle COUNT(*) queries specially
    if (lowerSql.includes("count(*)")) {
      const match = sql.match(/from\s+(\w+)/i);
      const tableName = match ? match[1] : "default";
      const tableData = this.data.get(tableName) || [];
      // Return both 'total' and 'count' for compatibility
      return {
        rows: [{ total: tableData.length, count: tableData.length } as T],
        rowCount: 1,
      };
    }

    const match = sql.match(/from\s+(\w+)/i);
    const tableName = match ? match[1] : "default";

    let rows = (this.data.get(tableName) || []) as T[];

    // Simple WHERE clause filtering
    if (params && params.length > 0 && sql.toLowerCase().includes("where")) {
      // Count how many parameters are in the WHERE clause versus LIMIT/OFFSET
      const whereMatch = sql.match(
        /where\s+(.+?)(?:\s+order\s+by|\s+limit|$)/i,
      );
      let whereParamCount = params.length;

      if (whereMatch) {
        const whereClause = whereMatch[1];
        whereParamCount = (whereClause.match(/\?/g) || []).length;
      }

      // Only use parameters that belong to the WHERE clause for filtering
      const filterParams = params.slice(0, whereParamCount);

      rows = rows.filter((row) => {
        const rowObj = row as Record<string, unknown>;
        return filterParams.some((param) =>
          Object.values(rowObj).some((val) => {
            // Standard equality
            if (
              val === param ||
              String(val) === String(param) ||
              (typeof val === "number" &&
                typeof param === "string" &&
                val === Number(param)) ||
              (typeof val === "string" &&
                typeof param === "number" &&
                Number(val) === param)
            ) {
              return true;
            }

            // JSON array check (for webhooks/events)
            if (
              typeof val === "string" &&
              val.startsWith("[") &&
              val.endsWith("]")
            ) {
              try {
                const parsed = JSON.parse(val);
                if (Array.isArray(parsed) && parsed.includes(param)) {
                  return true;
                }
              } catch {
                // Not valid JSON, ignore
              }
            }

            return false;
          }),
        );
      });
    }

    // Parse column aliases from SELECT: SELECT col1 as alias1, col2 as alias2, ...
    // Handles multiline SELECT statements by using [\s\S] instead of .
    const selectMatch = sql.match(/select\s+([\s\S]+?)\s+from/i);
    let columnMappings: Array<{ original: string; alias: string }> = [];

    if (selectMatch && !selectMatch[1].includes("*")) {
      columnMappings = selectMatch[1].split(",").map((col) => {
        const trimmed = col.trim();
        // Match patterns like: col AS alias, col as alias, col alias
        const aliasMatch = trimmed.match(/^(.+?)\s+(?:as\s+)?(.+)$/i);
        if (aliasMatch) {
          return {
            original: aliasMatch[1].trim().replace(/['"`]/g, ""),
            alias: aliasMatch[2].trim().replace(/['"`]/g, ""),
          };
        }
        // No alias, column name is used as-is
        return {
          original: trimmed.replace(/['"`]/g, ""),
          alias: trimmed.replace(/['"`]/g, ""),
        };
      });
    }

    // Simple ORDER BY support - must happen BEFORE column aliasing
    // so we can sort by the original column names
    const orderByMatch = sql.match(/order\s+by\s+(\w+)(?:\s+(asc|desc))?/i);
    if (orderByMatch) {
      const sortColumn = orderByMatch[1];
      const sortDirection = orderByMatch[2]?.toLowerCase() || "asc";

      rows.sort((a, b) => {
        const rowA = a as Record<string, unknown>;
        const rowB = b as Record<string, unknown>;
        const valA = rowA[sortColumn];
        const valB = rowB[sortColumn];

        // Handle numeric comparison
        if (typeof valA === "number" && typeof valB === "number") {
          return sortDirection === "desc" ? valB - valA : valA - valB;
        }

        // Handle string comparison
        const strA = String(valA);
        const strB = String(valB);
        const comparison = strA.localeCompare(strB);
        return sortDirection === "desc" ? -comparison : comparison;
      });
    }

    // Transform rows to apply aliases (happens after ORDER BY)
    if (columnMappings.length > 0) {
      rows = rows.map((row) => {
        const rowObj = row as Record<string, unknown>;
        const newRow: Record<string, unknown> = {};
        columnMappings.forEach(({ original, alias }) => {
          newRow[alias] = rowObj[original];
        });
        return newRow as T;
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
      // Extract column names from INSERT statement: INSERT INTO table (col1, col2) VALUES ...
      const columnMatch = sql.match(/\(([^)]+)\)\s*values/i);
      if (columnMatch) {
        // Parse column names from the parentheses
        const columnNames = columnMatch[1]
          .split(",")
          .map((col) => col.trim().replace(/['"`]/g, ""));

        // Map params to their actual column names
        params.forEach((param, index) => {
          if (index < columnNames.length) {
            newRow[columnNames[index]] = param;
          } else {
            newRow[`col${index}`] = param;
          }
        });
      } else {
        // Fallback to generic column names if no explicit columns specified
        params.forEach((param, index) => {
          newRow[`col${index}`] = param;
        });
      }
    }

    tableData.push(newRow);
    this.data.set(tableName, tableData);

    return { changes: 1, lastInsertId: newRow.id as number };
  }

  private mockUpdate(sql: string, params?: unknown[]): { changes: number } {
    const match = sql.match(/update\s+(\w+)/i);
    const tableName = match ? match[1] : "default";

    const tableData = this.data.get(tableName) || [];

    if (!params || params.length === 0) {
      return { changes: 0 };
    }

    // Extract SET columns from UPDATE statement: UPDATE table SET col1 = ?, col2 = ? WHERE ...
    // NOTE: Regex handles both "WHERE" and "JOIN" clauses for edge cases
    const setMatch = sql.match(/set\s+(.+?)\s+(?:where|join)/i);
    if (setMatch) {
      const setClause = setMatch[1];
      // Extract column names from SET clause (e.g., "col1 = ?, col2 = ?")
      const columnNames = setClause
        .split(",")
        .map((part) => {
          const colMatch = part.match(/(\w+)\s*=/);
          return colMatch ? colMatch[1].trim() : null;
        })
        .filter((col): col is string => col !== null);

      // Last param is typically the WHERE id
      const whereId = params[params.length - 1];

      // Find and update matching rows
      let updatedCount = 0;
      const updatedData = tableData.map((row) => {
        const rowObj = row as Record<string, unknown>;
        // Match by id with type coercion
        const rowId = rowObj.id;
        const matches =
          rowId === whereId ||
          String(rowId) === String(whereId) ||
          (typeof rowId === "number" &&
            typeof whereId === "string" &&
            rowId === Number(whereId)) ||
          (typeof rowId === "string" &&
            typeof whereId === "number" &&
            Number(rowId) === whereId);

        if (matches) {
          updatedCount++;
          // Update the row with new values
          const updatedRow = { ...rowObj };
          columnNames.forEach((col, index) => {
            if (index < params.length - 1) {
              // Exclude WHERE param
              updatedRow[col] = params[index];
            }
          });
          return updatedRow;
        }
        return row;
      });

      this.data.set(tableName, updatedData);
      return { changes: updatedCount };
    }

    return { changes: 0 };
  }

  private mockDelete(sql: string, params?: unknown[]): { changes: number } {
    const match = sql.match(/from\s+(\w+)/i);
    const tableName = match ? match[1] : "default";

    const tableData = this.data.get(tableName) || [];
    const initialLength = tableData.length;

    // Remove matching rows with type coercion support
    if (params && params.length > 0) {
      const filtered = tableData.filter((row) => {
        const rowObj = row as Record<string, unknown>;
        return !params.some((param) =>
          Object.values(rowObj).some(
            (val) =>
              val === param ||
              String(val) === String(param) ||
              (typeof val === "number" &&
                typeof param === "string" &&
                val === Number(param)) ||
              (typeof val === "string" &&
                typeof param === "number" &&
                Number(val) === param),
          ),
        );
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
