/**
 * @ferriqa/core - Error configuration
 *
 * Environment-based configuration for error handling
 * Parses FERRIQA_ERROR_* environment variables
 */

import type { ErrorLoggerConfig } from "./types.ts";
import { LogLevel, LOG_LEVEL_MAP, LogLevelString } from "./types.ts";

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: ErrorLoggerConfig = {
  enabled: true,
  defaultLevel: LogLevel.ERROR,
  consoleOutput: true,
  consolePretty: true,
  fileEnabled: false,
  filePath: "./logs",
  fileMaxSize: 10 * 1024 * 1024, // 10MB
  fileMaxFiles: 5,
};

/**
 * Parse boolean from environment variable
 * Handles "true", "1", "yes" as true, others as false
 */
function parseBoolean(
  value: string | undefined,
  defaultValue: boolean,
): boolean {
  if (value === undefined) return defaultValue;
  const normalized = value.toLowerCase().trim();
  return ["true", "1", "yes", "on"].includes(normalized);
}

/**
 * Parse log level from string
 */
function parseLogLevel(
  value: string | undefined,
  defaultValue: LogLevel,
): LogLevel {
  if (value === undefined) return defaultValue;
  const normalized = value.toLowerCase().trim() as LogLevelString;
  return LOG_LEVEL_MAP[normalized] ?? defaultValue;
}

/**
 * Parse file size (supports "10mb", "1gb", "100kb", or bytes as number)
 */
function parseFileSize(
  value: string | undefined,
  defaultValue: number,
): number {
  if (value === undefined) return defaultValue;

  const normalized = value.toLowerCase().trim();
  const match = normalized.match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);

  if (!match) return defaultValue;

  const num = parseFloat(match[1]);
  const unit = match[2] || "b";

  const multipliers: Record<string, number> = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024,
  };

  return Math.floor(num * (multipliers[unit] || 1));
}

/**
 * Parse integer from environment variable
 */
function parseInteger(value: string | undefined, defaultValue: number): number {
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Get environment variable value
 * Cross-runtime compatible (Bun, Node.js, Deno)
 */
function getEnvVar(name: string): string | undefined {
  try {
    // Try Bun/Node.js style
    if (typeof process !== "undefined" && process.env) {
      return process.env[name];
    }

    // Try Deno style
    // @ts-ignore - Deno not available in all runtimes
    if (typeof Deno !== "undefined") {
      // @ts-ignore
      return (globalThis as any).Deno.env.get(name);
    }
  } catch {
    // Environment variables not available
  }

  return undefined;
}

/**
 * Build configuration from environment variables
 */
export function buildConfigFromEnv(): ErrorLoggerConfig {
  return {
    enabled: parseBoolean(
      getEnvVar("FERRIQA_ERROR_LOGGING_ENABLED"),
      DEFAULT_CONFIG.enabled,
    ),

    defaultLevel: parseLogLevel(
      getEnvVar("FERRIQA_ERROR_LOG_LEVEL"),
      DEFAULT_CONFIG.defaultLevel,
    ),

    consoleOutput: parseBoolean(
      getEnvVar("FERRIQA_ERROR_CONSOLE_OUTPUT"),
      DEFAULT_CONFIG.consoleOutput,
    ),

    consolePretty: parseBoolean(
      getEnvVar("FERRIQA_ERROR_CONSOLE_PRETTY"),
      DEFAULT_CONFIG.consolePretty,
    ),

    fileEnabled: parseBoolean(
      getEnvVar("FERRIQA_ERROR_FILE_ENABLED"),
      DEFAULT_CONFIG.fileEnabled,
    ),

    filePath: getEnvVar("FERRIQA_ERROR_FILE_PATH") ?? DEFAULT_CONFIG.filePath,

    fileMaxSize: parseFileSize(
      getEnvVar("FERRIQA_ERROR_FILE_MAX_SIZE"),
      DEFAULT_CONFIG.fileMaxSize!,
    ),

    fileMaxFiles: parseInteger(
      getEnvVar("FERRIQA_ERROR_FILE_MAX_FILES"),
      DEFAULT_CONFIG.fileMaxFiles!,
    ),
  };
}

/**
 * Validate configuration
 * Returns validation errors if any
 */
export function validateConfig(config: ErrorLoggerConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate file path if file logging enabled
  if (config.fileEnabled) {
    if (!config.filePath) {
      errors.push("File logging enabled but no file path specified");
    }

    if (config.fileMaxSize && config.fileMaxSize < 1024) {
      errors.push("File max size must be at least 1KB");
    }

    if (config.fileMaxFiles && config.fileMaxFiles < 1) {
      errors.push("File max files must be at least 1");
    }
  }

  // Validate log level
  if (
    config.defaultLevel < LogLevel.DEBUG ||
    config.defaultLevel > LogLevel.FATAL
  ) {
    errors.push("Invalid log level");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Merge user configuration with defaults
 */
export function mergeConfig(
  userConfig: Partial<ErrorLoggerConfig>,
): ErrorLoggerConfig {
  const envConfig = buildConfigFromEnv();

  return {
    ...DEFAULT_CONFIG,
    ...envConfig,
    ...userConfig,
  };
}

/**
 * Configuration presets for common scenarios
 */
export const CONFIG_PRESETS = {
  /**
   * Development preset
   * - Pretty console output
   * - Debug level
   * - No file logging
   */
  development: (): ErrorLoggerConfig => ({
    ...DEFAULT_CONFIG,
    defaultLevel: LogLevel.DEBUG,
    consolePretty: true,
    fileEnabled: false,
  }),

  /**
   * Production preset
   * - JSON console output (for log aggregation)
   * - Error level
   * - File logging enabled
   */
  production: (): ErrorLoggerConfig => ({
    ...DEFAULT_CONFIG,
    defaultLevel: LogLevel.ERROR,
    consolePretty: false,
    fileEnabled: true,
  }),

  /**
   * Testing preset
   * - Minimal output
   * - Fatal level only
   * - No file logging
   */
  testing: (): ErrorLoggerConfig => ({
    ...DEFAULT_CONFIG,
    defaultLevel: LogLevel.FATAL,
    consoleOutput: false,
    fileEnabled: false,
  }),

  /**
   * Silent preset
   * - No output at all
   * - Useful for benchmarks or CLI tools
   */
  silent: (): ErrorLoggerConfig => ({
    ...DEFAULT_CONFIG,
    enabled: false,
    consoleOutput: false,
    fileEnabled: false,
  }),
};
