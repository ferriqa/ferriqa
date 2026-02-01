/**
 * @ferriqa/core - Console Transport
 *
 * Console output transport for error logging
 * Supports pretty and JSON output formats
 */

import type { ErrorTransport, ErrorContext } from "../types.js";
import { LogLevel } from "../types.js";
import { FerriqaError } from "../FerriqaError.js";
import { formatStackTrace } from "../error-formatter.js";
import { isBun, isDeno, isNode } from "../../runtime.js";

/**
 * ANSI color codes for pretty output
 */
const COLORS = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

/**
 * Get color for log level
 */
function getLevelColor(level: LogLevel): string {
  switch (level) {
    case LogLevel.DEBUG:
      return COLORS.dim;
    case LogLevel.INFO:
      return COLORS.blue;
    case LogLevel.WARN:
      return COLORS.yellow;
    case LogLevel.ERROR:
      return COLORS.red;
    case LogLevel.FATAL:
      return COLORS.magenta;
    default:
      return COLORS.reset;
  }
}

/**
 * Get level name
 */
function getLevelName(level: LogLevel): string {
  switch (level) {
    case LogLevel.DEBUG:
      return "DEBUG";
    case LogLevel.INFO:
      return "INFO";
    case LogLevel.WARN:
      return "WARN";
    case LogLevel.ERROR:
      return "ERROR";
    case LogLevel.FATAL:
      return "FATAL";
    default:
      return "UNKNOWN";
  }
}

/**
 * Format timestamp
 */
function formatTimestamp(date: Date): string {
  return date.toISOString();
}

/**
 * Console Transport implementation
 * Outputs errors to console (stdout/stderr)
 */
export class ConsoleTransport implements ErrorTransport {
  readonly name = "console";
  readonly level: LogLevel;

  private pretty: boolean;
  private useColor: boolean;

  /**
   * Create a console transport
   * @param options - Configuration options
   */
  constructor(options?: {
    /** Minimum log level */
    level?: LogLevel;
    /** Use pretty formatting (default: true) */
    pretty?: boolean;
    /** Use ANSI colors (default: auto-detect) */
    color?: boolean;
  }) {
    this.level = options?.level ?? LogLevel.DEBUG;
    this.pretty = options?.pretty ?? true;

    // Auto-detect color support
    if (options?.color !== undefined) {
      this.useColor = options.color;
    } else {
      this.useColor = this.detectColorSupport();
    }
  }

  /**
   * Detect if terminal supports colors
   */
  private detectColorSupport(): boolean {
    // Check environment variables
    if (isNode || isBun) {
      const env = process.env;
      if (env.NO_COLOR) return false;
      if (env.FORCE_COLOR) return true;
    }

    // Check if stdout is TTY
    if (isNode || isBun) {
      return process.stdout?.isTTY ?? false;
    }

    if (isDeno) {
      // @ts-ignore
      return (globalThis as any).Deno.stdout?.isTerminal?.() ?? false;
    }

    return false;
  }

  /**
   * Send error to console
   */
  send(error: FerriqaError, context: ErrorContext): void {
    if (this.pretty) {
      this.sendPretty(error, context);
    } else {
      this.sendJSON(error, context);
    }
  }

  /**
   * Pretty format output
   */
  private sendPretty(error: FerriqaError, context: ErrorContext): void {
    const level = this.errorToLogLevel(error);
    const levelColor = this.useColor ? getLevelColor(level) : "";
    const resetColor = this.useColor ? COLORS.reset : "";
    const brightColor = this.useColor ? COLORS.bright : "";
    const dimColor = this.useColor ? COLORS.dim : "";

    const lines: string[] = [];

    // Header line: [TIMESTAMP] [LEVEL] CODE: Message
    const levelName = getLevelName(level).padStart(5);
    const timestamp = formatTimestamp(context.timestamp);
    const header = `${dimColor}[${timestamp}]${resetColor} ${levelColor}${levelName}${resetColor} ${brightColor}${error.code}${resetColor}: ${error.message}`;

    lines.push(header);

    // Context info
    if (context.requestId) {
      lines.push(`  ${dimColor}Request ID:${resetColor} ${context.requestId}`);
    }

    if (context.userId) {
      lines.push(`  ${dimColor}User ID:${resetColor} ${context.userId}`);
    }

    if (context.path) {
      lines.push(
        `  ${dimColor}Path:${resetColor} ${context.method ?? "GET"} ${context.path}`,
      );
    }

    // Runtime info
    if (context.runtime) {
      lines.push(
        `  ${dimColor}Runtime:${resetColor} ${context.runtime.name} ${context.runtime.version}`,
      );
    }

    // Metadata
    if (error.metadata && Object.keys(error.metadata).length > 0) {
      lines.push(`  ${dimColor}Metadata:${resetColor}`);
      for (const [key, value] of Object.entries(error.metadata)) {
        const valueStr =
          typeof value === "object" ? JSON.stringify(value) : String(value);
        lines.push(`    ${key}: ${valueStr}`);
      }
    }

    // Stack trace (for errors and above)
    if (level >= LogLevel.ERROR && error.stack) {
      lines.push(`  ${dimColor}Stack Trace:${resetColor}`);
      const formattedStack = formatStackTrace(error, {
        showLineNumbers: true,
        maxFrames: 10,
        hideNodeModules: true,
      });
      const stackLines = formattedStack.split("\n").slice(1); // Skip error message line
      for (const line of stackLines) {
        if (line?.trim()) {
          lines.push(`    ${dimColor}${line.trim()}${resetColor}`);
        }
      }
    }

    // Cause (if any)
    if (error.cause) {
      lines.push(`  ${dimColor}Caused by:${resetColor}`);
      lines.push(`    ${error.cause.name}: ${error.cause.message}`);
    }

    // Output based on level
    const output = lines.join("\n") + "\n";

    if (level >= LogLevel.ERROR) {
      console.error(output);
    } else if (level === LogLevel.WARN) {
      console.warn(output);
    } else {
      console.log(output);
    }
  }

  /**
   * JSON format output
   */
  private sendJSON(error: FerriqaError, context: ErrorContext): void {
    const level = this.errorToLogLevel(error);

    const logEntry = {
      level: getLevelName(level).toLowerCase(),
      timestamp: context.timestamp.toISOString(),
      code: error.code,
      message: error.message,
      name: error.name,
      ...(context.requestId && { requestId: context.requestId }),
      ...(context.userId && { userId: context.userId }),
      ...(context.path && { path: context.path, method: context.method }),
      ...(context.runtime && {
        runtime: {
          name: context.runtime.name,
          version: context.runtime.version,
        },
      }),
      ...(error.metadata &&
        Object.keys(error.metadata).length > 0 && {
          metadata: error.metadata,
        }),
      ...(error.stack && level >= LogLevel.ERROR && { stack: error.stack }),
      ...(error.cause && {
        cause: {
          name: error.cause.name,
          message: error.cause.message,
        },
      }),
    };

    const output = JSON.stringify(logEntry);

    if (level >= LogLevel.ERROR) {
      console.error(output);
    } else {
      console.log(output);
    }
  }

  /**
   * Convert error severity to log level
   */
  private errorToLogLevel(error: FerriqaError): LogLevel {
    // Map error codes to log levels
    if (error.statusCode >= 500) {
      return LogLevel.ERROR;
    }
    if (error.statusCode >= 400) {
      return LogLevel.WARN;
    }
    // For status codes < 400 (2xx, 3xx), these are informational
    if (error.statusCode >= 300) {
      return LogLevel.INFO;
    }
    return LogLevel.DEBUG;
  }

  /**
   * Flush (no-op for console)
   */
  async flush(): Promise<void> {
    // Console is synchronous, nothing to flush
  }

  /**
   * Close (no-op for console)
   */
  async close(): Promise<void> {
    // Console cannot be closed
  }
}
