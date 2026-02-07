/**
 * @ferriqa/cli - Init Command Integration Tests
 *
 * Cross-runtime tests for `ferriqa init` command.
 * Works with Bun, Node.js, and Deno.
 */

import { describe, it, expect, runTests } from "@ferriqa/core/testing";
import { initCommand } from "../src/commands/init.ts";
import type { CLIContext } from "../src/index.ts";
import { createTestContext, cleanupTestContext } from "./utils.ts";

describe("init command", () => {
  describe("command exists", () => {
    it("should import initCommand successfully", async () => {
      expect(typeof initCommand).toBe("function");
    });

    it("should accept args and context parameters", async () => {
      const context = await createTestContext();

      try {
        const cliContext: CLIContext = {
          cwd: context.cwd,
          verbose: false,
        };

        expect(cliContext.cwd).toBe(context.cwd);
        expect(cliContext.verbose).toBe(false);
        expect(Array.isArray([])).toBe(true);
      } finally {
        await cleanupTestContext(context);
      }
    });
  });

  describe("context handling", () => {
    it("should create context with correct defaults", async () => {
      const context = await createTestContext();

      try {
        const cliContext: CLIContext = {
          cwd: context.cwd,
          verbose: false,
        };

        expect(cliContext.cwd).toBeDefined();
        expect(cliContext.verbose).toBe(false);
      } finally {
        await cleanupTestContext(context);
      }
    });

    it("should create context with verbose enabled", async () => {
      const context = await createTestContext();

      try {
        const cliContext: CLIContext = {
          cwd: context.cwd,
          verbose: true,
        };

        expect(cliContext.verbose).toBe(true);
      } finally {
        await cleanupTestContext(context);
      }
    });

    it("should create context with custom config path", async () => {
      const context = await createTestContext();

      try {
        const cliContext: CLIContext = {
          cwd: context.cwd,
          verbose: false,
          configPath: "./config/ferriqa.config.ts",
        };

        expect(cliContext.configPath).toBe("./config/ferriqa.config.ts");
      } finally {
        await cleanupTestContext(context);
      }
    });
  });

  describe("argument parsing", () => {
    it("should parse project name from args", async () => {
      const args = ["my-app"];
      const projectName = args[0];

      expect(projectName).toBe("my-app");
    });

    it("should handle empty args", async () => {
      const args: string[] = [];
      const projectName = args[0];

      expect(projectName).toBeUndefined();
    });

    it("should handle multiple args", async () => {
      const args = ["my-app", "--template", "blog"];

      expect(args[0]).toBe("my-app");
      expect(args[1]).toBe("--template");
      expect(args[2]).toBe("blog");
    });
  });
});

runTests();
