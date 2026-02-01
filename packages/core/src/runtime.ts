/**
 * Runtime detection utilities for Bun, Node.js, and Deno
 */

/** Detect if running in Bun runtime */
export const isBun = typeof (globalThis as any).Bun !== "undefined";

/** Detect if running in Deno runtime */
export const isDeno = typeof (globalThis as any).Deno !== "undefined";

/**
 * Detect if running in Node.js runtime
 * NOTE: This assumes process global indicates Node.js. Edge cases exist (Electron, polyfilled envs)
 * but these are acceptable for a library targeting Bun/Node/Deno specifically.
 */
export const isNode =
  !isBun && !isDeno && typeof (globalThis as any).process !== "undefined";

/**
 * Runtime information structure
 */
export interface RuntimeInfo {
  name: string;
  version: string;
}

/**
 * Get basic runtime information
 * @returns Object containing runtime name and version
 */
export function getRuntimeInfo(): RuntimeInfo {
  if (isBun) {
    return {
      name: "Bun",
      version: (globalThis as any).Bun?.version || "unknown",
    };
  }
  if (isDeno) {
    return {
      name: "Deno",
      version: (globalThis as any).Deno?.version?.deno || "unknown",
    };
  }
  if (isNode) {
    // DEFENSIVE: Validate this is actually Node.js by checking process.version
    // Some environments (browser polyfills, edge runtimes) may have process global without version
    const version = (globalThis as any).process?.version;
    if (version) {
      return { name: "Node.js", version };
    }
    // If no version, fall through to Unknown - this isn't really Node.js
  }
  return { name: "Unknown", version: "0.0.0" };
}

/**
 * Assert runtime type for type narrowing
 */
export function assertRuntime<T extends "bun" | "deno" | "node">(
  expected: T,
): asserts expected is T {
  const runtime = isBun ? "bun" : isDeno ? "deno" : isNode ? "node" : "unknown";
  if (runtime !== expected) {
    throw new Error(`Expected ${expected} runtime, but running on ${runtime}`);
  }
}

/**
 * Get runtime identifier string
 */
export function getRuntimeId(): "bun" | "deno" | "node" | "unknown" {
  if (isBun) return "bun";
  if (isDeno) return "deno";
  if (isNode) return "node";
  return "unknown";
}
