/**
 * @ferriqa/core - Configuration System
 *
 * Ferriqa configuration schema and validation using Zod
 */

import { z } from "zod";
import { loadEnvConfig } from "./env.ts";

/**
 * Server configuration schema
 */
export const ServerConfigSchema = z.object({
  port: z.number().int().min(1).max(65535).default(3000),
  host: z.string().default("localhost"),
  cors: z.object({
    enabled: z.boolean().default(true),
    origins: z.array(z.string()).default(["*"]),
  }),
});

/**
 * Database configuration schema
 */
export const DatabaseConfigSchema = z.object({
  type: z.enum(["sqlite", "postgresql", "mysql"]).default("sqlite"),
  url: z.string().default("./data.db"),
  poolSize: z.number().int().min(1).max(100).optional(),
  ssl: z.boolean().default(false),
});

/**
 * Authentication configuration schema
 */
export const AuthConfigSchema = z.object({
  enabled: z.boolean().default(true),
  jwtSecret: z.string().min(8).default("change-this-secret-in-production"),
  accessTokenExpiry: z.string().default("15m"),
  refreshTokenExpiry: z.string().default("7d"),
  providers: z.object({
    local: z.boolean().default(true),
    oauth: z.array(
      z.object({
        provider: z.enum(["google", "github", "discord"]),
        clientId: z.string(),
        clientSecret: z.string(),
      }),
    ),
  }),
});

/**
 * Media configuration schema
 */
export const MediaConfigSchema = z.object({
  enabled: z.boolean().default(true),
  storage: z.enum(["local", "s3", "gcs", "azure"]).default("local"),
  maxFileSize: z
    .number()
    .int()
    .max(100 * 1024 * 1024)
    .default(10 * 1024 * 1024), // 10MB default
  allowedTypes: z
    .array(z.string())
    .default(["image/*", "video/*", "application/pdf"]),
  local: z.object({
    path: z.string().default("./uploads"),
    publicUrl: z.string().default("/uploads"),
  }),
  s3: z.object({
    endpoint: z.string().optional(),
    region: z.string().default("us-east-1"),
    bucket: z.string().default(""),
    accessKeyId: z.string().optional(),
    secretAccessKey: z.string().optional(),
    publicUrl: z.string().optional(),
  }),
});

/**
 * Features configuration schema
 */
export const FeaturesConfigSchema = z.object({
  versioning: z.boolean().default(true),
  webhooks: z.boolean().default(false),
  caching: z.boolean().default(true),
  search: z.boolean().default(false),
  i18n: z.boolean().default(false),
  realtime: z.boolean().default(false),
});

/**
 * Log configuration schema
 */
export const LogConfigSchema = z.object({
  level: z.enum(["debug", "info", "warn", "error"]).default("info"),
  format: z.enum(["json", "pretty"]).default("pretty"),
  outputs: z.array(z.enum(["console", "file", "http"])).default(["console"]),
});

/**
 * Plugin reference schema - can be string id or object with config
 */
export const PluginReferenceSchema = z.union([
  z.string(),
  z.object({
    id: z.string(),
    config: z.record(z.string(), z.any()).default({}),
  }),
]);

/**
 * Main Ferriqa configuration schema
 */
export const FerriqaConfigSchema = z.object({
  name: z.string().min(1).max(100).default("Ferriqa App"),
  env: z
    .enum(["development", "staging", "production", "test"])
    .default("development"),

  server: ServerConfigSchema,
  database: DatabaseConfigSchema,
  auth: AuthConfigSchema,
  media: MediaConfigSchema,
  features: FeaturesConfigSchema,
  log: LogConfigSchema,

  plugins: z.array(PluginReferenceSchema).default([]),

  // Extension point for custom config
  custom: z.record(z.string(), z.any()).optional(),
});

/**
 * Type inference from schema
 */
export type FerriqaConfig = z.infer<typeof FerriqaConfigSchema>;
export type ServerConfig = z.infer<typeof ServerConfigSchema>;
export type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>;
export type AuthConfig = z.infer<typeof AuthConfigSchema>;
export type MediaConfig = z.infer<typeof MediaConfigSchema>;
export type FeaturesConfig = z.infer<typeof FeaturesConfigSchema>;
export type LogConfig = z.infer<typeof LogConfigSchema>;
export type PluginReference = z.infer<typeof PluginReferenceSchema>;

/**
 * Configuration validation result
 */
export interface ConfigValidationResult {
  success: boolean;
  config?: FerriqaConfig;
  errors?: z.ZodError;
}

/**
 * Validate configuration object against schema
 */
export function validateConfig(config: unknown): ConfigValidationResult {
  const result = FerriqaConfigSchema.safeParse(config);

  if (result.success) {
    return {
      success: true,
      config: result.data,
    };
  } else {
    return {
      success: false,
      errors: result.error,
    };
  }
}

/**
 * Define and validate Ferriqa configuration
 *
 * @example
 * ```ts
 * export default defineConfig({
 *   name: "My Blog",
 *   database: {
 *     type: "sqlite",
 *     url: "./blog.db",
 *   },
 *   plugins: ["seo", "analytics"],
 * });
 * ```
 */
export function defineConfig(config: Partial<FerriqaConfig>): FerriqaConfig {
  const result = validateConfig(config);

  if (!result.success) {
    const formattedErrors = result.errors?.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    throw new Error(`Configuration validation failed:\n${formattedErrors}`);
  }

  return result.config!;
}

/**
 * Load configuration from file path
 * Supports .ts, .js, .json, .yaml, .yml files
 * Automatically loads .env file and merges with config
 */
export async function loadConfig(
  configPath: string,
  options: {
    envFile?: string;
    loadEnv?: boolean;
  } = {},
): Promise<ConfigValidationResult> {
  const { envFile = ".env", loadEnv = true } = options;

  try {
    // Load .env file if enabled
    if (loadEnv) {
      const { loadEnvFile, applyEnv } = await import("./env.ts");
      const envVars = await loadEnvFile(envFile);
      applyEnv(envVars);
    }

    // Dynamic import for ESM compatibility
    const configModule = await import(configPath);
    const fileConfig = configModule.default || configModule;

    // Merge with environment variables
    const envConfig = loadEnvConfig();
    const mergedConfig = mergeConfigs(fileConfig, envConfig);

    return validateConfig(mergedConfig);
  } catch (error) {
    const issue: z.ZodIssue = {
      code: "custom",
      path: [],
      message: `Failed to load config from ${configPath}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };

    const zodError = new z.ZodError([]);
    (zodError as any).issues = [issue];

    return {
      success: false,
      errors: zodError,
    };
  }
}

/**
 * Merge multiple configuration objects
 * Later configs override earlier ones
 */
export function mergeConfigs(
  ...configs: Partial<FerriqaConfig>[]
): Partial<FerriqaConfig> {
  return configs.reduce((merged, config) => {
    return deepMerge(merged, config);
  }, {});
}

/**
 * Deep merge two objects
 */
function deepMerge<T extends Record<string, any>>(
  target: T,
  source: Partial<T>,
): T {
  const result: any = { ...target };

  for (const key in source) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key])
    ) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }

  return result;
}

// Re-export environment utilities
export {
  loadEnvConfig,
  loadEnvFile,
  parseEnvFile,
  applyEnv,
  getEnvironment,
  isProduction,
  isDevelopment,
  isTest,
  ENV_MAPPING,
} from "./env.ts";
