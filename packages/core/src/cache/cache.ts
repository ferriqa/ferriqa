/**
 * @ferriqa/core - Cache Implementation
 *
 * High-performance in-memory cache with TTL support and LRU eviction.
 * Thread-safe operations using single-threaded JavaScript event loop patterns.
 * Optimized for CMS workloads with content caching.
 */

import { LRUCache } from "./lru-cache.ts";
import type {
  CacheEntry,
  CacheOptions,
  CacheStats,
  SetOptions,
  CacheEventType,
  CacheEventCallback,
  ICache,
} from "./types.ts";

/**
 * Generic Cache class with TTL and LRU support
 * Provides thread-safe operations suitable for single-threaded JS runtimes
 */
export class Cache<V = unknown> implements ICache<string, V> {
  private storage: LRUCache<string, V>;
  private options: Required<CacheOptions>;
  private statsData: {
    hits: number;
    misses: number;
    evictions: number;
    expirations: number;
  };
  private eventListeners: Map<CacheEventType, Set<CacheEventCallback>>;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(options: CacheOptions = {}) {
    this.options = {
      maxSize: options.maxSize ?? 1000,
      defaultTTL: options.defaultTTL ?? 60000,
      debug: options.debug ?? false,
      name: options.name ?? "default",
      timeProvider: options.timeProvider ?? Date.now,
    };

    this.storage = new LRUCache<string, V>(this.options.maxSize);
    this.statsData = {
      hits: 0,
      misses: 0,
      evictions: 0,
      expirations: 0,
    };
    this.eventListeners = new Map();

    this.startCleanupInterval();
  }

  /**
   * Get value from cache
   * Returns undefined if not found or expired
   */
  get(key: string): V | undefined {
    const entry = this.storage.get(key);

    if (!entry) {
      this.statsData.misses++;
      this.emit("miss", key);
      return undefined;
    }

    if (this.isExpired(entry)) {
      this.storage.delete(key);
      this.statsData.expirations++;
      this.statsData.misses++;
      this.emit("expire", key, entry.value);
      this.emit("miss", key);
      return undefined;
    }

    this.statsData.hits++;
    this.emit("hit", key, entry.value);
    return entry.value;
  }

  /**
   * Set value in cache with optional TTL
   */
  set(key: string, value: V, options: SetOptions = {}): void {
    const ttl = options.noTTL ? null : (options.ttl ?? this.options.defaultTTL);

    const now = this.options.timeProvider();
    const entry: CacheEntry<V> = {
      value,
      createdAt: now,
      expiresAt: ttl ? now + ttl : null,
      accessCount: 0,
      lastAccessedAt: now,
    };

    const previousSize = this.storage.size;
    this.storage.set(key, entry);

    if (
      this.storage.size === previousSize &&
      this.storage.evictions > this.statsData.evictions
    ) {
      this.statsData.evictions = this.storage.evictions;
      this.emit("evict", key, value);
    }

    this.emit("set", key, value);

    if (this.options.debug) {
      console.log(
        `[Cache:${this.options.name}] SET ${key} (TTL: ${ttl ?? "none"}ms)`,
      );
    }
  }

  /**
   * Delete value from cache
   */
  delete(key: string): boolean {
    const entry = this.storage.get(key);
    const result = this.storage.delete(key);

    if (result) {
      this.emit("delete", key, entry?.value);
    }

    return result;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.storage.get(key);

    if (!entry) {
      return false;
    }

    if (this.isExpired(entry)) {
      this.storage.delete(key);
      this.statsData.expirations++;
      this.emit("expire", key, entry.value);
      return false;
    }

    return true;
  }

  /**
   * Clear all entries from cache
   */
  clear(): void {
    this.storage.clear();
    this.emit("clear", "*");

    if (this.options.debug) {
      console.log(`[Cache:${this.options.name}] CLEARED`);
    }
  }

  /**
   * Get current cache size
   */
  size(): number {
    this.cleanupExpired();
    return this.storage.size;
  }

  /**
   * Get cache statistics
   */
  stats(): CacheStats {
    const total = this.statsData.hits + this.statsData.misses;
    const hitRate = total > 0 ? (this.statsData.hits / total) * 100 : 0;

    return {
      hits: this.statsData.hits,
      misses: this.statsData.misses,
      size: this.storage.size,
      maxSize: this.options.maxSize,
      hitRate: Math.round(hitRate * 100) / 100,
      evictions: this.statsData.evictions,
      expirations: this.statsData.expirations,
    };
  }

  /**
   * Register event listener
   * Returns unsubscribe function
   */
  on(event: CacheEventType, callback: CacheEventCallback): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }

    const listeners = this.eventListeners.get(event)!;
    listeners.add(callback);

    return () => {
      listeners.delete(callback);
    };
  }

  /**
   * Get multiple values at once
   */
  mget(keys: string[]): Array<V | undefined> {
    return keys.map((key) => this.get(key));
  }

  /**
   * Set multiple values at once
   */
  mset(entries: Array<{ key: string; value: V; options?: SetOptions }>): void {
    for (const { key, value, options } of entries) {
      this.set(key, value, options);
    }
  }

  /**
   * Get or compute value (cache-aside pattern)
   */
  async getOrCompute(
    key: string,
    factory: () => Promise<V> | V,
    options?: SetOptions,
  ): Promise<V> {
    const cached = this.get(key);

    if (cached !== undefined) {
      return cached;
    }

    const value = await factory();
    this.set(key, value, options);
    return value;
  }

  /**
   * Dispose cache and cleanup resources
   */
  dispose(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
    this.eventListeners.clear();
  }

  /**
   * Check if entry is expired
   */
  private isExpired(entry: CacheEntry<V>): boolean {
    if (entry.expiresAt === null) {
      return false;
    }
    return this.options.timeProvider() > entry.expiresAt;
  }

  /**
   * Cleanup expired entries
   */
  private cleanupExpired(): void {
    const now = this.options.timeProvider();
    const keysToDelete: string[] = [];

    for (const key of this.storage.keys()) {
      const entry = this.storage.get(key);
      if (entry && entry.expiresAt !== null && now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      const entry = this.storage.get(key);
      this.storage.delete(key);
      this.statsData.expirations++;
      this.emit("expire", key, entry?.value);
    }

    if (this.options.debug && keysToDelete.length > 0) {
      console.log(
        `[Cache:${this.options.name}] Cleaned up ${keysToDelete.length} expired entries`,
      );
    }
  }

  /**
   * Start periodic cleanup interval
   */
  private startCleanupInterval(): void {
    // NOTE: Use fixed 10-second interval to ensure short TTL entries are cleaned promptly.
    // Previously used Math.min(defaultTTL / 2, 30000) which could delay cleanup
    // for short TTLs (e.g., 5s TTL could wait up to 30s).
    // Fixed interval ensures consistent cleanup regardless of TTL settings.
    const CLEANUP_INTERVAL = 10000; // 10 seconds
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, CLEANUP_INTERVAL);

    // Allow Node.js to exit even if this interval is still active.
    // This is a no-op on Bun/Deno but essential for Node.js test cleanup.
    if (typeof this.cleanupInterval?.unref === "function") {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Emit event to listeners
   */
  private emit(event: CacheEventType, key: string, value?: unknown): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      for (const callback of listeners) {
        try {
          callback(event, key, value);
        } catch (error) {
          console.error(
            `[Cache:${this.options.name}] Event listener error:`,
            error,
          );
        }
      }
    }
  }
}
