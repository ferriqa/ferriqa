/**
 * @ferriqa/core - Cache System Tests
 *
 * Unit tests for the in-memory caching system
 */

import { describe, it, expect, runTests } from "@ferriqa/core/testing";
import {
  Cache,
  LRUCache,
  createCache,
  getCache,
  hasCache,
  removeCache,
  clearAllCaches,
  defaultCache,
  createCacheWithPreset,
} from "../../cache/index.ts";

describe("Cache", () => {
  describe("Basic Operations", () => {
    it("should set and get values", () => {
      const cache = new Cache<string>({
        maxSize: 100,
        defaultTTL: 1000,
        name: "test-cache",
      });
      cache.set("key1", "value1");
      expect(cache.get("key1")).toBe("value1");
      cache.dispose();
    });

    it("should return undefined for non-existent keys", () => {
      const cache = new Cache<string>({
        maxSize: 100,
        defaultTTL: 1000,
        name: "test-cache",
      });
      expect(cache.get("non-existent")).toBeUndefined();
      cache.dispose();
    });

    it("should check if key exists", () => {
      const cache = new Cache<string>({
        maxSize: 100,
        defaultTTL: 1000,
        name: "test-cache",
      });
      cache.set("key1", "value1");
      expect(cache.has("key1")).toBe(true);
      expect(cache.has("non-existent")).toBe(false);
      cache.dispose();
    });

    it("should delete values", () => {
      const cache = new Cache<string>({
        maxSize: 100,
        defaultTTL: 1000,
        name: "test-cache",
      });
      cache.set("key1", "value1");
      expect(cache.delete("key1")).toBe(true);
      expect(cache.get("key1")).toBeUndefined();
      expect(cache.delete("key1")).toBe(false);
      cache.dispose();
    });

    it("should clear all values", () => {
      const cache = new Cache<string>({
        maxSize: 100,
        defaultTTL: 1000,
        name: "test-cache",
      });
      cache.set("key1", "value1");
      cache.set("key2", "value2");
      cache.clear();
      expect(cache.get("key1")).toBeUndefined();
      expect(cache.get("key2")).toBeUndefined();
      expect(cache.size()).toBe(0);
      cache.dispose();
    });
  });

  describe("TTL Support", () => {
    it("should expire entries after TTL", () => {
      let currentTime = 0;
      const cache = new Cache<string>({
        maxSize: 100,
        defaultTTL: 1000,
        name: "test-cache",
        timeProvider: () => currentTime,
      });
      cache.set("key1", "value1", { ttl: 50 });
      expect(cache.get("key1")).toBe("value1");

      currentTime = 60;
      expect(cache.get("key1")).toBeUndefined();
      cache.dispose();
    });

    it("should support noTTL option", () => {
      let currentTime = 0;
      const cache = new Cache<string>({
        maxSize: 100,
        defaultTTL: 1000,
        name: "test-cache",
        timeProvider: () => currentTime,
      });
      cache.set("key1", "value1", { noTTL: true });

      currentTime = 1000;
      expect(cache.get("key1")).toBe("value1");
      cache.dispose();
    });

    it("should use default TTL when not specified", () => {
      let currentTime = 0;
      const cache = new Cache<string>({
        maxSize: 100,
        defaultTTL: 100,
        name: "test-cache",
        timeProvider: () => currentTime,
      });
      cache.set("key1", "value1");
      expect(cache.get("key1")).toBe("value1");

      currentTime = 150;
      expect(cache.get("key1")).toBeUndefined();
      cache.dispose();
    });
  });

  describe("Statistics", () => {
    it("should track hits and misses", () => {
      const cache = new Cache<string>({
        maxSize: 100,
        defaultTTL: 1000,
        name: "test-cache",
      });
      cache.set("key1", "value1");

      cache.get("key1");
      cache.get("key1");
      cache.get("non-existent");

      const stats = cache.stats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      cache.dispose();
    });

    it("should calculate hit rate correctly", () => {
      const cache = new Cache<string>({
        maxSize: 100,
        defaultTTL: 1000,
        name: "test-cache",
      });
      cache.set("key1", "value1");
      cache.get("key1");
      cache.get("key1");
      cache.get("non-existent");

      const stats = cache.stats();
      expect(stats.hitRate).toBe(66.67);
      cache.dispose();
    });

    it("should return zero hit rate with no operations", () => {
      const cache = new Cache<string>({
        maxSize: 100,
        defaultTTL: 1000,
        name: "test-cache",
      });
      const stats = cache.stats();
      expect(stats.hitRate).toBe(0);
      cache.dispose();
    });
  });

  describe("Events", () => {
    it("should emit set events", () => {
      const cache = new Cache<string>({
        maxSize: 100,
        defaultTTL: 1000,
        name: "test-cache",
      });
      let eventFired = false;
      cache.on("set", (_event: string, key: string, value: unknown) => {
        eventFired = true;
        expect(key).toBe("key1");
        expect(value).toBe("value1");
      });

      cache.set("key1", "value1");
      expect(eventFired).toBe(true);
      cache.dispose();
    });

    it("should emit hit events", () => {
      const cache = new Cache<string>({
        maxSize: 100,
        defaultTTL: 1000,
        name: "test-cache",
      });
      let eventFired = false;
      cache.set("key1", "value1");

      cache.on("hit", (_event: string, key: string, value: unknown) => {
        eventFired = true;
        expect(key).toBe("key1");
        expect(value).toBe("value1");
      });

      cache.get("key1");
      expect(eventFired).toBe(true);
      cache.dispose();
    });

    it("should emit miss events", () => {
      const cache = new Cache<string>({
        maxSize: 100,
        defaultTTL: 1000,
        name: "test-cache",
      });
      let eventFired = false;
      cache.on("miss", (_event: string, key: string) => {
        eventFired = true;
        expect(key).toBe("non-existent");
      });

      cache.get("non-existent");
      expect(eventFired).toBe(true);
      cache.dispose();
    });

    it("should allow unsubscribing from events", () => {
      const cache = new Cache<string>({
        maxSize: 100,
        defaultTTL: 1000,
        name: "test-cache",
      });
      let count = 0;
      const unsubscribe = cache.on("set", () => {
        count++;
      });

      cache.set("key1", "value1");
      expect(count).toBe(1);

      unsubscribe();
      cache.set("key2", "value2");
      expect(count).toBe(1);
      cache.dispose();
    });
  });

  describe("Multi-operations", () => {
    it("should support mget", () => {
      const cache = new Cache<string>({
        maxSize: 100,
        defaultTTL: 1000,
        name: "test-cache",
      });
      cache.set("key1", "value1");
      cache.set("key2", "value2");

      const values = cache.mget(["key1", "key2", "key3"]);
      expect(values).toEqual(["value1", "value2", undefined]);
      cache.dispose();
    });

    it("should support mset", () => {
      const cache = new Cache<string>({
        maxSize: 100,
        defaultTTL: 1000,
        name: "test-cache",
      });
      cache.mset([
        { key: "key1", value: "value1" },
        { key: "key2", value: "value2", options: { ttl: 50000 } },
      ]);

      expect(cache.get("key1")).toBe("value1");
      expect(cache.get("key2")).toBe("value2");
      cache.dispose();
    });
  });

  describe("getOrCompute", () => {
    it("should return cached value if exists", async () => {
      const cache = new Cache<string>({
        maxSize: 100,
        defaultTTL: 1000,
        name: "test-cache",
      });
      cache.set("key1", "cached-value");
      const factory = () => "computed-value";

      const result = await cache.getOrCompute("key1", factory);
      expect(result).toBe("cached-value");
      cache.dispose();
    });

    it("should compute and cache value if not exists", async () => {
      const cache = new Cache<string>({
        maxSize: 100,
        defaultTTL: 1000,
        name: "test-cache",
      });
      const factory = () => "computed-value";

      const result = await cache.getOrCompute("key1", factory);
      expect(result).toBe("computed-value");
      expect(cache.get("key1")).toBe("computed-value");
      cache.dispose();
    });

    it("should support async factory functions", async () => {
      const cache = new Cache<string>({
        maxSize: 100,
        defaultTTL: 1000,
        name: "test-cache",
      });
      const factory = async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return "async-value";
      };

      const result = await cache.getOrCompute("key1", factory);
      expect(result).toBe("async-value");
      cache.dispose();
    });
  });
});

describe("LRUCache", () => {
  it("should evict LRU item when full", () => {
    const lru = new LRUCache<string, number>(3);

    lru.set("a", {
      value: 1,
      createdAt: 0,
      expiresAt: null,
      accessCount: 0,
      lastAccessedAt: 0,
    });
    lru.set("b", {
      value: 2,
      createdAt: 0,
      expiresAt: null,
      accessCount: 0,
      lastAccessedAt: 0,
    });
    lru.set("c", {
      value: 3,
      createdAt: 0,
      expiresAt: null,
      accessCount: 0,
      lastAccessedAt: 0,
    });

    lru.get("a");

    lru.set("d", {
      value: 4,
      createdAt: 0,
      expiresAt: null,
      accessCount: 0,
      lastAccessedAt: 0,
    });

    expect(lru.has("a")).toBe(true);
    expect(lru.has("b")).toBe(false);
    expect(lru.has("c")).toBe(true);
    expect(lru.has("d")).toBe(true);
    expect(lru.evictions).toBe(1);
  });

  it("should track size correctly", () => {
    const lru = new LRUCache<string, number>(3);

    expect(lru.size).toBe(0);

    lru.set("a", {
      value: 1,
      createdAt: 0,
      expiresAt: null,
      accessCount: 0,
      lastAccessedAt: 0,
    });
    expect(lru.size).toBe(1);

    lru.delete("a");
    expect(lru.size).toBe(0);
  });
});

describe("Cache Factory", () => {
  it("should create named caches", () => {
    const cache1 = createCache<string>("cache1", { maxSize: 50 });
    const cache2 = createCache<number>("cache2", { maxSize: 100 });

    expect(hasCache("cache1")).toBe(true);
    expect(hasCache("cache2")).toBe(true);
    expect(getCache<string>("cache1")).toBe(cache1);
    expect(getCache<number>("cache2")).toBe(cache2);

    clearAllCaches();
  });

  it("should return existing cache for same name", () => {
    const cache1 = createCache<string>("same-name");
    const cache2 = createCache<string>("same-name");

    expect(cache1).toBe(cache2);

    clearAllCaches();
  });

  it("should remove named caches", () => {
    createCache<string>("to-remove");
    expect(hasCache("to-remove")).toBe(true);

    removeCache("to-remove");
    expect(hasCache("to-remove")).toBe(false);

    clearAllCaches();
  });

  it("should create cache with preset", () => {
    const cache = createCacheWithPreset("api-cache", "api");
    const stats = cache.stats();

    expect(stats.maxSize).toBe(1000);
    expect(hasCache("api-cache")).toBe(true);

    clearAllCaches();
  });
});

describe("Default Cache", () => {
  it("should be available as singleton", () => {
    expect(defaultCache).toBeDefined();
    expect(defaultCache.stats().maxSize).toBe(10000);
  });

  it("should work with basic operations", () => {
    defaultCache.set("test-key", "test-value");
    expect(defaultCache.get("test-key")).toBe("test-value");
    defaultCache.delete("test-key");
  });
});

runTests();
