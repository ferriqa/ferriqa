/**
 * @ferriqa/core - File Transport
 *
 * File output transport for error logging
 * Supports log rotation and async file operations
 * MUST BE EXPLICITLY ENABLED via FERRIQA_ERROR_FILE_ENABLED
 */

import type { ErrorTransport, ErrorContext } from "../types.ts";
import { LogLevel } from "../types.ts";
import { FerriqaError } from "../FerriqaError.ts";
import { isBun, isDeno, isNode } from "../../runtime.ts";

/**
 * File Transport implementation
 * Writes errors to file with rotation support
 */
export class FileTransport implements ErrorTransport {
  readonly name = "file";
  readonly level: LogLevel;

  private filePath: string;
  private maxSize: number;
  private maxFiles: number;
  private currentSize: number = 0;
  private currentFileIndex: number = 0;
  private initialized: boolean = false;
  private writeQueue: string[] = [];
  private writing: boolean = false;

  /**
   * Create a file transport
   * @param options - Configuration options
   */
  constructor(options: {
    /** Minimum log level (default: DEBUG) */
    level?: LogLevel;
    /** Log file directory path */
    filePath: string;
    /** Maximum file size in bytes (default: 10MB) */
    maxSize?: number;
    /** Maximum number of rotated files (default: 5) */
    maxFiles?: number;
  }) {
    this.level = options.level ?? LogLevel.DEBUG;
    this.filePath = options.filePath;
    this.maxSize = options.maxSize ?? 10 * 1024 * 1024; // 10MB default
    this.maxFiles = options.maxFiles ?? 5;
  }

  /**
   * Initialize transport - create directory and check current file
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Ensure directory exists
      await this.ensureDirectory();

      // Check current file size
      await this.checkCurrentFile();

      this.initialized = true;
    } catch (error) {
      console.error(`Failed to initialize file transport: ${error}`);
      throw error;
    }
  }

  /**
   * Send error to file
   */
  async send(error: FerriqaError, context: ErrorContext): Promise<void> {
    if (!this.initialized) {
      try {
        await this.initialize();
      } catch (error) {
        // Initialization failed - disable this transport to prevent further errors
        console.error(
          `FileTransport disabled due to initialization error: ${error}`,
        );
        this.initialized = false;
        return; // Silently fail - don't block other transports
      }
    }

    const logEntry = this.formatLogEntry(error, context);

    // Add to write queue
    this.writeQueue.push(logEntry);

    // Process queue
    await this.processQueue();
  }

  /**
   * Format log entry as JSON
   */
  private formatLogEntry(error: FerriqaError, context: ErrorContext): string {
    const entry = {
      timestamp: context.timestamp.toISOString(),
      level: this.errorToLogLevel(error),
      code: error.code,
      message: error.message,
      name: error.name,
      ...(context.requestId && { requestId: context.requestId }),
      ...(context.userId && { userId: context.userId }),
      ...(context.path && { path: context.path, method: context.method }),
      ...(context.runtime && {
        runtime: context.runtime,
      }),
      ...(error.metadata &&
        Object.keys(error.metadata).length > 0 && {
          metadata: error.metadata,
        }),
      ...(error.stack && { stack: error.stack }),
      ...(error.cause && {
        cause: {
          name: error.cause.name,
          message: error.cause.message,
        },
      }),
    };

    return JSON.stringify(entry) + "\n";
  }

  /**
   * Process write queue
   */
  private async processQueue(): Promise<void> {
    if (this.writing || this.writeQueue.length === 0) {
      return;
    }

    this.writing = true;

    try {
      while (this.writeQueue.length > 0) {
        const entries = this.writeQueue.splice(0, 100); // Batch writes
        const data = entries.join("");

        // Check if rotation needed
        if (this.currentSize + data.length > this.maxSize) {
          await this.rotateFile();
        }

        // Write to file
        await this.writeToFile(data);
        this.currentSize += data.length;
      }
    } finally {
      this.writing = false;
    }
  }

  /**
   * Write data to current log file
   * Includes 5-second timeout to prevent hanging on slow filesystems
   */
  private async writeToFile(data: string): Promise<void> {
    const currentFile = this.getCurrentFilePath();
    const timeoutMs = 5000; // 5 seconds

    const writePromise = async (): Promise<void> => {
      if (isBun) {
        // Bun: Use node:fs/promises for append support
        const fs = await import("node:fs/promises");
        await fs.appendFile(currentFile, data);
      } else if (isDeno) {
        // Deno: use Deno.writeTextFile
        // @ts-ignore
        await (globalThis as any).Deno.writeTextFile(currentFile, data, {
          append: true,
        });
      } else if (isNode) {
        // Node: use fs.appendFile
        const fs = await import("node:fs/promises");
        await fs.appendFile(currentFile, data, "utf-8");
      } else {
        throw new Error("Unsupported runtime for file transport");
      }
    };

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(
          new Error(`File write timeout after ${timeoutMs}ms: ${currentFile}`),
        );
      }, timeoutMs);
    });

    await Promise.race([writePromise(), timeoutPromise]);
  }

  /**
   * Get current log file path
   */
  private getCurrentFilePath(): string {
    if (this.currentFileIndex === 0) {
      return `${this.filePath}/error.log`;
    }
    return `${this.filePath}/error.log.${this.currentFileIndex}`;
  }

  /**
   * Rotate log file
   */
  private async rotateFile(): Promise<void> {
    // Increment file index
    this.currentFileIndex++;

    // Remove oldest file if max files reached
    if (this.currentFileIndex > this.maxFiles) {
      const oldestFile = `${this.filePath}/error.log.${this.currentFileIndex - this.maxFiles}`;
      await this.deleteFile(oldestFile);
    }

    // Reset current size
    this.currentSize = 0;
  }

  /**
   * Ensure log directory exists
   */
  private async ensureDirectory(): Promise<void> {
    if (isBun) {
      // Bun.file() doesn't create directories
      // Need to use fs.mkdir equivalent
      // @ts-ignore
      if (typeof Bun !== "undefined") {
        await import("node:path");
        const fs = await import("node:fs/promises");
        await fs.mkdir(this.filePath, { recursive: true });
      }
    } else if (isDeno) {
      // @ts-ignore
      await (globalThis as any).Deno.mkdir(this.filePath, { recursive: true });
    } else if (isNode) {
      const fs = await import("node:fs/promises");
      await fs.mkdir(this.filePath, { recursive: true });
    }
  }

  /**
   * Check current file size
   */
  private async checkCurrentFile(): Promise<void> {
    const currentFile = this.getCurrentFilePath();

    try {
      let stats;

      if (isBun) {
        // Bun: use Bun.file
        // @ts-ignore - Bun global is available in Bun runtime
        const file = (globalThis as any).Bun.file(currentFile);
        stats = await file.stat();
      } else if (isDeno) {
        // Deno: use Deno.stat
        // @ts-ignore
        stats = await (globalThis as any).Deno.stat(currentFile);
      } else if (isNode) {
        // Node: use fs.stat
        const fs = await import("node:fs/promises");
        stats = await fs.stat(currentFile);
      }

      if (stats) {
        this.currentSize = stats.size;

        // If current file is already too big, rotate
        if (this.currentSize >= this.maxSize) {
          await this.rotateFile();
        }
      }
    } catch {
      // File doesn't exist yet, that's fine
      this.currentSize = 0;
    }
  }

  /**
   * Delete a file
   */
  private async deleteFile(filePath: string): Promise<void> {
    try {
      if (isBun) {
        // Bun: no direct delete, use fs
        const fs = await import("node:fs/promises");
        await fs.unlink(filePath);
      } else if (isDeno) {
        // @ts-ignore
        await (globalThis as any).Deno.remove(filePath);
      } else if (isNode) {
        const fs = await import("node:fs/promises");
        await fs.unlink(filePath);
      }
    } catch {
      // File might not exist, ignore
    }
  }

  /**
   * Convert error severity to log level
   */
  private errorToLogLevel(error: FerriqaError): string {
    if (error.statusCode >= 500) {
      return "error";
    }
    if (error.statusCode >= 400) {
      return "warn";
    }
    // For status codes < 400 (2xx, 3xx), these are informational
    if (error.statusCode >= 300) {
      return "info";
    }
    return "debug";
  }

  /**
   * Flush remaining logs
   */
  async flush(): Promise<void> {
    await this.processQueue();
  }

  /**
   * Close transport and cleanup
   */
  async close(): Promise<void> {
    await this.flush();
    this.initialized = false;
  }
}
