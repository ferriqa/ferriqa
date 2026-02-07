/**
 * @ferriqa/core - Environment-based Configuration
 *
 * Load environment variables and merge with config
 * Supports .env files and environment variable mapping
 */

// @ts-ignore - Bun is a global runtime
declare const Bun: any;

import type { FerriqaConfig } from "./index.ts";

/**
 * Environment variable mapping
 * Maps environment variables to config paths
 */
export const ENV_MAPPING: Record<string, string> = {
  // Server
  PORT: "server.port",
  HOST: "server.host",
  CORS_ENABLED: "server.cors.enabled",
  CORS_ORIGINS: "server.cors.origins",

  // Database
  DATABASE_TYPE: "database.type",
  DATABASE_URL: "database.url",
  DATABASE_POOL_SIZE: "database.poolSize",
  DATABASE_SSL: "database.ssl",

  // Auth
  AUTH_ENABLED: "auth.enabled",
  JWT_SECRET: "auth.jwtSecret",
  ACCESS_TOKEN_EXPIRY: "auth.accessTokenExpiry",
  REFRESH_TOKEN_EXPIRY: "auth.refreshTokenExpiry",

  // Media
  MEDIA_ENABLED: "media.enabled",
  MEDIA_STORAGE: "media.storage",
  MEDIA_MAX_FILE_SIZE: "media.maxFileSize",
  MEDIA_ALLOWED_TYPES: "media.allowedTypes",
  MEDIA_LOCAL_PATH: "media.local.path",
  MEDIA_PUBLIC_URL: "media.local.publicUrl",
  S3_ENDPOINT: "media.s3.endpoint",
  S3_REGION: "media.s3.region",
  S3_BUCKET: "media.s3.bucket",
  S3_ACCESS_KEY_ID: "media.s3.accessKeyId",
  S3_SECRET_ACCESS_KEY: "media.s3.secretAccessKey",
  S3_PUBLIC_URL: "media.s3.publicUrl",

  // Features
  FEATURE_VERSIONING: "features.versioning",
  FEATURE_WEBHOOKS: "features.webhooks",
  FEATURE_CACHING: "features.caching",
  FEATURE_SEARCH: "features.search",
  FEATURE_I18N: "features.i18n",
  FEATURE_REALTIME: "features.realtime",

  // Log
  LOG_LEVEL: "log.level",
  LOG_FORMAT: "log.format",
  LOG_OUTPUTS: "log.outputs",

  // General
  NODE_ENV: "env",
  FERRIQA_NAME: "name",
};

/**
 * Parse environment variable value to appropriate type
 */
function parseEnvValue(key: string, value: string): any {
  // Boolean values
  if (value.toLowerCase() === "true") return true;
  if (value.toLowerCase() === "false") return false;

  // Number values
  if (!isNaN(Number(value)) && value !== "") {
    return Number(value);
  }

  // Array values (comma-separated)
  if (
    key.includes("ORIGINS") ||
    key.includes("TYPES") ||
    key.includes("OUTPUTS")
  ) {
    return value.split(",").map((v) => v.trim());
  }

  // Return as string
  return value;
}

/**
 * Set nested value in object by path
 */
function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split(".");
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current)) {
      current[key] = {};
    }
    current = current[key];
  }

  current[keys[keys.length - 1]] = value;
}

/**
 * Load environment variables into config object
 */
export function loadEnvConfig(): Partial<FerriqaConfig> {
  const config: Partial<FerriqaConfig> = {};

  for (const [envKey, configPath] of Object.entries(ENV_MAPPING)) {
    // @ts-ignore - process.env access
    const value =
      typeof process !== "undefined"
        ? process.env[envKey]
        : // @ts-ignore - Deno.env access
          typeof Deno !== "undefined"
          ? Deno.env.get(envKey)
          : undefined;

    if (value !== undefined && value !== "") {
      const parsedValue = parseEnvValue(envKey, value);
      setNestedValue(config, configPath, parsedValue);
    }
  }

  return config;
}

/**
 * Simple .env file parser
 * Supports:
 * - KEY=value
 * - KEY="value"
 * - KEY='value'
 * - Comments with #
 * - Empty lines
 */
export function parseEnvFile(content: string): Record<string, string> {
  const env: Record<string, string> = {};
  const lines = content.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    // Find the first = sign
    const equalIndex = trimmed.indexOf("=");
    if (equalIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, equalIndex).trim();
    let value = trimmed.slice(equalIndex + 1).trim();

    // Remove quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    // Handle escaped characters in double quotes
    if (value.startsWith('"')) {
      value = value
        .replace(/\\n/g, "\n")
        .replace(/\\t/g, "\t")
        .replace(/\\r/g, "\r")
        .replace(/\\"/g, '"');
    }

    env[key] = value;
  }

  return env;
}

/**
 * Load .env file from path
 * Works in Bun, Node.js, and Deno
 */
export async function loadEnvFile(
  filePath: string = ".env",
): Promise<Record<string, string>> {
  try {
    let content: string;

    // @ts-ignore - Bun exists at runtime
    if (typeof Bun !== "undefined") {
      // Bun
      const file = Bun.file(filePath);
      if (!(await file.exists())) {
        return {};
      }
      content = await file.text();
    } else if (typeof Deno !== "undefined") {
      // Deno
      try {
        // @ts-ignore - Deno exists at runtime
        content = await Deno.readTextFile(filePath);
      } catch {
        return {};
      }
    } else {
      // Node.js
      const { readFile } = await import("node:fs/promises");
      try {
        content = await readFile(filePath, "utf-8");
      } catch {
        return {};
      }
    }

    return parseEnvFile(content);
  } catch (error) {
    console.warn(`Warning: Failed to load ${filePath}:`, error);
    return {};
  }
}

/**
 * Apply environment variables from object to process
 * Useful for testing
 */
export function applyEnv(env: Record<string, string>): void {
  if (typeof process !== "undefined") {
    for (const [key, value] of Object.entries(env)) {
      process.env[key] = value;
    }
  }
}

/**
 * Get environment name
 */
export function getEnvironment(): string {
  if (typeof process !== "undefined") {
    return process.env.NODE_ENV || "development";
  }
  // @ts-ignore
  if (typeof Deno !== "undefined") {
    // @ts-ignore
    return Deno.env.get("NODE_ENV") || "development";
  }
  return "development";
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return getEnvironment() === "production";
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return getEnvironment() === "development";
}

/**
 * Check if running in test mode
 */
export function isTest(): boolean {
  return getEnvironment() === "test";
}
