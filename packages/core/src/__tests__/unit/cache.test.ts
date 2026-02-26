/**
 * @ferriqa/core - Cache System Tests
 *
 * Unit tests for the in-memory caching system
 */

import { test } from "@cross/test";
import { assertEquals, assertStrictEquals, assertExists } from "@std/assert";
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

// Basic Operations
test("Cache > Basic Operations > should set and get values", () => {
  const cache = new Cache<string>({
    maxSize: 100,
    defaultTTL: 1000,
    name: "test-cache",
  });
  cache.set("key1", "value1");
  assertStrictEquals(cache.get("key1"), "value1");
  cache.dispose();
});

test("Cache > Basic Operations > should return undefined for non-existent keys", () => {
  const cache = new Cache<string>({
    maxSize: 100,
    defaultTTL: 1000,
    name: "test-cache",
  });
  assertEquals(cache.get("non-existent"), undefined);
  cache.dispose();
});

test("Cache > Basic Operations > should check if key exists", () => {
  const cache = new Cache<string>({
    maxSize: 100,
    defaultTTL: 1000,
    name: "test-cache",
  });
  cache.set("key1", "value1");
  assertEquals(cache.has("key1"), true);
  assertEquals(cache.has("non-existent"), false);
  cache.dispose();
});

test("Cache > Basic Operations > should delete values", () => {
  const cache = new Cache<string>({
    maxSize: 100,
    defaultTTL: 1000,
    name: "test-cache",
  });
  cache.set("key1", "value1");
  assertEquals(cache.delete("key1"), true);
  assertEquals(cache.get("key1"), undefined);
  assertEquals(cache.delete("key1"), false);
  cache.dispose();
});

test("Cache > Basic Operations > should clear all values", () => {
  const cache = new Cache<string>({
    maxSize: 100,
    defaultTTL: 1000,
    name: "test-cache",
  });
  cache.set("key1", "value1");
  cache.set("key2", "value2");
  cache.clear();
  assertEquals(cache.get("key1"), undefined);
  assertEquals(cache.get("key2"), undefined);
  assertEquals(cache.size(), 0);
  cache.dispose();
});

// TTL Support
test("Cache > TTL Support > should expire entries after TTL", () => {
  let currentTime = 0;
  const cache = new Cache<string>({
    maxSize: 100,
    defaultTTL: 1000,
    name: "test-cache",
    timeProvider: () => currentTime,
  });
  cache.set("key1", "value1", { ttl: 50 });
  assertStrictEquals(cache.get("key1"), "value1");

  currentTime = 60;
  assertEquals(cache.get("key1"), undefined);
  cache.dispose();
});

test("Cache > TTL Support > should support noTTL option", () => {
  let currentTime = 0;
  const cache = new Cache<string>({
    maxSize: 100,
    defaultTTL: 1000,
    name: "test-cache",
    timeProvider: () => currentTime,
  });
  cache.set("key1", "value1", { noTTL: true });

  currentTime = 1000;
  assertStrictEquals(cache.get("key1"), "value1");
  cache.dispose();
});

test("Cache > TTL Support > should use default TTL when not specified", () => {
  let currentTime = 0;
  const cache = new Cache<string>({
    maxSize: 100,
    defaultTTL: 100,
    name: "test-cache",
    timeProvider: () => currentTime,
  });
  cache.set("key1", "value1");
  assertStrictEquals(cache.get("key1"), "value1");

  currentTime = 150;
  assertEquals(cache.get("key1"), undefined);
  cache.dispose();
});

// Statistics
test("Cache > Statistics > should track hits and misses", () => {
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
  assertEquals(stats.hits, 2);
  assertEquals(stats.misses, 1);
  cache.dispose();
});

test("Cache > Statistics > should calculate hit rate correctly", () => {
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
  assertEquals(stats.hitRate, 66.67);
  cache.dispose();
});

test("Cache > Statistics > should return zero hit rate with no operations", () => {
  const cache = new Cache<string>({
    maxSize: 100,
    defaultTTL: 1000,
    name: "test-cache",
  });
  const stats = cache.stats();
  assertEquals(stats.hitRate, 0);
  cache.dispose();
});

// Events
test("Cache > Events > should emit set events", () => {
  const cache = new Cache<string>({
    maxSize: 100,
    defaultTTL: 1000,
    name: "test-cache",
  });
  let eventFired = false;
  cache.on("set", (_event: string, key: string, value: unknown) => {
    eventFired = true;
    assertStrictEquals(key, "key1");
    assertStrictEquals(value, "value1");
  });

  cache.set("key1", "value1");
  assertEquals(eventFired, true);
  cache.dispose();
});

test("Cache > Events > should emit hit events", () => {
  const cache = new Cache<string>({
    maxSize: 100,
    defaultTTL: 1000,
    name: "test-cache",
  });
  let eventFired = false;
  cache.set("key1", "value1");

  cache.on("hit", (_event: string, key: string, value: unknown) => {
    eventFired = true;
    assertStrictEquals(key, "key1");
    assertStrictEquals(value, "value1");
  });

  cache.get("key1");
  assertEquals(eventFired, true);
  cache.dispose();
});

test("Cache > Events > should emit miss events", () => {
  const cache = new Cache<string>({
    maxSize: 100,
    defaultTTL: 1000,
    name: "test-cache",
  });
  let eventFired = false;
  cache.on("miss", (_event: string, key: string) => {
    eventFired = true;
    assertStrictEquals(key, "non-existent");
  });

  cache.get("non-existent");
  assertEquals(eventFired, true);
  cache.dispose();
});

test("Cache > Events > should allow unsubscribing from events", () => {
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
  assertEquals(count, 1);

  unsubscribe();
  cache.set("key2", "value2");
  assertEquals(count, 1);
  cache.dispose();
});

// Multi-operations
test("Cache > Multi-operations > should support mget", () => {
  const cache = new Cache<string>({
    maxSize: 100,
    defaultTTL: 1000,
    name: "test-cache",
  });
  cache.set("key1", "value1");
  cache.set("key2", "value2");

  const values = cache.mget(["key1", "key2", "key3"]);
  assertEquals(values, ["value1", "value2", undefined]);
  cache.dispose();
});

test("Cache > Multi-operations > should support mset", () => {
  const cache = new Cache<string>({
    maxSize: 100,
    defaultTTL: 1000,
    name: "test-cache",
  });
  cache.mset([
    { key: "key1", value: "value1" },
    { key: "key2", value: "value2", options: { ttl: 50000 } },
  ]);

  assertStrictEquals(cache.get("key1"), "value1");
  assertStrictEquals(cache.get("key2"), "value2");
  cache.dispose();
});

// getOrCompute
test("Cache > getOrCompute > should return cached value if exists", async () => {
  const cache = new Cache<string>({
    maxSize: 100,
    defaultTTL: 1000,
    name: "test-cache",
  });
  cache.set("key1", "cached-value");
  const factory = () => "computed-value";

  const result = await cache.getOrCompute("key1", factory);
  assertStrictEquals(result, "cached-value");
  cache.dispose();
});

test("Cache > getOrCompute > should compute and cache value if not exists", async () => {
  const cache = new Cache<string>({
    maxSize: 100,
    defaultTTL: 1000,
    name: "test-cache",
  });
  const factory = () => "computed-value";

  const result = await cache.getOrCompute("key1", factory);
  assertStrictEquals(result, "computed-value");
  assertStrictEquals(cache.get("key1"), "computed-value");
  cache.dispose();
});

test("Cache > getOrCompute > should support async factory functions", async () => {
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
  assertStrictEquals(result, "async-value");
  cache.dispose();
});

// LRUCache
test("LRUCache > should evict LRU item when full", () => {
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

  assertEquals(lru.has("a"), true);
  assertEquals(lru.has("b"), false);
  assertEquals(lru.has("c"), true);
  assertEquals(lru.has("d"), true);
  assertEquals(lru.evictions, 1);
});

test("LRUCache > should track size correctly", () => {
  const lru = new LRUCache<string, number>(3);

  assertEquals(lru.size, 0);

  lru.set("a", {
    value: 1,
    createdAt: 0,
    expiresAt: null,
    accessCount: 0,
    lastAccessedAt: 0,
  });
  assertEquals(lru.size, 1);

  lru.delete("a");
  assertEquals(lru.size, 0);
});

// Cache Factory
test("Cache Factory > should create named caches", () => {
  const cache1 = createCache<string>("cache1", { maxSize: 50 });
  const cache2 = createCache<number>("cache2", { maxSize: 100 });

  assertEquals(hasCache("cache1"), true);
  assertEquals(hasCache("cache2"), true);
  assertEquals(getCache<string>("cache1"), cache1);
  assertEquals(getCache<number>("cache2"), cache2);

  clearAllCaches();
});

test("Cache Factory > should return existing cache for same name", () => {
  const cache1 = createCache<string>("same-name");
  const cache2 = createCache<string>("same-name");

  assertEquals(cache1, cache2);

  clearAllCaches();
});

test("Cache Factory > should remove named caches", () => {
  createCache<string>("to-remove");
  assertEquals(hasCache("to-remove"), true);

  removeCache("to-remove");
  assertEquals(hasCache("to-remove"), false);

  clearAllCaches();
});

test("Cache Factory > should create cache with preset", () => {
  const cache = createCacheWithPreset("api-cache", "api");
  const stats = cache.stats();

  assertEquals(stats.maxSize, 1000);
  assertEquals(hasCache("api-cache"), true);

  clearAllCaches();
});

// Default Cache
test("Default Cache > should be available as singleton", () => {
  assertExists(defaultCache);
  assertEquals(defaultCache.stats().maxSize, 10000);
});

test("Default Cache > should work with basic operations", () => {
  defaultCache.set("test-key", "test-value");
  assertStrictEquals(defaultCache.get("test-key"), "test-value");
  defaultCache.delete("test-key");
});
