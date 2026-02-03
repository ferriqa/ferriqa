/**
 * @ferriqa/core - FerriqaError base class
 *
 * Universal error class for the Ferriqa ecosystem
 * Cross-runtime compatible with serialization support
 */

import type { ErrorLogEntry } from "./types.ts";
import { ErrorCode, getDefaultStatusCode } from "./error-codes.ts";

/**
 * Base error class for all Ferriqa errors
 * Provides:
 * - Machine-readable error codes
 * - HTTP status code mapping
 * - Error chaining (cause)
 * - Cross-runtime serialization
 */
export class FerriqaError extends Error {
  /** Error code for machine-readable identification */
  readonly code: ErrorCode | string;

  /** HTTP status code for API responses */
  readonly statusCode: number;

  /** Original error that caused this error */
  override readonly cause?: Error;

  /** Additional error metadata */
  readonly metadata?: Record<string, unknown>;

  /** Timestamp when error was created */
  readonly timestamp: Date;

  /**
   * Create a new FerriqaError
   * @param code - Error code (from ErrorCode enum or custom string)
   * @param message - Human-readable error message
   * @param options - Optional configuration
   */
  constructor(
    code: ErrorCode | string,
    message: string,
    options?: {
      /** HTTP status code (auto-detected from code if not provided) */
      statusCode?: number;
      /** Original error that caused this error */
      cause?: Error;
      /** Additional metadata */
      metadata?: Record<string, unknown>;
    },
  ) {
    super(message);

    this.code = code;
    this.name = this.constructor.name;
    this.timestamp = new Date();
    this.cause = options?.cause;
    this.metadata = options?.metadata;

    // Auto-detect status code from error code if not provided
    this.statusCode =
      options?.statusCode ??
      (Object.values(ErrorCode).includes(code as ErrorCode)
        ? getDefaultStatusCode(code as ErrorCode)
        : 500);

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Serialize error to JSON
   * Cross-runtime compatible
   */
  toJSON(): ErrorLogEntry {
    const entry: ErrorLogEntry = {
      code: this.code,
      message: this.message,
      name: this.name,
      timestamp: this.timestamp.toISOString(),
    };

    if (this.stack) {
      entry.stack = this.stack;
    }

    if (this.statusCode !== 500) {
      entry.statusCode = this.statusCode;
    }

    if (this.cause) {
      entry.cause = {
        name: this.cause.name,
        message: this.cause.message,
        stack: this.cause.stack,
      };
    }

    if (this.metadata && Object.keys(this.metadata).length > 0) {
      entry.metadata = this.metadata;
    }

    return entry;
  }

  /**
   * Serialize to JSON string
   */
  toJSONString(): string {
    return JSON.stringify(this.toJSON(), null, 2);
  }

  /**
   * Create error from serialized JSON
   * Factory method for deserialization
   */
  static fromJSON(data: ErrorLogEntry): FerriqaError {
    const error = new FerriqaError(data.code, data.message, {
      statusCode: data.statusCode,
      metadata: data.metadata,
    });

    // Restore timestamp with validation
    const restoredTimestamp = new Date(data.timestamp);
    if (isNaN(restoredTimestamp.getTime())) {
      console.warn(
        `Invalid timestamp in error log: ${data.timestamp}, using current time`,
      );
      Object.defineProperty(error, "timestamp", {
        value: new Date(),
        writable: false,
      });
    } else {
      Object.defineProperty(error, "timestamp", {
        value: restoredTimestamp,
        writable: false,
      });
    }

    // Restore stack if available
    if (data.stack) {
      Object.defineProperty(error, "stack", {
        value: data.stack,
        writable: false,
        configurable: true,
      });
    }

    // Restore cause if available
    if (data.cause) {
      const causeError = new Error(data.cause.message);
      causeError.name = data.cause.name;
      Object.defineProperty(causeError, "stack", {
        value: data.cause.stack,
        writable: false,
        configurable: true,
      });
      Object.defineProperty(error, "cause", {
        value: causeError,
        writable: false,
      });
    }

    return error;
  }

  /**
   * Create error from JSON string
   */
  static fromJSONString(jsonString: string): FerriqaError {
    const data = JSON.parse(jsonString) as ErrorLogEntry;
    return FerriqaError.fromJSON(data);
  }
}

/**
 * Database-specific error
 * Includes query information (sanitized)
 */
export class FerriqaDatabaseError extends FerriqaError {
  /**
   * Create a database error
   * @param code - Error code
   * @param message - Error message
   * @param options - Additional options
   */
  constructor(
    code: ErrorCode | string,
    message: string,
    options?: {
      statusCode?: number;
      cause?: Error;
      metadata?: Record<string, unknown>;
      /** Database operation that failed */
      operation?: string;
      /** Table/collection name */
      table?: string;
    },
  ) {
    super(code, message, {
      ...options,
      metadata: {
        ...options?.metadata,
        operation: options?.operation,
        table: options?.table,
      },
    });
  }
}

/**
 * Validation error
 * For input validation failures
 */
export class FerriqaValidationError extends FerriqaError {
  /** Field that failed validation */
  readonly field?: string;

  constructor(
    code: ErrorCode | string,
    message: string,
    options?: {
      statusCode?: number;
      cause?: Error;
      metadata?: Record<string, unknown>;
      /** Field path that failed validation */
      field?: string;
      /** Invalid value (sanitized) */
      value?: unknown;
    },
  ) {
    super(code, message, {
      statusCode: options?.statusCode ?? 400,
      ...options,
      metadata: {
        ...options?.metadata,
        field: options?.field,
        value: options?.value,
      },
    });

    this.field = options?.field;
  }
}

/**
 * Runtime error
 * For runtime-specific failures
 */
export class FerriqaRuntimeError extends FerriqaError {
  constructor(
    code: ErrorCode | string,
    message: string,
    options?: {
      statusCode?: number;
      cause?: Error;
      metadata?: Record<string, unknown>;
      /** Runtime that caused the error */
      runtime?: string;
      /** Missing capability */
      capability?: string;
    },
  ) {
    super(code, message, {
      statusCode: options?.statusCode ?? 500,
      ...options,
      metadata: {
        ...options?.metadata,
        runtime: options?.runtime,
        capability: options?.capability,
      },
    });
  }
}

/**
 * Authentication/Authorization error
 */
export class FerriqaAuthError extends FerriqaError {
  constructor(
    code: ErrorCode | string,
    message: string,
    options?: {
      statusCode?: number;
      cause?: Error;
      metadata?: Record<string, unknown>;
      /** User ID if available */
      userId?: string | number;
    },
  ) {
    super(code, message, {
      statusCode: options?.statusCode ?? 401,
      ...options,
      metadata: {
        ...options?.metadata,
        userId: options?.userId,
      },
    });
  }
}
