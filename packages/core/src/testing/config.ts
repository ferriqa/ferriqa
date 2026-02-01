/**
 * @ferriqa/core - Test Configuration
 *
 * Cross-runtime test configuration utilities.
 * Handles environment-based configuration for tests.
 */

import type { TestRunnerConfig } from "./runner.js";

/**
 * Default test configuration
 */
export const defaultTestConfig: TestRunnerConfig = {
  include: ["**/*.test.ts", "**/*.spec.ts"],
  exclude: ["node_modules/**", "dist/**", ".git/**", "coverage/**"],
  timeout: 5000,
  parallel: false,
  coverage: false,
  watch: false,
  verbose: false,
};

/**
 * Load test configuration from environment variables
 * NOTE: Cross-runtime safe - returns empty config if process.env not available (Deno/browser)
 */
export function loadTestConfigFromEnv(): Partial<TestRunnerConfig> {
  const config: Partial<TestRunnerConfig> = {};

  // CROSS-RUNTIME: Check if process.env exists before accessing (Deno doesn't have process)
  if (typeof process === "undefined" || !process.env) {
    return config;
  }

  // FERRIQA_TEST_TIMEOUT - Test timeout in milliseconds
  const timeout = process.env.FERRIQA_TEST_TIMEOUT;
  if (timeout) {
    config.timeout = parseInt(timeout, 10);
  }

  // FERRIQA_TEST_PARALLEL - Enable parallel execution
  const parallel = process.env.FERRIQA_TEST_PARALLEL;
  if (parallel !== undefined) {
    config.parallel = parallel === "true" || parallel === "1";
  }

  // FERRIQA_TEST_COVERAGE - Enable coverage reporting
  const coverage = process.env.FERRIQA_TEST_COVERAGE;
  if (coverage !== undefined) {
    config.coverage = coverage === "true" || coverage === "1";
  }

  // FERRIQA_TEST_VERBOSE - Verbose output
  const verbose = process.env.FERRIQA_TEST_VERBOSE;
  if (verbose !== undefined) {
    config.verbose = verbose === "true" || verbose === "1";
  }

  // FERRIQA_TEST_PATTERN - Test file pattern
  const pattern = process.env.FERRIQA_TEST_PATTERN;
  if (pattern) {
    config.include = pattern.split(",").map((p) => p.trim());
  }

  return config;
}

/**
 * Merge configuration with defaults
 */
export function mergeTestConfig(
  overrides: Partial<TestRunnerConfig> = {},
): TestRunnerConfig {
  const envConfig = loadTestConfigFromEnv();
  return {
    ...defaultTestConfig,
    ...envConfig,
    ...overrides,
  };
}

/**
 * Test environment types
 */
export type TestEnvironment = "unit" | "integration" | "e2e" | "cross-runtime";

/**
 * Get current test environment
 * NOTE: Cross-runtime safe - defaults to "unit" if process.env not available
 */
export function getTestEnvironment(): TestEnvironment {
  // CROSS-RUNTIME: Safe access to process.env with fallback
  const env =
    typeof process !== "undefined" && process.env
      ? process.env.FERRIQA_TEST_ENV
      : undefined;
  if (
    env === "unit" ||
    env === "integration" ||
    env === "e2e" ||
    env === "cross-runtime"
  ) {
    return env;
  }
  return "unit";
}

/**
 * Configuration presets for different test types
 */
export const testConfigPresets: Record<TestEnvironment, TestRunnerConfig> = {
  unit: {
    ...defaultTestConfig,
    timeout: 1000, // Fast unit tests
    include: ["**/*.unit.test.ts", "**/*.test.ts"],
    parallel: true,
  },
  integration: {
    ...defaultTestConfig,
    timeout: 30000, // Slower integration tests
    include: ["**/*.integration.test.ts"],
    parallel: false,
  },
  e2e: {
    ...defaultTestConfig,
    timeout: 60000, // Slow E2E tests
    include: ["**/*.e2e.test.ts"],
    parallel: false,
  },
  "cross-runtime": {
    ...defaultTestConfig,
    timeout: 10000,
    include: ["**/*.cross-runtime.test.ts"],
    parallel: false,
  },
};

/**
 * Get configuration for a specific test environment
 */
export function getTestConfigForEnvironment(
  environment: TestEnvironment,
): TestRunnerConfig {
  return testConfigPresets[environment] || defaultTestConfig;
}

/**
 * Check if running in CI environment
 * NOTE: Cross-runtime safe - returns false if process.env not available
 */
export function isCI(): boolean {
  // CROSS-RUNTIME: Guard for Deno/browser environments where process is undefined
  if (typeof process === "undefined" || !process.env) {
    return false;
  }

  return !!(
    process.env.CI ||
    process.env.CONTINUOUS_INTEGRATION ||
    process.env.GITHUB_ACTIONS ||
    process.env.GITLAB_CI ||
    process.env.CIRCLECI ||
    process.env.TRAVIS
  );
}

/**
 * Get CI-specific configuration adjustments
 */
export function getCIConfig(): Partial<TestRunnerConfig> {
  if (!isCI()) {
    return {};
  }

  return {
    // Disable watch mode in CI
    watch: false,
    // Reduce parallelization in CI to avoid resource contention
    parallel: false,
    // Increase timeout in CI (slower machines)
    timeout: 10000,
    // Enable verbose for better CI logs
    verbose: true,
  };
}

/**
 * Validate test configuration
 */
export function validateTestConfig(config: TestRunnerConfig): string[] {
  const errors: string[] = [];

  if (config.timeout !== undefined && config.timeout <= 0) {
    errors.push("Timeout must be a positive number");
  }

  if (config.timeout !== undefined && config.timeout > 300000) {
    errors.push("Timeout should not exceed 5 minutes (300000ms)");
  }

  if (config.include !== undefined && config.include.length === 0) {
    errors.push("Include patterns cannot be empty");
  }

  if (
    config.include !== undefined &&
    config.include.some((p) => p.trim() === "")
  ) {
    errors.push("Include patterns cannot contain empty strings");
  }

  return errors;
}

/**
 * Final test configuration with all sources merged
 * Usage: import { testConfig } from "@ferriqa/core/testing";
 */
export const testConfig = (() => {
  const env = getTestEnvironment();
  const preset = getTestConfigForEnvironment(env);
  const envConfig = loadTestConfigFromEnv();
  const ciConfig = getCIConfig();

  return mergeTestConfig({
    ...preset,
    ...envConfig,
    ...ciConfig,
  });
})();
