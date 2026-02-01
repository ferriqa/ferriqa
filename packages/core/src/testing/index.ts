/**
 * @ferriqa/core - Universal Test Utilities
 *
 * Cross-runtime testing utilities that work with Bun, Node.js, and Deno.
 * Provides a unified API for writing tests that run across all runtimes.
 */

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

// Internal matcher implementation
class MatchersImpl<T> implements Matchers<T> {
  private value: T;
  private isNot: boolean;

  constructor(value: T, isNot = false) {
    this.value = value;
    this.isNot = isNot;
  }

  private assert(
    condition: boolean,
    passMessage: string,
    failMessage: string,
  ): void {
    const passed = this.isNot ? !condition : condition;
    if (!passed) {
      throw new Error(
        `Assertion failed: ${this.isNot ? failMessage : passMessage}`,
      );
    }
  }

  toBe(expected: T): void {
    this.assert(
      Object.is(this.value, expected),
      `Expected ${this.value} to be ${expected}`,
      `Expected ${this.value} not to be ${expected}`,
    );
  }

  toEqual(expected: unknown): void {
    const pass = deepEqual(this.value, expected);
    this.assert(
      pass,
      `Expected ${JSON.stringify(this.value)} to equal ${JSON.stringify(expected)}`,
      `Expected ${JSON.stringify(this.value)} not to equal ${JSON.stringify(expected)}`,
    );
  }

  toBeDefined(): void {
    this.assert(
      this.value !== undefined,
      `Expected value to be defined`,
      `Expected value not to be defined`,
    );
  }

  toBeUndefined(): void {
    this.assert(
      this.value === undefined,
      `Expected value to be undefined`,
      `Expected value not to be undefined`,
    );
  }

  toBeNull(): void {
    this.assert(
      this.value === null,
      `Expected value to be null`,
      `Expected value not to be null`,
    );
  }

  toBeTruthy(): void {
    this.assert(
      !!this.value,
      `Expected value to be truthy`,
      `Expected value not to be truthy`,
    );
  }

  toBeFalsy(): void {
    this.assert(
      !this.value,
      `Expected value to be falsy`,
      `Expected value not to be falsy`,
    );
  }

  toContain(expected: string | unknown): void {
    const value = this.value;
    if (typeof value === "string") {
      this.assert(
        value.includes(String(expected)),
        `Expected string to contain "${expected}"`,
        `Expected string not to contain "${expected}"`,
      );
    } else if (Array.isArray(value)) {
      this.assert(
        value.includes(expected as T),
        `Expected array to contain ${expected}`,
        `Expected array not to contain ${expected}`,
      );
    } else {
      throw new Error(`toContain only works with strings and arrays`);
    }
  }

  toBeGreaterThan(expected: number): void {
    this.assert(
      (this.value as number) > expected,
      `Expected ${this.value} to be greater than ${expected}`,
      `Expected ${this.value} not to be greater than ${expected}`,
    );
  }

  toBeGreaterThanOrEqual(expected: number): void {
    this.assert(
      (this.value as number) >= expected,
      `Expected ${this.value} to be greater than or equal to ${expected}`,
      `Expected ${this.value} not to be greater than or equal to ${expected}`,
    );
  }

  toBeLessThan(expected: number): void {
    this.assert(
      (this.value as number) < expected,
      `Expected ${this.value} to be less than ${expected}`,
      `Expected ${this.value} not to be less than ${expected}`,
    );
  }

  toBeLessThanOrEqual(expected: number): void {
    this.assert(
      (this.value as number) <= expected,
      `Expected ${this.value} to be less than or equal to ${expected}`,
      `Expected ${this.value} not to be less than or equal to ${expected}`,
    );
  }

  toThrow(expected?: string | RegExp | Error): void {
    if (typeof this.value !== "function") {
      throw new Error(
        `toThrow() expects a function. Received: ${typeof this.value}`,
      );
    }

    let thrownError: Error | null = null;
    try {
      (this.value as () => unknown)();
    } catch (error) {
      thrownError = error as Error;
    }

    // Check if an error was thrown
    if (thrownError === null) {
      this.assert(
        false,
        `Expected function to throw`,
        `Expected function not to throw`,
      );
      return;
    }

    // If no expected value, just check that something was thrown
    if (expected === undefined) {
      this.assert(
        true,
        `Expected function to throw`,
        `Expected function not to throw`,
      );
      return;
    }

    // Check if thrown error matches expected
    let matches = false;
    if (typeof expected === "string") {
      matches = thrownError.message.includes(expected);
    } else if (expected instanceof RegExp) {
      matches = expected.test(thrownError.message);
    } else if (expected instanceof Error) {
      matches =
        thrownError.constructor === expected.constructor &&
        thrownError.message === expected.message;
    }

    this.assert(
      matches,
      `Expected function to throw ${expected}`,
      `Expected function not to throw ${expected}`,
    );
  }

  toBeInstanceOf(expected: new (...args: never[]) => unknown): void {
    this.assert(
      this.value instanceof expected,
      `Expected value to be instance of ${expected.name}`,
      `Expected value not to be instance of ${expected.name}`,
    );
  }

  toHaveLength(expected: number): void {
    const value = this.value as { length: number };
    this.assert(
      value.length === expected,
      `Expected length to be ${expected}, got ${value.length}`,
      `Expected length not to be ${expected}`,
    );
  }

  toMatch(expected: RegExp | string): void {
    const value = String(this.value);
    const regex =
      typeof expected === "string" ? new RegExp(expected) : expected;
    this.assert(
      regex.test(value),
      `Expected "${value}" to match ${expected}`,
      `Expected "${value}" not to match ${expected}`,
    );
  }

  toMatchObject(expected: Record<string, unknown>): void {
    const pass = matchObject(this.value as Record<string, unknown>, expected);
    this.assert(
      pass,
      `Expected object to match ${JSON.stringify(expected)}`,
      `Expected object not to match ${JSON.stringify(expected)}`,
    );
  }

  get not(): Matchers<T> {
    return new MatchersImpl(this.value, true) as Matchers<T>;
  }
}

// Deep equality helper
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;

  if (typeof a === "object") {
    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;
    const keysA = Object.keys(aObj);
    const keysB = Object.keys(bObj);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
      if (!keysB.includes(key)) return false;
      if (!deepEqual(aObj[key], bObj[key])) return false;
    }

    return true;
  }

  return false;
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

// Test registry
interface TestSuite {
  name: string;
  fn: () => void | Promise<void>;
  tests: TestCase[];
  hooks: {
    beforeAll: HookFunction[];
    beforeEach: HookFunction[];
    afterAll: HookFunction[];
    afterEach: HookFunction[];
  };
}

interface TestCase {
  name: string;
  fn: TestFunction;
  suite: TestSuite;
}

// Global state
let currentSuite: TestSuite | null = null;
const suites: TestSuite[] = [];

// Create expect function
export function expect<T>(value: T): Matchers<T> {
  return new MatchersImpl(value) as Matchers<T>;
}

// Runtime-specific describe implementation
export function describe(name: string, fn: () => void | Promise<void>): void {
  const suite: TestSuite = {
    name,
    fn,
    tests: [],
    hooks: {
      beforeAll: [],
      beforeEach: [],
      afterAll: [],
      afterEach: [],
    },
  };

  suites.push(suite);
  currentSuite = suite;

  try {
    fn();
  } finally {
    currentSuite = null;
  }
}

// Runtime-specific it implementation
// Note: This registers tests for later execution via runTests()
// This is by design - tests are collected during describe() execution,
// then runTests() is called manually. This allows for flexible test
// runner integration across different runtimes (Bun, Node, Deno).
// This is NOT a bug - it's an intentional lightweight test framework design.
export function it(name: string, fn: TestFunction): void {
  if (!currentSuite) {
    throw new Error("it() must be called within a describe() block");
  }

  currentSuite.tests.push({
    name,
    fn,
    suite: currentSuite,
  });
}

// Hook implementations
export function beforeAll(fn: HookFunction): void {
  if (!currentSuite) {
    throw new Error("beforeAll() must be called within a describe() block");
  }
  currentSuite.hooks.beforeAll.push(fn);
}

export function beforeEach(fn: HookFunction): void {
  if (!currentSuite) {
    throw new Error("beforeEach() must be called within a describe() block");
  }
  currentSuite.hooks.beforeEach.push(fn);
}

export function afterAll(fn: HookFunction): void {
  if (!currentSuite) {
    throw new Error("afterAll() must be called within a describe() block");
  }
  currentSuite.hooks.afterAll.push(fn);
}

export function afterEach(fn: HookFunction): void {
  if (!currentSuite) {
    throw new Error("afterEach() must be called within a describe() block");
  }
  currentSuite.hooks.afterEach.push(fn);
}

// Test runner function
export async function runTests(): Promise<{ passed: number; failed: number }> {
  let passed = 0;
  let failed = 0;

  for (const suite of suites) {
    console.log(`\n${suite.name}`);

    // Run beforeAll hooks
    for (const hook of suite.hooks.beforeAll) {
      await hook();
    }

    for (const test of suite.tests) {
      // Run beforeEach hooks
      for (const hook of suite.hooks.beforeEach) {
        await hook();
      }

      try {
        await test.fn();
        console.log(`  ✓ ${test.name}`);
        passed++;
      } catch (error) {
        console.log(`  ✗ ${test.name}`);
        console.error(`    ${(error as Error).message}`);
        failed++;
      }

      // Run afterEach hooks
      for (const hook of suite.hooks.afterEach) {
        await hook();
      }
    }

    // Run afterAll hooks
    for (const hook of suite.hooks.afterAll) {
      await hook();
    }
  }

  console.log(`\n${passed} passing, ${failed} failing`);
  return { passed, failed };
}

// Clear all registered tests (useful for testing the test runner itself)
export function clearTests(): void {
  suites.length = 0;
  currentSuite = null;
}

// Export runtime detection for conditional tests
export { isBun, isDeno, isNode };

// Re-export all testing modules
export * from "./runner.ts";
export * from "./fixtures.ts";
export * from "./mocks.ts";
export * from "./config.ts";
