/**
 * @ferriqa/adapters-db - Migration System Types
 *
 * Type definitions for database migrations
 */

import type { DatabaseAdapter, DatabaseTransaction } from "../types.js";

/**
 * Migration definition
 */
export interface Migration {
  /** Unique migration ID (timestamp-based recommended) */
  id: string;
  /** Migration name (descriptive) */
  name: string;
  /** Apply migration - receives adapter or transaction */
  up: (db: DatabaseAdapter | DatabaseTransaction) => Promise<void>;
  /** Rollback migration - receives adapter or transaction */
  down: (db: DatabaseAdapter | DatabaseTransaction) => Promise<void>;
  /** Timestamp when migration was created */
  timestamp: number;
}

/**
 * Migration record stored in database
 */
export interface MigrationRecord {
  id: string;
  name: string;
  executedAt: Date;
  executionTimeMs: number;
}

/**
 * Migration status
 */
export interface MigrationStatus {
  /** Migration ID */
  id: string;
  /** Migration name */
  name: string;
  /** Whether migration has been applied */
  applied: boolean;
  /** When migration was applied (if applicable) */
  executedAt?: Date;
  /** Execution time in ms (if applicable) */
  executionTimeMs?: number;
}

/**
 * Migration result
 */
export interface MigrationResult {
  /** Whether migration succeeded */
  success: boolean;
  /** Applied migration IDs */
  applied: string[];
  /** Failed migration (if stopOnError=true, only first failure is reported) */
  failed?: {
    id: string;
    error: string;
  };
  /** Migrations that failed but were skipped (only when stopOnError=false) */
  skipped?: Array<{
    id: string;
    error: string;
  }>;
  /** Total execution time */
  totalTimeMs: number;
}

/**
 * Rollback result
 */
export interface RollbackResult {
  /** Whether rollback succeeded */
  success: boolean;
  /** Rolled back migration IDs */
  rolledBack: string[];
  /** Failed rollback (if any) */
  failed?: {
    id: string;
    error: string;
  };
  /** Total execution time */
  totalTimeMs: number;
}

/**
 * Migration runner options
 */
export interface MigrationRunnerOptions {
  /** Run migrations in a transaction (default: true) */
  transactional?: boolean;
  /** Stop on first error (default: true) */
  stopOnError?: boolean;
  /** Log migration progress */
  logger?: (message: string) => void;
}

/**
 * Migration file loader
 * Loads migrations from filesystem
 */
export type MigrationLoader = () => Promise<Migration[]>;

/**
 * Migration direction
 */
export type MigrationDirection = "up" | "down";
