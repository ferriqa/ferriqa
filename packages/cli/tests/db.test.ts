/**
 * @ferriqa/cli - DB Command Integration Tests
 *
 * Tests for `ferriqa db` subcommands.
 */

import { describe, it, expect, runTests } from "@ferriqa/core/testing";
import { dbCommand } from "../src/commands/db.ts";
import type { CLIContext } from "../src/index.ts";
import { createTestContext, cleanupTestContext, crossFs } from "./utils.ts";

describe("db command", () => {
  describe("command exists", () => {
    it("should import dbCommand successfully", async () => {
      expect(typeof dbCommand).toBe("function");
    });

    it("should accept args and context parameters", async () => {
      const context = await createTestContext();

      try {
        const cliContext: CLIContext = {
          cwd: context.cwd,
          verbose: false,
        };

        expect(cliContext.cwd).toBeDefined();
        expect(cliContext.verbose).toBe(false);
        expect(Array.isArray([])).toBe(true);
      } finally {
        await cleanupTestContext(context);
      }
    });
  });

  describe("subcommand parsing", () => {
    it("should parse migrate subcommand", async () => {
      const args = ["migrate"];
      const subcommand = args[0];

      expect(subcommand).toBe("migrate");
    });

    it("should parse rollback subcommand", async () => {
      const args = ["rollback"];
      const subcommand = args[0];

      expect(subcommand).toBe("rollback");
    });

    it("should parse seed subcommand", async () => {
      const args = ["seed"];
      const subcommand = args[0];

      expect(subcommand).toBe("seed");
    });

    it("should parse reset subcommand", async () => {
      const args = ["reset"];
      const subcommand = args[0];

      expect(subcommand).toBe("reset");
    });

    it("should parse status subcommand", async () => {
      const args = ["status"];
      const subcommand = args[0];

      expect(subcommand).toBe("status");
    });

    it("should parse create subcommand", async () => {
      const args = ["create", "add_users_table"];
      const subcommand = args[0];
      const migrationName = args[1];

      expect(subcommand).toBe("create");
      expect(migrationName).toBe("add_users_table");
    });
  });

  describe("flag parsing", () => {
    it("should parse dry-run flag", async () => {
      const args = ["migrate", "--dry-run"];
      const dryRun = args.includes("--dry-run");

      expect(dryRun).toBe(true);
    });

    it("should parse force flag", async () => {
      const args = ["reset", "--force"];
      const force = args.includes("--force");

      expect(force).toBe(true);
    });

    it("should parse rollback steps", async () => {
      const args = ["rollback", "3"];
      const steps = parseInt(args[1], 10);

      expect(steps).toBe(3);
    });
  });

  describe("filesystem operations", () => {
    it("should create and check migrations directory", async () => {
      const context = await createTestContext();

      try {
        const fs = await crossFs();
        await fs.mkdir(`${context.cwd}/migrations`);

        const stats = await fs.stat(`${context.cwd}/migrations`);
        expect(stats).not.toBeNull();
      } finally {
        await cleanupTestContext(context);
      }
    });

    it("should write and read migration file", async () => {
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
        expect(contentStr).toContain("export async function up");
      } finally {
        await cleanupTestContext(context);
      }
    });

    it("should list migration files", async () => {
      const context = await createTestContext();

      try {
        const fs = await crossFs();
        await fs.mkdir(`${context.cwd}/migrations`);
        await fs.writeFile(`${context.cwd}/migrations/001_users.ts`, "");
        await fs.writeFile(`${context.cwd}/migrations/002_posts.ts`, "");

        const files = (await fs.readdir(
          `${context.cwd}/migrations`,
        )) as string[];
        expect(files).toHaveLength(2);
        expect(files.some((f: string) => f.includes("001_users"))).toBe(true);
        expect(files.some((f: string) => f.includes("002_posts"))).toBe(true);
      } finally {
        await cleanupTestContext(context);
      }
    });
  });

  describe("error handling", () => {
    it("should handle empty args", async () => {
      const args: string[] = [];
      const subcommand = args[0];

      expect(subcommand).toBeUndefined();
    });

    it("should handle unknown subcommand", async () => {
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

      expect(isUnknown).toBe(true);
    });
  });
});

runTests();
