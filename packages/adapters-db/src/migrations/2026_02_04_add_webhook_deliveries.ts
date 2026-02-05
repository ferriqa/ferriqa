/**
 * Migration: Create webhook_deliveries table
 *
 * REVIEW NOTE: This migration creates the webhook_deliveries table required for
 * tracking webhook delivery attempts, success/failure status, and retry history.
 *
 * Created: 2026-02-04
 * Related: webhook delivery system implementation (roadmap webhook-implementation-plan)
 */

import type { DatabaseAdapter, DatabaseTransaction } from "../types.ts";

/**
 * Migration definition
 */
export const migration = {
  id: "2026_02_04_add_webhook_deliveries",
  name: "Create webhook_deliveries table",
  timestamp: 1770163200000, // 2026-02-04T00:00:00Z

  /**
   * Apply migration - create webhook_deliveries table
   */
  up: async (db: DatabaseAdapter | DatabaseTransaction): Promise<void> => {
    // Create webhook_deliveries table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS webhook_deliveries (
        id TEXT PRIMARY KEY,
        webhook_id INTEGER NOT NULL,
        event TEXT NOT NULL,
        status_code INTEGER,
        success INTEGER NOT NULL DEFAULT 0,
        attempt INTEGER NOT NULL DEFAULT 1,
        response TEXT,
        duration INTEGER,
        error TEXT,
        created_at INTEGER NOT NULL,
        completed_at INTEGER,
        FOREIGN KEY (webhook_id) REFERENCES webhooks(id) ON DELETE CASCADE
      )
    `);

    // Explicit index on primary key (SQLite auto-creates, documented here for clarity)
    // Note: SQLite automatically creates an index on PRIMARY KEY columns

    // Create index on webhook_id for delivery history queries
    await db.execute(
      `CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_id ON webhook_deliveries(webhook_id)`,
    );

    // Create index on event for event filtering
    await db.execute(
      `CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_event ON webhook_deliveries(event)`,
    );

    // Create index on created_at for timeline queries
    await db.execute(
      `CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_created_at ON webhook_deliveries(created_at)`,
    );

    // Create composite index on (webhook_id, success) for filtering failed/successful deliveries
    await db.execute(
      `CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_success ON webhook_deliveries(webhook_id, success)`,
    );
  },

  /**
   * Rollback migration - drop webhook_deliveries table
   * WARNING: This will delete all delivery history
   */
  down: async (db: DatabaseAdapter | DatabaseTransaction): Promise<void> => {
    // Drop indexes first (with IF EXISTS for safety)
    await db.execute(`DROP INDEX IF EXISTS idx_webhook_deliveries_webhook_id`);
    await db.execute(`DROP INDEX IF EXISTS idx_webhook_deliveries_event`);
    await db.execute(`DROP INDEX IF EXISTS idx_webhook_deliveries_created_at`);
    await db.execute(
      `DROP INDEX IF EXISTS idx_webhook_deliveries_webhook_success`,
    );

    // Drop table (with IF EXISTS for safety)
    await db.execute(`DROP TABLE IF EXISTS webhook_deliveries`);
  },
};
