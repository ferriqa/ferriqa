/**
 * @ferriqa/core - Plugin Manager Tests
 */

import { expect, test, describe } from "bun:test";
import { PluginManager } from "../manager.ts";
import { HookRegistry } from "../../hooks/registry.ts";
import { FieldRegistry } from "../../fields/registry.ts";
import { type FerriqaPlugin } from "../types.ts";
import { z } from "zod";

describe("PluginManager", () => {
  const createManager = () => {
    const hooks = new HookRegistry();
    const fields = new FieldRegistry();
    return new PluginManager(hooks, fields);
  };

  test("should load a simple plugin", async () => {
    const manager = createManager();
    let initCalled = false;

    const dummyPlugin: FerriqaPlugin = {
      manifest: {
        id: "dummy",
        name: "Dummy Plugin",
        version: "1.0.0",
      },
      init: async (ctx) => {
        initCalled = true;
        expect(ctx.manifest.id).toBe("dummy");
      },
    };

    await manager.load(dummyPlugin);

    expect(initCalled).toBe(true);
    const instance = manager.getPlugin("dummy");
    expect(instance?.state).toBe("active");
  });

  test("should validate plugin config schema", async () => {
    const manager = createManager();

    const configPlugin: FerriqaPlugin = {
      manifest: {
        id: "config-test",
        name: "Config Test",
        version: "1.0.0",
        configSchema: z.object({
          apiKey: z.string(),
        }),
      },
    };

    // Fail validation
    await expect(
      manager.load(configPlugin, { wrong: "key" }),
    ).rejects.toThrow();

    // Pass validation
    await manager.load(configPlugin, { apiKey: "test-key" });
    const instance = manager.getPlugin("config-test");
    expect(instance?.context.config.apiKey).toBe("test-key");
  });

  test("should handle plugin lifecycle errors", async () => {
    const manager = createManager();

    const errorPlugin: FerriqaPlugin = {
      manifest: {
        id: "error-plugin",
        name: "Error Plugin",
        version: "1.0.0",
      },
      init: () => {
        throw new Error("Init Failed");
      },
    };

    await expect(manager.load(errorPlugin)).rejects.toThrow("Init Failed");
    const instance = manager.getPlugin("error-plugin");
    expect(instance?.state).toBe("error");
  });

  test("should unload a plugin", async () => {
    const manager = createManager();
    let disableCalled = false;

    const lifecyclePlugin: FerriqaPlugin = {
      manifest: {
        id: "lifecycle",
        name: "Lifecycle",
        version: "1.0.0",
      },
      disable: () => {
        disableCalled = true;
      },
    };

    await manager.load(lifecyclePlugin);
    await manager.unload("lifecycle");

    expect(disableCalled).toBe(true);
    expect(manager.getPlugin("lifecycle")).toBeUndefined();
  });
});
