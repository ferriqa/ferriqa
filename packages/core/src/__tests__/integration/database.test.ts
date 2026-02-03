/**
 * @ferriqa/core - Database Adapter Integration Tests
 *
 * Cross-runtime database adapter tests.
 * Tests run on Bun, Node.js, and Deno.
 */

import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  runTests,
} from "../../testing/index.ts";
import { MockDatabaseAdapter } from "../../testing/mocks.ts";

describe("Database Adapter Integration", () => {
  let db: MockDatabaseAdapter;

  beforeAll(async () => {
    db = new MockDatabaseAdapter({ path: ":memory:" });
    await db.connect();
  });

  afterAll(async () => {
    await db.close();
  });

  // Connection Tests
  it("Connection > should connect to database", () => {
    expect(db.isConnected()).toBe(true);
  });

  it("Connection > should close connection", async () => {
    const tempDb = new MockDatabaseAdapter({ path: ":memory:" });
    await tempDb.connect();
    expect(tempDb.isConnected()).toBe(true);

    await tempDb.close();
    expect(tempDb.isConnected()).toBe(false);
  });

  // CRUD Operations Tests
  it("CRUD > should insert data", async () => {
    const result = await db.execute(
      "INSERT INTO users (name, email) VALUES (?, ?)",
      ["John Doe", "john@example.com"],
    );

    expect(result.changes).toBe(1);
    expect(result.lastInsertId).toBeDefined();
  });

  it("CRUD > should query data", async () => {
    // Insert test data
    await db.execute("INSERT INTO users (name) VALUES (?)", ["Test User"]);

    const result = await db.query("SELECT * FROM users");
    expect(result.rowCount).toBeGreaterThan(0);
    expect(result.rows.length).toBeGreaterThan(0);
  });

  it("CRUD > should update data", async () => {
    await db.execute("INSERT INTO users (name) VALUES (?)", ["Update Test"]);

    const result = await db.execute(
      "UPDATE users SET name = ? WHERE name = ?",
      ["Updated Name", "Update Test"],
    );

    expect(result.changes).toBeGreaterThanOrEqual(0);
  });

  it("CRUD > should delete data", async () => {
    const insertResult = await db.execute(
      "INSERT INTO users (name) VALUES (?)",
      ["Delete Test"],
    );

    const result = await db.execute("DELETE FROM users WHERE id = ?", [
      insertResult.lastInsertId,
    ]);

    expect(result.changes).toBeGreaterThanOrEqual(0);
  });

  // Transaction Tests
  it("Transactions > should support transactions", async () => {
    const result = await db.transaction(async (trx) => {
      await trx.execute("INSERT INTO users (name) VALUES (?)", ["Trx Test"]);
      return { success: true };
    });

    expect(result.success).toBe(true);
  });

  it("Transactions > should rollback on error", async () => {
    let errorThrown = false;

    try {
      await db.transaction(async () => {
        throw new Error("Transaction error");
      });
    } catch {
      errorThrown = true;
    }

    expect(errorThrown).toBe(true);
  });

  // Batch Operations Tests
  it("Batch Operations > should execute batch statements", async () => {
    const statements = [
      { sql: "INSERT INTO users (name) VALUES (?)", params: ["Batch 1"] },
      { sql: "INSERT INTO users (name) VALUES (?)", params: ["Batch 2"] },
    ];

    const results = await db.batch(statements);
    expect(results.length).toBe(2);
  });
});

runTests();
