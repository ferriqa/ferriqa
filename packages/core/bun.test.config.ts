/**
 * Bun Test Configuration
 *
 * This file configures Bun's test runner for the project.
 */

import { beforeAll, afterAll } from "bun:test";

// Global test setup
beforeAll(() => {
  console.log("🧪 Starting test suite...");
});

// Global test teardown
afterAll(() => {
  console.log("✅ Test suite completed");
});

// Test timeout configuration
export const timeout = 30000; // 30 seconds

// Coverage configuration
export const coverage = {
  reporter: ["text", "lcov", "html"],
  exclude: [
    "node_modules/**",
    "**/*.test.ts",
    "**/*.spec.ts",
    "**/__tests__/**",
    "**/testing/**",
  ],
  thresholds: {
    lines: 70,
    functions: 70,
    statements: 70,
    branches: 60,
  },
};
