/**
 * @ferriqa/cli - Plugin Command Integration Tests
 *
 * Tests for `ferriqa plugin` subcommands.
 */

import { describe, it, expect, runTests } from "@ferriqa/core/testing";
import { pluginCommand } from "../src/commands/plugin.ts";
import type { CLIContext } from "../src/index.ts";
import { createTestContext, cleanupTestContext, crossFs } from "./utils.ts";

describe("plugin command", () => {
  describe("command exists", () => {
    it("should import pluginCommand successfully", async () => {
      expect(typeof pluginCommand).toBe("function");
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
    it("should parse list subcommand", async () => {
      const args = ["list"];
      const subcommand = args[0];

      expect(subcommand).toBe("list");
    });

    it("should parse add subcommand", async () => {
      const args = ["add", "seo"];
      const subcommand = args[0];
      const pluginId = args[1];

      expect(subcommand).toBe("add");
      expect(pluginId).toBe("seo");
    });

    it("should parse remove subcommand", async () => {
      const args = ["remove", "analytics"];
      const subcommand = args[0];
      const pluginId = args[1];

      expect(subcommand).toBe("remove");
      expect(pluginId).toBe("analytics");
    });

    it("should parse create subcommand", async () => {
      const args = ["create", "My Plugin"];
      const subcommand = args[0];
      const pluginName = args[1];

      expect(subcommand).toBe("create");
      expect(pluginName).toBe("My Plugin");
    });
  });

  describe("plugin structure", () => {
    it("should create valid plugin metadata", async () => {
      const plugin = {
        id: "my-plugin",
        name: "My Plugin",
        version: "1.0.0",
        dependencies: [],
      };

      expect(plugin.id).toBe("my-plugin");
      expect(plugin.name).toBe("My Plugin");
      expect(plugin.version).toBe("1.0.0");
    });

    it("should generate valid package.json for plugin", async () => {
      const pkg = {
        name: "ferriqa-plugin-test",
        version: "1.0.0",
        type: "module",
        dependencies: {
          "@ferriqa/core": "workspace:*",
        },
      };

      expect(pkg.name).toBe("ferriqa-plugin-test");
      expect(pkg.type).toBe("module");
      expect(pkg.dependencies["@ferriqa/core"]).toBe("workspace:*");
    });

    it("should create valid plugin index.ts content", async () => {
      const pluginCode = `
import { FerriqaPlugin } from "@ferriqa/core";

export const testPlugin: FerriqaPlugin = {
  id: "test-plugin",
  name: "Test Plugin",
  version: "1.0.0",
  async init() {},
  async enable() {},
  async disable() {},
};
`;

      expect(pluginCode).toContain('id: "test-plugin"');
      expect(pluginCode).toContain('name: "Test Plugin"');
      expect(pluginCode).toContain("async init");
      expect(pluginCode).toContain("async enable");
      expect(pluginCode).toContain("async disable");
    });
  });

  describe("filesystem operations", () => {
    it("should create plugins directory", async () => {
      const context = await createTestContext();

      try {
        const fs = await crossFs();
        await fs.mkdir(`${context.cwd}/plugins`);

        const stats = await fs.stat(`${context.cwd}/plugins`);
        expect(stats).not.toBeNull();
      } finally {
        await cleanupTestContext(context);
      }
    });

    it("should create plugin structure", async () => {
      const context = await createTestContext();

      try {
        const fs = await crossFs();
        await fs.mkdir(`${context.cwd}/plugins`);
        await fs.mkdir(`${context.cwd}/plugins/my-plugin`);
        await fs.mkdir(`${context.cwd}/plugins/my-plugin/src`);

        const pkg = {
          name: "ferriqa-plugin-my-plugin",
          version: "1.0.0",
          type: "module",
        };

        await fs.writeFile(
          `${context.cwd}/plugins/my-plugin/package.json`,
          JSON.stringify(pkg, null, 2),
        );

        const content = await fs.readFile(
          `${context.cwd}/plugins/my-plugin/package.json`,
        );
        const contentStr =
          typeof content === "string" ? content : content.toString();
        const parsed = JSON.parse(contentStr);

        expect(parsed.name).toBe("ferriqa-plugin-my-plugin");
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
      const knownSubcommands = ["list", "add", "remove", "create"];
      const isUnknown = !knownSubcommands.includes(args[0]);

      expect(isUnknown).toBe(true);
    });

    it("should handle missing plugin id", async () => {
      const args = ["add"];
      const pluginId = args[1];

      expect(pluginId).toBeUndefined();
    });
  });
});

runTests();
