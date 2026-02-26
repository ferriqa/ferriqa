/**
 * @ferriqa/core - Test Helpers
 *
 * Reusable helper functions for @cross/test
 * Provides common patterns for setup/test/teardown
 */

/**
 * Helper for setup/test/teardown pattern
 * Eliminates boilerplate for tests that need resource cleanup
 *
 * @example
 * ```ts
 * await withResource(
 *   async () => {
 *     const db = new MockDatabaseAdapter();
 *     await db.connect();
 *     return db;
 *   },
 *   async (db) => {
 *     // Test code here
 *   },
 *   async (db) => {
 *     await db.close();
 *   }
 * );
 * ```
 */
export async function withResource<T>(
  setup: () => Promise<T> | T,
  test: (resource: T) => Promise<void> | void,
  cleanup: (resource: T) => Promise<void> | void,
): Promise<void> {
  const resource = await setup();
  try {
    await test(resource);
  } finally {
    await cleanup(resource);
  }
}

/**
 * Helper for database tests
 * Common pattern: connect → test → close
 *
 * @example
 * ```ts
 * await withDatabase(
 *   async (db) => {
 *     await db.execute("INSERT...");
 *     const result = await db.query("SELECT...");
 *     assertEquals(result.rows.length, 1);
 *   },
 *   () => new MockDatabaseAdapter()
 * );
 * ```
 */
export async function withDatabase<T>(
  test: (db: T) => Promise<void> | void,
  dbFactory: () => T,
): Promise<void> {
  const db = dbFactory();
  try {
    await test(db);
  } finally {
    // Close if available
    if (
      db &&
      typeof (db as unknown as { close: () => Promise<void> }).close ===
        "function"
    ) {
      await (db as unknown as { close: () => Promise<void> }).close();
    }
  }
}

/**
 * Helper for service tests
 * Creates and optionally destroys service instances
 *
 * @example
 * ```ts
 * await withService(
 *   (config) => new WebhookService(config),
 *   async (service) => {
 *     const webhook = await service.create({...});
 *     assertEquals(webhook.isActive, true);
 *   },
 *   { db, hookRegistry: hooks }
 * );
 * ```
 */
export async function withService<TService, TConfig = void>(
  factory: (config: TConfig) => TService,
  test: (service: TService) => Promise<void> | void,
  config?: TConfig,
): Promise<void> {
  const service = factory(config as TConfig);
  try {
    await test(service);
  } finally {
    // Destroy if available
    if (
      service &&
      typeof (service as unknown as { destroy: () => Promise<void> })
        .destroy === "function"
    ) {
      await (service as unknown as { destroy: () => Promise<void> }).destroy();
    }
  }
}

/**
 * Helper for assertions with custom error messages
 * Wrapper around @std/assert's assertExists for better error messages
 *
 * @example
 * ```ts
 * assertDefined(value, "Value should be defined but was undefined");
 * ```
 */
export function assertDefined<T>(
  value: T | null | undefined,
  message?: string,
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(
      message || `Expected value to be defined, but got ${value}`,
    );
  }
}

/**
 * Helper for testing async operations that should complete within timeout
 *
 * @example
 * ```ts
 * await withTimeout(
 *   async () => {
 *     const result = await asyncOperation();
 *     assertEquals(result, "expected");
 *   },
 *   5000 // 5 second timeout
 * );
 * ```
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(
      () => reject(new Error(`Timeout after ${timeoutMs}ms`)),
      timeoutMs,
    );
  });

  return Promise.race([fn(), timeoutPromise]);
}
