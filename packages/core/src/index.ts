/**
 * @ferriqa/core - Core runtime utilities and foundation
 *
 * Universal runtime detection and capability checking for Bun, Node.js, and Deno
 */

// Runtime detection
export {
  isBun,
  isDeno,
  isNode,
  getRuntimeInfo,
  assertRuntime,
  getRuntimeId,
} from "./runtime";

// Runtime capabilities
export {
  type RuntimeCapabilities,
  type RuntimeEnvironment,
  type CapabilityCheck,
  detectCapabilities,
  getRuntimeEnvironment,
  checkRequiredCapabilities,
  printCapabilityReport,
  validateRuntime,
  getCapabilitySummary,
} from "./capabilities";

// Error handling system
export * from "./errors/index.js";

// Note: Testing utilities are available as a separate import:
//   import * as testing from "@ferriqa/core/testing"
// This keeps the main package clean and prevents confusion about what's intended
// for production use vs testing. Testing utilities are NOT exported from the main
// package to reduce bundle size and maintain clear separation of concerns.

// Re-export everything from runtime for convenience
export * from "./runtime";
export * from "./capabilities";
