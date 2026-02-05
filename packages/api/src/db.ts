/**
 * @ferriqa/api - Database Adapter Configuration
 *
 * Centralized database adapter initialization for the API.
 * Handles environment detection and returns the appropriate adapter instance.
 */

import { MockDatabaseAdapter } from "@ferriqa/core/testing";
// import { BunSQLiteAdapter } from "@ferriqa/adapters-db"; // Future production adapter

function getNodeEnv(): string {
  if (typeof process !== "undefined" && process.env) {
    return process.env.NODE_ENV || "development";
  }
  return "development";
}

const nodeEnv = getNodeEnv();

function createDatabaseAdapter() {
  // TODO: Add real production adapter logic here when available
  // Example:
  // if (nodeEnv === "production") {
  //   return new BunSQLiteAdapter({ path: "ferriqa.db" });
  // }

  if (nodeEnv === "production") {
    console.warn(
      "[db] ⚠️  WARNING: Using In-Memory Database in Production! Data will be lost on exit.\n" +
        "  To fix this, configure a real database adapter in packages/api/src/db.ts",
    );
  }

  return new MockDatabaseAdapter({ path: ":memory:" });
}

/**
 * Shared database adapter instance
 */
export const db = createDatabaseAdapter();
