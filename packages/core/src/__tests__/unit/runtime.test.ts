/**
 * @ferriqa/core - Runtime Detection Unit Tests
 *
 * Tests for runtime detection utilities.
 */

import { test } from "@cross/test";
import { assertEquals, assertNotEquals } from "@std/assert";
import {
  isBun,
  isDeno,
  isNode,
  getRuntimeInfo,
  assertRuntime,
  getRuntimeId,
} from "../../runtime.ts";

test("Runtime Detection - isBun should be a boolean", () => {
  assertEquals(typeof isBun, "boolean");
});

test("Runtime Detection - isBun should detect Bun runtime correctly", () => {
  if (typeof (globalThis as any).Bun !== "undefined") {
    assertEquals(isBun, true);
  } else {
    assertEquals(isBun, false);
  }
});

test("Runtime Detection - isDeno should be a boolean", () => {
  assertEquals(typeof isDeno, "boolean");
});

test("Runtime Detection - isDeno should detect Deno runtime correctly", () => {
  if (typeof Deno !== "undefined") {
    assertEquals(isDeno, true);
  } else {
    assertEquals(isDeno, false);
  }
});

test("Runtime Detection - isNode should be a boolean", () => {
  assertEquals(typeof isNode, "boolean");
});

test("Runtime Detection - isNode should not be true if Bun or Deno", () => {
  if (isBun || isDeno) {
    assertEquals(isNode, false);
  }
});

test("Runtime Detection - getRuntimeInfo should return runtime info object", () => {
  const info = getRuntimeInfo();
  assertEquals(typeof info.name, "string");
  assertEquals(typeof info.version, "string");
});

test("Runtime Detection - getRuntimeInfo should return correct runtime name", () => {
  const info = getRuntimeInfo();

  if (isBun) {
    assertEquals(info.name, "Bun");
  } else if (isDeno) {
    assertEquals(info.name, "Deno");
  } else if (isNode) {
    assertEquals(info.name, "Node.js");
  } else {
    assertEquals(info.name, "Unknown");
  }
});

test("Runtime Detection - getRuntimeId should return runtime identifier", () => {
  const id = getRuntimeId();
  assertEquals(["bun", "deno", "node", "unknown"].includes(id), true);
});

test("Runtime Detection - getRuntimeId should match runtime detection", () => {
  const id = getRuntimeId();

  if (isBun) {
    assertEquals(id, "bun");
  } else if (isDeno) {
    assertEquals(id, "deno");
  } else if (isNode) {
    assertEquals(id, "node");
  } else {
    assertEquals(id, "unknown");
  }
});

test("Runtime Detection - assertRuntime should not throw for correct runtime", () => {
  const currentRuntime = getRuntimeId();

  if (currentRuntime !== "unknown") {
    // Should not throw
    assertRuntime(currentRuntime);
  }
});

test("Runtime Detection - assertRuntime should throw for incorrect runtime", () => {
  const currentRuntime = getRuntimeId();
  const wrongRuntime = currentRuntime === "bun" ? "node" : "bun";

  let threw = false;
  try {
    assertRuntime(wrongRuntime as "bun" | "deno" | "node");
  } catch {
    threw = true;
  }
  assertEquals(threw, true);
});
