/**
 * @ferriqa/core - LRU Cache Implementation
 *
 * High-performance LRU (Least Recently Used) cache using Map.
 * Automatically evicts least recently used items when max size is reached.
 */

import { type CacheEntry } from "./types.ts";

/**
 * Node for doubly-linked list (for O(1) LRU operations)
 */
interface LRUNode<K, V> {
  key: K;
  entry: CacheEntry<V>;
  prev: LRUNode<K, V> | null;
  next: LRUNode<K, V> | null;
}

/**
 * LRU Cache implementation using Map + Doubly Linked List
 * Provides O(1) get, set, and eviction operations
 */
export class LRUCache<K, V> {
  private maxSize: number;
  private cache: Map<K, LRUNode<K, V>>;
  private head: LRUNode<K, V> | null = null;
  private tail: LRUNode<K, V> | null = null;
  private _evictions = 0;

  constructor(maxSize: number = 1000) {
    this.maxSize = Math.max(1, maxSize);
    this.cache = new Map();
  }

  /**
   * Get value from cache and update access order
   */
  get(key: K): CacheEntry<V> | undefined {
    const node = this.cache.get(key);
    if (!node) {
      return undefined;
    }

    this.moveToFront(node);
    node.entry.accessCount++;
    node.entry.lastAccessedAt = Date.now();

    return node.entry;
  }

  /**
   * Set value in cache
   */
  set(key: K, entry: CacheEntry<V>): void {
    const existingNode = this.cache.get(key);

    if (existingNode) {
      existingNode.entry = entry;
      this.moveToFront(existingNode);
      return;
    }

    const newNode: LRUNode<K, V> = {
      key,
      entry,
      prev: null,
      next: null,
    };

    this.cache.set(key, newNode);
    this.addToFront(newNode);

    if (this.cache.size > this.maxSize) {
      this.evictLRU();
    }
  }

  /**
   * Delete a key from cache
   */
  delete(key: K): boolean {
    const node = this.cache.get(key);
    if (!node) {
      return false;
    }

    this.removeNode(node);
    this.cache.delete(key);
    return true;
  }

  /**
   * Check if key exists in cache
   */
  has(key: K): boolean {
    return this.cache.has(key);
  }

  /**
   * Get current cache size
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Get max cache size
   */
  get maxCacheSize(): number {
    return this.maxSize;
  }

  /**
   * Get total evictions count
   */
  get evictions(): number {
    return this._evictions;
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.cache.clear();
    this.head = null;
    this.tail = null;
  }

  /**
   * Get all keys (for iteration/debugging)
   */
  keys(): IterableIterator<K> {
    return this.cache.keys();
  }

  /**
   * Add node to front (most recently used)
   */
  private addToFront(node: LRUNode<K, V>): void {
    node.next = this.head;
    node.prev = null;

    if (this.head) {
      this.head.prev = node;
    }

    this.head = node;

    if (!this.tail) {
      this.tail = node;
    }
  }

  /**
   * Move node to front (most recently used)
   */
  private moveToFront(node: LRUNode<K, V>): void {
    if (node === this.head) {
      return;
    }

    this.removeNode(node);
    this.addToFront(node);
  }

  /**
   * Remove node from list
   */
  private removeNode(node: LRUNode<K, V>): void {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }
  }

  /**
   * Evict least recently used item
   */
  private evictLRU(): void {
    if (!this.tail) {
      return;
    }

    const keyToEvict = this.tail.key;
    this.removeNode(this.tail);
    this.cache.delete(keyToEvict);
    this._evictions++;
  }
}
