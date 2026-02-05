/**
 * @ferriqa/core/webhooks/retry - Retry Logic with Exponential Backoff
 *
 * Manages webhook retry decisions and delay calculations
 */

import type { WebhookDeliveryOptions } from "./types.ts";

/**
 * Error categories for retry decision making
 * More robust than string matching alone
 */
const ErrorCategory = {
  PERMANENT_NETWORK: "PERMANENT_NETWORK",
  TEMPORARY_NETWORK: "TEMPORARY_NETWORK",
  CERTIFICATE: "CERTIFICATE",
  TIMEOUT: "TIMEOUT",
  CLIENT_ERROR: "CLIENT_ERROR",
} as const;

/**
 * Classify error into category for retry decision
 * Uses multiple heuristics for robustness across platforms
 */
function classifyError(error: Error): string | null {
  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();
  const code = (error as any).code?.toLowerCase();

  // Check for certificate errors (highest priority - never retry)
  if (
    message.includes("cert_") ||
    message.includes("certificate") ||
    message.includes("tls") ||
    name.includes("certerror") ||
    code === "cert_"
  ) {
    return ErrorCategory.CERTIFICATE;
  }

  // Check for DNS failures and connection refused (permanent)
  if (
    message.includes("enotfound") ||
    message.includes("dns") ||
    message.includes("econnrefused") ||
    code === "enotfound" ||
    code === "econnrefused" ||
    name.includes("dnserror")
  ) {
    return ErrorCategory.PERMANENT_NETWORK;
  }

  // Check for timeout errors (retryable)
  if (
    message.includes("etimedout") ||
    message.includes("timeout") ||
    code === "etimedout" ||
    name.includes("timeouterror")
  ) {
    return ErrorCategory.TIMEOUT;
  }

  // Check for connection reset (permanent - see note above)
  if (message.includes("econnreset") || code === "econnreset") {
    return ErrorCategory.PERMANENT_NETWORK;
  }

  // Check for temporary network errors (retryable)
  if (
    message.includes("econnaborted") ||
    message.includes("ehostunreach") ||
    message.includes("enetworkunreach") ||
    message.includes("eai_again") ||
    message.includes("eai_noname") ||
    message.includes("socket hang up") ||
    message.includes("epipe") ||
    message.includes("conn") ||
    message.includes("network") ||
    message.includes("socket")
  ) {
    return ErrorCategory.TEMPORARY_NETWORK;
  }

  // Check for HTTP client errors in message (4xx)
  if (
    message.includes("404") ||
    message.includes("401") ||
    message.includes("403") ||
    message.includes("400")
  ) {
    return ErrorCategory.CLIENT_ERROR;
  }

  // Unknown error - default to temporary for safety
  return null;
}

export class WebhookRetryManager {
  /**
   * Calculate next retry delay using exponential backoff
   */
  calculateDelay(
    attempt: number,
    options: WebhookDeliveryOptions = {},
  ): number {
    const baseDelay = options.initialDelayMs ?? 1000;
    const multiplier = options.backoffMultiplier ?? 2;
    return baseDelay * Math.pow(multiplier, attempt - 1);
  }

  /**
   * Determine if a delivery should be retried
   * Uses error classification + HTTP status codes for robust decision making
   */
  shouldRetry(
    statusCode: number | undefined,
    error: Error | undefined,
  ): boolean {
    if (error) {
      const category = classifyError(error);

      // Don't retry permanent failures
      if (
        category === ErrorCategory.CERTIFICATE ||
        category === ErrorCategory.PERMANENT_NETWORK ||
        category === ErrorCategory.CLIENT_ERROR
      ) {
        return false;
      }

      // Retry temporary network errors
      if (
        category === ErrorCategory.TEMPORARY_NETWORK ||
        category === ErrorCategory.TIMEOUT
      ) {
        return true;
      }

      // Default to retrying unknown errors conservatively
      return true;
    }

    if (!statusCode) {
      return false;
    }

    if (statusCode >= 500 && statusCode < 600) {
      return true;
    }

    if (statusCode === 408 || statusCode === 429) {
      return true;
    }

    if (statusCode >= 400 && statusCode < 500) {
      return false;
    }

    return false;
  }

  /**
   * Check if max retries has been reached
   */
  isFinalFailure(attempt: number, maxRetries: number): boolean {
    return attempt >= maxRetries;
  }
}
