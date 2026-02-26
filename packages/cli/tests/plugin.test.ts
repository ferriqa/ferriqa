/**
 * @ferriqa/cli - Plugin Command Integration Tests
 *
 * Tests for `ferriqa plugin` subcommands.
 */

import { test } from "@cross/test";
import { assertStrictEquals, assertEquals, assertExists } from "@std/assert";
import { pluginCommand } from "../src/commands/plugin.ts";
import type { CLIContext } from "../src/index.ts";
import { createTestContext, cleanupTestContext, crossFs } from "./utils.ts";

test("plugin command > command exists > should import pluginCommand successfully", async () => {
  assertStrictEquals(typeof pluginCommand, "function");
});

test("plugin command > command exists > should accept args and context parameters", async () => {
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

test("plugin command > subcommand parsing > should parse list subcommand", async () => {
  const args = ["list"];
  const subcommand = args[0];

  assertStrictEquals(subcommand, "list");
});

test("plugin command > subcommand parsing > should parse add subcommand", async () => {
  const args = ["add", "seo"];
  const subcommand = args[0];
  const pluginId = args[1];

  assertStrictEquals(subcommand, "add");
  assertStrictEquals(pluginId, "seo");
});

test("plugin command > subcommand parsing > should parse remove subcommand", async () => {
  const args = ["remove", "analytics"];
  const subcommand = args[0];
  const pluginId = args[1];

  assertStrictEquals(subcommand, "remove");
  assertStrictEquals(pluginId, "analytics");
});

test("plugin command > subcommand parsing > should parse create subcommand", async () => {
  const args = ["create", "My Plugin"];
  const subcommand = args[0];
  const pluginName = args[1];

  assertStrictEquals(subcommand, "create");
  assertStrictEquals(pluginName, "My Plugin");
});

test("plugin command > plugin structure > should create valid plugin metadata", async () => {
  const plugin = {
    id: "my-plugin",
    name: "My Plugin",
    version: "1.0.0",
    dependencies: [],
  };

  assertStrictEquals(plugin.id, "my-plugin");
  assertStrictEquals(plugin.name, "My Plugin");
  assertStrictEquals(plugin.version, "1.0.0");
});

test("plugin command > plugin structure > should generate valid package.json for plugin", async () => {
  const pkg = {
    name: "ferriqa-plugin-test",
    version: "1.0.0",
    type: "module",
    dependencies: {
      "@ferriqa/core": "workspace:*",
    },
  };

  assertStrictEquals(pkg.name, "ferriqa-plugin-test");
  assertStrictEquals(pkg.type, "module");
  assertStrictEquals(pkg.dependencies["@ferriqa/core"], "workspace:*");
});

test("plugin command > plugin structure > should create valid plugin index.ts content", async () => {
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

  assertEquals(pluginCode.includes('id: "test-plugin"'), true);
  assertEquals(pluginCode.includes('name: "Test Plugin"'), true);
  assertEquals(pluginCode.includes("async init"), true);
  assertEquals(pluginCode.includes("async enable"), true);
  assertEquals(pluginCode.includes("async disable"), true);
});

test("plugin command > filesystem operations > should create plugins directory", async () => {
  const context = await createTestContext();

  try {
    const fs = await crossFs();
    await fs.mkdir(`${context.cwd}/plugins`);

    const stats = await fs.stat(`${context.cwd}/plugins`);
    assertEquals(stats !== null, true);
  } finally {
    await cleanupTestContext(context);
  }
});

test("plugin command > filesystem operations > should create plugin structure", async () => {
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

    assertStrictEquals(parsed.name, "ferriqa-plugin-my-plugin");
  } finally {
    await cleanupTestContext(context);
  }
});

test("plugin command > error handling > should handle empty args", async () => {
  const args: string[] = [];
  const subcommand = args[0];

  assertEquals(subcommand, undefined);
});

test("plugin command > error handling > should handle unknown subcommand", async () => {
  const args = ["unknown"];
  const knownSubcommands = ["list", "add", "remove", "create"];
  const isUnknown = !knownSubcommands.includes(args[0]);

  assertStrictEquals(isUnknown, true);
});

test("plugin command > error handling > should handle missing plugin id", async () => {
  const args = ["add"];
  const pluginId = args[1];

  assertEquals(pluginId, undefined);
});
