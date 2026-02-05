/**
 * @ferriqa/core - Webhook Queue & Retry Unit Tests
 *
 * Based on Task 5.2: Queue & Retry Tests
 */

import { describe, it, expect } from "../../testing/index.ts";
import { WebhookDeliveryQueue } from "../queue.ts";
import { WebhookRetryManager } from "../retry.ts";
import type { WebhookJob, WebhookJobProcessor } from "../types.ts";

// Mock Job Processor
class MockProcessor implements WebhookJobProcessor {
    processedJobs: WebhookJob[] = [];

    async processJob(job: WebhookJob): Promise<void> {
        this.processedJobs.push(job);
    }
}

describe("WebhookDeliveryQueue", () => {
    it("should enqueue and process jobs", async () => {
        const queue = new WebhookDeliveryQueue({ processIntervalMs: 10 });
        const processor = new MockProcessor();
        queue.setProcessor(processor);

        const job: WebhookJob = {
            id: "job-1",
            webhookId: 1,
            event: "content.created",
            payload: { event: "content.created", timestamp: Date.now(), deliveryId: "job-1", data: {} },
            attempt: 1,
            maxRetries: 5,
            delayMs: 0,
            priority: 1,
            scheduledFor: Date.now(),
        };

        queue.enqueue(job);

        // Wait for immediate trigger or next tick
        await new Promise(resolve => setTimeout(resolve, 50));

        expect(processor.processedJobs).toHaveLength(1);
        expect(processor.processedJobs[0].id).toBe("job-1");

        queue.stop();
    });

    it("should process jobs in priority order", async () => {
        // Stop the timer so we can check the queue state and trigger manually
        const queue = new WebhookDeliveryQueue({ processIntervalMs: 10000 });
        const processor = new MockProcessor();
        queue.setProcessor(processor);

        const lowPriorityJob: WebhookJob = {
            id: "low",
            webhookId: 1,
            event: "content.created",
            payload: { event: "content.created", timestamp: Date.now(), deliveryId: "low", data: {} },
            attempt: 1,
            maxRetries: 5,
            delayMs: 0,
            priority: 0,
            scheduledFor: Date.now(),
        };

        const highPriorityJob: WebhookJob = {
            id: "high",
            webhookId: 1,
            event: "content.created",
            payload: { event: "content.created", timestamp: Date.now(), deliveryId: "high", data: {} },
            attempt: 1,
            maxRetries: 5,
            delayMs: 0,
            priority: 2,
            scheduledFor: Date.now(),
        };

        queue.enqueue(lowPriorityJob);
        queue.enqueue(highPriorityJob);

        // Trigger process manually through any cast
        await (queue as any).process();

        expect(processor.processedJobs).toHaveLength(2);
        expect(processor.processedJobs[0].id).toBe("high");
        expect(processor.processedJobs[1].id).toBe("low");

        queue.stop();
    });

    it("should skip jobs scheduled for future", async () => {
        const queue = new WebhookDeliveryQueue({ processIntervalMs: 10000 });
        const processor = new MockProcessor();
        queue.setProcessor(processor);

        const futureJob: WebhookJob = {
            id: "future",
            webhookId: 1,
            event: "content.created",
            payload: { event: "content.created", timestamp: Date.now(), deliveryId: "future", data: {} },
            attempt: 1,
            maxRetries: 5,
            delayMs: 1000,
            priority: 1,
            scheduledFor: Date.now() + 10000,
        };

        queue.enqueue(futureJob);

        await (queue as any).process();

        expect(processor.processedJobs).toHaveLength(0);
        expect(queue.getStats().pending).toBe(1);

        queue.stop();
    });

    it("should handle retries correctly", async () => {
        const queue = new WebhookDeliveryQueue({ processIntervalMs: 10000 });
        const processor = new MockProcessor();
        queue.setProcessor(processor);

        const job: WebhookJob = {
            id: "job-orig",
            webhookId: 1,
            event: "content.created",
            payload: { event: "content.created", timestamp: Date.now(), deliveryId: "job-orig", data: {} },
            attempt: 1,
            maxRetries: 5,
            delayMs: 0,
            priority: 1,
            scheduledFor: Date.now(),
        };

        queue.scheduleRetry(job, 1000);

        const stats = queue.getStats();
        expect(stats.pending).toBe(1);

        // Should be at the end of the queue (low priority for retries)
        // and have a new ID
        const pendingJob = (queue as any).queue[0];
        expect(pendingJob.id).not.toBe("job-orig");
        expect(pendingJob.attempt).toBe(2);
        expect(pendingJob.priority).toBe(0);

        queue.stop();
    });
});

describe("WebhookRetryManager", () => {
    const retryManager = new WebhookRetryManager();

    describe("calculateDelay", () => {
        it("should implement exponential backoff", () => {
            const options = { initialDelayMs: 1000, backoffMultiplier: 2 };

            expect(retryManager.calculateDelay(1, options)).toBe(1000);
            expect(retryManager.calculateDelay(2, options)).toBe(2000);
            expect(retryManager.calculateDelay(3, options)).toBe(4000);
            expect(retryManager.calculateDelay(4, options)).toBe(8000);
        });

        it("should use default options if not provided", () => {
            expect(retryManager.calculateDelay(1)).toBe(1000);
            expect(retryManager.calculateDelay(2)).toBe(2000);
        });
    });

    describe("shouldRetry", () => {
        it("should retry on 5xx errors", () => {
            expect(retryManager.shouldRetry(500, undefined)).toBe(true);
            expect(retryManager.shouldRetry(503, undefined)).toBe(true);
        });

        it("should retry on 408 and 429", () => {
            expect(retryManager.shouldRetry(408, undefined)).toBe(true);
            expect(retryManager.shouldRetry(429, undefined)).toBe(true);
        });

        it("should NOT retry on other 4xx errors", () => {
            expect(retryManager.shouldRetry(400, undefined)).toBe(false);
            expect(retryManager.shouldRetry(401, undefined)).toBe(false);
            expect(retryManager.shouldRetry(404, undefined)).toBe(false);
        });

        it("should retry on temporary network errors", () => {
            const timeoutError = new Error("ETIMEDOUT");
            expect(retryManager.shouldRetry(undefined, timeoutError)).toBe(true);

            const socketError = new Error("socket hang up");
            expect(retryManager.shouldRetry(undefined, socketError)).toBe(true);
        });

        it("should NOT retry on permanent network errors", () => {
            const dnsError = new Error("ENOTFOUND");
            expect(retryManager.shouldRetry(undefined, dnsError)).toBe(false);

            const connRefused = new Error("ECONNREFUSED");
            expect(retryManager.shouldRetry(undefined, connRefused)).toBe(false);
        });

        it("should NOT retry on certificate errors", () => {
            const certError = new Error("CERT_HAS_EXPIRED");
            expect(retryManager.shouldRetry(undefined, certError)).toBe(false);
        });
    });

    describe("isFinalFailure", () => {
        it("should correctly identify final failure", () => {
            expect(retryManager.isFinalFailure(5, 5)).toBe(true);
            expect(retryManager.isFinalFailure(6, 5)).toBe(true);
            expect(retryManager.isFinalFailure(4, 5)).toBe(false);
        });
    });
});
