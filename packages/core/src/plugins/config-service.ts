/**
 * @ferriqa/core - Plugin Configuration Service
 * Phase 3: Config Persistence
 */

import type { DatabaseAdapter } from "../../../adapters-db/src/types.ts";

export interface PluginConfigRecord {
  plugin_id: string;
  config: Record<string, unknown>;
  environment?: string;
  updated_at: number;
}

export class PluginConfigService {
  constructor(private db: DatabaseAdapter) {}

  /**
   * Get plugin configuration from database
   */
  async getConfig(
    pluginId: string,
    env?: string,
  ): Promise<Record<string, unknown> | null> {
    const result = await this.db.query<{ config: string }>(
      "SELECT config FROM plugin_configs WHERE plugin_id = ? AND (environment = ? OR environment IS NULL) ORDER BY environment DESC LIMIT 1",
      [pluginId, env || null],
    );

    if (result.rows.length === 0) {
      return null;
    }

    try {
      return JSON.parse(result.rows[0].config);
    } catch (error) {
      console.error(`Failed to parse config for plugin "${pluginId}":`, error);
      return null;
    }
  }

  /**
   * Save plugin configuration to database
   */
  async saveConfig(
    pluginId: string,
    config: Record<string, unknown>,
    env?: string,
  ): Promise<void> {
    const now = Date.now();
    const configJson = JSON.stringify(config);

    // Using primitive SQL for SQLite ON CONFLICT
    // NOTE: This assumes SQLite or an adapter that supports this syntax
    await this.db.execute(
      `INSERT INTO plugin_configs (plugin_id, config, environment, updated_at, created_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(plugin_id) DO UPDATE SET
         config = excluded.config,
         environment = excluded.environment,
         updated_at = excluded.updated_at`,
      [pluginId, configJson, env || null, now, now],
    );
  }

  /**
   * Delete plugin configuration from database
   */
  async deleteConfig(pluginId: string): Promise<void> {
    await this.db.execute("DELETE FROM plugin_configs WHERE plugin_id = ?", [
      pluginId,
    ]);
  }

  /**
   * List all plugin configurations
   */
  async listConfigs(env?: string): Promise<PluginConfigRecord[]> {
    const result = await this.db.query<{
      plugin_id: string;
      config: string;
      environment: string;
      updated_at: number;
    }>(
      "SELECT plugin_id, config, environment, updated_at FROM plugin_configs WHERE environment = ? OR environment IS NULL",
      [env || null],
    );

    return result.rows.map((row) => ({
      plugin_id: row.plugin_id,
      config: JSON.parse(row.config),
      environment: row.environment,
      updated_at: row.updated_at,
    }));
  }
}
