/**
 * @ferriqa/adapters-db - Migrations Index
 *
 * Centralized export of all database migrations.
 * Migrations are automatically sorted by timestamp.
 */

import type { Migration } from "./types.ts";

// Import all migrations
import { migration as addPublishColumns } from "./2026_02_01_add_publish_columns.ts";
import { migration as createRelationsTable } from "./2026_02_02_create_relations_table.ts";
import { migration as addWebhookDeliveries } from "./2026_02_04_add_webhook_deliveries.ts";
import { CreatePluginConfigsMigration } from "./2026_02_06_create_plugin_configs.ts";

/**
 * All available migrations in chronological order
 * Sorted by timestamp (ascending) for proper execution order
 */
export const allMigrations: Migration[] = [
  addPublishColumns,
  createRelationsTable,
  addWebhookDeliveries,
  CreatePluginConfigsMigration,
].sort((a, b) => a.timestamp - b.timestamp);

// Re-export types
export type { Migration } from "./types.ts";
export {
  MigrationRunner,
  createMigrationRunner,
} from "./runner.ts";
export type {
  MigrationRecord,
  MigrationStatus,
  MigrationResult,
  RollbackResult,
  MigrationRunnerOptions,
  MigrationDirection,
} from "./types.ts";

// Re-export individual migrations for direct access
export {
  addPublishColumns,
  createRelationsTable,
  addWebhookDeliveries,
  CreatePluginConfigsMigration,
};
