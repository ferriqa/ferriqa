import {
  PluginManager,
  hooks,
  globalFieldRegistry,
  PluginConfigService,
} from "@ferriqa/core";
import { globalStorageRegistry } from "../media/registry.ts";
import { db } from "../db.ts";

// Create global PluginManager for the API
export const pluginManager = new PluginManager(hooks, globalFieldRegistry, {
  storage: globalStorageRegistry,
});

// Create config service
export const pluginConfigService = new PluginConfigService(db);

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
  | {
    id: string;
    path?: string;
    config?: Record<string, unknown>;
    environments?: {
      development?: Record<string, unknown>;
      production?: Record<string, unknown>;
      test?: Record<string, unknown>;
    };
  };

function getCurrentEnvironment(): string {
  if (typeof process !== "undefined" && process.env) {
    return process.env.NODE_ENV || "development";
  }
  return "development";
}

/**
 * Initialize the plugin system and load enabled plugins.
 */
export async function initPlugins(
  configPlugins: PluginConfiguration[] = [],
  options: { loadConfigFromDB?: boolean } = {},
): Promise<PluginInitResult> {
  console.info("[Plugins] Initializing plugin system...");
  const result: PluginInitResult = {
    loaded: [],
    failed: [],
  };

  const env = getCurrentEnvironment();

  for (const pluginConfig of configPlugins) {
    const pluginId =
      typeof pluginConfig === "string" ? pluginConfig : pluginConfig.id;

    try {
      let finalConfig: Record<string, unknown> = {};

      // 1. Load from DB if requested (Phase 3)
      if (options.loadConfigFromDB) {
        const dbConfig = await pluginConfigService.getConfig(pluginId, env);
        if (dbConfig) {
          finalConfig = { ...dbConfig };
        }
      }

      // 2. Base config from code
      if (typeof pluginConfig === "object" && pluginConfig.config) {
        finalConfig = { ...finalConfig, ...pluginConfig.config };
      }

      // 3. Environment overrides (Phase 5)
      if (typeof pluginConfig === "object" && pluginConfig.environments) {
        const envConfig =
          (pluginConfig.environments as any)[env] ||
          (pluginConfig.environments as any)["default"];
        if (envConfig) {
          finalConfig = { ...finalConfig, ...envConfig };
        }
      }

      // 4. Load or Reconfigure (Phase 2 integration)
      const existing = pluginManager.getPlugin(pluginId);
      if (existing) {
        await pluginManager.reconfigure(pluginId, finalConfig);
      } else {
        if (typeof pluginConfig === "string") {
          await loadPluginById(pluginId, finalConfig);
        } else {
          await loadPluginFromConfig(pluginId, {
            ...pluginConfig,
            config: finalConfig,
          });
        }
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

async function loadPluginById(
  pluginId: string,
  config: Record<string, unknown> = {},
) {
  // Mapping of built-in IDs to their implementation paths
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
    await pluginManager.load(plugin, config);
  } else {
    throw new Error(`Unknown built-in plugin: ${pluginId}`);
  }
}

async function loadPluginFromConfig(
  pluginId: string,
  config: { path?: string; config?: Record<string, unknown> },
) {
  if (config.path) {
    const pluginModule = await import(config.path);
    const plugin = pluginModule.default || pluginModule;
    await pluginManager.load(plugin, config.config || {});
  } else {
    await loadPluginById(pluginId, config.config || {});
  }
}
