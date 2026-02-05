/**
 * @ferriqa/core/webhooks/utils - Shared Utilities
 *
 * Common utility functions for webhook system
 */

/**
 * Generate a random UUID v4
 * Uses the Web Crypto API for secure random UUID generation when available,
 * falls back to a Math.random-based implementation for compatibility
 */
export function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without Web Crypto API
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}
