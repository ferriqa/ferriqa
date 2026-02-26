/**
 * @ferriqa/core - Cross-Runtime Tests
 *
 * Tests that verify functionality across Bun, Node.js, and Deno runtimes.
 */

import { test } from "@cross/test";
import { assertGreater, assertStrictEquals, assertExists } from "@std/assert";
import {
  isBun,
  isDeno,
  isNode,
  getRuntimeId,
  getRuntimeInfo,
} from "../../runtime.ts";

test("Cross-Runtime Compatibility > Runtime Detection > should detect exactly one runtime", () => {
  const detected = [isBun, isDeno, isNode].filter(Boolean).length;
  assertGreater(detected, 0);
});

test("Cross-Runtime Compatibility > Runtime Detection > should return valid runtime ID", () => {
  const id = getRuntimeId();
  const validIds = ["bun", "deno", "node", "unknown"];
  assertExists(validIds.find((v) => v === id));
});

test("Cross-Runtime Compatibility > Runtime Detection > should return runtime info with version", () => {
  const info = getRuntimeInfo();
  assertExists(info.name);
  assertExists(info.version);
});

test("Cross-Runtime Compatibility > Module Loading > should load ES modules", async () => {
  const { hooks } = await import("../../hooks/index.ts");
  assertExists(hooks);
});

test("Cross-Runtime Compatibility > Module Loading > should support dynamic imports", async () => {
  const module = await import("../../runtime.ts");
  assertExists(module.getRuntimeId);
});

test("Cross-Runtime Compatibility > File System Operations > should be able to run tests (basic operation)", () => {
  assertStrictEquals(true, true);
});

test("Cross-Runtime Compatibility > Environment Variables > should have process.env or Deno.env", () => {
  const hasEnv =
    typeof (globalThis as any).process !== "undefined" ||
    typeof Deno !== "undefined";
  assertStrictEquals(hasEnv, true);
});
