/**
 * @ferriqa/adapters-db - Universal Database Factory
 *
 * Factory for creating database adapters based on runtime
 * Automatically detects Bun, Node.js, or Deno and creates appropriate adapter
 */

import type {
  DatabaseAdapter,
  DatabaseConfig,
  AdapterFactoryOptions,
} from "./types.ts";
import { FerriqaDatabaseError, ErrorCode } from "./types.ts";
import { isBun, isDeno, isNode } from "@ferriqa/core";

// Import adapters
import { BunSQLiteAdapter } from "./adapters/BunSQLiteAdapter.ts";
import { BetterSQLiteAdapter } from "./adapters/BetterSQLiteAdapter.ts";
import { DenoSQLiteAdapter } from "./adapters/DenoSQLiteAdapter.ts";

/**
 * Universal Database Factory
 * Creates appropriate database adapter based on runtime
 */
export class UniversalDBFactory {
  /**
   * Create database adapter based on current runtime
   * Automatically detects Bun, Node.js, or Deno
   */
  static async create(
    options: AdapterFactoryOptions,
  ): Promise<DatabaseAdapter> {
    const { config, forceAdapter, debug } = options;

    if (debug) {
      console.log(`[UniversalDBFactory] Runtime detection:`, {
        isBun,
        isNode,
        isDeno,
        forceAdapter,
      });
    }

    // If forced adapter specified, use it
    if (forceAdapter) {
      return await this.createForcedAdapter(forceAdapter, config, debug);
    }

    // Auto-detect runtime and create appropriate adapter
    if (isBun) {
      if (debug) {
        console.log("[UniversalDBFactory] Creating BunSQLiteAdapter");
      }

      if (!BunSQLiteAdapter.isSupported()) {
        throw new FerriqaDatabaseError(
          ErrorCode.DB_CONNECTION_FAILED,
          "Bun runtime detected but bun:sqlite is not available",
        );
      }

      return new BunSQLiteAdapter(config);
    }

    if (isNode) {
      if (debug) {
        console.log("[UniversalDBFactory] Creating BetterSQLiteAdapter");
      }

      // Check if better-sqlite3 is available
      const isBetterSQLiteSupported = await BetterSQLiteAdapter.isSupported();

      if (!isBetterSQLiteSupported) {
        throw new FerriqaDatabaseError(
          ErrorCode.DB_CONNECTION_FAILED,
          "Node.js runtime detected but better-sqlite3 is not installed. " +
            "Please install it: npm install better-sqlite3",
        );
      }

      return new BetterSQLiteAdapter(config);
    }

    if (isDeno) {
      if (debug) {
        console.log("[UniversalDBFactory] Creating DenoSQLiteAdapter");
      }

      if (!DenoSQLiteAdapter.isSupported()) {
        throw new FerriqaDatabaseError(
          ErrorCode.DB_CONNECTION_FAILED,
          "Deno runtime detected but required permissions not granted. " +
            "Run with --allow-read and --allow-write flags",
        );
      }

      return new DenoSQLiteAdapter(config);
    }

    throw new FerriqaDatabaseError(
      ErrorCode.DB_CONNECTION_FAILED,
      "Unsupported runtime. UniversalDBFactory requires Bun, Node.js, or Deno.",
    );
  }

  /**
   * Create a specific adapter type (for testing or explicit control)
   */
  private static async createForcedAdapter(
    adapter: NonNullable<AdapterFactoryOptions["forceAdapter"]>,
    config: DatabaseConfig,
    debug?: boolean,
  ): Promise<DatabaseAdapter> {
    if (debug) {
      console.log(`[UniversalDBFactory] Creating forced adapter: ${adapter}`);
    }

    switch (adapter) {
      case "bun":
        if (!BunSQLiteAdapter.isSupported()) {
          throw new FerriqaDatabaseError(
            ErrorCode.DB_CONNECTION_FAILED,
            `Forced adapter "bun" is not supported in the current runtime`,
          );
        }
        return new BunSQLiteAdapter(config);

      case "better-sqlite3": {
        const isSupported = await BetterSQLiteAdapter.isSupported();
        if (!isSupported) {
          throw new FerriqaDatabaseError(
            ErrorCode.DB_CONNECTION_FAILED,
            `Forced adapter "better-sqlite3" is not supported. better-sqlite3 may not be installed.`,
          );
        }
        return new BetterSQLiteAdapter(config);
      }

      case "deno-sqlite":
        if (!DenoSQLiteAdapter.isSupported()) {
          throw new FerriqaDatabaseError(
            ErrorCode.DB_CONNECTION_FAILED,
            `Forced adapter "deno-sqlite" is not supported in the current runtime`,
          );
        }
        return new DenoSQLiteAdapter(config);

      default:
        throw new FerriqaDatabaseError(
          ErrorCode.DB_CONNECTION_FAILED,
          `Unknown adapter: ${adapter}`,
        );
    }
  }

  /**
   * Get current runtime information
   */
  static getRuntime(): { name: string; detected: boolean } {
    if (isBun) {
      return { name: "bun", detected: true };
    }
    if (isNode) {
      return { name: "node", detected: true };
    }
    if (isDeno) {
      return { name: "deno", detected: true };
    }
    return { name: "unknown", detected: false };
  }

  /**
   * Check if current runtime is supported
   */
  static isSupported(): boolean {
    return isBun || isNode || isDeno;
  }

  /**
   * Get available adapter for current runtime
   */
  static getAvailableAdapter(): string | null {
    if (isBun) return "bun";
    if (isNode) return "better-sqlite3";
    if (isDeno) return "deno-sqlite";
    return null;
  }
}

/**
 * Convenience function to create database connection
 */
export async function createDatabase(
  config: DatabaseConfig,
  options?: Omit<AdapterFactoryOptions, "config">,
): Promise<DatabaseAdapter> {
  const adapter = await UniversalDBFactory.create({
    config,
    ...options,
  });

  await adapter.connect();
  return adapter;
}

/**
 * Convenience function to create in-memory database (for testing)
 */
export async function createMemoryDatabase(
  options?: Omit<AdapterFactoryOptions, "config">,
): Promise<DatabaseAdapter> {
  return createDatabase(
    {
      path: ":memory:",
      walMode: false,
      foreignKeys: true,
    },
    options,
  );
}
