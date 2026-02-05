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
} from "./src/types.ts";

// Main classes (includes enums which are both types and values)
export {
  FerriqaDatabaseError,
  AdapterState,
  DatabaseErrorType,
} from "./src/types.ts";

// Adapters
export { BunSQLiteAdapter } from "./src/adapters/BunSQLiteAdapter.ts";
export { BetterSQLiteAdapter } from "./src/adapters/BetterSQLiteAdapter.ts";
export { DenoSQLiteAdapter } from "./src/adapters/DenoSQLiteAdapter.ts";

// Factory
export {
  UniversalDBFactory,
  createDatabase,
  createMemoryDatabase,
} from "./src/factory.ts";

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
} from "./src/schema.ts";

// Migrations - use the index.ts for all migration exports
export type {
  Migration,
  MigrationRecord,
  MigrationStatus,
  MigrationResult,
  RollbackResult,
  MigrationRunnerOptions,
  MigrationDirection,
} from "./src/migrations/index.ts";

export {
  MigrationRunner,
  createMigrationRunner,
  allMigrations,
  addPublishColumns,
  createRelationsTable,
  addWebhookDeliveries,
  CreatePluginConfigsMigration,
} from "./src/migrations/index.ts";
