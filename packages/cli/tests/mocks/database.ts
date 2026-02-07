/**
 * @ferriqa/cli - Database Mocks
 *
 * Mock implementations for database operations in CLI tests.
 */

export interface MockMigration {
  id: number;
  name: string;
  executedAt: Date;
}

export interface MockDatabase {
  migrations: MockMigration[];
  data: Map<string, unknown[]>;
}

/**
 * Create a mock database instance
 */
export function createMockDatabase(): MockDatabase {
  return {
    migrations: [],
    data: new Map(),
  };
}

/**
 * Mock migration runner
 */
export class MockMigrationRunner {
  private db: MockDatabase;
  private appliedMigrations: Set<string> = new Set();

  constructor(db: MockDatabase) {
    this.db = db;
  }

  /**
   * Check if a migration has been applied
   */
  isApplied(migrationName: string): boolean {
    return this.appliedMigrations.has(migrationName);
  }

  /**
   * Apply a migration
   */
  async apply(migrationName: string): Promise<void> {
    if (this.appliedMigrations.has(migrationName)) {
      throw new Error(`Migration ${migrationName} already applied`);
    }

    this.appliedMigrations.add(migrationName);
    this.db.migrations.push({
      id: this.db.migrations.length + 1,
      name: migrationName,
      executedAt: new Date(),
    });
  }

  /**
   * Rollback a migration
   */
  async rollback(migrationName: string): Promise<void> {
    if (!this.appliedMigrations.has(migrationName)) {
      throw new Error(`Migration ${migrationName} not applied`);
    }

    this.appliedMigrations.delete(migrationName);
    const index = this.db.migrations.findIndex((m) => m.name === migrationName);
    if (index > -1) {
      this.db.migrations.splice(index, 1);
    }
  }

  /**
   * Get applied migrations
   */
  getAppliedMigrations(): MockMigration[] {
    return [...this.db.migrations];
  }

  /**
   * Reset all migrations
   */
  reset(): void {
    this.appliedMigrations.clear();
    this.db.migrations = [];
    this.db.data.clear();
  }
}

/**
 * Mock database connection
 */
export class MockDatabaseConnection {
  private db: MockDatabase;
  public connected = false;

  constructor(db: MockDatabase) {
    this.db = db;
  }

  async connect(): Promise<void> {
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  async query(_sql: string, _params?: unknown[]): Promise<unknown[]> {
    if (!this.connected) {
      throw new Error("Database not connected");
    }

    // Simple mock query implementation
    if (_sql.toLowerCase().includes("select")) {
      return [];
    }

    return [];
  }

  async execute(_sql: string): Promise<void> {
    if (!this.connected) {
      throw new Error("Database not connected");
    }
    // Mock execution
  }
}

/**
 * Global mock database instance for tests
 */
let globalMockDb: MockDatabase | null = null;

export function getGlobalMockDb(): MockDatabase {
  if (!globalMockDb) {
    globalMockDb = createMockDatabase();
  }
  return globalMockDb;
}

export function resetGlobalMockDb(): void {
  globalMockDb = createMockDatabase();
}
