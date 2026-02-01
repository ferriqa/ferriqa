/**
 * @ferriqa/core - Error handling types and interfaces
 *
 * Zero-dependency error handling system with transport pattern
 * Compatible with Bun, Node.js, and Deno runtimes
 */

import type { RuntimeInfo } from "../runtime.js";

/**
 * Log severity levels
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

/**
 * String representation of log levels for configuration
 */
export type LogLevelString = "debug" | "info" | "warn" | "error" | "fatal";

/**
 * Map string log levels to enum values
 */
export const LOG_LEVEL_MAP: Record<LogLevelString, LogLevel> = {
  debug: LogLevel.DEBUG,
  info: LogLevel.INFO,
  warn: LogLevel.WARN,
  error: LogLevel.ERROR,
  fatal: LogLevel.FATAL,
};

/**
 * Context information for error logging
 * Captures runtime state and request metadata
 */
export interface ErrorContext {
  /** Timestamp when error occurred */
  timestamp: Date;

  /** Runtime information (Bun/Node/Deno) */
  runtime: RuntimeInfo;

  /** Optional request ID for tracing */
  requestId?: string;

  /** Optional user ID who triggered the error */
  userId?: string | number;

  /** Optional HTTP path if applicable */
  path?: string;

  /** Optional HTTP method if applicable */
  method?: string;

  /** Optional session or correlation ID */
  sessionId?: string;

  /** Additional contextual metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Transport interface for error logging destinations
 * Implement this to create custom transports (DB, Sentry, webhooks, etc.)
 */
export interface ErrorTransport {
  /** Unique transport identifier */
  readonly name: string;

  /** Minimum log level this transport accepts */
  readonly level: LogLevel;

  /**
   * Send error to this transport
   * @param error - The FerriqaError to log
   * @param context - Contextual information about the error
   */
  send(error: FerriqaError, context: ErrorContext): Promise<void> | void;

  /**
   * Optional: Flush any buffered logs
   * Called during graceful shutdown
   */
  flush?(): Promise<void>;

  /**
   * Optional: Close transport and cleanup resources
   * Called during graceful shutdown
   */
  close?(): Promise<void>;
}

/**
 * Base error class for Ferriqa ecosystem
 * All application errors should extend this class
 */
export declare class FerriqaError extends Error {
  /** Error code for machine-readable identification */
  readonly code: string;

  /** HTTP status code if applicable */
  readonly statusCode?: number;

  /** Original error that caused this error */
  readonly cause?: Error;

  /** Additional error metadata */
  readonly metadata?: Record<string, unknown>;

  /** Timestamp when error was created */
  readonly timestamp: Date;

  /**
   * Serialize error to JSON
   * Cross-runtime compatible serialization
   */
  toJSON(): ErrorLogEntry;

  /**
   * Create error from serialized JSON
   * Factory method for deserialization
   */
  static fromJSON(data: ErrorLogEntry): FerriqaError;
}

/**
 * Serialized error log entry structure
 * Used for storage, transmission, and reconstruction
 */
export interface ErrorLogEntry {
  /** Error code */
  code: string;

  /** Error message */
  message: string;

  /** Stack trace */
  stack?: string;

  /** HTTP status code */
  statusCode?: number;

  /** Original error information */
  cause?: {
    message: string;
    stack?: string;
    name: string;
  };

  /** Additional metadata */
  metadata?: Record<string, unknown>;

  /** When error occurred */
  timestamp: string;

  /** Error class name */
  name: string;
}

/**
 * Configuration for error logging system
 * Populated from environment variables
 */
export interface ErrorLoggerConfig {
  /** Global logging enabled/disabled */
  enabled: boolean;

  /** Default minimum log level */
  defaultLevel: LogLevel;

  /** Console output enabled */
  consoleOutput: boolean;

  /** Pretty print console output */
  consolePretty: boolean;

  /** File logging enabled - MUST BE EXPLICITLY ENABLED */
  fileEnabled: boolean;

  /** File log directory path */
  filePath?: string;

  /** Maximum file size before rotation */
  fileMaxSize?: number;

  /** Maximum number of rotated files to keep */
  fileMaxFiles?: number;

  /** Additional custom transports */
  transports?: ErrorTransport[];
}

/**
 * Normalized stack trace frame
 */
export interface StackFrame {
  /** Function name */
  functionName?: string;

  /** File path */
  fileName?: string;

  /** Line number */
  lineNumber?: number;

  /** Column number */
  columnNumber?: number;

  /** Source code line (if available) */
  sourceLine?: string;
}

/**
 * Normalized stack trace information
 */
export interface NormalizedStackTrace {
  /** Error message */
  message: string;

  /** Error name */
  name: string;

  /** Parsed stack frames */
  frames: StackFrame[];

  /** Original raw stack string */
  raw: string;
}
