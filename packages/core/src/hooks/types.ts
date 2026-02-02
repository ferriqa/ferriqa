/**
 * @ferriqa/core - Hook System Types
 *
 * Type definitions for the event orchestration system.
 * Provides type-safe hook definitions for Actions and Filters.
 */

/**
 * Hook callback function type
 */
export type HookCallback<T> = (context: T) => Promise<void> | void;

/**
 * Filter callback function type - returns transformed data
 */
export type FilterCallback<T> = (data: T) => Promise<T> | T;

/**
 * Hook types
 */
export type HookType = "action" | "filter";

/**
 * Hook priority levels
 */
export type HookPriority = "low" | "normal" | "high" | "critical";

/**
 * Priority values for internal use
 */
export const HOOK_PRIORITY_VALUES: Record<HookPriority, number> = {
  low: 10,
  normal: 50,
  high: 100,
  critical: 1000,
};

/**
 * Hook options
 */
export interface HookOptions {
  priority?: HookPriority;
  once?: boolean;
}

/**
 * Internal hook handler structure
 */
export interface HookHandler<T> {
  id: string;
  callback: HookCallback<T> | FilterCallback<T>;
  priority: number;
  once: boolean;
  type: HookType;
}

/**
 * Hook execution result
 */
export interface HookResult {
  success: boolean;
  executed: number;
  errors: Array<{ handlerId: string; error: Error }>;
}

/**
 * Filter execution result
 */
export interface FilterResult<T> {
  success: boolean;
  data: T;
  errors: Array<{ handlerId: string; error: Error }>;
}

/**
 * Hook registry interface
 */
export interface IHookRegistry {
  on<T>(
    event: string,
    callback: HookCallback<T>,
    options?: HookOptions,
  ): () => void;
  off<T>(event: string, callback: HookCallback<T>): void;
  emit<T>(event: string, context: T): Promise<HookResult>;
  filter<T>(event: string, data: T): Promise<FilterResult<T>>;
  clear(): void;
}

/**
 * Error handling strategy for hooks
 */
export type ErrorStrategy = "continue" | "stop" | "ignore";

/**
 * Hook execution options
 */
export interface ExecutionOptions {
  errorStrategy?: ErrorStrategy;
  timeout?: number;
}

// ========== RELATION HOOK CONTEXTS ==========

/**
 * Relation create hook context
 * REVIEW: Simplified inline type for consumer convenience
 * Canonical type with full Relation interface is in relations/types.ts
 */
// REVIEW: Type is 'string' instead of 'RelationType' - this is INTENTIONAL
// This is a simplified inline type for consumer convenience
// Canonical type with full RelationType is in relations/types.ts
// Runtime values will match RelationType ("one-to-one" | "one-to-many" | "many-to-many")
export interface RelationCreateContext {
  sourceContentId: string;
  targetContentId: string;
  type: string;
  metadata?: Record<string, unknown>;
  userId?: string;
}

/**
 * Relation update hook context
 * REVIEW: Simplified inline type for consumer convenience
 * Canonical type with full Relation interface is in relations/types.ts
 */
export interface RelationUpdateContext {
  relation: {
    id: string;
    sourceContentId: string;
    targetContentId: string;
    type: string;
    metadata?: Record<string, unknown>;
  };
  metadata?: Record<string, unknown>;
  userId?: string;
}

/**
 * Relation delete hook context
 * REVIEW: Simplified inline type for consumer convenience
 * Canonical type with full Relation interface is in relations/types.ts
 */
export interface RelationDeleteContext {
  relation: {
    id: string;
    sourceContentId: string;
    targetContentId: string;
    type: string;
    metadata?: Record<string, unknown>;
  };
  userId?: string;
}
