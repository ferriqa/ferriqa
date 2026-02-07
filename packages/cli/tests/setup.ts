/**
 * @ferriqa/cli - Cross-Runtime Test Setup
 *
 * Global test configuration and setup for cross-runtime testing.
 * Works with Bun, Node.js, and Deno.
 */

import { clearPromptMocks } from "./mocks/clack.ts";
import { resetGlobalMockDb } from "./mocks/database.ts";

/**
 * Initialize test environment
 * Called automatically by the test runner
 */
export function setupTests(): void {
  // Clear all mocks before each test
  clearPromptMocks();
  resetGlobalMockDb();
}

/**
 * Cleanup after tests
 * Called automatically by the test runner
 */
export function teardownTests(): void {
  // Clean up after each test
  clearPromptMocks();
}
