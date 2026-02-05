/**
 * @ferriqa/core - Plugin Discovery
 */

import { type FerriqaPlugin } from "./types.ts";

export class PluginDiscovery {
  /**
   * Discovery strategy: Load from a file path
   * Supports both default exports and named exports if tagged correctly.
   */
  async discoverFromPath(path: string): Promise<FerriqaPlugin> {
    try {
      const module = await import(path);
      const plugin = module.default || module.plugin || module;

      if (!this.isValidPlugin(plugin)) {
        throw new Error(`Module at ${path} is not a valid Ferriqa plugin.`);
      }

      return plugin as FerriqaPlugin;
    } catch (error) {
      throw new Error(
        `Failed to discover plugin at ${path}: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Helper to validate plugin structure
   */
  private isValidPlugin(plugin: any): plugin is FerriqaPlugin {
    return (
      plugin &&
      typeof plugin === "object" &&
      plugin.manifest &&
      typeof plugin.manifest.id === "string" &&
      typeof plugin.manifest.name === "string" &&
      typeof plugin.manifest.version === "string"
    );
  }
}
