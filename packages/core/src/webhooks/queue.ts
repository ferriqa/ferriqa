/**
 * @ferriqa/core/webhooks/queue - In-Memory Delivery Queue
 *
 * Priority queue for async webhook delivery with retry support
 */

import type { WebhookJob, WebhookJobProcessor } from "./types.ts";
import type { WebhookRetryManager } from "./retry.ts";
import { generateUUID } from "./utils.ts";

interface QueueOptions {
  maxConcurrent?: number;
  processIntervalMs?: number;
  retryManager?: WebhookRetryManager;
  onDeliveryLogged?: (
    webhookId: number,
    event: string,
    deliveryId: string,
    result: {
      success: false;
      duration: number;
      attempt: number;
      error: Error;
      completedAt: number;
    },
  ) => Promise<void>;
}

export class WebhookDeliveryQueue implements WebhookJobProcessor {
  private queue: WebhookJob[] = [];
  private processingCount: number = 0;
  private timer?: ReturnType<typeof setInterval>;
  private processor?: WebhookJobProcessor;
  private retryManager?: WebhookRetryManager;
  private onDeliveryLogged?: QueueOptions["onDeliveryLogged"];
  private maxConcurrent: number;
  private processIntervalMs: number;

  constructor(options: QueueOptions = {}) {
    this.maxConcurrent = options.maxConcurrent ?? 10;
    this.processIntervalMs = options.processIntervalMs ?? 1000;
    this.retryManager = options.retryManager;
    this.onDeliveryLogged = options.onDeliveryLogged;
  }

  /**
   * Set the job processor
   */
  setProcessor(processor: WebhookJobProcessor): void {
    this.processor = processor;
  }

  /**
   * Add job to queue (for immediate execution)
   */
  enqueue(job: WebhookJob): void {
    this.queue.push(job);
    this.sortQueue();
    // Trigger processing immediately to reduce latency
    setTimeout(() => {
      this.process().catch((error) => {
        console.error("[webhook queue] Immediate process error:", error);
      });
    }, 0);
  }

  /**
   * Add retry job (scheduled for later)
   * Uses Date.now() for accurate scheduling from when the retry is triggered
   *
   * DESIGN NOTE: We use Date.now() instead of cycleStartTime to ensure retries
   * are scheduled relative to when the failure occurred, not when the cycle started.
   * This prevents retries from being scheduled in the past when jobs take time to execute.
   *
   * CRITICAL: Each retry gets a new UUID to ensure unique delivery records in the database.
   * The webhook_deliveries table uses the job ID as primary key, so duplicate IDs would
   * cause constraint violations or overwrite previous delivery attempts.
   */
  scheduleRetry(job: WebhookJob, delayMs: number): void {
    const retryJob: WebhookJob = {
      ...job,
      id: generateUUID(), // CRITICAL: New unique ID for each retry attempt
      attempt: job.attempt + 1,
      delayMs,
      priority: 0,
      scheduledFor: Date.now() + delayMs,
    };
    this.queue.push(retryJob);
    this.sortQueue();
  }

  /**
   * Sort queue by priority (descending) and scheduled time
   */
  private sortQueue(): void {
    this.queue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return a.scheduledFor - b.scheduledFor;
    });
  }

  /**
   * Process queue (runs every processIntervalMs)
   *
   * DESIGN NOTE: Uses cycleStartTime for job selection AND tracks processed job IDs
   * to ensure jobs are never processed twice, even if enqueued during the current cycle.
   * The processed Set is cleared at the start of each cycle to allow retries with new IDs.
   */
  private async process(): Promise<void> {
    if (!this.processor) {
      return;
    }

    const cycleStartTime = Date.now();
    const processedThisCycle = new Set<string>();

    for (let i = this.queue.length - 1; i >= 0; i--) {
      if (this.queue[i].scheduledFor > cycleStartTime) {
        continue;
      }

      if (this.processingCount >= this.maxConcurrent) {
        break;
      }

      const job = this.queue[i];

      if (processedThisCycle.has(job.id)) {
        continue;
      }

      processedThisCycle.add(job.id);
      this.processingCount++;
      this.queue.splice(i, 1);

      this.processor
        .processJob(job)
        .finally(() => {
          this.processingCount--;
        })
        .catch((err) => {
          /**
           * CRITICAL DESIGN NOTE: This catch block handles ONLY unexpected errors
           * that escape processJob's internal try-catch. processJob() already logs
           * all expected failures (HTTP errors, network errors) to webhook_deliveries.
           *
           * This catch handles edge cases like:
           * - Unhandled promise rejections
           * - Synchronous throws in processJob
           * - Internal processor bugs
           *
           * If onDeliveryLogged callback is provided, use it to log this failure.
           * Otherwise, log to console with warning.
           */
          const errorObj = err instanceof Error ? err : new Error(String(err));
          console.error(
            "[queue] UNEXPECTED job processing error (escaped processJob catch):",
            errorObj.message,
          );

          if (this.onDeliveryLogged) {
            this.onDeliveryLogged(job.webhookId, job.event, job.id, {
              success: false,
              duration: 0,
              attempt: job.attempt,
              error: errorObj,
              completedAt: Date.now(),
            }).catch((logError) => {
              console.error("[queue] Failed to log delivery:", logError);
            });
          } else {
            console.error(
              "[queue] WARNING: This error was NOT logged to webhook_deliveries.",
              "Check processJob implementation for proper error handling.",
            );
          }

          if (job.attempt < job.maxRetries) {
            /**
             * DESIGN NOTE: Use WebhookRetryManager for consistent retry logic
             * If retryManager is available, use it with job's configured options
             * Otherwise fallback to simple exponential backoff for resilience
             * This ensures queue-level retries respect webhook configuration
             */
            const delayMs = this.retryManager
              ? this.retryManager.calculateDelay(job.attempt + 1, {
                initialDelayMs: job.initialDelayMs,
                backoffMultiplier: job.backoffMultiplier,
              })
              : Math.min(1000 * Math.pow(2, job.attempt), 60000);

            /**
             * CRITICAL: Generate new UUID for retry job to ensure unique delivery records
             * Each HTTP attempt (including retries) must have a unique ID in webhook_deliveries
             * Using the same ID would cause primary key conflicts or overwrite original delivery
             */
            const retryJob: WebhookJob = {
              ...job,
              id: generateUUID(), // New unique ID for this retry attempt
              attempt: job.attempt + 1,
              delayMs,
              priority: 0,
              scheduledFor: Date.now() + delayMs,
            };
            this.queue.push(retryJob);
            this.sortQueue();
            console.log(
              `[queue] Retrying job ${retryJob.id} (attempt ${job.attempt + 1}/${job.maxRetries}) after ${delayMs}ms`,
            );
          } else {
            console.error(
              `[queue] Job ${job.id} permanently failed after ${job.maxRetries} attempts`,
            );
          }
        });
    }
  }

  /**
   * Start queue processor
   */
  start(): void {
    if (this.timer) {
      return;
    }

    this.timer = setInterval(() => {
      this.process().catch((error) => {
        console.error("[webhook queue] Process error:", error);
      });
    }, this.processIntervalMs);
  }

  /**
   * Stop queue processor
   */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  /**
   * Get queue stats
   */
  getStats(): { pending: number; processing: number } {
    return {
      pending: this.queue.length,
      processing: this.processingCount,
    };
  }

  /**
   * Process single job (implements WebhookJobProcessor)
   * This is a no-op here - the actual processor is set via setProcessor()
   */
  async processJob(_job: WebhookJob): Promise<void> {
    throw new Error(
      "WebhookDeliveryQueue.processJob() should not be called directly. Use setProcessor() to set a processor.",
    );
  }
}
