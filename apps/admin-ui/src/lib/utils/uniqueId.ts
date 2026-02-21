/**
 * Generates unique IDs for component instances
 * Prevents duplicate IDs when multiple components are rendered on the same page
 */

let counter = 0;

/**
 * Creates a unique ID with an optional prefix
 * @param prefix - Descriptive prefix for the ID (e.g., 'field', 'validation')
 * @returns A unique ID string
 * @example
 * ```ts
 * const id1 = createUniqueId('field'); // 'field-0-abc123'
 * const id2 = createUniqueId('field'); // 'field-1-def456'
 * ```
 */
export function createUniqueId(prefix: string = "id"): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 9);
  const uniqueId = `${prefix}-${counter++}-${timestamp}-${random}`;
  return uniqueId;
}

/**
 * Creates multiple unique IDs with a common base prefix
 * Useful for form fields with multiple related inputs
 * @param basePrefix - Common prefix for all IDs
 * @param suffixes - Array of suffixes to append to the base prefix
 * @returns Object mapping suffixes to unique IDs
 * @example
 * ```ts
 * const ids = createUniqueIds('user', ['name', 'email', 'password']);
 * // Returns: { name: 'user-0-abc-name', email: 'user-0-def-email', ... }
 * ```
 */
export function createUniqueIds<T extends Record<string, string>>(
  basePrefix: string,
  suffixes: string[],
): Record<string, string> {
  const instanceId = createUniqueId(basePrefix);
  const ids: Record<string, string> = {};

  for (const suffix of suffixes) {
    ids[suffix] = `${instanceId}-${suffix}`;
  }

  return ids as T;
}
