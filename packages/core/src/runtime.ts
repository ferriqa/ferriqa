/**
 * Runtime detection utilities for Bun, Node.js, and Deno
 */

/** Detect if running in Bun runtime */
export const isBun = typeof Bun !== "undefined";

/** Detect if running in Deno runtime */
export const isDeno = typeof Deno !== "undefined";

/** Detect if running in Node.js runtime */
export const isNode = !isBun && !isDeno && typeof process !== "undefined";

/**
 * Get basic runtime information
 * @returns Object containing runtime name and version
 */
export function getRuntimeInfo(): { name: string; version: string } {
  if (isBun) {
    return { name: "Bun", version: Bun?.version || "unknown" };
  }
  if (isDeno) {
    return { name: "Deno", version: Deno?.version?.deno || "unknown" };
  }
  if (isNode) {
    return { name: "Node.js", version: process.version };
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
