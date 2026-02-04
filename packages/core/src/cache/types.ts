/**
 * @ferriqa/core - Cache Types
 *
 * Type definitions for the in-memory caching system.
 * Provides interfaces for cache entries, statistics, and configuration options.
 */

/**
 * Cache entry metadata with TTL support
 */
export interface CacheEntry<V> {
  value: V;
  createdAt: number;
  expiresAt: number | null;
  accessCount: number;
  lastAccessedAt: number;
}

/**
 * Cache statistics for monitoring performance
 */
export interface CacheStats {
  /** Total number of cache hits */
  hits: number;
  /** Total number of cache misses */
  misses: number;
  /** Number of entries currently in cache */
  size: number;
  /** Maximum allowed entries */
  maxSize: number;
  /** Cache hit rate as percentage (0-100) */
  hitRate: number;
  /** Number of evictions due to LRU policy */
  evictions: number;
  /** Number of entries expired due to TTL */
  expirations: number;
}

/**
 * Time provider function for testing and clock manipulation
 * Returns current timestamp in milliseconds
 */
export type TimeProvider = () => number;

/**
 * Options for configuring a cache instance
 */
export interface CacheOptions {
  /** Maximum number of entries before LRU eviction (default: 1000) */
  maxSize?: number;
  /** Default TTL in milliseconds (default: 60000 = 1 minute) */
  defaultTTL?: number;
  /** Enable debug logging (default: false) */
  debug?: boolean;
  /** Cache name for identification (default: 'default') */
  name?: string;
  /** Time provider for testing (default: Date.now) */
  timeProvider?: TimeProvider;
}

/**
 * Options for individual cache set operations
 */
export interface SetOptions {
  /** Time-to-live in milliseconds (overrides defaultTTL) */
  ttl?: number;
  /** Whether to skip TTL and cache indefinitely */
  noTTL?: boolean;
}

/**
 * Cache event types for monitoring
 */
export type CacheEventType =
  | "hit"
  | "miss"
  | "set"
  | "delete"
  | "evict"
  | "expire"
  | "clear";

/**
 * Cache event callback
 */
export type CacheEventCallback = (
  event: CacheEventType,
  key: string,
  value?: unknown,
) => void;

/**
 * Interface for cache implementations
 */
export interface ICache<K, V> {
  get(key: K): V | undefined;
  set(key: K, value: V, options?: SetOptions): void;
  delete(key: K): boolean;
  has(key: K): boolean;
  clear(): void;
  size(): number;
  stats(): CacheStats;
  on(event: CacheEventType, callback: CacheEventCallback): () => void;
}
