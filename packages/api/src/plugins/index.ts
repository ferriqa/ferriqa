/**
 * @ferriqa/api - Plugin System Initialization
 */

import { PluginManager, hooks, globalFieldRegistry } from "@ferriqa/core";
import { globalStorageRegistry } from "../media/registry.ts";

// Create global PluginManager for the API
export const pluginManager = new PluginManager(hooks, globalFieldRegistry, {
  storage: globalStorageRegistry,
});

/**
 * Result of plugin initialization
 */
export interface PluginInitResult {
  loaded: string[];
  failed: Array<{ id: string; error: string }>;
}

/**
 * Plugin configuration entry - can be a simple string (ID) or a full config object.
 */
export type PluginConfiguration =
  | string
  | { id: string; path?: string; config?: Record<string, unknown> };

/**
 * Initialize the plugin system and load enabled plugins.
 */
export async function initPlugins(
  configPlugins: PluginConfiguration[] = [],
): Promise<PluginInitResult> {
  console.info("[Plugins] Initializing plugin system...");
  const result: PluginInitResult = {
    loaded: [],
    failed: [],
  };

  for (const pluginConfig of configPlugins) {
    const pluginId =
      typeof pluginConfig === "string" ? pluginConfig : pluginConfig.id;

    try {
      if (typeof pluginConfig === "string") {
        await loadPluginById(pluginConfig);
      } else if (typeof pluginConfig === "object") {
        await loadPluginFromConfig(pluginId, pluginConfig);
      }
      result.loaded.push(pluginId);
    } catch (error) {
      const message = (error as Error).message;
      console.error(
        `[Plugins] Failed to load plugin "${pluginId}": ${message}`,
      );
      result.failed.push({ id: pluginId, error: message });
    }
  }

  console.info(
    `[Plugins] Initialization complete. ${result.loaded.length} loaded, ${result.failed.length} failed.`,
  );
  return result;
}

async function loadPluginById(pluginId: string) {
  // Mapping of built-in IDs to their implementation paths
  // Note: We avoid .ts extension here to be more bundler-friendly
  const builtins: Record<string, string> = {
    seo: "../../../plugins/src/builtins/seo",
  };

  const path = builtins[pluginId];
  if (path) {
    const module = await import(path);
    const plugin = module.seoPlugin || module.default;
    if (!plugin) {
      throw new Error(`Plugin export not found in ${path}`);
    }
    await pluginManager.load(plugin);
  } else {
    throw new Error(`Unknown built-in plugin: ${pluginId}`);
  }
}

async function loadPluginFromConfig(
  pluginId: string,
  config: { path?: string; config?: Record<string, unknown> },
) {
  // Future: Load from custom path or NPM
  if (config.path) {
    const plugin = await import(config.path);
    await pluginManager.load(plugin.default || plugin, config.config || {});
  } else {
    // Fallback to ID-based loading with extra config
    await loadPluginById(pluginId);
    const instance = pluginManager.getPlugin(pluginId);
    if (instance && config.config) {
      // If we need to re-initialize with config, the PluginManager
      // already handles config during load(), but here we might
      // need to handle dynamic reconfiguration if supported.
    }
  }
}
