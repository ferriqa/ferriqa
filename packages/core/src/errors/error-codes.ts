/**
 * @ferriqa/core - Error codes
 *
 * Machine-readable error codes for the entire Ferriqa ecosystem
 * Prefix convention:
 *   - AUTH_* : Authentication/Authorization errors
 *   - DB_*   : Database errors
 *   - VALIDATION_* : Input validation errors
 *   - RUNTIME_* : Runtime/environment errors
 *   - HOOK_* : Hook system errors
 *   - BLUEPRINT_* : Content blueprint errors
 *   - CONTENT_* : Content management errors
 *   - SYSTEM_* : Internal system errors
 */

/**
 * Error codes organized by module
 * Each code maps to a unique string identifier
 */
export enum ErrorCode {
  // ========== AUTHENTICATION & AUTHORIZATION ==========
  /** Invalid credentials provided */
  AUTH_INVALID_CREDENTIALS = "AUTH_INVALID_CREDENTIALS",

  /** Token is expired */
  AUTH_TOKEN_EXPIRED = "AUTH_TOKEN_EXPIRED",

  /** Token is invalid or malformed */
  AUTH_INVALID_TOKEN = "AUTH_INVALID_TOKEN",

  /** Missing required authentication */
  AUTH_UNAUTHORIZED = "AUTH_UNAUTHORIZED",

  /** User does not have required permissions */
  AUTH_FORBIDDEN = "AUTH_FORBIDDEN",

  /** Session not found or expired */
  AUTH_SESSION_NOT_FOUND = "AUTH_SESSION_NOT_FOUND",

  // ========== DATABASE ==========
  /** Failed to connect to database */
  DB_CONNECTION_FAILED = "DB_CONNECTION_FAILED",

  /** Connection pool exhausted */
  DB_CONNECTION_POOL_EXHAUSTED = "DB_CONNECTION_POOL_EXHAUSTED",

  /** Query execution failed */
  DB_QUERY_FAILED = "DB_QUERY_FAILED",

  /** Unique constraint violation */
  DB_UNIQUE_VIOLATION = "DB_UNIQUE_VIOLATION",

  /** Foreign key constraint violation */
  DB_FOREIGN_KEY_VIOLATION = "DB_FOREIGN_KEY_VIOLATION",

  /** Record not found */
  DB_RECORD_NOT_FOUND = "DB_RECORD_NOT_FOUND",

  /** Migration failed */
  DB_MIGRATION_FAILED = "DB_MIGRATION_FAILED",

  /** Transaction failed */
  DB_TRANSACTION_FAILED = "DB_TRANSACTION_FAILED",

  /** Timeout during database operation */
  DB_TIMEOUT = "DB_TIMEOUT",

  // ========== VALIDATION ==========
  /** Invalid input data */
  VALIDATION_INVALID_INPUT = "VALIDATION_INVALID_INPUT",

  /** Required field missing */
  VALIDATION_REQUIRED_FIELD = "VALIDATION_REQUIRED_FIELD",

  /** Field value too short */
  VALIDATION_TOO_SHORT = "VALIDATION_TOO_SHORT",

  /** Field value too long */
  VALIDATION_TOO_LONG = "VALIDATION_TOO_LONG",

  /** Invalid email format */
  VALIDATION_INVALID_EMAIL = "VALIDATION_INVALID_EMAIL",

  /** Invalid date format */
  VALIDATION_INVALID_DATE = "VALIDATION_INVALID_DATE",

  /** Invalid JSON format */
  VALIDATION_INVALID_JSON = "VALIDATION_INVALID_JSON",

  /** Value not in allowed enum */
  VALIDATION_INVALID_ENUM = "VALIDATION_INVALID_ENUM",

  /** Regex pattern mismatch */
  VALIDATION_PATTERN_MISMATCH = "VALIDATION_PATTERN_MISMATCH",

  // ========== RUNTIME ==========
  /** Unsupported runtime environment */
  RUNTIME_UNSUPPORTED = "RUNTIME_UNSUPPORTED",

  /** Runtime capability not available */
  RUNTIME_CAPABILITY_MISSING = "RUNTIME_CAPABILITY_MISSING",

  /** Feature not implemented for this runtime */
  RUNTIME_NOT_IMPLEMENTED = "RUNTIME_NOT_IMPLEMENTED",

  /** Runtime version incompatible */
  RUNTIME_VERSION_INCOMPATIBLE = "RUNTIME_VERSION_INCOMPATIBLE",

  /** File system operation failed */
  RUNTIME_FS_ERROR = "RUNTIME_FS_ERROR",

  /** Environment variable missing or invalid */
  RUNTIME_ENV_ERROR = "RUNTIME_ENV_ERROR",

  // ========== HOOK SYSTEM ==========
  /** Hook callback execution failed */
  HOOK_EXECUTION_FAILED = "HOOK_EXECUTION_FAILED",

  /** Hook callback timeout */
  HOOK_TIMEOUT = "HOOK_TIMEOUT",

  /** Invalid hook event name */
  HOOK_INVALID_EVENT = "HOOK_INVALID_EVENT",

  /** Hook registration failed */
  HOOK_REGISTRATION_FAILED = "HOOK_REGISTRATION_FAILED",

  // ========== BLUEPRINT ==========
  /** Blueprint not found */
  BLUEPRINT_NOT_FOUND = "BLUEPRINT_NOT_FOUND",

  /** Invalid blueprint definition */
  BLUEPRINT_INVALID_DEFINITION = "BLUEPRINT_INVALID_DEFINITION",

  /** Blueprint field type not supported */
  BLUEPRINT_INVALID_FIELD_TYPE = "BLUEPRINT_INVALID_FIELD_TYPE",

  /** Blueprint slug already exists */
  BLUEPRINT_DUPLICATE_SLUG = "BLUEPRINT_DUPLICATE_SLUG",

  /** Blueprint has existing content - cannot delete */
  BLUEPRINT_HAS_CONTENT = "BLUEPRINT_HAS_CONTENT",

  // ========== CONTENT ==========
  /** Content not found */
  CONTENT_NOT_FOUND = "CONTENT_NOT_FOUND",

  /** Invalid content data for blueprint */
  CONTENT_INVALID_DATA = "CONTENT_INVALID_DATA",

  /** Content slug already exists */
  CONTENT_DUPLICATE_SLUG = "CONTENT_DUPLICATE_SLUG",

  /** Content validation failed against blueprint */
  CONTENT_VALIDATION_FAILED = "CONTENT_VALIDATION_FAILED",

  /** Version not found */
  CONTENT_VERSION_NOT_FOUND = "CONTENT_VERSION_NOT_FOUND",

  // ========== SYSTEM ==========
  /** System info (non-error) */
  SYSTEM_INFO = "SYSTEM_INFO",

  /** Unexpected internal error */
  SYSTEM_INTERNAL_ERROR = "SYSTEM_INTERNAL_ERROR",

  /** Configuration error */
  SYSTEM_CONFIG_ERROR = "SYSTEM_CONFIG_ERROR",

  /** Service unavailable */
  SYSTEM_SERVICE_UNAVAILABLE = "SYSTEM_SERVICE_UNAVAILABLE",

  /** Rate limit exceeded */
  SYSTEM_RATE_LIMIT = "SYSTEM_RATE_LIMIT",

  /** Request timeout */
  SYSTEM_TIMEOUT = "SYSTEM_TIMEOUT",

  /** Circular dependency detected */
  SYSTEM_CIRCULAR_DEPENDENCY = "SYSTEM_CIRCULAR_DEPENDENCY",
}

/**
 * Get error prefix from error code
 * Useful for grouping and filtering
 */
export function getErrorPrefix(code: ErrorCode): string {
  return code.split("_")[0];
}

/**
 * Check if error code belongs to a specific category
 */
export function isErrorCategory(code: ErrorCode, category: string): boolean {
  return code.startsWith(`${category}_`);
}

/**
 * Get default HTTP status code for error code
 */
export function getDefaultStatusCode(code: ErrorCode): number {
  const prefix = getErrorPrefix(code);

  switch (prefix) {
    case "AUTH":
      if (code === ErrorCode.AUTH_UNAUTHORIZED) return 401;
      if (code === ErrorCode.AUTH_FORBIDDEN) return 403;
      return 401;

    case "DB":
      if (code === ErrorCode.DB_RECORD_NOT_FOUND) return 404;
      if (code === ErrorCode.DB_UNIQUE_VIOLATION) return 409;
      return 500;

    case "VALIDATION":
      return 400;

    case "RUNTIME":
      return 500;

    case "HOOK":
      return 500;

    case "BLUEPRINT":
    case "CONTENT":
      if (code.includes("NOT_FOUND")) return 404;
      if (code.includes("DUPLICATE")) return 409;
      return 400;

    case "SYSTEM":
      if (code === ErrorCode.SYSTEM_INFO) return 200;
      if (code === ErrorCode.SYSTEM_RATE_LIMIT) return 429;
      if (code === ErrorCode.SYSTEM_TIMEOUT) return 504;
      return 500;

    default:
      return 500;
  }
}

/**
 * Error categories for grouping
 */
export const ERROR_CATEGORIES = [
  "AUTH",
  "DB",
  "VALIDATION",
  "RUNTIME",
  "HOOK",
  "BLUEPRINT",
  "CONTENT",
  "SYSTEM",
] as const;

export type ErrorCategory = (typeof ERROR_CATEGORIES)[number];
