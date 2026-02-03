/**
 * @ferriqa/core - Universal Test Utilities
 *
 * Cross-runtime testing utilities that work with Bun, Node.js, and Deno.
 * Provides a unified API for writing tests that run across all runtimes.
 * Now powered by @cross/test and @std/assert for cross-platform compatibility.
 */

// Cross-runtime test framework
import { test } from "@cross/test";

// Assertion library from Deno standard library
import {
  assertEquals,
  assertStrictEquals,
  assertExists,
  assertInstanceOf,
  assertMatch,
  assertArrayIncludes,
  assertGreater,
  assertGreaterOrEqual,
  assertLess,
  assertLessOrEqual,
  assertThrows,
  AssertionError,
} from "@std/assert";

// Runtime detection - imported from runtime module to avoid duplication
import { isBun, isDeno, isNode } from "../runtime.ts";

// Type definitions for test functions
export type TestFunction = () => void | Promise<void>;
export type HookFunction = () => void | Promise<void>;

// Matchers interface
// Note: Async matchers (resolves/rejects) are not implemented in this lightweight framework.
// For async assertions, await the promise first: const value = await promise; expect(value).toBe(expected)
export interface Matchers<T> {
  toBe(expected: T): void;
  toEqual(expected: unknown): void;
  toBeDefined(): void;
  toBeUndefined(): void;
  toBeNull(): void;
  toBeTruthy(): void;
  toBeFalsy(): void;
  toContain(expected: string | unknown): void;
  toBeGreaterThan(expected: number): void;
  toBeGreaterThanOrEqual(expected: number): void;
  toBeLessThan(expected: number): void;
  toBeLessThanOrEqual(expected: number): void;
  toThrow(expected?: string | RegExp | Error): void;
  toBeInstanceOf(expected: new (...args: never[]) => unknown): void;
  toHaveLength(expected: number): void;
  toMatch(expected: RegExp | string): void;
  toMatchObject(expected: Record<string, unknown>): void;
  not: Matchers<T>;
}

// Internal matcher implementation using @std/assert
class MatchersImpl<T> implements Matchers<T> {
  private value: T;
  private isNot: boolean;

  constructor(value: T, isNot = false) {
    this.value = value;
    this.isNot = isNot;
  }

  /**
   * Helper to handle negated assertions.
   * For negated assertions, we expect the assertion to throw.
   * If it doesn't throw, the negated assertion fails.
   */
  private assertNegated(
    assertionFn: () => void,
    passMessage: string,
    failMessage: string,
  ): void {
    try {
      assertionFn();
      // If we get here, the assertion passed, which means the negated assertion failed
      throw new Error(failMessage);
    } catch (error) {
      if (error instanceof AssertionError) {
        // The original assertion failed, which means the negated assertion passes
        return;
      }
      // Re-throw if it's our own negation error or another unexpected error
      throw error;
    }
  }

  toBe(expected: T): void {
    if (this.isNot) {
      this.assertNegated(
        () => assertStrictEquals(this.value, expected),
        `Expected ${this.value} not to be ${expected}`,
        `Expected ${this.value} to not be ${expected}, but they are the same`,
      );
    } else {
      assertStrictEquals(this.value, expected);
    }
  }

  toEqual(expected: unknown): void {
    if (this.isNot) {
      this.assertNegated(
        () => assertEquals(this.value, expected),
        `Expected values to not be equal`,
        `Expected ${JSON.stringify(this.value)} to not equal ${JSON.stringify(expected)}, but they are equal`,
      );
    } else {
      assertEquals(this.value, expected);
    }
  }

  toBeDefined(): void {
    if (this.isNot) {
      if (this.value !== undefined) {
        throw new AssertionError(
          "Expected value to be undefined, but it was defined",
        );
      }
    } else {
      assertExists(this.value);
    }
  }

  toBeUndefined(): void {
    if (this.isNot) {
      if (this.value === undefined) {
        throw new AssertionError(
          "Expected value to not be undefined, but it was undefined",
        );
      }
    } else {
      if (this.value !== undefined) {
        throw new AssertionError(
          `Expected value to be undefined, but got ${this.value}`,
        );
      }
    }
  }

  toBeNull(): void {
    if (this.isNot) {
      if (this.value === null) {
        throw new AssertionError(
          "Expected value to not be null, but it was null",
        );
      }
    } else {
      if (this.value !== null) {
        throw new AssertionError(
          `Expected value to be null, but got ${this.value}`,
        );
      }
    }
  }

  toBeTruthy(): void {
    if (this.isNot) {
      if (this.value) {
        throw new AssertionError(
          `Expected value to be falsy, but got ${this.value}`,
        );
      }
    } else {
      if (!this.value) {
        throw new AssertionError(
          `Expected value to be truthy, but got ${this.value}`,
        );
      }
    }
  }

  toBeFalsy(): void {
    if (this.isNot) {
      if (!this.value) {
        throw new AssertionError(
          `Expected value to be truthy, but got ${this.value}`,
        );
      }
    } else {
      if (this.value) {
        throw new AssertionError(
          `Expected value to be falsy, but got ${this.value}`,
        );
      }
    }
  }

  toContain(expected: string | unknown): void {
    const value = this.value;
    if (typeof value === "string") {
      if (this.isNot) {
        if (value.includes(String(expected))) {
          throw new AssertionError(
            `Expected string not to contain "${expected}", but it did`,
          );
        }
      } else {
        if (!value.includes(String(expected))) {
          throw new AssertionError(
            `Expected string to contain "${expected}", but got "${value}"`,
          );
        }
      }
    } else if (Array.isArray(value)) {
      if (this.isNot) {
        this.assertNegated(
          () => assertArrayIncludes(value, [expected]),
          `Expected array not to contain ${expected}`,
          `Expected array to not contain ${expected}, but it was found`,
        );
      } else {
        assertArrayIncludes(value, [expected]);
      }
    } else {
      throw new Error(`toContain only works with strings and arrays`);
    }
  }

  toBeGreaterThan(expected: number): void {
    if (this.isNot) {
      this.assertNegated(
        () => assertGreater(this.value as number, expected),
        `Expected ${this.value} not to be greater than ${expected}`,
        `Expected ${this.value} to not be greater than ${expected}, but it is`,
      );
    } else {
      assertGreater(this.value as number, expected);
    }
  }

  toBeGreaterThanOrEqual(expected: number): void {
    if (this.isNot) {
      this.assertNegated(
        () => assertGreaterOrEqual(this.value as number, expected),
        `Expected ${this.value} not to be greater than or equal to ${expected}`,
        `Expected ${this.value} to not be >= ${expected}, but it is`,
      );
    } else {
      assertGreaterOrEqual(this.value as number, expected);
    }
  }

  toBeLessThan(expected: number): void {
    if (this.isNot) {
      this.assertNegated(
        () => assertLess(this.value as number, expected),
        `Expected ${this.value} not to be less than ${expected}`,
        `Expected ${this.value} to not be < ${expected}, but it is`,
      );
    } else {
      assertLess(this.value as number, expected);
    }
  }

  toBeLessThanOrEqual(expected: number): void {
    if (this.isNot) {
      this.assertNegated(
        () => assertLessOrEqual(this.value as number, expected),
        `Expected ${this.value} not to be less than or equal to ${expected}`,
        `Expected ${this.value} to not be <= ${expected}, but it is`,
      );
    } else {
      assertLessOrEqual(this.value as number, expected);
    }
  }

  toThrow(expected?: string | RegExp | Error): void {
    if (typeof this.value !== "function") {
      throw new Error(
        `toThrow() expects a function. Received: ${typeof this.value}`,
      );
    }

    if (this.isNot) {
      // For negated toThrow, we expect the function NOT to throw
      try {
        (this.value as () => unknown)();
        // No throw = negated assertion passes
        return;
      } catch (error) {
        throw new AssertionError(
          `Expected function not to throw, but it threw: ${(error as Error).message}`,
        );
      }
    }

    // Positive case: we expect it to throw
    if (expected === undefined) {
      // Just check that it throws anything
      assertThrows(this.value as () => void);
    } else if (typeof expected === "string") {
      const fn = this.value as () => void;
      let thrown: Error | undefined;
      try {
        fn();
      } catch (e) {
        thrown = e as Error;
      }
      if (!thrown || !thrown.message.includes(expected)) {
        throw new AssertionError(
          `Expected function to throw message containing "${expected}", but got: ${thrown?.message}`,
        );
      }
    } else if (expected instanceof RegExp) {
      const fn = this.value as () => void;
      let thrown: Error | undefined;
      try {
        fn();
      } catch (e) {
        thrown = e as Error;
      }
      if (!thrown || !expected.test(thrown.message)) {
        throw new AssertionError(
          `Expected function to throw message matching ${expected}, but got: ${thrown?.message}`,
        );
      }
    } else if (expected instanceof Error) {
      const fn = this.value as () => void;
      let thrown: Error | undefined;
      try {
        fn();
      } catch (e) {
        thrown = e as Error;
      }
      if (
        !thrown ||
        thrown.constructor !== expected.constructor ||
        thrown.message !== expected.message
      ) {
        throw new AssertionError(
          `Expected function to throw ${expected.constructor.name} with message "${expected.message}"`,
        );
      }
    }
  }

  toBeInstanceOf(expected: new (...args: never[]) => unknown): void {
    if (this.isNot) {
      this.assertNegated(
        () => assertInstanceOf(this.value, expected),
        `Expected value not to be instance of ${expected.name}`,
        `Expected value to not be instance of ${expected.name}, but it is`,
      );
    } else {
      assertInstanceOf(this.value, expected);
    }
  }

  toHaveLength(expected: number): void {
    const value = this.value as { length: number };
    const actualLength = value.length;
    if (this.isNot) {
      if (actualLength === expected) {
        throw new AssertionError(
          `Expected length not to be ${expected}, but it was`,
        );
      }
    } else {
      if (actualLength !== expected) {
        throw new AssertionError(
          `Expected length to be ${expected}, but got ${actualLength}`,
        );
      }
    }
  }

  toMatch(expected: RegExp | string): void {
    const value = String(this.value);
    const regex =
      typeof expected === "string" ? new RegExp(expected) : expected;

    if (this.isNot) {
      if (regex.test(value)) {
        throw new AssertionError(
          `Expected "${value}" not to match ${expected}, but it did`,
        );
      }
    } else {
      assertMatch(value, regex);
    }
  }

  toMatchObject(expected: Record<string, unknown>): void {
    const pass = matchObject(this.value as Record<string, unknown>, expected);
    if (this.isNot) {
      if (pass) {
        throw new AssertionError(
          `Expected object not to match ${JSON.stringify(expected)}, but it did`,
        );
      }
    } else {
      if (!pass) {
        throw new AssertionError(
          `Expected object to match ${JSON.stringify(expected)}, but got ${JSON.stringify(this.value)}`,
        );
      }
    }
  }

  get not(): Matchers<T> {
    return new MatchersImpl(this.value, true) as Matchers<T>;
  }
}

// Object matching helper
function matchObject(
  actual: Record<string, unknown>,
  expected: Record<string, unknown>,
): boolean {
  for (const [key, value] of Object.entries(expected)) {
    if (!(key in actual)) return false;
    if (typeof value === "object" && value !== null) {
      if (
        !matchObject(
          actual[key] as Record<string, unknown>,
          value as Record<string, unknown>,
        )
      ) {
        return false;
      }
    } else if (actual[key] !== value) {
      return false;
    }
  }
  return true;
}

// Test suite context for hooks
interface SuiteContext {
  name: string;
  hooks: {
    beforeAll: HookFunction[];
    beforeEach: HookFunction[];
    afterAll: HookFunction[];
    afterEach: HookFunction[];
  };
  testCount: number;
  completedTests: number;
  beforeAllExecuted: boolean;
}

// Global state for current suite context
let currentContext: SuiteContext | null = null;
const suiteContexts: SuiteContext[] = [];

// Create expect function
export function expect<T>(value: T): Matchers<T> {
  return new MatchersImpl(value) as Matchers<T>;
}

// describe() now uses @cross/test test() with grouping
export function describe(name: string, fn: () => void | Promise<void>): void {
  const context: SuiteContext = {
    name,
    hooks: {
      beforeAll: [],
      beforeEach: [],
      afterAll: [],
      afterEach: [],
    },
    testCount: 0,
    completedTests: 0,
    beforeAllExecuted: false,
  };

  // Store context for tracking
  suiteContexts.push(context);

  const previousContext = currentContext;
  currentContext = context;

  try {
    // Execute the suite definition function to collect tests and hooks
    fn();
  } finally {
    currentContext = previousContext;
  }
}

// it() registers tests using @cross/test with proper hook execution
export function it(name: string, fn: TestFunction): void {
  if (!currentContext) {
    throw new Error("it() must be called within a describe() block");
  }

  const context = currentContext;
  context.testCount++;

  // Register the test with @cross/test
  test(`${context.name} > ${name}`, async () => {
    // Execute beforeAll hooks on first test
    if (!context.beforeAllExecuted && context.hooks.beforeAll.length > 0) {
      for (const hook of context.hooks.beforeAll) {
        await hook();
      }
      context.beforeAllExecuted = true;
    }

    // Run beforeEach hooks
    for (const hook of context.hooks.beforeEach) {
      await hook();
    }

    try {
      await fn();
    } finally {
      context.completedTests++;

      // Run afterEach hooks
      for (const hook of context.hooks.afterEach) {
        await hook();
      }

      // Execute afterAll hooks on last test
      if (
        context.completedTests === context.testCount &&
        context.hooks.afterAll.length > 0
      ) {
        for (const hook of context.hooks.afterAll) {
          await hook();
        }
      }
    }
  });
}

// Hook implementations - collect hooks for the current context
export function beforeAll(fn: HookFunction): void {
  if (!currentContext) {
    throw new Error("beforeAll() must be called within a describe() block");
  }
  currentContext.hooks.beforeAll.push(fn);
}

export function beforeEach(fn: HookFunction): void {
  if (!currentContext) {
    throw new Error("beforeEach() must be called within a describe() block");
  }
  currentContext.hooks.beforeEach.push(fn);
}

export function afterAll(fn: HookFunction): void {
  if (!currentContext) {
    throw new Error("afterAll() must be called within a describe() block");
  }
  currentContext.hooks.afterAll.push(fn);
}

export function afterEach(fn: HookFunction): void {
  if (!currentContext) {
    throw new Error("afterEach() must be called within a describe() block");
  }
  currentContext.hooks.afterEach.push(fn);
}

/**
 * runTests() is now a compatibility function.
 * With @cross/test, tests are automatically run by the test runner.
 * This function returns a resolved promise for backward compatibility.
 */
export async function runTests(): Promise<{ passed: number; failed: number }> {
  // With @cross/test, tests are automatically run by the test runner
  // This function is kept for backward compatibility
  return { passed: 0, failed: 0 };
}

// Clear context (useful for testing the test framework itself)
export function clearTests(): void {
  currentContext = null;
  suiteContexts.length = 0;
}

// Export runtime detection for conditional tests
export { isBun, isDeno, isNode };

// Re-export all testing modules
export * from "./runner.ts";
export * from "./fixtures.ts";
export * from "./mocks.ts";
export * from "./config.ts";
