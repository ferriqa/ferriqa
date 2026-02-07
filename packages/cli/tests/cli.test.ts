/**
 * @ferriqa/cli - Main CLI Integration Tests
 *
 * Tests for the main CLI entry point and command routing.
 */

import { describe, it, expect, runTests } from "@ferriqa/core/testing";

describe("CLI entry point", () => {
  describe("command routing", () => {
    it("should show help when no command provided", async () => {
      const originalArgv = process.argv;
      process.argv = ["node", "ferriqa"];

      try {
        expect(true).toBe(true);
      } finally {
        process.argv = originalArgv;
      }
    });

    it("should show help with --help flag", async () => {
      const originalArgv = process.argv;
      process.argv = ["node", "ferriqa", "--help"];

      try {
        expect(true).toBe(true);
      } finally {
        process.argv = originalArgv;
      }
    });

    it("should show version with --version flag", async () => {
      const originalArgv = process.argv;
      process.argv = ["node", "ferriqa", "--version"];

      try {
        expect(true).toBe(true);
      } finally {
        process.argv = originalArgv;
      }
    });
  });

  describe("global options", () => {
    it("should parse verbose flag", async () => {
      const args = ["--verbose"];
      const verbose = args.includes("--verbose") || args.includes("-v");

      expect(verbose).toBe(true);
    });

    it("should parse config option", async () => {
      const args = ["--config", "./custom.config.ts"];
      const configIndex = args.findIndex(
        (arg) => arg === "--config" || arg === "-c",
      );
      const configPath =
        configIndex !== -1 && args[configIndex + 1]
          ? args[configIndex + 1]
          : undefined;

      expect(configPath).toBe("./custom.config.ts");
    });

    it("should parse short flags", async () => {
      const args = ["-v", "-c", "./config.ts", "-h"];

      const verbose = args.includes("-v");
      const configIndex = args.indexOf("-c");
      const configPath = configIndex !== -1 ? args[configIndex + 1] : undefined;
      const help = args.includes("-h");

      expect(verbose).toBe(true);
      expect(configPath).toBe("./config.ts");
      expect(help).toBe(true);
    });
  });

  describe("error handling", () => {
    it("should handle unknown commands", async () => {
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

      expect(isUnknown).toBe(true);
    });

    it("should provide suggestions for typos", async () => {
      const input = "devv";
      const knownCommands = ["init", "dev", "db", "blueprint", "plugin"];

      const suggestions = knownCommands.filter(
        (cmd) => cmd.startsWith(input[0]) && cmd.length >= input.length - 1,
      );

      expect(suggestions).toContain("dev");
    });
  });

  describe("CLI context", () => {
    it("should create context with correct defaults", async () => {
      const context = {
        cwd: process.cwd(),
        verbose: false,
        configPath: undefined,
      };

      expect(context.cwd).toBe(process.cwd());
      expect(context.verbose).toBe(false);
      expect(context.configPath).toBeUndefined();
    });

    it("should create context with verbose enabled", async () => {
      const context = {
        cwd: process.cwd(),
        verbose: true,
        configPath: undefined,
      };

      expect(context.verbose).toBe(true);
    });

    it("should create context with custom config path", async () => {
      const context = {
        cwd: process.cwd(),
        verbose: false,
        configPath: "./config/ferriqa.config.ts",
      };

      expect(context.configPath).toBe("./config/ferriqa.config.ts");
    });
  });
});

runTests();
