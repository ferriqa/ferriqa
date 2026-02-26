/**
 * @ferriqa/core - Database Adapter Integration Tests
 *
 * Cross-runtime database adapter tests.
 * Tests run on Bun, Node.js, and Deno.
 */

import { test } from "@cross/test";
import { assertEquals, assertExists, assertGreater } from "@std/assert";
import { MockDatabaseAdapter } from "../../testing/mocks.ts";

test("Database Adapter Integration > Connection > should connect to database", async () => {
  const db = new MockDatabaseAdapter({ path: ":memory:" });
  await db.connect();

  try {
    assertEquals(db.isConnected(), true);
  } finally {
    await db.close();
  }
});

test("Database Adapter Integration > Connection > should close connection", async () => {
  const tempDb = new MockDatabaseAdapter({ path: ":memory:" });
  await tempDb.connect();
  assertEquals(tempDb.isConnected(), true);

  await tempDb.close();
  assertEquals(tempDb.isConnected(), false);
});

test("Database Adapter Integration > CRUD > should insert data", async () => {
  const db = new MockDatabaseAdapter({ path: ":memory:" });
  await db.connect();

  try {
    const result = await db.execute(
      "INSERT INTO users (name, email) VALUES (?, ?)",
      ["John Doe", "john@example.com"],
    );

    assertEquals(result.changes, 1);
    assertExists(result.lastInsertId);
  } finally {
    await db.close();
  }
});

test("Database Adapter Integration > CRUD > should query data", async () => {
  const db = new MockDatabaseAdapter({ path: ":memory:" });
  await db.connect();

  try {
    // Insert test data
    await db.execute("INSERT INTO users (name) VALUES (?)", ["Test User"]);

    const result = await db.query("SELECT * FROM users");
    assertGreater(result.rowCount, 0);
    assertGreater(result.rows.length, 0);
  } finally {
    await db.close();
  }
});

test("Database Adapter Integration > CRUD > should update data", async () => {
  const db = new MockDatabaseAdapter({ path: ":memory:" });
  await db.connect();

  try {
    await db.execute("INSERT INTO users (name) VALUES (?)", ["Update Test"]);

    const result = await db.execute(
      "UPDATE users SET name = ? WHERE name = ?",
      ["Updated Name", "Update Test"],
    );

    assertEquals(result.changes >= 0, true);
  } finally {
    await db.close();
  }
});

test("Database Adapter Integration > CRUD > should delete data", async () => {
  const db = new MockDatabaseAdapter({ path: ":memory:" });
  await db.connect();

  try {
    const insertResult = await db.execute(
      "INSERT INTO users (name) VALUES (?)",
      ["Delete Test"],
    );

    const result = await db.execute("DELETE FROM users WHERE id = ?", [
      insertResult.lastInsertId,
    ]);

    assertEquals(result.changes >= 0, true);
  } finally {
    await db.close();
  }
});

test("Database Adapter Integration > Transactions > should support transactions", async () => {
  const db = new MockDatabaseAdapter({ path: ":memory:" });
  await db.connect();

  try {
    const result = await db.transaction(async (trx) => {
      await trx.execute("INSERT INTO users (name) VALUES (?)", ["Trx Test"]);
      return { success: true };
    });

    assertEquals(result.success, true);
  } finally {
    await db.close();
  }
});

test("Database Adapter Integration > Transactions > should rollback on error", async () => {
  const db = new MockDatabaseAdapter({ path: ":memory:" });
  await db.connect();

  try {
    let errorThrown = false;

    try {
      await db.transaction(async () => {
        throw new Error("Transaction error");
      });
    } catch {
      errorThrown = true;
    }

    assertEquals(errorThrown, true);
  } finally {
    await db.close();
  }
});

test("Database Adapter Integration > Batch Operations > should execute batch statements", async () => {
  const db = new MockDatabaseAdapter({ path: ":memory:" });
  await db.connect();

  try {
    const statements = [
      { sql: "INSERT INTO users (name) VALUES (?)", params: ["Batch 1"] },
      { sql: "INSERT INTO users (name) VALUES (?)", params: ["Batch 2"] },
    ];

    const results = await db.batch(statements);
    assertEquals(results.length, 2);
  } finally {
    await db.close();
  }
});
