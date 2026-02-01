/**
 * @ferriqa/core - Hook Error Handling
 *
 * Error handling utilities for the hook system.
 * Provides structured error information and recovery mechanisms.
 */

import type { HookResult, FilterResult } from "./types.ts";

/**
 * Hook execution error
 */
export class HookExecutionError extends Error {
  constructor(
    public readonly event: string,
    public readonly handlerId: string,
    public readonly originalError: Error,
  ) {
    super(
      `Hook execution failed for event "${event}" (handler: ${handlerId}): ${originalError.message}`,
    );
    this.name = "HookExecutionError";
  }
}

/**
 * Hook validation error
 */
export class HookValidationError extends Error {
  constructor(
    public readonly event: string,
    message: string,
  ) {
    super(`Hook validation failed for event "${event}": ${message}`);
    this.name = "HookValidationError";
  }
}

/**
 * Error handler interface
 */
export interface HookErrorHandler {
  handle(error: HookExecutionError, context: unknown): void | Promise<void>;
}

/**
 * Console error handler - logs errors to console
 */
export class ConsoleErrorHandler implements HookErrorHandler {
  handle(error: HookExecutionError, _context?: unknown): void {
    console.error(`[Hook Error] ${error.message}`);
    console.error(`Original error:`, error.originalError);
  }
}

/**
 * Error aggregator - collects errors for later analysis
 */
export class ErrorAggregator implements HookErrorHandler {
  private errors: HookExecutionError[] = [];

  handle(error: HookExecutionError, _context?: unknown): void {
    this.errors.push(error);
  }

  getErrors(): HookExecutionError[] {
    return [...this.errors];
  }

  clear(): void {
    this.errors = [];
  }

  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  getErrorCount(): number {
    return this.errors.length;
  }
}

/**
 * Create a composite error handler
 */
export function createCompositeHandler(
  ...handlers: HookErrorHandler[]
): HookErrorHandler {
  return {
    handle: async (error: HookExecutionError, context: unknown) => {
      for (const handler of handlers) {
        await handler.handle(error, context);
      }
    },
  };
}

/**
 * Format hook result as string for logging
 */
export function formatHookResult(result: HookResult): string {
  const status = result.success ? "✓" : "✗";
  const executed = `${result.executed} handler${result.executed === 1 ? "" : "s"} executed`;

  if (result.errors.length === 0) {
    return `${status} ${executed}`;
  }

  const errorCount = `${result.errors.length} error${result.errors.length === 1 ? "" : "s"}`;
  return `${status} ${executed}, ${errorCount}`;
}

/**
 * Format filter result as string for logging
 */
export function formatFilterResult<T>(result: FilterResult<T>): string {
  const status = result.success ? "✓" : "✗";

  if (result.errors.length === 0) {
    return `${status} Filter pipeline completed successfully`;
  }

  const errorCount = `${result.errors.length} error${result.errors.length === 1 ? "" : "s"}`;
  return `${status} Filter pipeline completed with ${errorCount}`;
}

/**
 * Check if error is a HookExecutionError
 */
export function isHookExecutionError(
  error: unknown,
): error is HookExecutionError {
  return error instanceof HookExecutionError;
}

/**
 * Check if error is a HookValidationError
 */
export function isHookValidationError(
  error: unknown,
): error is HookValidationError {
  return error instanceof HookValidationError;
}

/**
 * Safe hook execution wrapper
 * Wraps a callback to catch and format errors
 */
export function safeHook<T, R>(
  event: string,
  handlerId: string,
  fn: (context: T) => R | Promise<R>,
): (context: T) => Promise<R> {
  return async (context: T): Promise<R> => {
    try {
      const result = fn(context);

      if (result instanceof Promise) {
        return await result;
      }

      return result;
    } catch (error) {
      const originalError =
        error instanceof Error ? error : new Error(String(error));
      throw new HookExecutionError(event, handlerId, originalError);
    }
  };
}
