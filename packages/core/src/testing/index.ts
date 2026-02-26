/**
 * @ferriqa/core - Testing Compatibility Layer
 *
 * This module provides compatibility between the old describe/it/expect API
 * and the new @cross/test API.
 *
 * @deprecated Use @cross/test directly instead
 */

import { test as crossTest } from "@cross/test";
import {
  assertEquals,
  assertStrictEquals,
  assertExists,
  assertGreater,
  assertLess,
  assertMatch,
  assertArrayIncludes,
} from "@std/assert";

const describeStack: string[] = [];
const beforeHooks: Map<string, Array<() => void | Promise<void>>> = new Map();
const afterHooks: Map<string, Array<() => void | Promise<void>>> = new Map();

function getDescribeKey(): string {
  return describeStack.join(" > ");
}

export function describe(name: string, fn: () => void) {
  describeStack.push(name);
  const key = getDescribeKey();
  beforeHooks.set(key, []);
  afterHooks.set(key, []);

  try {
    fn();
  } finally {
    describeStack.pop();
  }
}

export function beforeEach(fn: () => void | Promise<void>) {
  const key = getDescribeKey();
  const hooks = beforeHooks.get(key) || [];
  hooks.push(fn);
  beforeHooks.set(key, hooks);
}

export function afterEach(fn: () => void | Promise<void>) {
  const key = getDescribeKey();
  const hooks = afterHooks.get(key) || [];
  hooks.push(fn);
  afterHooks.set(key, hooks);
}

export function it(name: string, fn: () => void | Promise<void>) {
  const fullName = [...describeStack, name].join(" > ");
  const wrappedFn = async () => {
    // Run parent hooks
    for (let i = 0; i < describeStack.length; i++) {
      const parentKey = describeStack.slice(0, i + 1).join(" > ");
      const hooks = beforeHooks.get(parentKey) || [];
      for (const hook of hooks) {
        await hook();
      }
    }

    try {
      await fn();
    } finally {
      // Run parent hooks
      for (let i = describeStack.length - 1; i >= 0; i--) {
        const parentKey = describeStack.slice(0, i + 1).join(" > ");
        const hooks = afterHooks.get(parentKey) || [];
        for (const hook of hooks) {
          await hook();
        }
      }
    }
  };
  crossTest(fullName, wrappedFn);
}

export function expect(actual: any) {
  return {
    toBe(expected: any) {
      assertStrictEquals(actual, expected);
    },
    toEqual(expected: any) {
      assertEquals(actual, expected);
    },
    toBeDefined() {
      assertExists(actual);
    },
    toBeNull() {
      assertStrictEquals(actual, null);
    },
    toBeUndefined() {
      assertStrictEquals(actual, undefined);
    },
    toBeTruthy() {
      if (!actual) throw new Error("Expected truthy value");
    },
    toBeFalsy() {
      if (actual) throw new Error("Expected falsy value");
    },
    toBeGreaterThan(expected: number) {
      assertGreater(actual, expected);
    },
    toBeLessThan(expected: number) {
      assertLess(actual, expected);
    },
    toHaveLength(length: number) {
      assertEquals(actual.length, length);
    },
    toContain(item: any) {
      // Handle both array and string contains
      if (Array.isArray(actual)) {
        assertArrayIncludes(actual, [item]);
      } else if (typeof actual === "string") {
        if (!actual.includes(item)) {
          throw new Error(`Expected "${actual}" to contain "${item}"`);
        }
      } else {
        throw new Error("toContain only works with arrays and strings");
      }
    },
    toBeInstanceOf(clazz: new (...args: any[]) => any) {
      assertStrictEquals(actual instanceof clazz, true);
    },
    toMatch(regex: RegExp) {
      assertMatch(String(actual), regex);
    },
    toBeGreaterThanOrEqual(expected: number) {
      if (actual < expected) {
        throw new Error(`Expected ${actual} to be >= ${expected}`);
      }
    },
    toBeLessThanOrEqual(expected: number) {
      if (actual > expected) {
        throw new Error(`Expected ${actual} to be <= ${expected}`);
      }
    },
  };
}

export function runTests() {
  // No-op - tests run when the file is loaded
}
