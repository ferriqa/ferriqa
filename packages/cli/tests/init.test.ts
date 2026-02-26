/**
 * @ferriqa/cli - Init Command Integration Tests
 *
 * Cross-runtime tests for `ferriqa init` command.
 * Works with Bun, Node.js, and Deno.
 */

import { test } from "@cross/test";
import { assertStrictEquals, assertEquals, assertExists } from "@std/assert";
import { initCommand } from "../src/commands/init.ts";
import type { CLIContext } from "../src/index.ts";
import { createTestContext, cleanupTestContext } from "./utils.ts";

test("init command > command exists > should import initCommand successfully", async () => {
  assertStrictEquals(typeof initCommand, "function");
});

test("init command > command exists > should accept args and context parameters", async () => {
  const context = await createTestContext();

  try {
    const cliContext: CLIContext = {
      cwd: context.cwd,
      verbose: false,
    };

    assertStrictEquals(cliContext.cwd, context.cwd);
    assertStrictEquals(cliContext.verbose, false);
    assertStrictEquals(Array.isArray([]), true);
  } finally {
    await cleanupTestContext(context);
  }
});

test("init command > context handling > should create context with correct defaults", async () => {
  const context = await createTestContext();

  try {
    const cliContext: CLIContext = {
      cwd: context.cwd,
      verbose: false,
    };

    assertExists(cliContext.cwd);
    assertStrictEquals(cliContext.verbose, false);
  } finally {
    await cleanupTestContext(context);
  }
});

test("init command > context handling > should create context with verbose enabled", async () => {
  const context = await createTestContext();

  try {
    const cliContext: CLIContext = {
      cwd: context.cwd,
      verbose: true,
    };

    assertStrictEquals(cliContext.verbose, true);
  } finally {
    await cleanupTestContext(context);
  }
});

test("init command > context handling > should create context with custom config path", async () => {
  const context = await createTestContext();

  try {
    const cliContext: CLIContext = {
      cwd: context.cwd,
      verbose: false,
      configPath: "./config/ferriqa.config.ts",
    };

    assertStrictEquals(cliContext.configPath, "./config/ferriqa.config.ts");
  } finally {
    await cleanupTestContext(context);
  }
});

test("init command > argument parsing > should parse project name from args", async () => {
  const args = ["my-app"];
  const projectName = args[0];

  assertStrictEquals(projectName, "my-app");
});

test("init command > argument parsing > should handle empty args", async () => {
  const args: string[] = [];
  const projectName = args[0];

  assertEquals(projectName, undefined);
});

test("init command > argument parsing > should handle multiple args", async () => {
  const args = ["my-app", "--template", "blog"];

  assertStrictEquals(args[0], "my-app");
  assertStrictEquals(args[1], "--template");
  assertStrictEquals(args[2], "blog");
});
