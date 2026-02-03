/**
 * @ferriqa/core - Error Handling Unit Tests
 *
 * Tests for error system utilities.
 */

import { test } from "@cross/test";
import { assertEquals } from "@std/assert";
import {
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
} from "../../hooks/index.ts";

test("Error Handling - HookExecutionError should create error with correct properties", () => {
  const original = new Error("Test error");
  const error = new HookExecutionError("test:event", "handler-123", original);

  assertEquals(error.name, "HookExecutionError");
  assertEquals(error.event, "test:event");
  assertEquals(error.handlerId, "handler-123");
  assertEquals(error.originalError, original);
  assertEquals(error.message.includes("test:event"), true);
  assertEquals(error.message.includes("handler-123"), true);
  assertEquals(error.message.includes("Test error"), true);
});

test("Error Handling - HookValidationError should create error with event name", () => {
  const error = new HookValidationError("test:event", "Invalid hook");

  assertEquals(error.name, "HookValidationError");
  assertEquals(error.event, "test:event");
  assertEquals(error.message.includes("test:event"), true);
  assertEquals(error.message.includes("Invalid hook"), true);
});

test("Error Handling - ConsoleErrorHandler should handle errors without throwing", () => {
  const handler = new ConsoleErrorHandler();

  const dummyOriginalError = {
    name: "Error",
    message: "Dummy error for testing",
    stack: undefined as string | undefined,
  };

  const error = new HookExecutionError(
    "test:event",
    "test-handler",
    dummyOriginalError as Error,
  );

  handler.handle(error, {});
  assertEquals(true, true);
});

test("Error Handling - ErrorAggregator should collect errors", () => {
  const aggregator = new ErrorAggregator();
  const error1 = new HookExecutionError("event1", "h1", new Error("Error 1"));
  const error2 = new HookExecutionError("event2", "h2", new Error("Error 2"));

  aggregator.handle(error1, {});
  aggregator.handle(error2, {});

  const errors = aggregator.getErrors();
  assertEquals(errors.length, 2);
  assertEquals(errors[0], error1);
  assertEquals(errors[1], error2);
});

test("Error Handling - ErrorAggregator should clear errors", () => {
  const aggregator = new ErrorAggregator();
  const error = new HookExecutionError("test", "handler", new Error("Test"));

  aggregator.handle(error, {});
  assertEquals(aggregator.hasErrors(), true);

  aggregator.clear();
  assertEquals(aggregator.hasErrors(), false);
  assertEquals(aggregator.getErrorCount(), 0);
});

test("Error Handling - ErrorAggregator should check if has errors", () => {
  const aggregator = new ErrorAggregator();
  assertEquals(aggregator.hasErrors(), false);

  const error = new HookExecutionError("test", "handler", new Error("Test"));
  aggregator.handle(error, {});

  assertEquals(aggregator.hasErrors(), true);
});

test("Error Handling - ErrorAggregator should return error count", () => {
  const aggregator = new ErrorAggregator();
  assertEquals(aggregator.getErrorCount(), 0);

  aggregator.handle(new HookExecutionError("test", "h1", new Error("1")), {});
  aggregator.handle(new HookExecutionError("test", "h2", new Error("2")), {});

  assertEquals(aggregator.getErrorCount(), 2);
});

test("Error Handling - createCompositeHandler should call all handlers", async () => {
  const calls: string[] = [];
  const handler1 = {
    handle: async () => {
      calls.push("handler1");
    },
  };
  const handler2 = {
    handle: async () => {
      calls.push("handler2");
    },
  };

  const composite = createCompositeHandler(handler1, handler2);
  const error = new HookExecutionError("test", "handler", new Error("Test"));

  await composite.handle(error, {});

  assertEquals(calls.includes("handler1"), true);
  assertEquals(calls.includes("handler2"), true);
});

test("Error Handling - formatHookResult should format successful result", () => {
  const result = { success: true, executed: 3, errors: [] };
  const formatted = formatHookResult(result);

  assertEquals(formatted.includes("✓"), true);
  assertEquals(formatted.includes("3 handlers"), true);
});

test("Error Handling - formatHookResult should format result with errors", () => {
  const result = {
    success: false,
    executed: 3,
    errors: [{ handlerId: "h1", error: new Error("Error") }],
  };
  const formatted = formatHookResult(result);

  assertEquals(formatted.includes("✗"), true);
  assertEquals(formatted.includes("3 handlers"), true);
  assertEquals(formatted.includes("1 error"), true);
});

test("Error Handling - formatFilterResult should format successful filter result", () => {
  const result = { success: true, data: { value: 42 }, errors: [] };
  const formatted = formatFilterResult(result);

  assertEquals(formatted.includes("✓"), true);
  assertEquals(formatted.includes("successfully"), true);
});

test("Error Handling - formatFilterResult should format filter result with errors", () => {
  const result = {
    success: false,
    data: { value: 42 },
    errors: [
      { handlerId: "h1", error: new Error("Error 1") },
      { handlerId: "h2", error: new Error("Error 2") },
    ],
  };
  const formatted = formatFilterResult(result);

  assertEquals(formatted.includes("✗"), true);
  assertEquals(formatted.includes("2 errors"), true);
});

test("Error Handling - isHookExecutionError should return true for HookExecutionError", () => {
  const error = new HookExecutionError("test", "handler", new Error("Test"));
  assertEquals(isHookExecutionError(error), true);
});

test("Error Handling - isHookExecutionError should return false for regular Error", () => {
  const error = new Error("Test");
  assertEquals(isHookExecutionError(error), false);
});

test("Error Handling - isHookValidationError should return true for HookValidationError", () => {
  const error = new HookValidationError("test", "Invalid");
  assertEquals(isHookValidationError(error), true);
});

test("Error Handling - isHookValidationError should return false for regular Error", () => {
  const error = new Error("Test");
  assertEquals(isHookValidationError(error), false);
});

test("Error Handling - safeHook should wrap function and return result", async () => {
  const fn = (x: number) => x * 2;
  const safe = safeHook("test", "handler", fn);

  const result = await safe(5);
  assertEquals(result, 10);
});

test("Error Handling - safeHook should wrap async function", async () => {
  const fn = async (x: number) => {
    await new Promise((resolve) => setTimeout(resolve, 10));
    return x + 1;
  };
  const safe = safeHook("test", "handler", fn);

  const result = await safe(5);
  assertEquals(result, 6);
});

test("Error Handling - safeHook should convert errors to HookExecutionError", async () => {
  const fn = () => {
    throw new Error("Test error");
  };
  const safe = safeHook("test:event", "handler-123", fn);

  let isHookError = false;
  let caughtEvent = "";
  let caughtHandlerId = "";

  try {
    await safe(undefined);
  } catch (error: unknown) {
    isHookError = isHookExecutionError(error);
    if (isHookError) {
      const hookError = error as HookExecutionError;
      caughtEvent = hookError.event;
      caughtHandlerId = hookError.handlerId;
    }
  }

  assertEquals(isHookError, true);
  assertEquals(caughtEvent, "test:event");
  assertEquals(caughtHandlerId, "handler-123");
});
