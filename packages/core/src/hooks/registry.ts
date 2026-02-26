/**
 * @ferriqa/core - Hook Registry Implementation
 *
 * Event orchestrator that manages type-safe hook registrations and executions.
 * Supports both Action hooks (fire-and-forget) and Filter hooks (data transformation).
 */

// CROSS-RUNTIME: Use Web Crypto API instead of Node.js crypto module for Deno/Bun compatibility
const generateUUID = () => crypto.randomUUID();

import type {
  HookCallback,
  FilterCallback,
  HookOptions,
  HookHandler,
  HookResult,
  FilterResult,
  IHookRegistry,
  ExecutionOptions,
} from "./types.ts";
import { HOOK_PRIORITY_VALUES } from "./types.ts";

/**
 * Generate unique handler ID
 */
function generateHandlerId(): string {
  return `hook_${generateUUID().replace(/-/g, "")}`;
}

/**
 * Hook Registry - Manages hook registrations and executions
 */
export class HookRegistry implements IHookRegistry {
  private handlers: Map<string, Array<HookHandler<unknown>>> = new Map();
  private handlerIds: Map<string, Set<string>> = new Map();
  private registrationCounter = 0;

  /**
   * Register an action hook
   * @param event - Hook name
   * @param callback - Hook callback function
   * @param options - Hook options (priority, once)
   * @returns Unsubscribe function
   */
  on<T>(
    event: string,
    callback: HookCallback<T>,
    options: HookOptions = {},
  ): () => void {
    const handler: HookHandler<T> = {
      id: generateHandlerId(),
      callback: callback as HookCallback<unknown>,
      priority: HOOK_PRIORITY_VALUES[options.priority ?? "normal"],
      once: options.once ?? false,
      type: "action",
      index: this.registrationCounter++,
    };

    // Add to handlers map
    const existing = this.handlers.get(event) || [];
    existing.push(handler as HookHandler<unknown>);

    // Sort by priority (descending), then by index (ascending) for stable sort
    // Higher priority runs first, same priority maintains insertion order
    existing.sort((a, b) => {
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      return a.index - b.index;
    });

    this.handlers.set(event, existing);

    // Track handler ID
    const ids = this.handlerIds.get(event) || new Set();
    ids.add(handler.id);
    this.handlerIds.set(event, ids);

    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  /**
   * Register a filter hook
   * @param event - Hook name
   * @param callback - Filter callback function
   * @param options - Hook options (priority, once)
   * @returns Unsubscribe function
   */
  addFilter<T>(
    event: string,
    callback: FilterCallback<T>,
    options: HookOptions = {},
  ): () => void {
    const handler: HookHandler<T> = {
      id: generateHandlerId(),
      callback: callback as HookCallback<T>,
      priority: HOOK_PRIORITY_VALUES[options.priority ?? "normal"],
      once: options.once ?? false,
      type: "filter",
      index: this.registrationCounter++,
    };

    // Add to handlers map
    const existing = this.handlers.get(event) || [];
    existing.push(handler as unknown as HookHandler<unknown>);

    // Sort by priority (descending), then by index (ascending) for stable sort
    // Higher priority runs first, same priority maintains insertion order
    existing.sort((a, b) => {
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      return a.index - b.index;
    });

    this.handlers.set(event, existing);

    // Track handler ID
    const ids = this.handlerIds.get(event) || new Set();
    ids.add(handler.id);
    this.handlerIds.set(event, ids);

    // Return unsubscribe function
    return () => this.removeFilter(event, callback);
  }

  /**
   * Remove an action hook
   * @param event - Hook name
   * @param callback - Hook callback function to remove
   */
  off<T>(event: string, callback: HookCallback<T>): void {
    const handlers = this.handlers.get(event);
    if (!handlers) return;

    // Remove ALL handlers with matching callback (not just the first one)
    // This prevents memory leaks when the same callback is registered multiple times
    const matchingHandlers = handlers.filter(
      (h) => h.callback === (callback as HookCallback<unknown>),
    );

    if (matchingHandlers.length === 0) return;

    // Filter out all matching handlers
    const filtered = handlers.filter(
      (h) => h.callback !== (callback as HookCallback<unknown>),
    );

    // Update handlers map
    if (filtered.length === 0) {
      this.handlers.delete(event);
    } else {
      this.handlers.set(event, filtered);
    }

    // Remove all matching IDs from tracking
    const ids = this.handlerIds.get(event);
    if (ids) {
      for (const handler of matchingHandlers) {
        ids.delete(handler.id);
      }
      if (ids.size === 0) {
        this.handlerIds.delete(event);
      }
    }
  }

  /**
   * Remove a filter hook
   * @param event - Hook name
   * @param callback - Filter callback function to remove
   */
  removeFilter<T>(event: string, callback: FilterCallback<T>): void {
    const handlers = this.handlers.get(event);
    if (!handlers) return;

    // Remove ALL handlers with matching callback (not just the first one)
    // This prevents memory leaks when the same callback is registered multiple times
    const matchingHandlers = handlers.filter(
      (h) => h.callback === (callback as FilterCallback<unknown>),
    );

    if (matchingHandlers.length === 0) return;

    // Filter out all matching handlers
    const filtered = handlers.filter(
      (h) => h.callback !== (callback as FilterCallback<unknown>),
    );

    // Update handlers map
    if (filtered.length === 0) {
      this.handlers.delete(event);
    } else {
      this.handlers.set(event, filtered);
    }

    // Remove all matching IDs from tracking
    const ids = this.handlerIds.get(event);
    if (ids) {
      for (const handler of matchingHandlers) {
        ids.delete(handler.id);
      }
      if (ids.size === 0) {
        this.handlerIds.delete(event);
      }
    }
  }

  /**
   * Emit an action hook - executes all registered handlers in parallel
   * @param event - Hook name
   * @param context - Context data to pass to handlers
   * @param options - Execution options
   * @returns Hook execution result
   */
  async emit<T>(
    event: string,
    context: T,
    options: ExecutionOptions = {},
  ): Promise<HookResult> {
    const handlers = this.handlers.get(event) || [];
    const actionHandlers = handlers.filter((h) => h.type === "action");

    if (actionHandlers.length === 0) {
      return { success: true, executed: 0, errors: [] };
    }

    const errors: Array<{ handlerId: string; error: Error }> = [];
    const errorStrategy = options.errorStrategy ?? "continue";

    if (errorStrategy === "stop") {
      // SEQUENTIAL EXECUTION: When errorStrategy is "stop", execute handlers one by one
      // This ensures that if one handler throws, subsequent handlers don't run
      let caughtError: Error | null = null;
      for (let i = 0; i < actionHandlers.length; i++) {
        const handler = actionHandlers[i];
        try {
          const result = (handler.callback as HookCallback<T>)(context);

          // Handle async callbacks
          if (result instanceof Promise) {
            await result;
          }

          // Remove once handlers immediately after execution
          if (handler.once) {
            this.removeHandlerById(event, handler.id);
          }
        } catch (error) {
          caughtError =
            error instanceof Error ? error : new Error(String(error));
          errors.push({
            handlerId: handler.id,
            error: caughtError,
          });
          // Stop execution on first error
          break;
        }
      }
      // Re-throw the caught error so the caller sees it when errorStrategy is "stop"
      if (caughtError) {
        throw caughtError;
      }
    } else {
      // PARALLEL EXECUTION: When errorStrategy is "continue", execute handlers in parallel
      // RACE CONDITION FIX: Collect once handler IDs during execution, remove after Promise.all
      // Prevents concurrent array modifications when multiple once handlers run in parallel
      const onceHandlerIds: string[] = [];

      const promises = actionHandlers.map(async (handler) => {
        try {
          const result = (handler.callback as HookCallback<T>)(context);

          // Handle async callbacks
          if (result instanceof Promise) {
            await result;
          }

          // Collect once handler IDs (don't remove during parallel execution)
          if (handler.once) {
            onceHandlerIds.push(handler.id);
          }
        } catch (error) {
          errors.push({
            handlerId: handler.id,
            error: error instanceof Error ? error : new Error(String(error)),
          });
          // Don't throw - continue executing other handlers
        }
      });

      await Promise.all(promises);

      // RACE CONDITION FIX: Remove once handlers after all parallel execution completes
      // This prevents concurrent array modifications during Promise.all
      for (const handlerId of onceHandlerIds) {
        this.removeHandlerById(event, handlerId);
      }
    }

    return {
      success: errors.length === 0,
      executed: actionHandlers.length,
      errors,
    };
  }

  /**
   * Execute filter hooks - transforms data through sequential pipeline
   * @param event - Hook name
   * @param data - Initial data to transform
   * @param options - Execution options
   * @returns Filter execution result with transformed data
   */
  async filter<T>(
    event: string,
    data: T,
    options: ExecutionOptions = {},
  ): Promise<FilterResult<T>> {
    const handlers = this.handlers.get(event) || [];
    const filterHandlers = handlers.filter((h) => h.type === "filter");

    if (filterHandlers.length === 0) {
      return { success: true, data, errors: [] };
    }

    let currentData = data;
    const errors: Array<{ handlerId: string; error: Error }> = [];
    const errorStrategy = options.errorStrategy ?? "continue";

    // Execute handlers sequentially (pipeline pattern)
    for (const handler of filterHandlers) {
      try {
        const result = (handler.callback as FilterCallback<T>)(currentData);

        // Handle async callbacks
        if (result instanceof Promise) {
          currentData = await result;
        } else {
          currentData = result;
        }

        // Remove once handlers
        if (handler.once) {
          this.removeHandlerById(event, handler.id);
        }
      } catch (error) {
        errors.push({
          handlerId: handler.id,
          error: error instanceof Error ? error : new Error(String(error)),
        });

        if (errorStrategy === "stop") {
          break;
        }
      }
    }

    return {
      success: errors.length === 0,
      data: currentData,
      errors,
    };
  }

  /**
   * Check if an event has registered handlers
   * @param event - Hook name
   * @returns True if handlers exist
   */
  hasHandlers(event: string): boolean {
    const handlers = this.handlers.get(event);
    return !!handlers && handlers.length > 0;
  }

  /**
   * Get number of handlers for an event
   * @param event - Hook name
   * @returns Number of registered handlers
   */
  handlerCount(event: string): number {
    const handlers = this.handlers.get(event);
    return handlers?.length ?? 0;
  }

  /**
   * Get all registered event names
   * @returns Array of event names
   */
  getRegisteredEvents(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Clear all handlers for a specific event
   * @param event - Hook name
   */
  clearEvent(event: string): void {
    this.handlers.delete(event);
    this.handlerIds.delete(event);
  }

  /**
   * Clear all handlers
   */
  clear(): void {
    this.handlers.clear();
    this.handlerIds.clear();
  }

  /**
   * Dispose hook registry and cleanup resources
   * Alias for clear() - removes all event handlers
   */
  dispose(): void {
    this.clear();
  }

  /**
   * Remove a handler by ID (internal use)
   * @param event - Hook name
   * @param handlerId - Handler ID
   */
  private removeHandlerById(event: string, handlerId: string): void {
    const handlers = this.handlers.get(event);
    if (!handlers) return;

    const index = handlers.findIndex((h) => h.id === handlerId);
    if (index !== -1) {
      handlers.splice(index, 1);

      if (handlers.length === 0) {
        this.handlers.delete(event);
      } else {
        this.handlers.set(event, handlers);
      }

      const ids = this.handlerIds.get(event);
      if (ids) {
        ids.delete(handlerId);
        if (ids.size === 0) {
          this.handlerIds.delete(event);
        }
      }
    }
  }
}

/**
 * Global hook registry instance
 */
export const hooks = new HookRegistry();

/**
 * Create a new hook registry instance
 * Useful for testing or isolated hook systems
 */
export function createHookRegistry(): HookRegistry {
  return new HookRegistry();
}
