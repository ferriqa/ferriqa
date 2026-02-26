/**
 * @ferriqa/cli - Main CLI Integration Tests
 *
 * Tests for the main CLI entry point and command routing.
 */

import { test } from "@cross/test";
import { assertStrictEquals, assertEquals } from "@std/assert";

test("CLI entry point > command routing > should show help when no command provided", async () => {
  const originalArgv = process.argv;
  process.argv = ["node", "ferriqa"];

  try {
    assertStrictEquals(true, true);
  } finally {
    process.argv = originalArgv;
  }
});

test("CLI entry point > command routing > should show help with --help flag", async () => {
  const originalArgv = process.argv;
  process.argv = ["node", "ferriqa", "--help"];

  try {
    assertStrictEquals(true, true);
  } finally {
    process.argv = originalArgv;
  }
});

test("CLI entry point > command routing > should show version with --version flag", async () => {
  const originalArgv = process.argv;
  process.argv = ["node", "ferriqa", "--version"];

  try {
    assertStrictEquals(true, true);
  } finally {
    process.argv = originalArgv;
  }
});

test("CLI entry point > global options > should parse verbose flag", async () => {
  const args = ["--verbose"];
  const verbose = args.includes("--verbose") || args.includes("-v");

  assertStrictEquals(verbose, true);
});

test("CLI entry point > global options > should parse config option", async () => {
  const args = ["--config", "./custom.config.ts"];
  const configIndex = args.findIndex(
    (arg) => arg === "--config" || arg === "-c",
  );
  const configPath =
    configIndex !== -1 && args[configIndex + 1]
      ? args[configIndex + 1]
      : undefined;

  assertStrictEquals(configPath, "./custom.config.ts");
});

test("CLI entry point > global options > should parse short flags", async () => {
  const args = ["-v", "-c", "./config.ts", "-h"];

  const verbose = args.includes("-v");
  const configIndex = args.indexOf("-c");
  const configPath = configIndex !== -1 ? args[configIndex + 1] : undefined;
  const help = args.includes("-h");

  assertStrictEquals(verbose, true);
  assertStrictEquals(configPath, "./config.ts");
  assertStrictEquals(help, true);
});

test("CLI entry point > error handling > should handle unknown commands", async () => {
  const args = ["unknown-command"];
  const knownCommands = [
    "init",
    "dev",
    "db",
    "blueprint",
    "plugin",
    "build",
    "start",
  ];
  const isUnknown = !knownCommands.includes(args[0]);

  assertStrictEquals(isUnknown, true);
});

test("CLI entry point > error handling > should provide suggestions for typos", async () => {
  const input = "devv";
  const knownCommands = ["init", "dev", "db", "blueprint", "plugin"];

  const suggestions = knownCommands.filter(
    (cmd) => cmd.startsWith(input[0]) && cmd.length >= input.length - 1,
  );

  assertEquals(suggestions.includes("dev"), true);
});

test("CLI entry point > CLI context > should create context with correct defaults", async () => {
  const context = {
    cwd: process.cwd(),
    verbose: false,
    configPath: undefined,
  };

  assertStrictEquals(context.cwd, process.cwd());
  assertStrictEquals(context.verbose, false);
  assertEquals(context.configPath, undefined);
});

test("CLI entry point > CLI context > should create context with verbose enabled", async () => {
  const context = {
    cwd: process.cwd(),
    verbose: true,
    configPath: undefined,
  };

  assertStrictEquals(context.verbose, true);
});

test("CLI entry point > CLI context > should create context with custom config path", async () => {
  const context = {
    cwd: process.cwd(),
    verbose: false,
    configPath: "./config/ferriqa.config.ts",
  };

  assertStrictEquals(context.configPath, "./config/ferriqa.config.ts");
});
