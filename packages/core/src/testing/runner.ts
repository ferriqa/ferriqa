/**
 * @ferriqa/core - Test Runner Detection
 *
 * Detects and adapts to the test runner being used (Bun, Node.js, Deno).
 * Provides a unified API for test runner configuration.
 */

// Declare optional globals for cross-runtime compatibility
declare const process: { platform?: string } | undefined;

import { isBun, isDeno, isNode } from "../runtime.ts";

/**
 * Escape special shell characters in a string to prevent command injection.
 * SECURITY: Uses platform-specific escaping for maximum safety
 * @param str - String to escape
 * @returns Escaped string safe for shell command
 */
function shellEscape(str: string): string {
  // Detect platform and use appropriate escaping
  const isWindows =
    typeof process !== "undefined" && process.platform === "win32";

  if (isWindows) {
    // Windows: Use double quotes and escape internal double quotes
    // This works for both cmd.exe and PowerShell
    return '"' + str.replace(/"/g, '""') + '"';
  } else {
    // POSIX (bash/zsh): Use single quotes and escape single quotes
    // Replace ' with '\'' (close quote, add escaped quote, reopen)
    return "'" + str.replace(/'/g, "'\\''") + "'";
  }
}

/**
 * Test runner types
 */
export type TestRunner = "bun" | "node" | "deno" | "unknown";

/**
 * Detect which test runner is being used
 */
export function detectTestRunner(): TestRunner {
  if (isBun) return "bun";
  if (isDeno) return "deno";
  if (isNode) return "node";
  return "unknown";
}

/**
 * Test runner capabilities
 */
export interface TestRunnerCapabilities {
  /** Supports native parallel execution */
  supportsParallel: boolean;
  /** Supports native mocking */
  supportsNativeMocking: boolean;
  /** Supports native snapshots */
  supportsSnapshots: boolean;
  /** Supports coverage reporting */
  supportsCoverage: boolean;
  /** Supports watch mode */
  supportsWatch: boolean;
  /** Maximum timeout in ms */
  maxTimeout: number;
  /** Default timeout in ms */
  defaultTimeout: number;
}

/**
 * Get capabilities for the current test runner
 */
export function getTestRunnerCapabilities(): TestRunnerCapabilities {
  const runner = detectTestRunner();

  switch (runner) {
    case "bun":
      return {
        supportsParallel: true,
        supportsNativeMocking: true,
        supportsSnapshots: true,
        supportsCoverage: true,
        supportsWatch: true,
        maxTimeout: 300000, // 5 minutes
        defaultTimeout: 5000, // 5 seconds
      };

    case "node":
      return {
        supportsParallel: false, // Node test runner doesn't support parallel by default
        // NOTE: Node's built-in test runner has limited mocking. Use external libraries like:
        // - @vitest/snapshot for snapshots
        // - tinyspy, sinon, or jest-mock for mocking
        supportsNativeMocking: false,
        supportsSnapshots: false,
        supportsCoverage: true, // Via --experimental-test-coverage
        supportsWatch: false, // Not built-in
        maxTimeout: 300000,
        defaultTimeout: 5000,
      };

    case "deno":
      return {
        supportsParallel: true,
        supportsNativeMocking: false, // Deno has mocking utilities but not native in test runner
        supportsSnapshots: true,
        supportsCoverage: true,
        supportsWatch: true,
        maxTimeout: 300000,
        defaultTimeout: 5000,
      };

    default:
      return {
        supportsParallel: false,
        supportsNativeMocking: false,
        supportsSnapshots: false,
        supportsCoverage: false,
        supportsWatch: false,
        maxTimeout: 300000,
        defaultTimeout: 5000,
      };
  }
}

/**
 * Deno permission flags
 */
export interface DenoPermissions {
  /** Allow environment variable access */
  env?: boolean;
  /** Allow file system read */
  read?: boolean;
  /** Allow file system write */
  write?: boolean;
  /** Allow network access */
  net?: boolean;
  /** Allow running subprocesses */
  run?: boolean;
  /** Allow FFI (Foreign Function Interface) */
  ffi?: boolean;
}

/**
 * Test runner configuration
 */
export interface TestRunnerConfig {
  /** Test file patterns */
  include?: string[];
  /** Exclude patterns */
  exclude?: string[];
  /** Test timeout in ms */
  timeout?: number;
  /** Enable parallel execution */
  parallel?: boolean;
  /** Enable coverage reporting */
  coverage?: boolean;
  /** Enable watch mode */
  watch?: boolean;
  /** Verbose output */
  verbose?: boolean;
  /** Only run tests matching this pattern */
  testNamePattern?: string;
  /** Deno-specific permissions (follows principle of least privilege) */
  denoPermissions?: DenoPermissions;
}

/**
 * Get default test configuration for current runner
 */
export function getDefaultTestConfig(): TestRunnerConfig {
  const capabilities = getTestRunnerCapabilities();

  return {
    include: ["**/*.test.ts", "**/*.spec.ts"],
    exclude: ["node_modules/**", "dist/**", ".git/**"],
    timeout: capabilities.defaultTimeout,
    parallel: capabilities.supportsParallel,
    coverage: false,
    watch: false,
    verbose: false,
  };
}

/**
 * Generate command to run tests for current runner
 */
export function generateTestCommand(config: TestRunnerConfig = {}): string {
  const runner = detectTestRunner();
  const defaultConfig = getDefaultTestConfig();
  const finalConfig = { ...defaultConfig, ...config };

  switch (runner) {
    case "bun":
      return generateBunCommand(finalConfig);
    case "node":
      return generateNodeCommand(finalConfig);
    case "deno":
      return generateDenoCommand(finalConfig);
    default:
      throw new Error(`Unsupported test runner: ${runner}`);
  }
}

function generateBunCommand(config: TestRunnerConfig): string {
  const args: string[] = ["bun", "test"];

  if (config.timeout) {
    args.push(`--timeout=${config.timeout}`);
  }

  if (config.coverage) {
    args.push("--coverage");
  }

  if (config.watch) {
    args.push("--watch");
  }

  if (config.verbose) {
    args.push("--verbose");
  }

  if (config.testNamePattern) {
    // SECURITY: Use single quotes and shell escaping to prevent command injection
    args.push(`--test-name-pattern='${shellEscape(config.testNamePattern)}'`);
  }

  // Add include patterns
  if (config.include && config.include.length > 0) {
    args.push(...config.include);
  }

  return args.join(" ");
}

function generateNodeCommand(config: TestRunnerConfig): string {
  const args: string[] = ["node", "--test"];

  // VALIDATION: Warn about unsupported features in Node.js test runner
  if (config.watch) {
    console.warn(
      "[TestRunner] Node.js built-in test runner does not support watch mode. Consider using Bun or Deno for watch functionality.",
    );
  }

  if (config.timeout) {
    args.push(`--test-timeout=${config.timeout}`);
  }

  if (config.coverage) {
    args.push("--experimental-test-coverage");
  }

  if (config.testNamePattern) {
    // SECURITY: Use platform-specific shell escaping to prevent command injection
    args.push(`--test-name-pattern=${shellEscape(config.testNamePattern)}`);
  }

  // Node doesn't support include patterns directly, need to specify files
  // This is a simplified version
  if (config.include && config.include.length > 0) {
    args.push(...config.include);
  }

  return args.join(" ");
}

function generateDenoCommand(config: TestRunnerConfig): string {
  const args: string[] = ["deno", "test"];

  if (config.timeout) {
    args.push(`--timeout=${config.timeout}`);
  }

  if (config.coverage) {
    args.push("--coverage");
  }

  if (config.watch) {
    args.push("--watch");
  }

  // SECURITY: Apply principle of least privilege - only add permissions that are explicitly requested
  // Default: minimal permissions for test discovery (--allow-read for test files)
  // Never use --allow-all as it grants dangerous privileges (arbitrary file read/write/exec)
  const perms = config.denoPermissions ?? { read: true };
  if (perms.env) args.push("--allow-env");
  if (perms.read) args.push("--allow-read");
  if (perms.write) args.push("--allow-write");
  if (perms.net) args.push("--allow-net");
  if (perms.run) args.push("--allow-run");
  if (perms.ffi) args.push("--allow-ffi");

  if (config.testNamePattern) {
    // SECURITY: Use single quotes and shell escaping to prevent command injection
    args.push(`--filter='${shellEscape(config.testNamePattern)}'`);
  }

  // Add include patterns
  if (config.include && config.include.length > 0) {
    args.push(...config.include);
  }

  return args.join(" ");
}

/**
 * Boolean capability features (for supportsFeature check)
 */
export type BooleanTestRunnerFeature =
  | "supportsParallel"
  | "supportsNativeMocking"
  | "supportsSnapshots"
  | "supportsCoverage"
  | "supportsWatch";

/**
 * Check if a specific feature is supported by current test runner
 */
export function supportsFeature(feature: BooleanTestRunnerFeature): boolean {
  const capabilities = getTestRunnerCapabilities();
  return capabilities[feature];
}

/**
 * Skip tests if not running on specific runner
 */
export function skipIfNotRunner(runner: TestRunner, reason?: string): void {
  const current = detectTestRunner();
  if (current !== runner) {
    throw new Error(`SKIP: ${reason || `Only runs on ${runner}`}`);
  }
}

/**
 * Conditional test execution based on runner
 */
export function runIfRunner<T>(runner: TestRunner, fn: () => T): T | undefined {
  if (detectTestRunner() === runner) {
    return fn();
  }
  return undefined;
}

/**
 * Cross-runtime test utilities export
 */
export { isBun, isDeno, isNode } from "../runtime.ts";
