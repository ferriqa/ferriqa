/**
 * @ferriqa/adapters-db - Universal Database Adapter
 *
 * Cross-runtime database adapter for Bun, Node.js, and Deno
 * Supports SQLite with automatic runtime detection
 */

// Types
export type {
  DatabaseAdapter,
  DatabaseConfig,
  DatabaseTransaction,
  QueryResult,
  IsolationLevel,
  AdapterFactoryOptions,
} from "./src/types.js";

// Main classes (includes enums which are both types and values)
export {
  FerriqaDatabaseError,
  AdapterState,
  DatabaseErrorType,
} from "./src/types.js";

// Adapters
export { BunSQLiteAdapter } from "./src/adapters/BunSQLiteAdapter.js";
export { BetterSQLiteAdapter } from "./src/adapters/BetterSQLiteAdapter.js";
export { DenoSQLiteAdapter } from "./src/adapters/DenoSQLiteAdapter.js";

// Factory
export {
  UniversalDBFactory,
  createDatabase,
  createMemoryDatabase,
} from "./src/factory.js";

// Schema
export {
  users,
  blueprints,
  contents,
  relations,
  versions,
  webhooks,
  auditLogs,
  settings,
  migrations,
  tables,
  type FieldDefinition,
} from "./src/schema.js";

// Migrations
export type {
  Migration,
  MigrationRecord,
  MigrationStatus,
  MigrationResult,
  RollbackResult,
  MigrationRunnerOptions,
  MigrationDirection,
} from "./src/migrations/types.js";

export {
  MigrationRunner,
  createMigrationRunner,
} from "./src/migrations/runner.js";
