/**
 * Plugin Handlers
 *
 * RESTful API handlers for Plugin operations
 */

import type { Context } from "hono";
import { pluginManager, pluginConfigService } from "../plugins/index.ts";

interface PluginInstance {
  manifest: {
    id: string;
    name: string;
    description?: string;
    version: string;
    author?: string;
  };
  config: Record<string, unknown>;
}

export function pluginListHandler() {
  return async (c: Context) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const plugins = pluginManager.listPlugins() as any[];

    const pluginData = plugins.map((plugin: any) => ({
      id: plugin.plugin?.manifest?.id || "unknown",
      name: plugin.plugin?.manifest?.name || "Unknown Plugin",
      description: plugin.plugin?.manifest?.description,
      version: plugin.plugin?.manifest?.version || "0.0.0",
      author: plugin.plugin?.manifest?.author,
      isEnabled: plugin.state === "started",
      config: plugin.context?.config || {},
    }));

    return c.json({
      data: pluginData,
      pagination: {
        page: 1,
        limit: 50,
        total: pluginData.length,
        totalPages: 1,
      },
    });
  };
}

export function pluginGetHandler() {
  return async (c: Context) => {
    const { id } = c.req.param();

    const plugin = pluginManager.getPlugin(id) as PluginInstance | undefined;

    if (!plugin) {
      return c.json({ error: "Plugin not found" }, 404);
    }

    return c.json({
      data: {
        id: plugin.manifest.id,
        name: plugin.manifest.name,
        description: plugin.manifest.description,
        version: plugin.manifest.version,
        author: plugin.manifest.author,
        isEnabled: true,
        config: plugin.config,
      },
    });
  };
}
