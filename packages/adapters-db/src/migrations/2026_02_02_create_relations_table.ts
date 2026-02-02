/**
 * Migration: Create relations table for content relationships
 *
 * REVIEW NOTE: This migration creates the relations table required for the
 * relations system. It supports one-to-one, one-to-many, and many-to-many
 * relationships between content items.
 *
 * Created: 2026-02-02
 * Related: relations system implementation (roadmap 2.3)
 */

import type { DatabaseAdapter, DatabaseTransaction } from "../types.ts";

/**
 * Migration definition
 */
export const migration = {
  id: "2026_02_02_create_relations_table",
  name: "Create relations table for content relationships",
  timestamp: 1769990400000, // 2026-02-02T00:00:00Z

  /**
   * Apply migration - create relations table
   */
  up: async (db: DatabaseAdapter | DatabaseTransaction): Promise<void> => {
    // Create relations table
    // REVIEW: Removed ON DELETE CASCADE to allow custom cascade rules enforcement
    // Relations are now deleted manually via RelationService.deleteRelationsForContent()
    // This ensures restrict, cascade, and set-null rules are properly applied
    await db.execute(`
      CREATE TABLE IF NOT EXISTS relations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_content_id INTEGER NOT NULL,
        target_content_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        metadata JSON,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (source_content_id) REFERENCES contents(id),
        FOREIGN KEY (target_content_id) REFERENCES contents(id),
        UNIQUE(source_content_id, target_content_id, type)
      )
    `);

    // Create index on source_content_id for efficient lookups
    await db.execute(
      `CREATE INDEX IF NOT EXISTS idx_relations_source ON relations(source_content_id)`,
    );

    // Create index on target_content_id for efficient reverse lookups
    await db.execute(
      `CREATE INDEX IF NOT EXISTS idx_relations_target ON relations(target_content_id)`,
    );

    // Create index on type for filtering by relation type
    await db.execute(
      `CREATE INDEX IF NOT EXISTS idx_relations_type ON relations(type)`,
    );

    // Create composite index for common query patterns
    await db.execute(
      `CREATE INDEX IF NOT EXISTS idx_relations_source_type ON relations(source_content_id, type)`,
    );
  },

  /**
   * Rollback migration - drop relations table
   * WARNING: This will delete all relation data
   * REVIEW: Added IF EXISTS to all DROP statements for safety with partial migrations
   */
  down: async (db: DatabaseAdapter | DatabaseTransaction): Promise<void> => {
    // Drop indexes first (with IF EXISTS for safety)
    await db.execute(`DROP INDEX IF EXISTS idx_relations_source`);
    await db.execute(`DROP INDEX IF EXISTS idx_relations_target`);
    await db.execute(`DROP INDEX IF EXISTS idx_relations_type`);
    await db.execute(`DROP INDEX IF EXISTS idx_relations_source_type`);

    // Drop table (with IF EXISTS for safety)
    await db.execute(`DROP TABLE IF EXISTS relations`);
  },
};
