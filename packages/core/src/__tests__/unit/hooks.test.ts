/**
 * @ferriqa/core - Hook System Unit Tests
 *
 * Tests for the hook registry and hook execution.
 */

import { test } from "@cross/test";
import {
  assertStrictEquals,
  assertEquals,
  assertExists,
  assertArrayIncludes,
} from "@std/assert";
import { createHookRegistry, HookExecutionError } from "../../hooks/index.ts";

test("Hook System > HookRegistry > Action Hooks > should register and emit action hooks", async () => {
  const registry = createHookRegistry();
  let called = false;

  registry.on("test:event", () => {
    called = true;
  });

  await registry.emit("test:event", {});
  assertStrictEquals(called, true);
});

test("Hook System > HookRegistry > Action Hooks > should support async action hooks", async () => {
  const registry = createHookRegistry();
  let called = false;

  registry.on("test:async", async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
    called = true;
  });

  await registry.emit("test:async", {});
  assertStrictEquals(called, true);
});

test("Hook System > HookRegistry > Action Hooks > should execute multiple handlers", async () => {
  const registry = createHookRegistry();
  const calls: string[] = [];

  registry.on("test:multi", () => {
    calls.push("first");
  });

  registry.on("test:multi", () => {
    calls.push("second");
  });

  await registry.emit("test:multi", {});
  assertArrayIncludes(calls, ["first"]);
  assertArrayIncludes(calls, ["second"]);
  assertEquals(calls.length, 2);
});

test("Hook System > HookRegistry > Action Hooks > should support hook priority", async () => {
  const registry = createHookRegistry();
  const order: string[] = [];

  registry.on(
    "test:priority",
    () => {
      order.push("low");
    },
    { priority: "low" },
  );

  registry.on(
    "test:priority",
    () => {
      order.push("high");
    },
    { priority: "high" },
  );

  registry.on(
    "test:priority",
    () => {
      order.push("normal");
    },
    { priority: "normal" },
  );

  await registry.emit("test:priority", {});
  assertStrictEquals(order[0], "high");
  assertStrictEquals(order[2], "low");
});

test("Hook System > HookRegistry > Action Hooks > should support once hooks", async () => {
  const registry = createHookRegistry();
  let count = 0;

  registry.on(
    "test:once",
    () => {
      count++;
    },
    { once: true },
  );

  await registry.emit("test:once", {});
  await registry.emit("test:once", {});

  assertStrictEquals(count, 1);
});

test("Hook System > HookRegistry > Action Hooks > should return hook result with execution count", async () => {
  const registry = createHookRegistry();

  registry.on("test:result", () => {});
  registry.on("test:result", () => {});

  const result = await registry.emit("test:result", {});
  assertStrictEquals(result.success, true);
  assertStrictEquals(result.executed, 2);
  assertEquals(result.errors.length, 0);
});

test("Hook System > HookRegistry > Action Hooks > should handle errors in action hooks", async () => {
  const registry = createHookRegistry();

  registry.on("test:error", () => {
    throw new Error("Test error");
  });

  const result = await registry.emit("test:error", {});
  assertStrictEquals(result.success, false);
  assertEquals(result.errors.length, 1);
});

test("Hook System > HookRegistry > Action Hooks > should support error strategy continue", async () => {
  const registry = createHookRegistry();
  let secondCalled = false;

  registry.on("test:continue", () => {
    throw new Error("First error");
  });

  registry.on("test:continue", () => {
    secondCalled = true;
  });

  await registry.emit("test:continue", {}, { errorStrategy: "continue" });
  assertStrictEquals(secondCalled, true);
});

test("Hook System > HookRegistry > Action Hooks > should stop on first error when errorStrategy is 'stop'", async () => {
  const registry = createHookRegistry();
  let secondCalled = false;

  registry.on("test:stop", () => {
    throw new Error("First error - should stop");
  });

  registry.on("test:stop", () => {
    secondCalled = true;
  });

  let errorThrown = false;
  try {
    await registry.emit("test:stop", {}, { errorStrategy: "stop" });
  } catch (error: unknown) {
    errorThrown = true;
    assertStrictEquals((error as Error).message, "First error - should stop");
  }

  assertStrictEquals(errorThrown, true);
  assertStrictEquals(secondCalled, false); // Second handler should not be called
});

test("Hook System > HookRegistry > Action Hooks > should unsubscribe handlers", async () => {
  const registry = createHookRegistry();
  let count = 0;

  const unsubscribe = registry.on("test:unsub", () => {
    count++;
  });

  await registry.emit("test:unsub", {});
  unsubscribe();
  await registry.emit("test:unsub", {});

  assertStrictEquals(count, 1);
});

test("Hook System > HookRegistry > Action Hooks > should remove all duplicate callbacks on unsubscribe (memory leak fix)", async () => {
  const registry = createHookRegistry();
  let count = 0;

  const callback = () => {
    count++;
  };

  // Register same callback twice (intentionally or by mistake)
  registry.on("test:duplicate", callback);
  registry.on("test:duplicate", callback);

  // Both should fire
  await registry.emit("test:duplicate", {});
  assertStrictEquals(count, 2);

  // Unsubscribe once - should remove ALL instances
  registry.off("test:duplicate", callback);

  // Reset count
  count = 0;

  // Should not fire anymore
  await registry.emit("test:duplicate", {});
  assertStrictEquals(count, 0);
});

test("Hook System > HookRegistry > Filter Hooks > should transform data through filter pipeline", async () => {
  const registry = createHookRegistry();

  registry.addFilter("test:filter", (data: { value: number }) => {
    return { value: data.value * 2 };
  });

  const result = await registry.filter("test:filter", { value: 5 });
  assertStrictEquals(result.data.value, 10);
  assertStrictEquals(result.success, true);
});

test("Hook System > HookRegistry > Filter Hooks > should chain multiple filters", async () => {
  const registry = createHookRegistry();

  registry.addFilter("test:chain", (data: { value: number }) => {
    return { value: data.value + 1 };
  });

  registry.addFilter("test:chain", (data: { value: number }) => {
    return { value: data.value * 2 };
  });

  const result = await registry.filter("test:chain", { value: 5 });
  assertStrictEquals(result.data.value, 12); // (5 + 1) * 2
});

test("Hook System > HookRegistry > Filter Hooks > should support async filters", async () => {
  const registry = createHookRegistry();

  registry.addFilter("test:async", async (data: { value: number }) => {
    await new Promise((resolve) => setTimeout(resolve, 10));
    return { value: data.value + 10 };
  });

  const result = await registry.filter("test:async", { value: 5 });
  assertStrictEquals(result.data.value, 15);
});

test("Hook System > HookRegistry > Filter Hooks > should handle errors in filter hooks", async () => {
  const registry = createHookRegistry();

  registry.addFilter("test:filter-error", () => {
    throw new Error("Filter error");
  });

  const result = await registry.filter("test:filter-error", { value: 5 });
  assertStrictEquals(result.success, false);
  assertEquals(result.errors.length, 1);
});

test("Hook System > HookRegistry > Filter Hooks > should remove all duplicate filter callbacks on removeFilter (memory leak fix)", async () => {
  const registry = createHookRegistry();

  const callback = (data: { value: number }) => {
    return { value: data.value + 1 };
  };

  // Register same callback twice
  registry.addFilter("test:filter-dup", callback);
  registry.addFilter("test:filter-dup", callback);

  // Both should execute (value + 1 + 1)
  const result1 = await registry.filter("test:filter-dup", { value: 5 });
  assertStrictEquals(result1.data.value, 7);

  // Remove once - should remove ALL instances
  registry.removeFilter("test:filter-dup", callback);

  // Should not transform anymore
  const result2 = await registry.filter("test:filter-dup", { value: 5 });
  assertStrictEquals(result2.data.value, 5);
});

test("Hook System > HookRegistry > Utility Methods > should check if event has handlers", () => {
  const registry = createHookRegistry();

  assertStrictEquals(registry.hasHandlers("test:exists"), false);

  registry.on("test:exists", () => {});
  assertStrictEquals(registry.hasHandlers("test:exists"), true);
});

test("Hook System > HookRegistry > Utility Methods > should count handlers for an event", () => {
  const registry = createHookRegistry();

  assertStrictEquals(registry.handlerCount("test:count"), 0);

  registry.on("test:count", () => {});
  registry.on("test:count", () => {});
  assertStrictEquals(registry.handlerCount("test:count"), 2);
});

test("Hook System > HookRegistry > Utility Methods > should return registered events", () => {
  const registry = createHookRegistry();

  registry.on("test:event1", () => {});
  registry.on("test:event2", () => {});

  const events = registry.getRegisteredEvents();
  assertArrayIncludes(events, ["test:event1"]);
  assertArrayIncludes(events, ["test:event2"]);
});

test("Hook System > HookRegistry > Utility Methods > should clear specific event handlers", async () => {
  const registry = createHookRegistry();
  let called = false;

  registry.on("test:clear", () => {
    called = true;
  });

  registry.clearEvent("test:clear");
  await registry.emit("test:clear", {});

  assertStrictEquals(called, false);
});

test("Hook System > HookRegistry > Utility Methods > should clear all handlers", () => {
  const registry = createHookRegistry();

  registry.on("test:clear1", () => {});
  registry.on("test:clear2", () => {});

  registry.clear();

  assertStrictEquals(registry.hasHandlers("test:clear1"), false);
  assertStrictEquals(registry.hasHandlers("test:clear2"), false);
});

test("Hook System > Hook Errors > should create HookExecutionError", () => {
  const originalError = new Error("Original");
  const error = new HookExecutionError(
    "test:event",
    "handler-1",
    originalError,
  );

  assertStrictEquals(error.name, "HookExecutionError");
  assertStrictEquals(error.event, "test:event");
  assertStrictEquals(error.handlerId, "handler-1");
  assertStrictEquals(error.originalError, originalError);
});

test("Hook System > Hook Errors > should create HookExecutionError with message containing event name", () => {
  const originalError = new Error("Original");
  const error = new HookExecutionError(
    "test:event",
    "handler-1",
    originalError,
  );

  // The error message should contain the event name
  const messageContainsEvent = error.message.includes("test:event");
  assertStrictEquals(messageContainsEvent, true);
});

test("Hook System > Global Registry > should export global hooks instance", async () => {
  const { hooks } = await import("../../hooks/index.ts");
  assertExists(hooks);
  assertStrictEquals(typeof hooks.on, "function");
  assertStrictEquals(typeof hooks.emit, "function");
});
