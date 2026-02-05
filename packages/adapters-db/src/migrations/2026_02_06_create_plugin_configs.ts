import type { DatabaseAdapter, DatabaseTransaction } from "../types.ts";
import type { Migration } from "./types.ts";

/**
 * Migration: Create plugin_configs table
 * Phase 3: Config Persistence
 */
export const CreatePluginConfigsMigration: Migration = {
    id: "2026_02_06_create_plugin_configs",
    name: "create_plugin_configs_table",
    timestamp: 1738792000000,

    async up(db: DatabaseAdapter | DatabaseTransaction): Promise<void> {
        await db.execute(`
      CREATE TABLE IF NOT EXISTS plugin_configs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plugin_id TEXT NOT NULL UNIQUE,
        config TEXT NOT NULL,
        environment TEXT,
        updated_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      )
    `);

        // Add index for environment lookups
        await db.execute(`
      CREATE INDEX idx_plugin_configs_env ON plugin_configs(plugin_id, environment)
    `);
    },

    async down(db: DatabaseAdapter | DatabaseTransaction): Promise<void> {
        await db.execute(`DROP TABLE IF EXISTS plugin_configs`);
    }
};
