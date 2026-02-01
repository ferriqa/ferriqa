/**
 * @ferriqa/core - Hook System Unit Tests
 *
 * Tests for the hook registry and hook execution.
 */

import { describe, it, expect } from "../../testing/index.ts";
import {
  HookRegistry,
  createHookRegistry,
  HookExecutionError,
} from "../../hooks/index.ts";

describe("Hook System", () => {
  describe("HookRegistry", () => {
    describe("Action Hooks", () => {
      it("should register and emit action hooks", async () => {
        const registry = createHookRegistry();
        let called = false;

        registry.on("test:event", () => {
          called = true;
        });

        await registry.emit("test:event", {});
        expect(called).toBe(true);
      });

      it("should support async action hooks", async () => {
        const registry = createHookRegistry();
        let called = false;

        registry.on("test:async", async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          called = true;
        });

        await registry.emit("test:async", {});
        expect(called).toBe(true);
      });

      it("should execute multiple handlers", async () => {
        const registry = createHookRegistry();
        const calls: string[] = [];

        registry.on("test:multi", () => {
          calls.push("first");
        });

        registry.on("test:multi", () => {
          calls.push("second");
        });

        await registry.emit("test:multi", {});
        expect(calls).toContain("first");
        expect(calls).toContain("second");
        expect(calls.length).toBe(2);
      });

      it("should support hook priority", async () => {
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
        expect(order[0]).toBe("high");
        expect(order[2]).toBe("low");
      });

      it("should support once hooks", async () => {
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

        expect(count).toBe(1);
      });

      it("should return hook result with execution count", async () => {
        const registry = createHookRegistry();

        registry.on("test:result", () => {});
        registry.on("test:result", () => {});

        const result = await registry.emit("test:result", {});
        expect(result.success).toBe(true);
        expect(result.executed).toBe(2);
        expect(result.errors.length).toBe(0);
      });

      it("should handle errors in action hooks", async () => {
        const registry = createHookRegistry();

        registry.on("test:error", () => {
          throw new Error("Test error");
        });

        const result = await registry.emit("test:error", {});
        expect(result.success).toBe(false);
        expect(result.errors.length).toBe(1);
      });

      it("should support error strategy continue", async () => {
        const registry = createHookRegistry();
        let secondCalled = false;

        registry.on("test:continue", () => {
          throw new Error("First error");
        });

        registry.on("test:continue", () => {
          secondCalled = true;
        });

        await registry.emit("test:continue", {}, { errorStrategy: "continue" });
        expect(secondCalled).toBe(true);
      });

      it("should stop on first error when errorStrategy is 'stop'", async () => {
        const registry = createHookRegistry();
        let secondCalled = false;

        registry.on("test:stop", () => {
          throw new Error("First error - should stop");
        });

        registry.on("test:stop", () => {
          secondCalled = true;
        });

        // When errorStrategy is "stop", emit should throw the error
        let errorThrown = false;
        try {
          await registry.emit("test:stop", {}, { errorStrategy: "stop" });
        } catch (error: unknown) {
          errorThrown = true;
          expect((error as Error).message).toBe("First error - should stop");
        }

        expect(errorThrown).toBe(true);
        expect(secondCalled).toBe(false); // Second handler should not be called
      });

      it("should unsubscribe handlers", async () => {
        const registry = createHookRegistry();
        let count = 0;

        const unsubscribe = registry.on("test:unsub", () => {
          count++;
        });

        await registry.emit("test:unsub", {});
        unsubscribe();
        await registry.emit("test:unsub", {});

        expect(count).toBe(1);
      });

      it("should remove all duplicate callbacks on unsubscribe (memory leak fix)", async () => {
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
        expect(count).toBe(2);

        // Unsubscribe once - should remove ALL instances
        registry.off("test:duplicate", callback);

        // Reset count
        count = 0;

        // Should not fire anymore
        await registry.emit("test:duplicate", {});
        expect(count).toBe(0);
      });
    });

    describe("Filter Hooks", () => {
      it("should transform data through filter pipeline", async () => {
        const registry = createHookRegistry();

        registry.addFilter("test:filter", (data: { value: number }) => {
          return { value: data.value * 2 };
        });

        const result = await registry.filter("test:filter", { value: 5 });
        expect(result.data.value).toBe(10);
        expect(result.success).toBe(true);
      });

      it("should chain multiple filters", async () => {
        const registry = createHookRegistry();

        registry.addFilter("test:chain", (data: { value: number }) => {
          return { value: data.value + 1 };
        });

        registry.addFilter("test:chain", (data: { value: number }) => {
          return { value: data.value * 2 };
        });

        const result = await registry.filter("test:chain", { value: 5 });
        expect(result.data.value).toBe(12); // (5 + 1) * 2
      });

      it("should support async filters", async () => {
        const registry = createHookRegistry();

        registry.addFilter("test:async", async (data: { value: number }) => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return { value: data.value + 10 };
        });

        const result = await registry.filter("test:async", { value: 5 });
        expect(result.data.value).toBe(15);
      });

      it("should handle errors in filter hooks", async () => {
        const registry = createHookRegistry();

        registry.addFilter("test:filter-error", () => {
          throw new Error("Filter error");
        });

        const result = await registry.filter("test:filter-error", { value: 5 });
        expect(result.success).toBe(false);
        expect(result.errors.length).toBe(1);
      });

      it("should remove all duplicate filter callbacks on removeFilter (memory leak fix)", async () => {
        const registry = createHookRegistry();

        const callback = (data: { value: number }) => {
          return { value: data.value + 1 };
        };

        // Register same callback twice
        registry.addFilter("test:filter-dup", callback);
        registry.addFilter("test:filter-dup", callback);

        // Both should execute (value + 1 + 1)
        const result1 = await registry.filter("test:filter-dup", { value: 5 });
        expect(result1.data.value).toBe(7);

        // Remove once - should remove ALL instances
        registry.removeFilter("test:filter-dup", callback);

        // Should not transform anymore
        const result2 = await registry.filter("test:filter-dup", { value: 5 });
        expect(result2.data.value).toBe(5);
      });
    });

    describe("Utility Methods", () => {
      it("should check if event has handlers", () => {
        const registry = createHookRegistry();

        expect(registry.hasHandlers("test:exists")).toBe(false);

        registry.on("test:exists", () => {});
        expect(registry.hasHandlers("test:exists")).toBe(true);
      });

      it("should count handlers for an event", () => {
        const registry = createHookRegistry();

        expect(registry.handlerCount("test:count")).toBe(0);

        registry.on("test:count", () => {});
        registry.on("test:count", () => {});
        expect(registry.handlerCount("test:count")).toBe(2);
      });

      it("should return registered events", () => {
        const registry = createHookRegistry();

        registry.on("test:event1", () => {});
        registry.on("test:event2", () => {});

        const events = registry.getRegisteredEvents();
        expect(events).toContain("test:event1");
        expect(events).toContain("test:event2");
      });

      it("should clear specific event handlers", async () => {
        const registry = createHookRegistry();
        let called = false;

        registry.on("test:clear", () => {
          called = true;
        });

        registry.clearEvent("test:clear");
        await registry.emit("test:clear", {});

        expect(called).toBe(false);
      });

      it("should clear all handlers", () => {
        const registry = createHookRegistry();

        registry.on("test:clear1", () => {});
        registry.on("test:clear2", () => {});

        registry.clear();

        expect(registry.hasHandlers("test:clear1")).toBe(false);
        expect(registry.hasHandlers("test:clear2")).toBe(false);
      });
    });
  });

  describe("Hook Errors", () => {
    it("should create HookExecutionError", () => {
      const originalError = new Error("Original");
      const error = new HookExecutionError(
        "test:event",
        "handler-1",
        originalError,
      );

      expect(error.name).toBe("HookExecutionError");
      expect(error.event).toBe("test:event");
      expect(error.handlerId).toBe("handler-1");
      expect(error.originalError).toBe(originalError);
      expect(error.message).toContain("test:event");
    });
  });

  describe("Global Registry", () => {
    it("should export global hooks instance", async () => {
      const { hooks } = await import("../../hooks/index.js");
      expect(hooks).toBeDefined();
      expect(typeof hooks.on).toBe("function");
      expect(typeof hooks.emit).toBe("function");
    });
  });
});
