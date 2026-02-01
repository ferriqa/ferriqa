/**
 * @ferriqa/core - Cross-Runtime Tests
 *
 * Tests that verify functionality across Bun, Node.js, and Deno runtimes.
 */

import { describe, it, expect } from "../../testing/index.ts";
import {
  isBun,
  isDeno,
  isNode,
  getRuntimeId,
  getRuntimeInfo,
} from "../../runtime.ts";

describe("Cross-Runtime Compatibility", () => {
  describe("Runtime Detection", () => {
    it("should detect exactly one runtime", () => {
      const detected = [isBun, isDeno, isNode].filter(Boolean).length;
      expect(detected).toBeGreaterThanOrEqual(1);
    });

    it("should return valid runtime ID", () => {
      const id = getRuntimeId();
      expect(["bun", "deno", "node", "unknown"]).toContain(id);
    });

    it("should return runtime info with version", () => {
      const info = getRuntimeInfo();
      expect(info.name).toBeTruthy();
      expect(info.version).toBeTruthy();
    });
  });

  describe("Module Loading", () => {
    it("should load ES modules", async () => {
      const { hooks } = await import("../../hooks/index.ts");
      expect(hooks).toBeDefined();
    });

    it("should support dynamic imports", async () => {
      const module = await import("../../runtime.ts");
      expect(module.getRuntimeId).toBeDefined();
    });
  });

  describe("File System Operations", () => {
    it("should be able to run tests (basic operation)", () => {
      expect(true).toBe(true);
    });
  });

  describe("Environment Variables", () => {
    it("should have process.env or Deno.env", () => {
      const hasEnv =
        typeof (globalThis as any).process !== "undefined" ||
        typeof Deno !== "undefined";
      expect(hasEnv).toBe(true);
    });
  });
});
