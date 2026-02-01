/**
 * @ferriqa/core - Error Logger
 *
 * Main error logging system with transport management
 * Zero-dependency, cross-runtime compatible
 */

import type {
  ErrorTransport,
  ErrorContext,
  ErrorLoggerConfig,
  LogLevel,
} from "./types.js";
import { LogLevel as LogLevelEnum } from "./types.js";
import type { FerriqaError } from "./FerriqaError.js";
import { ConsoleTransport } from "./transports/ConsoleTransport.js";
import { FileTransport } from "./transports/FileTransport.js";
import {
  buildConfigFromEnv,
  mergeConfig,
  validateConfig,
  DEFAULT_CONFIG,
} from "./config.js";
import { getRuntimeInfo, isBun, isDeno, isNode } from "../runtime.js";

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}`;
}

/**
 * Error Logger class
 * Manages multiple transports and handles error dispatching
 */
export class FerriqaErrorLogger {
  private transports: Map<string, ErrorTransport> = new Map();
  private config: ErrorLoggerConfig;
  private initialized: boolean = false;
  private shutdownHandlers: (() => void)[] = [];

  /**
   * Create a new error logger
   * @param userConfig - Optional configuration (overrides env vars)
   */
  constructor(userConfig?: Partial<ErrorLoggerConfig>) {
    this.config = mergeConfig(userConfig ?? {});

    // Validate config
    const validation = validateConfig(this.config);
    if (!validation.valid) {
      console.warn(
        `Invalid error logger configuration: ${validation.errors.join(", ")}`,
      );
    }

    // Setup default transports
    this.setupDefaultTransports();

    // Setup graceful shutdown
    this.setupShutdownHandlers();
  }

  /**
   * Setup default transports based on configuration
   */
  private setupDefaultTransports(): void {
    if (!this.config.enabled) {
      return;
    }

    // Always add console transport
    if (this.config.consoleOutput) {
      const consoleTransport = new ConsoleTransport({
        level: this.config.defaultLevel,
        pretty: this.config.consolePretty,
      });
      this.addTransport(consoleTransport);
    }

    // Add file transport only if explicitly enabled
    if (this.config.fileEnabled) {
      const fileTransport = new FileTransport({
        level: this.config.defaultLevel,
        filePath: this.config.filePath ?? DEFAULT_CONFIG.filePath!,
        maxSize: this.config.fileMaxSize ?? DEFAULT_CONFIG.fileMaxSize,
        maxFiles: this.config.fileMaxFiles ?? DEFAULT_CONFIG.fileMaxFiles,
      });
      this.addTransport(fileTransport);
    }

    // Add custom transports from config
    if (this.config.transports) {
      for (const transport of this.config.transports) {
        this.addTransport(transport);
      }
    }
  }

  /**
   * Setup graceful shutdown handlers
   */
  private setupShutdownHandlers(): void {
    const shutdown = async () => {
      await this.close();
    };

    // Node.js/Bun
    if (isNode || isBun) {
      const handler = () => {
        // Graceful shutdown without forced exit
        // Allows other registered handlers to complete
        shutdown().catch(() => {
          // Ignore shutdown errors during exit
        });
      };
      process.on("SIGINT", handler);
      process.on("SIGTERM", handler);

      this.shutdownHandlers.push(() => {
        process.removeListener("SIGINT", handler);
        process.removeListener("SIGTERM", handler);
      });
    }

    // Deno
    if (isDeno) {
      // @ts-ignore - Deno types not available in all runtimes
      const handler = () => {
        // Graceful shutdown without forced exit
        shutdown().catch(() => {
          // Ignore shutdown errors during exit
        });
      };
      // @ts-ignore
      (globalThis as any).Deno.addSignalListener("SIGINT", handler);
      // @ts-ignore
      (globalThis as any).Deno.addSignalListener("SIGTERM", handler);

      this.shutdownHandlers.push(() => {
        // @ts-ignore
        (globalThis as any).Deno.removeSignalListener("SIGINT", handler);
        // @ts-ignore
        (globalThis as any).Deno.removeSignalListener("SIGTERM", handler);
      });
    }
  }

  /**
   * Add a transport
   * @param transport - Transport implementation
   */
  addTransport(transport: ErrorTransport): void {
    this.transports.set(transport.name, transport);
  }

  /**
   * Remove a transport
   * @param name - Transport name
   */
  removeTransport(name: string): boolean {
    const transport = this.transports.get(name);
    if (!transport) {
      return false;
    }

    // Cleanup if available
    if (transport.close) {
      transport.close().catch(() => {
        // Ignore close errors
      });
    }

    return this.transports.delete(name);
  }

  /**
   * Get all registered transports
   */
  getTransports(): ErrorTransport[] {
    return Array.from(this.transports.values());
  }

  /**
   * Check if a transport is registered
   */
  hasTransport(name: string): boolean {
    return this.transports.has(name);
  }

  /**
   * Log an error
   * @param error - Error to log
   * @param context - Optional context
   */
  async log(
    error: FerriqaError,
    context?: Partial<ErrorContext>,
  ): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    // Build full context
    const fullContext: ErrorContext = {
      timestamp: context?.timestamp ?? new Date(),
      runtime: context?.runtime ?? getRuntimeInfo(),
      requestId: context?.requestId ?? generateRequestId(),
      userId: context?.userId,
      path: context?.path,
      method: context?.method,
      sessionId: context?.sessionId,
      metadata: context?.metadata,
    };

    // Dispatch to all applicable transports
    const promises: Promise<void>[] = [];

    for (const transport of this.transports.values()) {
      const errorLevel = this.errorToLogLevel(error);

      // Skip if transport level is higher than error level
      if (transport.level > errorLevel) {
        continue;
      }

      // Send to transport
      const result = transport.send(error, fullContext);

      // Handle both sync and async transports
      if (result instanceof Promise) {
        promises.push(result);
      }
    }

    // Wait for all transports
    if (promises.length > 0) {
      await Promise.all(promises);
    }
  }

  /**
   * Log an error with minimal context (auto-generated)
   */
  async logError(error: FerriqaError): Promise<void> {
    return this.log(error);
  }

  /**
   * Log a message directly (convenience method)
   * Creates a simple FerriqaError internally
   */
  async logMessage(
    level: LogLevel,
    message: string,
    context?: Partial<ErrorContext>,
  ): Promise<void> {
    const { FerriqaError } = await import("./FerriqaError.js");

    const code =
      level >= LogLevelEnum.ERROR ? "SYSTEM_INTERNAL_ERROR" : "SYSTEM_INFO";

    const error = new FerriqaError(code, message);

    await this.log(error, context);
  }

  /**
   * Flush all transports
   */
  async flush(): Promise<void> {
    const promises: Promise<void>[] = [];

    for (const transport of this.transports.values()) {
      if (transport.flush) {
        const result = transport.flush();
        promises.push(result);
      }
    }

    if (promises.length > 0) {
      await Promise.all(promises);
    }
  }

  /**
   * Close all transports and cleanup
   */
  async close(): Promise<void> {
    await this.flush();

    // Close all transports
    const promises: Promise<void>[] = [];

    for (const transport of this.transports.values()) {
      if (transport.close) {
        const result = transport.close();
        promises.push(result);
      }
    }

    if (promises.length > 0) {
      await Promise.all(promises);
    }

    // Remove shutdown handlers
    for (const handler of this.shutdownHandlers) {
      handler();
    }
    this.shutdownHandlers = [];

    // Clear transports
    this.transports.clear();
    this.initialized = false;
  }

  /**
   * Update configuration
   * @param config - New configuration (partial)
   */
  updateConfig(config: Partial<ErrorLoggerConfig>): void {
    this.config = { ...this.config, ...config };

    // Re-setup transports if needed
    if (
      config.consoleOutput !== undefined ||
      config.fileEnabled !== undefined
    ) {
      // Remove existing default transports
      this.removeTransport("console");
      this.removeTransport("file");

      // Re-setup
      this.setupDefaultTransports();
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): ErrorLoggerConfig {
    return { ...this.config };
  }

  /**
   * Enable/disable logging
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  /**
   * Convert error to log level
   */
  private errorToLogLevel(error: FerriqaError): LogLevel {
    // Map error codes to log levels
    if (error.statusCode >= 500) {
      return LogLevelEnum.ERROR;
    }
    if (error.statusCode >= 400) {
      return LogLevelEnum.WARN;
    }
    // For status codes < 400 (2xx, 3xx), these are informational
    if (error.statusCode >= 300) {
      return LogLevelEnum.INFO;
    }
    return LogLevelEnum.DEBUG;
  }
}

/**
 * Create a singleton logger instance
 * Lazily initialized on first use
 */
let globalLogger: FerriqaErrorLogger | null = null;

/**
 * Get global logger instance
 * Creates default instance if not exists
 */
export function getGlobalLogger(): FerriqaErrorLogger {
  if (!globalLogger) {
    globalLogger = new FerriqaErrorLogger();
  }
  return globalLogger;
}

/**
 * Set global logger instance
 * Useful for testing or custom configuration
 */
export function setGlobalLogger(logger: FerriqaErrorLogger): void {
  globalLogger = logger;
}

/**
 * Reset global logger
 * Removes current instance (useful for testing)
 */
export function resetGlobalLogger(): void {
  if (globalLogger) {
    globalLogger.close().catch(() => {
      // Ignore close errors
    });
  }
  globalLogger = null;
}
