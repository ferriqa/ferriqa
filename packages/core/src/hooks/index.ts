/**
 * @ferriqa/core - Hook System
 *
 * Event orchestration system for Ferriqa.
 * Provides type-safe action and filter hooks with priority support.
 *
 * @example
 * ```typescript
 * import { hooks, addFilter } from "@ferriqa/core/hooks";
 *
 * // Register an action hook
 * const unsubscribe = hooks.on("content:afterCreate", async (context) => {
 *   console.log("Content created:", context.slug);
 * });
 *
 * // Register a filter hook
 * addFilter("content:beforeCreate", async (data) => {
 *   // Transform data
 *   return { ...data, slug: data.slug.toLowerCase() };
 * });
 *
 * // Emit action hook
 * await hooks.emit("content:afterCreate", {
 *   blueprintId: 1,
 *   slug: "my-post",
 *   data: { title: "My Post" },
 *   status: "published",
 * });
 *
 * // Execute filter hook
 * const result = await hooks.filter("content:beforeCreate", inputData);
 * console.log(result.data); // Transformed data
 * ```
 */

// Types
export type {
  HookCallback,
  FilterCallback,
  HookType,
  HookPriority,
  HookOptions,
  HookHandler,
  HookResult,
  FilterResult,
  IHookRegistry,
  ErrorStrategy,
  ExecutionOptions,
} from "./types.ts";

export { HOOK_PRIORITY_VALUES } from "./types.ts";

// Registry
export { HookRegistry, hooks, createHookRegistry } from "./registry.ts";

// Built-in hooks
export type {
  BuiltInHookDefinition,
  HookContentCreateContext,
  HookContentUpdateContext,
  HookContentDeleteContext,
  HookContentGetContext,
  HookContentPublishContext,
  HookBlueprintCreateContext,
  HookBlueprintUpdateContext,
  HookBlueprintDeleteContext,
  HookWebhookSendContext,
} from "./built-in.ts";

export {
  BUILT_IN_HOOKS,
  getHookDefinition,
  isBuiltInHook,
  getBuiltInHookNames,
  getBuiltInActionHooks,
  getBuiltInFilterHooks,
} from "./built-in.ts";

// Error handling
export {
  HookExecutionError,
  HookValidationError,
  ConsoleErrorHandler,
  ErrorAggregator,
  createCompositeHandler,
  formatHookResult,
  formatFilterResult,
  isHookExecutionError,
  isHookValidationError,
  safeHook,
} from "./errors.ts";

export type { HookErrorHandler } from "./errors.ts";

// Convenience exports for the global hooks instance
/**
 * Register an action hook
 * @alias hooks.on
 */
export function on<T>(
  event: string,
  callback: import("./types.ts").HookCallback<T>,
  options?: import("./types.ts").HookOptions,
): () => void {
  return hooks.on(event, callback, options);
}

/**
 * Remove an action hook
 * @alias hooks.off
 */
export function off<T>(
  event: string,
  callback: import("./types.ts").HookCallback<T>,
): void {
  return hooks.off(event, callback);
}

/**
 * Register a filter hook
 * @alias hooks.addFilter
 */
export function addFilter<T>(
  event: string,
  callback: import("./types.ts").FilterCallback<T>,
  options?: import("./types.ts").HookOptions,
): () => void {
  return hooks.addFilter(event, callback, options);
}

/**
 * Remove a filter hook
 * @alias hooks.removeFilter
 */
export function removeFilter<T>(
  event: string,
  callback: import("./types.ts").FilterCallback<T>,
): void {
  return hooks.removeFilter(event, callback);
}

/**
 * Emit an action hook
 * @alias hooks.emit
 */
export function emit<T>(
  event: string,
  context: T,
  options?: import("./types.ts").ExecutionOptions,
): Promise<import("./types.ts").HookResult> {
  return hooks.emit(event, context, options);
}

/**
 * Execute filter hooks
 * @alias hooks.filter
 */
export function filter<T>(
  event: string,
  data: T,
  options?: import("./types.ts").ExecutionOptions,
): Promise<import("./types.ts").FilterResult<T>> {
  return hooks.filter(event, data, options);
}

// Re-import hooks for the convenience functions
import { hooks } from "./registry.ts";
