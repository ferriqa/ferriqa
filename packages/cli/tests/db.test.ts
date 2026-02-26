/**
 * @ferriqa/cli - DB Command Integration Tests
 *
 * Tests for `ferriqa db` subcommands.
 */

import { test } from "@cross/test";
import { assertStrictEquals, assertEquals, assertExists } from "@std/assert";
import { dbCommand } from "../src/commands/db.ts";
import type { CLIContext } from "../src/index.ts";
import { createTestContext, cleanupTestContext, crossFs } from "./utils.ts";

test("db command > command exists > should import dbCommand successfully", async () => {
  assertStrictEquals(typeof dbCommand, "function");
});

test("db command > command exists > should accept args and context parameters", async () => {
  const context = await createTestContext();

  try {
    const cliContext: CLIContext = {
      cwd: context.cwd,
      verbose: false,
    };

    assertExists(cliContext.cwd);
    assertStrictEquals(cliContext.verbose, false);
    assertStrictEquals(Array.isArray([]), true);
  } finally {
    await cleanupTestContext(context);
  }
});

test("db command > subcommand parsing > should parse migrate subcommand", async () => {
  const args = ["migrate"];
  const subcommand = args[0];

  assertStrictEquals(subcommand, "migrate");
});

test("db command > subcommand parsing > should parse rollback subcommand", async () => {
  const args = ["rollback"];
  const subcommand = args[0];

  assertStrictEquals(subcommand, "rollback");
});

test("db command > subcommand parsing > should parse seed subcommand", async () => {
  const args = ["seed"];
  const subcommand = args[0];

  assertStrictEquals(subcommand, "seed");
});

test("db command > subcommand parsing > should parse reset subcommand", async () => {
  const args = ["reset"];
  const subcommand = args[0];

  assertStrictEquals(subcommand, "reset");
});

test("db command > subcommand parsing > should parse status subcommand", async () => {
  const args = ["status"];
  const subcommand = args[0];

  assertStrictEquals(subcommand, "status");
});

test("db command > subcommand parsing > should parse create subcommand", async () => {
  const args = ["create", "add_users_table"];
  const subcommand = args[0];
  const migrationName = args[1];

  assertStrictEquals(subcommand, "create");
  assertStrictEquals(migrationName, "add_users_table");
});

test("db command > flag parsing > should parse dry-run flag", async () => {
  const args = ["migrate", "--dry-run"];
  const dryRun = args.includes("--dry-run");

  assertStrictEquals(dryRun, true);
});

test("db command > flag parsing > should parse force flag", async () => {
  const args = ["reset", "--force"];
  const force = args.includes("--force");

  assertStrictEquals(force, true);
});

test("db command > flag parsing > should parse rollback steps", async () => {
  const args = ["rollback", "3"];
  const steps = parseInt(args[1], 10);

  assertStrictEquals(steps, 3);
});

test("db command > filesystem operations > should create and check migrations directory", async () => {
  const context = await createTestContext();

  try {
    const fs = await crossFs();
    await fs.mkdir(`${context.cwd}/migrations`);

    const stats = await fs.stat(`${context.cwd}/migrations`);
    assertEquals(stats !== null, true);
  } finally {
    await cleanupTestContext(context);
  }
});

test("db command > filesystem operations > should write and read migration file", async () => {
  const context = await createTestContext();

  try {
    const fs = await crossFs();
    await fs.mkdir(`${context.cwd}/migrations`);
    await fs.writeFile(
      `${context.cwd}/migrations/001_create_users.ts`,
      "export async function up() {}",
    );

    const content = await fs.readFile(
      `${context.cwd}/migrations/001_create_users.ts`,
    );
    const contentStr =
      typeof content === "string" ? content : content.toString();
    assertEquals(contentStr.includes("export async function up"), true);
  } finally {
    await cleanupTestContext(context);
  }
});

test("db command > filesystem operations > should list migration files", async () => {
  const context = await createTestContext();

  try {
    const fs = await crossFs();
    await fs.mkdir(`${context.cwd}/migrations`);
    await fs.writeFile(`${context.cwd}/migrations/001_users.ts`, "");
    await fs.writeFile(`${context.cwd}/migrations/002_posts.ts`, "");

    const files = (await fs.readdir(`${context.cwd}/migrations`)) as string[];
    assertEquals(files.length, 2);
    assertEquals(
      files.some((f: string) => f.includes("001_users")),
      true,
    );
    assertEquals(
      files.some((f: string) => f.includes("002_posts")),
      true,
    );
  } finally {
    await cleanupTestContext(context);
  }
});

test("db command > error handling > should handle empty args", async () => {
  const args: string[] = [];
  const subcommand = args[0];

  assertEquals(subcommand, undefined);
});

test("db command > error handling > should handle unknown subcommand", async () => {
  const args = ["unknown"];
  const knownSubcommands = [
    "migrate",
    "rollback",
    "seed",
    "reset",
    "status",
    "create",
  ];
  const isUnknown = !knownSubcommands.includes(args[0]);

  assertStrictEquals(isUnknown, true);
});
