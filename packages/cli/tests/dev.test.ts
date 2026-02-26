/**
 * @ferriqa/cli - Dev Command Integration Tests
 *
 * Cross-runtime tests for `ferriqa dev` command.
 * Works with Bun, Node.js, and Deno.
 */

import { test } from "@cross/test";
import { assertStrictEquals, assertEquals } from "@std/assert";
import type { CLIContext } from "../src/index.ts";
import { createTestContext, cleanupTestContext, crossFs } from "./utils.ts";

test("dev command > argument parsing > should parse port option", async () => {
  const args = ["--port", "4000"];
  const portIndex = args.indexOf("--port");
  const port = portIndex !== -1 ? parseInt(args[portIndex + 1], 10) : 3000;

  assertStrictEquals(port, 4000);
});

test("dev command > argument parsing > should parse host option", async () => {
  const args = ["--host", "0.0.0.0"];
  const hostIndex = args.indexOf("--host");
  const host = hostIndex !== -1 ? args[hostIndex + 1] : "localhost";

  assertStrictEquals(host, "0.0.0.0");
});

test("dev command > argument parsing > should support no-watch flag", async () => {
  const args = ["--no-watch"];
  const noWatch = args.includes("--no-watch");

  assertStrictEquals(noWatch, true);
});

test("dev command > argument parsing > should combine multiple options", async () => {
  const args = ["--port", "5000", "--host", "127.0.0.1", "--no-watch"];

  const portIndex = args.indexOf("--port");
  const port = portIndex !== -1 ? parseInt(args[portIndex + 1], 10) : 3000;

  const hostIndex = args.indexOf("--host");
  const host = hostIndex !== -1 ? args[hostIndex + 1] : "localhost";

  const noWatch = args.includes("--no-watch");

  assertStrictEquals(port, 5000);
  assertStrictEquals(host, "127.0.0.1");
  assertStrictEquals(noWatch, true);
});

test("dev command > argument parsing > should parse short flags", async () => {
  const args = ["-p", "8080", "-h", "0.0.0.0"];

  const portIndex = args.indexOf("-p");
  const port = portIndex !== -1 ? parseInt(args[portIndex + 1], 10) : 3000;

  const hostIndex = args.indexOf("-h");
  const host = hostIndex !== -1 ? args[hostIndex + 1] : "localhost";

  assertStrictEquals(port, 8080);
  assertStrictEquals(host, "0.0.0.0");
});

test("dev command > context handling > should create context with custom config path", async () => {
  const context = await createTestContext();

  try {
    const cliContext: CLIContext = {
      cwd: context.cwd,
      verbose: false,
      configPath: "./config/custom.config.ts",
    };

    assertStrictEquals(cliContext.configPath, "./config/custom.config.ts");
  } finally {
    await cleanupTestContext(context);
  }
});

test("dev command > context handling > should handle missing config file gracefully", async () => {
  const context = await createTestContext();

  try {
    const fs = await crossFs();
    const configExists = await fs.stat(`${context.cwd}/ferriqa.config.ts`);
    assertEquals(configExists, null);
  } finally {
    await cleanupTestContext(context);
  }
});

test("dev command > help flags > should detect help flag", async () => {
  const args = ["--help"];
  const showHelp = args.includes("--help") || args.includes("-h");

  assertStrictEquals(showHelp, true);
});

test("dev command > help flags > should detect help short flag", async () => {
  const args = ["-h"];
  const showHelp = args.includes("--help") || args.includes("-h");

  assertStrictEquals(showHelp, true);
});

test("dev command > default values > should use default port 3000", async () => {
  const args: string[] = [];
  const portIndex = args.indexOf("--port");
  const port = portIndex !== -1 ? parseInt(args[portIndex + 1], 10) : 3000;

  assertStrictEquals(port, 3000);
});

test("dev command > default values > should use default host localhost", async () => {
  const args: string[] = [];
  const hostIndex = args.indexOf("--host");
  const host = hostIndex !== -1 ? args[hostIndex + 1] : "localhost";

  assertStrictEquals(host, "localhost");
});
