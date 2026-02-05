/**
 * @ferriqa/core - Plugin System Types
 */

import { z } from "zod";
import type { IHookRegistry } from "../hooks/types.ts";
import type { FieldRegistry } from "../fields/registry.ts";

/**
 * Plugin Migration definition
 */
export interface PluginMigration<TConfig = any> {
  from: string;
  to: string;
  migrate: (oldConfig: any) => TConfig;
}

/**
 * Plugin Manifest - Defines plugin metadata and requirements
 */
export const PluginManifestSchema = z.object({
  id: z
    .string()
    .describe("Unique plugin identifier (e.g., 'seo', 'analytics')"),
  name: z.string().describe("Display name of the plugin"),
  version: z.string().describe("Semver version string"),
  description: z.string().optional(),
  author: z.string().optional(),
  license: z.string().optional(),

  // Dependencies
  dependencies: z
    .array(z.string())
    .optional()
    .describe("IDs of other required plugins"),
  incompatible: z
    .array(z.string())
    .optional()
    .describe("IDs of conflicting plugins"),

  // Runtime requirements
  engines: z
    .object({
      ferriqa: z.string().optional(),
      bun: z.string().optional(),
      node: z.string().optional(),
      deno: z.string().optional(),
    })
    .optional(),

  // Configuration schema
  configSchema: z
    .any()
    .optional()
    .describe("Zod schema for plugin configuration"),
});

export interface PluginManifest<TConfig = any>
  extends z.infer<typeof PluginManifestSchema> {
  configSchema?: z.ZodType<TConfig>;
  migrations?: PluginMigration<TConfig>[];
}

/**
 * Plugin Lifecycle States
 */
export type PluginState =
  | "loading" // Initial state
  | "initializing" // Running init()
  | "active" // Fully loaded and enabled
  | "disabling" // Running disable()
  | "disabled" // Loaded but inactive
  | "error"; // Failed to load or initialize

/**
 * Plugin Context - APIs available to plugins during lifecycle
 */
export interface PluginContext<
  TConfig = Record<string, unknown>,
> {
  manifest: PluginManifest<TConfig>;
  config: TConfig;
  hooks: IHookRegistry;
  registries: {
    fields: FieldRegistry;
    // These will be expanded as we add more registries (storage, auth, etc.)
    [key: string]: unknown;
  };
  logger: {
    info(message: string, ...args: unknown[]): void;
    warn(message: string, ...args: unknown[]): void;
    error(message: string, ...args: unknown[]): void;
    debug(message: string, ...args: unknown[]): void;
  };
}

/**
 * Ferriqa Plugin Interface
 */
export interface FerriqaPlugin<
  TConfig = Record<string, unknown>,
> {
  manifest: PluginManifest<TConfig>;

  /**
   * Called when plugin is first loaded. Use for registration and setup.
   */
  init?(context: PluginContext<TConfig>): Promise<void> | void;

  /**
   * Called when plugin is enabled.
   */
  enable?(context: PluginContext<TConfig>): Promise<void> | void;

  /**
   * Called when plugin configuration is updated.
   */
  reconfigure?(context: PluginContext<TConfig>): Promise<void> | void;

  /**
   * Called when plugin is disabled.
   */
  disable?(context: PluginContext<TConfig>): Promise<void> | void;

  /**
   * Called when plugin is being removed.
   */
  destroy?(context: PluginContext<TConfig>): Promise<void> | void;
}

/**
 * Internal Plugin Instance
 */
export interface PluginInstance<
  TConfig = Record<string, unknown>,
> {
  plugin: FerriqaPlugin<TConfig>;
  context: PluginContext<TConfig>;
  state: PluginState;
  error?: Error;
  startedAt: number;
}
