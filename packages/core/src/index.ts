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

// Re-export everything from runtime for convenience
export * from "./runtime";
export * from "./capabilities";
