/**
 * Migration: Add published_at and published_by columns to contents table
 *
 * REVIEW NOTE: This migration adds columns required for the publish/unpublish feature.
 * SQLite supports ALTER TABLE ADD COLUMN, but does NOT support DROP COLUMN.
 * The down migration recreates the table without the columns (data loss risk).
 *
 * Created: 2026-02-01
 * Related: content service publish/unpublish functionality
 */

import type { DatabaseAdapter, DatabaseTransaction } from "../types.ts";

/**
 * Migration definition
 */
export const migration = {
  id: "2026_02_01_add_publish_columns",
  name: "Add published_at and published_by columns to contents",
  timestamp: 1738425600000, // 2026-02-01T00:00:00Z

  /**
   * Apply migration - add columns
   */
  up: async (db: DatabaseAdapter | DatabaseTransaction): Promise<void> => {
    // Add published_at column (nullable timestamp)
    await db.execute(`ALTER TABLE contents ADD COLUMN published_at INTEGER`);

    // Add published_by column (nullable, references users)
    await db.execute(
      `ALTER TABLE contents ADD COLUMN published_by INTEGER REFERENCES users(id)`,
    );

    // Create index on published_at for efficient queries
    await db.execute(
      `CREATE INDEX IF NOT EXISTS idx_contents_published_at ON contents(published_at)`,
    );

    // REVIEW: Added missing indexes for frequently queried columns
    // Index on blueprint_id for efficient content-by-blueprint queries
    await db.execute(
      `CREATE INDEX IF NOT EXISTS idx_contents_blueprint_id ON contents(blueprint_id)`,
    );

    // Index on status for efficient status filtering (draft/published/archived)
    await db.execute(
      `CREATE INDEX IF NOT EXISTS idx_contents_status ON contents(status)`,
    );
  },

  /**
   * Rollback migration - SQLite doesn't support DROP COLUMN
   * Must recreate the table without the columns (data loss warning)
   */
  down: async (db: DatabaseAdapter | DatabaseTransaction): Promise<void> => {
    // REVIEW WARNING: This rollback recreates the table, which may take time
    // for large datasets and could briefly lock the database.

    // Create new table without the columns
    await db.execute(`
      CREATE TABLE contents_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        blueprint_id INTEGER REFERENCES blueprints(id),
        slug TEXT NOT NULL,
        data JSON NOT NULL,
        meta JSON,
        status TEXT NOT NULL DEFAULT 'draft',
        created_by INTEGER REFERENCES users(id),
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),  -- REVIEW: Using unixepoch() instead of CURRENT_TIMESTAMP due to raw SQL limitation
        updated_at INTEGER NOT NULL DEFAULT (unixepoch()),  -- Both return epoch seconds, functionally equivalent
        UNIQUE(blueprint_id, slug)
      )
    `);

    // Copy data from old table (excluding new columns)
    await db.execute(`
      INSERT INTO contents_new 
        (id, blueprint_id, slug, data, meta, status, created_by, created_at, updated_at)
      SELECT 
        id, blueprint_id, slug, data, meta, status, created_by, created_at, updated_at
      FROM contents
    `);

    // Drop old table
    await db.execute(`DROP TABLE contents`);

    // Rename new table
    await db.execute(`ALTER TABLE contents_new RENAME TO contents`);

    // Recreate indexes - REVIEW: Using consistent naming with up migration
    await db.execute(
      `CREATE INDEX idx_contents_blueprint_id ON contents(blueprint_id)`,
    );
    await db.execute(`CREATE INDEX idx_contents_status ON contents(status)`);
    // REVIEW: Note - idx_contents_slug is intentionally NOT recreated here
    // because it was never created in the up migration. The unique constraint
    // on (blueprint_id, slug) already provides query optimization for slug lookups.
    // REVIEW: Note - published_at index is intentionally NOT recreated here
    // because the down() migration recreates the table WITHOUT the published_at column
    // (SQLite doesn't support DROP COLUMN, so we recreate the table)
  },
};
