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
  private plugins = new Map<string, PluginInstance>();

  constructor(
    private hooks: IHookRegistry,
    private fields: FieldRegistry,
    private registries: Record<string, any> = {},
  ) {}

  /**
   * Load and initialize a plugin
   */
  async load(
    plugin: FerriqaPlugin,
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

    // 3. Validate Configuration
    if (manifest.configSchema) {
      const configResult = manifest.configSchema.safeParse(config);
      if (!configResult.success) {
        throw new Error(
          `Invalid configuration for plugin "${manifest.id}": ${configResult.error.message}`,
        );
      }
    }

    // 4. Create Context
    const context: PluginContext = {
      manifest,
      config,
      hooks: this.hooks,
      registries: {
        fields: this.fields,
        ...this.registries,
      },
      logger: this.createLogger(manifest.id),
    };

    const instance: PluginInstance = {
      plugin,
      context,
      state: "loading",
      startedAt: Date.now(),
    };

    this.plugins.set(manifest.id, instance);

    try {
      // 5. Initialize
      if (plugin.init) {
        instance.state = "initializing";
        await plugin.init(context);
      }

      // 6. Enable
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
    for (const instance of this.plugins.values()) {
      instance.context.registries[name] = registry;
    }
  }

  getPlugin(pluginId: string): PluginInstance | undefined {
    return this.plugins.get(pluginId);
  }

  listPlugins(): PluginInstance[] {
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
