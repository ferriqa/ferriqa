/**
 * @ferriqa/core - Error handling system
 *
 * Zero-dependency, cross-runtime error handling
 * Bun, Node.js, and Deno compatible
 *
 * @example
 * ```typescript
 * import { FerriqaErrorLogger, FerriqaError, ErrorCode } from '@ferriqa/core/errors';
 *
 * // Create logger
 * const logger = new FerriqaErrorLogger();
 *
 * // Log an error
 * const error = new FerriqaError(ErrorCode.DB_CONNECTION_FAILED, 'Failed to connect');
 * await logger.log(error);
 *
 * // Cleanup
 * await logger.close();
 * ```
 */

// Types
export type {
  ErrorTransport,
  ErrorContext,
  ErrorLogEntry,
  ErrorLoggerConfig,
  LogLevelString,
  StackFrame,
  NormalizedStackTrace,
} from "./types.ts";

// Enums
export { LogLevel, LOG_LEVEL_MAP } from "./types.ts";

// Error classes
export {
  FerriqaError,
  FerriqaDatabaseError,
  FerriqaValidationError,
  FerriqaRuntimeError,
  FerriqaAuthError,
} from "./FerriqaError.ts";

// Error codes
export {
  ErrorCode,
  ERROR_CATEGORIES,
  getErrorPrefix,
  isErrorCategory,
  getDefaultStatusCode,
} from "./error-codes.ts";

// Logger
export {
  FerriqaErrorLogger,
  getGlobalLogger,
  setGlobalLogger,
  resetGlobalLogger,
} from "./error-logger.ts";

// Configuration
export {
  buildConfigFromEnv,
  mergeConfig,
  validateConfig,
  DEFAULT_CONFIG,
  CONFIG_PRESETS,
} from "./config.ts";

// Formatters
export {
  normalizeStackTrace,
  formatStackTrace,
  stackTraceToJSON,
  getRuntimeStackFormat,
  cleanStackTracePaths,
} from "./error-formatter.ts";

// Transports
export { ConsoleTransport, FileTransport } from "./transports/index.ts";

// Extension interface
export type {
  TransportFactory,
  TransportPackageManifest,
} from "./extension.ts";

export {
  TransportRegistry,
  getGlobalRegistry,
  createTransportFactory,
  createTransportManifest,
  loadTransportsFromEnv,
} from "./extension.ts";
