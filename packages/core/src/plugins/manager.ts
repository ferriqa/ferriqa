/**
 * @ferriqa/core - Plugin Manager
 *
 * Orchestrates plugin lifecycles, dependencies, and configuration.
 */

import {
  type FerriqaPlugin,
  type PluginInstance,
  type PluginContext,
  PluginManifestSchema,
} from "./types.ts";
import type { IHookRegistry } from "../hooks/types.ts";
import type { FieldRegistry } from "../fields/registry.ts";

export class PluginManager {
  private plugins = new Map<string, PluginInstance<any>>();

  constructor(
    private hooks: IHookRegistry,
    private fields: FieldRegistry,
    private registries: Record<string, any> = {},
  ) { }

  /**
   * Load and initialize a plugin
   */
  async load<TConfig extends Record<string, unknown> = any>(
    plugin: FerriqaPlugin<TConfig>,
    config: Record<string, unknown> = {},
  ): Promise<void> {
    const { manifest } = plugin;

    // 1. Validate Manifest
    const manifestResult = PluginManifestSchema.safeParse(manifest);
    if (!manifestResult.success) {
      throw new Error(
        `Invalid plugin manifest for ${manifest.id}: ${manifestResult.error.message}`,
      );
    }

    // 2. Check for duplicates
    if (this.plugins.has(manifest.id)) {
      throw new Error(`Plugin with ID "${manifest.id}" is already loaded.`);
    }

    let finalConfig = { ...config };

    // 3. Handle Migrations
    const savedVersion = finalConfig.__version as string | undefined;
    if (savedVersion && manifest.migrations && savedVersion !== manifest.version) {
      const logger = this.createLogger(manifest.id);
      logger.info(`Migrating configuration from ${savedVersion} to ${manifest.version}...`);

      for (const migration of manifest.migrations) {
        // Simple linear migration for now
        // TODO: Implement proper version range matching if needed
        if (migration.from === savedVersion) {
          finalConfig = { ...migration.migrate(finalConfig) };
          logger.debug(`Applied migration from ${migration.from} to ${migration.to}`);
        }
      }
    }

    // Set current version in config if not present or changed
    finalConfig.__version = manifest.version;

    // 4. Validate Configuration
    if (manifest.configSchema) {
      const configResult = manifest.configSchema.safeParse(finalConfig);
      if (!configResult.success) {
        throw new Error(
          `Invalid configuration for plugin "${manifest.id}": ${configResult.error.message}`,
        );
      }
      finalConfig = configResult.data as any;
    }

    // 5. Create Context
    const context: PluginContext<TConfig> = {
      manifest,
      config: finalConfig as TConfig,
      hooks: this.hooks,
      registries: {
        fields: this.fields,
        ...this.registries,
      },
      logger: this.createLogger(manifest.id),
    };

    const instance: PluginInstance<TConfig> = {
      plugin,
      context,
      state: "loading",
      startedAt: Date.now(),
    };

    this.plugins.set(manifest.id, instance);

    try {
      // 6. Initialize
      if (plugin.init) {
        instance.state = "initializing";
        await plugin.init(context);
      }

      // 7. Enable
      if (plugin.enable) {
        await plugin.enable(context);
      }

      instance.state = "active";

      // Notify via hooks
      await this.hooks.emit("plugin:loaded", { pluginId: manifest.id });
    } catch (error) {
      instance.state = "error";
      instance.error =
        error instanceof Error ? error : new Error(String(error));
      this.createLogger(manifest.id).error(
        `Failed to load plugin: ${instance.error.message}`,
      );
      throw error;
    }
  }

  /**
   * Update plugin configuration dynamically
   */
  async reconfigure(
    pluginId: string,
    newConfig: Record<string, unknown>,
  ): Promise<void> {
    const instance = this.plugins.get(pluginId);
    if (!instance) {
      throw new Error(`Plugin "${pluginId}" not found.`);
    }

    // 1. Validate New Configuration
    const mergedConfig = { ...instance.context.config, ...newConfig };
    if (instance.plugin.manifest.configSchema) {
      const configResult =
        instance.plugin.manifest.configSchema.safeParse(mergedConfig);
      if (!configResult.success) {
        throw new Error(
          `Invalid configuration for reconfiguration of "${pluginId}": ${configResult.error.message}`,
        );
      }
      instance.context.config = configResult.data;
    } else {
      instance.context.config = mergedConfig;
    }

    // 2. Call lifecycle hook
    if (instance.plugin.reconfigure) {
      await instance.plugin.reconfigure(instance.context);
    }

    // 3. Notify via hooks
    await this.hooks.emit("plugin:reconfigured", {
      pluginId,
      config: instance.context.config,
    });
  }

  /**
   * Unload and cleanup a plugin
   */
  async unload(pluginId: string): Promise<void> {
    const instance = this.plugins.get(pluginId);
    if (!instance) return;

    try {
      if (instance.state === "active") {
        instance.state = "disabling";
        if (instance.plugin.disable) {
          await instance.plugin.disable(instance.context);
        }
      }

      if (instance.plugin.destroy) {
        await instance.plugin.destroy(instance.context);
      }

      instance.state = "disabled";
      this.plugins.delete(pluginId);

      await this.hooks.emit("plugin:unloaded", { pluginId });
    } catch (error) {
      instance.state = "error";
      instance.error =
        error instanceof Error ? error : new Error(String(error));
      throw error;
    }
  }

  /**
   * Register an additional registry (e.g., StorageRegistry)
   */
  registerRegistry(name: string, registry: any): void {
    this.registries[name] = registry;
    // Update all existing plugin contexts
    for (const instance of Array.from(this.plugins.values())) {
      instance.context.registries[name] = registry;
    }
  }

  getPlugin(pluginId: string): PluginInstance<any> | undefined {
    return this.plugins.get(pluginId);
  }

  listPlugins(): PluginInstance<any>[] {
    return Array.from(this.plugins.values());
  }

  private createLogger(pluginId: string) {
    const prefix = `[Plugin:${pluginId}]`;
    return {
      info: (msg: string, ...args: any[]) =>
        console.info(`${prefix} ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) =>
        console.warn(`${prefix} ${msg}`, ...args),
      error: (msg: string, ...args: any[]) =>
        console.error(`${prefix} ${msg}`, ...args),
      debug: (msg: string, ...args: any[]) =>
        console.debug(`${prefix} ${msg}`, ...args),
    };
  }
}
