/**
 * @ferriqa/api - Storage Registry
 *
 * Manages multiple storage adapters for media management.
 */

import { type StorageAdapter } from "./storage.ts";

export class StorageRegistry {
  private adapters = new Map<string, StorageAdapter>();
  private defaultType: string = "local";

  constructor(initialAdapters: StorageAdapter[] = []) {
    for (const adapter of initialAdapters) {
      this.register(adapter);
    }
  }

  /**
   * Register a new storage adapter
   */
  register(adapter: StorageAdapter): void {
    if (this.adapters.has(adapter.type)) {
      console.warn(
        `Storage adapter for type "${adapter.type}" is already registered. Overwriting.`,
      );
    }
    this.adapters.set(adapter.type, adapter);
  }

  /**
   * Get an adapter by type
   */
  get(type: string): StorageAdapter | undefined {
    return this.adapters.get(type);
  }

  /**
   * Get the default adapter
   */
  getDefault(): StorageAdapter {
    const adapter = this.adapters.get(this.defaultType);
    if (!adapter) {
      throw new Error(
        `Default storage adapter "${this.defaultType}" not found.`,
      );
    }
    return adapter;
  }

  /**
   * Set the default storage type
   */
  setDefaultType(type: string): void {
    if (!this.adapters.has(type)) {
      throw new Error(
        `Cannot set default storage to "${type}" as it's not registered.`,
      );
    }
    this.defaultType = type;
  }

  /**
   * List all registered storage types
   */
  listTypes(): string[] {
    return Array.from(this.adapters.keys());
  }
}

// Global storage registry instance (to be initialized during app bootstrap)
export const globalStorageRegistry = new StorageRegistry();
