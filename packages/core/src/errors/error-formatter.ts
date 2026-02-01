/**
 * @ferriqa/core - Error formatter
 *
 * Stack trace normalization for cross-runtime compatibility
 * Handles Bun, Node.js, and Deno stack formats
 */

import type { NormalizedStackTrace, StackFrame } from "./types.ts";
import { isBun, isDeno, isNode } from "../runtime.ts";

/**
 * Parse a single stack frame
 * Handles different runtime formats
 */
function parseStackFrame(line: string): StackFrame | null {
  // Bun format: "    at functionName (file://path:line:column)"
  // Node format: "    at functionName (path:line:column)"
  // Deno format: "    at functionName (file://path:line:column)"

  const bunMatch = line.match(
    /^\s*at\s+(?:(.+?)\s+\()?file:\/\/(.+?):(\d+):(\d+)\)?$/,
  );
  if (bunMatch) {
    return {
      functionName: bunMatch[1] || "<anonymous>",
      fileName: bunMatch[2],
      lineNumber: parseInt(bunMatch[3], 10),
      columnNumber: parseInt(bunMatch[4], 10),
    };
  }

  // Standard format with optional function name
  const standardMatch = line.match(
    /^\s*at\s+(?:(.+?)\s+\()?(.+?):(\d+):(\d+)\)?$/,
  );
  if (standardMatch) {
    return {
      functionName: standardMatch[1] || "<anonymous>",
      fileName: standardMatch[2],
      lineNumber: parseInt(standardMatch[3], 10),
      columnNumber: parseInt(standardMatch[4], 10),
    };
  }

  // Native code
  if (line.includes("native")) {
    return {
      functionName: "<native>",
      fileName: "native",
    };
  }

  // Async boundary
  if (line.includes("<anonymous>")) {
    return null; // Skip async boundaries
  }

  return null;
}

/**
 * Normalize a stack trace string
 * Cross-runtime compatible
 */
export function normalizeStackTrace(error: Error): NormalizedStackTrace {
  const stack = error.stack || "";
  const lines = stack.split("\n");

  // First line is usually the error message in some formats
  let message = error.message;
  let name = error.name;
  let startIndex = 0;

  // Check if first line contains error message
  if (lines[0] && lines[0].includes(error.message)) {
    // Extract name and message from first line
    const match = lines[0].match(/^([\w$]+):\s*(.+)$/);
    if (match) {
      name = match[1];
      message = match[2];
    }
    startIndex = 1;
  }

  // Parse stack frames
  const frames: StackFrame[] = [];
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const frame = parseStackFrame(line);
    if (frame) {
      frames.push(frame);
    }
  }

  return {
    message,
    name,
    frames,
    raw: stack,
  };
}

/**
 * Format stack trace for pretty printing
 */
export function formatStackTrace(
  error: Error,
  options?: {
    /** Include source line numbers */
    showLineNumbers?: boolean;
    /** Maximum frames to show */
    maxFrames?: number;
    /** Hide node_modules frames */
    hideNodeModules?: boolean;
  },
): string {
  const normalized = normalizeStackTrace(error);
  const opts = {
    showLineNumbers: true,
    maxFrames: 50,
    hideNodeModules: false,
    ...options,
  };

  let result = `${normalized.name}: ${normalized.message}\n`;

  let frames = normalized.frames;

  if (opts.hideNodeModules) {
    frames = frames.filter(
      (f) => f.fileName && !f.fileName.includes("node_modules"),
    );
  }

  // Limit frames
  const hiddenCount = frames.length - opts.maxFrames;
  if (frames.length > opts.maxFrames) {
    frames = frames.slice(0, opts.maxFrames);
  }

  for (const frame of frames) {
    const location = opts.showLineNumbers
      ? `${frame.fileName}:${frame.lineNumber}:${frame.columnNumber}`
      : frame.fileName;

    result += `    at ${frame.functionName} (${location})\n`;
  }

  if (hiddenCount > 0) {
    result += `    ... ${hiddenCount} more frames\n`;
  }

  return result;
}

/**
 * Format stack trace as JSON
 */
export function stackTraceToJSON(error: Error): string {
  const normalized = normalizeStackTrace(error);
  return JSON.stringify(normalized, null, 2);
}

/**
 * Get current runtime identifier for stack traces
 */
export function getRuntimeStackFormat(): "bun" | "deno" | "node" | "unknown" {
  if (isBun) return "bun";
  if (isDeno) return "deno";
  if (isNode) return "node";
  return "unknown";
}

/**
 * Clean up file paths in stack traces
 * Makes them relative and removes file:// prefix
 */
export function cleanStackTracePaths(stack: string, basePath?: string): string {
  return stack
    .split("\n")
    .map((line) => {
      // Remove file:// prefix
      line = line.replace(/file:\/\//g, "");

      // Make paths relative if basePath provided
      if (basePath && line.includes(basePath)) {
        line = line.replace(basePath, ".");
      }

      return line;
    })
    .join("\n");
}
