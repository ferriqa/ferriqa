/**
 * @ferriqa/core - Cache System
 *
 * High-performance in-memory caching with TTL and LRU eviction.
 * Optimized for FerriQA CMS workloads.
 */

export { Cache } from "./cache.ts";
export { LRUCache } from "./lru-cache.ts";
export type {
  CacheEntry,
  CacheStats,
  CacheOptions,
  SetOptions,
  CacheEventType,
  CacheEventCallback,
  ICache,
} from "./types.ts";

import { Cache } from "./cache.ts";
import type { CacheOptions } from "./types.ts";

/**
 * Global cache registry for named cache instances
 */
const cacheRegistry = new Map<string, Cache<unknown>>();

/**
 * Default application-wide cache instance
 * Use for general-purpose caching throughout the app
 */
export const defaultCache = new Cache({
  name: "default",
  maxSize: 10000,
  defaultTTL: 300000, // 5 minutes
});

/**
 * Factory function for creating named cache instances
 * Reuses existing cache if name already exists
 */
export function createCache<V = unknown>(
  name: string,
  options: Omit<CacheOptions, "name"> = {},
): Cache<V> {
  if (cacheRegistry.has(name)) {
    return cacheRegistry.get(name) as Cache<V>;
  }

  const cache = new Cache<V>({
    ...options,
    name,
  });

  cacheRegistry.set(name, cache as Cache<unknown>);
  return cache;
}

/**
 * Get an existing named cache
 * Returns undefined if not found
 */
export function getCache<V = unknown>(name: string): Cache<V> | undefined {
  return cacheRegistry.get(name) as Cache<V> | undefined;
}

/**
 * Check if a named cache exists
 */
export function hasCache(name: string): boolean {
  return cacheRegistry.has(name);
}

/**
 * Remove a named cache from registry and dispose it
 */
export function removeCache(name: string): boolean {
  const cache = cacheRegistry.get(name);
  if (cache) {
    cache.dispose();
    return cacheRegistry.delete(name);
  }
  return false;
}

/**
 * Clear all registered caches
 * NOTE: Does not dispose defaultCache - it's a module-level singleton
 * that persists for the application lifetime
 */
export function clearAllCaches(): void {
  for (const [name, cache] of cacheRegistry) {
    cache.dispose();
    cacheRegistry.delete(name);
  }
}

/**
 * Get all registered cache names
 */
export function getCacheNames(): string[] {
  return Array.from(cacheRegistry.keys());
}

/**
 * Pre-configured cache presets for common CMS use cases
 */
export const cachePresets = {
  /**
   * Cache for blueprints (schemas) - longer TTL as they change infrequently
   */
  blueprints: {
    maxSize: 100,
    defaultTTL: 600000, // 10 minutes
  },

  /**
   * Cache for content queries - shorter TTL for frequently changing data
   */
  content: {
    maxSize: 5000,
    defaultTTL: 60000, // 1 minute
  },

  /**
   * Cache for user sessions - moderate TTL
   */
  sessions: {
    maxSize: 10000,
    defaultTTL: 1800000, // 30 minutes
  },

  /**
   * Cache for API responses - short TTL for real-time feel
   */
  api: {
    maxSize: 1000,
    defaultTTL: 15000, // 15 seconds
  },

  /**
   * Cache for configuration - long TTL as configs rarely change
   */
  config: {
    maxSize: 50,
    defaultTTL: 300000, // 5 minutes
  },
} as const;

/**
 * Create a cache using a preset configuration
 */
export function createCacheWithPreset<V = unknown>(
  name: string,
  preset: keyof typeof cachePresets,
  options: Omit<CacheOptions, "name" | "maxSize" | "defaultTTL"> = {},
): Cache<V> {
  const presetConfig = cachePresets[preset];
  return createCache<V>(name, {
    ...presetConfig,
    ...options,
  });
}
