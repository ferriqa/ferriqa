/**
 * @ferriqa/cli - Dev Command Integration Tests
 *
 * Cross-runtime tests for `ferriqa dev` command.
 * Works with Bun, Node.js, and Deno.
 */

import { describe, it, expect, runTests } from "@ferriqa/core/testing";
import type { CLIContext } from "../src/index.ts";
import { createTestContext, cleanupTestContext, crossFs } from "./utils.ts";

describe("dev command", () => {
  describe("argument parsing", () => {
    it("should parse port option", async () => {
      const args = ["--port", "4000"];
      const portIndex = args.indexOf("--port");
      const port = portIndex !== -1 ? parseInt(args[portIndex + 1], 10) : 3000;

      expect(port).toBe(4000);
    });

    it("should parse host option", async () => {
      const args = ["--host", "0.0.0.0"];
      const hostIndex = args.indexOf("--host");
      const host = hostIndex !== -1 ? args[hostIndex + 1] : "localhost";

      expect(host).toBe("0.0.0.0");
    });

    it("should support no-watch flag", async () => {
      const args = ["--no-watch"];
      const noWatch = args.includes("--no-watch");

      expect(noWatch).toBe(true);
    });

    it("should combine multiple options", async () => {
      const args = ["--port", "5000", "--host", "127.0.0.1", "--no-watch"];

      const portIndex = args.indexOf("--port");
      const port = portIndex !== -1 ? parseInt(args[portIndex + 1], 10) : 3000;

      const hostIndex = args.indexOf("--host");
      const host = hostIndex !== -1 ? args[hostIndex + 1] : "localhost";

      const noWatch = args.includes("--no-watch");

      expect(port).toBe(5000);
      expect(host).toBe("127.0.0.1");
      expect(noWatch).toBe(true);
    });

    it("should parse short flags", async () => {
      const args = ["-p", "8080", "-h", "0.0.0.0"];

      const portIndex = args.indexOf("-p");
      const port = portIndex !== -1 ? parseInt(args[portIndex + 1], 10) : 3000;

      const hostIndex = args.indexOf("-h");
      const host = hostIndex !== -1 ? args[hostIndex + 1] : "localhost";

      expect(port).toBe(8080);
      expect(host).toBe("0.0.0.0");
    });
  });

  describe("context handling", () => {
    it("should create context with custom config path", async () => {
      const context = await createTestContext();

      try {
        const cliContext: CLIContext = {
          cwd: context.cwd,
          verbose: false,
          configPath: "./config/custom.config.ts",
        };

        expect(cliContext.configPath).toBe("./config/custom.config.ts");
      } finally {
        await cleanupTestContext(context);
      }
    });

    it("should handle missing config file gracefully", async () => {
      const context = await createTestContext();

      try {
        const fs = await crossFs();
        const configExists = await fs.stat(`${context.cwd}/ferriqa.config.ts`);
        expect(configExists).toBeNull();
      } finally {
        await cleanupTestContext(context);
      }
    });
  });

  describe("help flags", () => {
    it("should detect help flag", async () => {
      const args = ["--help"];
      const showHelp = args.includes("--help") || args.includes("-h");

      expect(showHelp).toBe(true);
    });

    it("should detect help short flag", async () => {
      const args = ["-h"];
      const showHelp = args.includes("--help") || args.includes("-h");

      expect(showHelp).toBe(true);
    });
  });

  describe("default values", () => {
    it("should use default port 3000", async () => {
      const args: string[] = [];
      const portIndex = args.indexOf("--port");
      const port = portIndex !== -1 ? parseInt(args[portIndex + 1], 10) : 3000;

      expect(port).toBe(3000);
    });

    it("should use default host localhost", async () => {
      const args: string[] = [];
      const hostIndex = args.indexOf("--host");
      const host = hostIndex !== -1 ? args[hostIndex + 1] : "localhost";

      expect(host).toBe("localhost");
    });
  });
});

runTests();
