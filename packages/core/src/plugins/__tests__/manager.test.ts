/**
 * @ferriqa/core - Plugin Manager Tests
 */

import { test } from "@cross/test";
import { assertStrictEquals } from "@std/assert";
import { PluginManager } from "../manager.ts";
import { HookRegistry } from "../../hooks/registry.ts";
import { FieldRegistry } from "../../fields/registry.ts";
import { type FerriqaPlugin } from "../types.ts";
import { z } from "zod";

const createManager = () => {
  const hooks = new HookRegistry();
  const fields = new FieldRegistry();
  return new PluginManager(hooks, fields);
};

test("PluginManager > should load a simple plugin", async () => {
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
      assertStrictEquals(ctx.manifest.id, "dummy");
    },
  };

  await manager.load(dummyPlugin);

  assertStrictEquals(initCalled, true);
  const instance = manager.getPlugin("dummy");
  assertStrictEquals(instance?.state, "active");
});

test("PluginManager > should validate plugin config schema", async () => {
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

  // Fail validation - using rejects
  let threw = false;
  try {
    await manager.load(configPlugin, { wrong: "key" });
  } catch {
    threw = true;
  }
  assertStrictEquals(threw, true);

  // Pass validation
  await manager.load(configPlugin, { apiKey: "test-key" });
  const instance = manager.getPlugin("config-test");
  assertStrictEquals(instance?.context.config.apiKey, "test-key");
});

test("PluginManager > should handle plugin lifecycle errors", async () => {
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

  // The plugin should throw during load
  let threw = false;
  try {
    await manager.load(errorPlugin);
  } catch (e) {
    threw = true;
    // Error should contain "Init Failed"
    assertStrictEquals(String(e).includes("Init Failed"), true);
  }
  assertStrictEquals(threw, true);

  const instance = manager.getPlugin("error-plugin");
  assertStrictEquals(instance?.state, "error");
});

test("PluginManager > should unload a plugin", async () => {
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

  assertStrictEquals(disableCalled, true);
  assertStrictEquals(manager.getPlugin("lifecycle"), undefined);
});
