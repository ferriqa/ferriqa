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
export * from "./errors/index.ts"; // .js extension required for ESM bundler resolution

// Blueprint Engine - Content Modeling & Schema
export * from "./blueprint/index.ts"; // .js extension required for ESM bundler resolution

// Field Types Registry
export * from "./fields/index.ts"; // .js extension required for ESM bundler resolution

// Validation Engine
export * from "./validation/index.ts"; // .js extension required for ESM bundler resolution

// Slug Management
export * from "./slug/index.ts"; // .js extension required for ESM bundler resolution

// Content Storage
export * from "./content/index.ts"; // .js extension required for ESM bundler resolution

// Note: Testing utilities are available as a separate import:
//   import * as testing from "@ferriqa/core/testing"
// This keeps the main package clean and prevents confusion about what's intended
// for production use vs testing. Testing utilities are NOT exported from the main
// package to reduce bundle size and maintain clear separation of concerns.

// Re-export everything from runtime for convenience
// NOTE: These are NOT redundant with lines 8-28 above.
// Lines 8-15 and 18-28 export specific named exports (types and functions)
// Lines 52-53 export ALL exports from those modules as wildcards
// This is a valid TypeScript pattern to support both:
//   - Named imports: import { isBun } from "@ferriqa/core"
//   - Wildcard imports: import * as runtime from "@ferriqa/core"
export * from "./runtime";
export * from "./capabilities";
