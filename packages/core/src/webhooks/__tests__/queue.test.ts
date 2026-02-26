/**
 * @ferriqa/core - Webhook Queue & Retry Unit Tests
 *
 * Based on Task 5.2: Queue & Retry Tests
 */

import { test } from "@cross/test";
import { assertEquals, assertStrictEquals } from "@std/assert";
import { WebhookDeliveryQueue } from "../queue.ts";
import { WebhookRetryManager } from "../retry.ts";
import type { WebhookJob, WebhookJobProcessor } from "../types.ts";

class MockProcessor implements WebhookJobProcessor {
  processedJobs: WebhookJob[] = [];

  async processJob(job: WebhookJob): Promise<void> {
    this.processedJobs.push(job);
  }
}

test("WebhookDeliveryQueue > should enqueue and process jobs", async () => {
  const queue = new WebhookDeliveryQueue({ processIntervalMs: 10 });
  const processor = new MockProcessor();
  queue.setProcessor(processor);

  const job: WebhookJob = {
    id: "job-1",
    webhookId: 1,
    event: "content.created",
    payload: {
      event: "content.created",
      timestamp: Date.now(),
      deliveryId: "job-1",
      data: {},
    },
    attempt: 1,
    maxRetries: 5,
    delayMs: 0,
    priority: 1,
    scheduledFor: Date.now(),
  };

  queue.enqueue(job);

  await new Promise((resolve) => setTimeout(resolve, 20));

  assertEquals(processor.processedJobs.length, 1);
  assertStrictEquals(processor.processedJobs[0].id, "job-1");

  queue.stop();
});

test("WebhookDeliveryQueue > should process jobs in priority order", async () => {
  const queue = new WebhookDeliveryQueue({ processIntervalMs: 10000 });
  const processor = new MockProcessor();
  queue.setProcessor(processor);

  const lowPriorityJob: WebhookJob = {
    id: "low",
    webhookId: 1,
    event: "content.created",
    payload: {
      event: "content.created",
      timestamp: Date.now(),
      deliveryId: "low",
      data: {},
    },
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
    payload: {
      event: "content.created",
      timestamp: Date.now(),
      deliveryId: "high",
      data: {},
    },
    attempt: 1,
    maxRetries: 5,
    delayMs: 0,
    priority: 2,
    scheduledFor: Date.now(),
  };

  queue.enqueue(lowPriorityJob);
  queue.enqueue(highPriorityJob);

  await (queue as any).process();

  assertEquals(processor.processedJobs.length, 2);
  assertStrictEquals(processor.processedJobs[0].id, "high");
  assertStrictEquals(processor.processedJobs[1].id, "low");

  queue.stop();
});

test("WebhookDeliveryQueue > should skip jobs scheduled for future", async () => {
  const queue = new WebhookDeliveryQueue({ processIntervalMs: 10000 });
  const processor = new MockProcessor();
  queue.setProcessor(processor);

  const futureJob: WebhookJob = {
    id: "future",
    webhookId: 1,
    event: "content.created",
    payload: {
      event: "content.created",
      timestamp: Date.now(),
      deliveryId: "future",
      data: {},
    },
    attempt: 1,
    maxRetries: 5,
    delayMs: 1000,
    priority: 1,
    scheduledFor: Date.now() + 10000,
  };

  queue.enqueue(futureJob);

  await (queue as any).process();

  assertEquals(processor.processedJobs.length, 0);
  assertEquals(queue.getStats().pending, 1);

  queue.stop();
});

test("WebhookDeliveryQueue > should handle retries correctly", async () => {
  const queue = new WebhookDeliveryQueue({ processIntervalMs: 10000 });
  const processor = new MockProcessor();
  queue.setProcessor(processor);

  const job: WebhookJob = {
    id: "job-orig",
    webhookId: 1,
    event: "content.created",
    payload: {
      event: "content.created",
      timestamp: Date.now(),
      deliveryId: "job-orig",
      data: {},
    },
    attempt: 1,
    maxRetries: 5,
    delayMs: 0,
    priority: 1,
    scheduledFor: Date.now(),
  };

  queue.scheduleRetry(job, 1000);

  const stats = queue.getStats();
  assertEquals(stats.pending, 1);

  const pendingJob = (queue as any).queue[0];
  assertStrictEquals(pendingJob.id !== "job-orig", true);
  assertEquals(pendingJob.attempt, 2);
  assertEquals(pendingJob.priority, 0);

  queue.stop();
});

test("WebhookRetryManager > calculateDelay > should implement exponential backoff", () => {
  const retryManager = new WebhookRetryManager();
  const options = { initialDelayMs: 1000, backoffMultiplier: 2 };

  assertEquals(retryManager.calculateDelay(1, options), 1000);
  assertEquals(retryManager.calculateDelay(2, options), 2000);
  assertEquals(retryManager.calculateDelay(3, options), 4000);
  assertEquals(retryManager.calculateDelay(4, options), 8000);
});

test("WebhookRetryManager > calculateDelay > should use default options if not provided", () => {
  const retryManager = new WebhookRetryManager();

  assertEquals(retryManager.calculateDelay(1), 1000);
  assertEquals(retryManager.calculateDelay(2), 2000);
});

test("WebhookRetryManager > shouldRetry > should retry on 5xx errors", () => {
  const retryManager = new WebhookRetryManager();

  assertStrictEquals(retryManager.shouldRetry(500, undefined), true);
  assertStrictEquals(retryManager.shouldRetry(503, undefined), true);
});

test("WebhookRetryManager > shouldRetry > should retry on 408 and 429", () => {
  const retryManager = new WebhookRetryManager();

  assertStrictEquals(retryManager.shouldRetry(408, undefined), true);
  assertStrictEquals(retryManager.shouldRetry(429, undefined), true);
});

test("WebhookRetryManager > shouldRetry > should NOT retry on other 4xx errors", () => {
  const retryManager = new WebhookRetryManager();

  assertStrictEquals(retryManager.shouldRetry(400, undefined), false);
  assertStrictEquals(retryManager.shouldRetry(401, undefined), false);
  assertStrictEquals(retryManager.shouldRetry(404, undefined), false);
});

test("WebhookRetryManager > shouldRetry > should retry on temporary network errors", () => {
  const retryManager = new WebhookRetryManager();

  const timeoutError = new Error("ETIMEDOUT");
  assertStrictEquals(retryManager.shouldRetry(undefined, timeoutError), true);

  const socketError = new Error("socket hang up");
  assertStrictEquals(retryManager.shouldRetry(undefined, socketError), true);
});

test("WebhookRetryManager > shouldRetry > should NOT retry on permanent network errors", () => {
  const retryManager = new WebhookRetryManager();

  const dnsError = new Error("ENOTFOUND");
  assertStrictEquals(retryManager.shouldRetry(undefined, dnsError), false);

  const connRefused = new Error("ECONNREFUSED");
  assertStrictEquals(retryManager.shouldRetry(undefined, connRefused), false);
});

test("WebhookRetryManager > shouldRetry > should NOT retry on certificate errors", () => {
  const retryManager = new WebhookRetryManager();

  const certError = new Error("CERT_HAS_EXPIRED");
  assertStrictEquals(retryManager.shouldRetry(undefined, certError), false);
});

test("WebhookRetryManager > isFinalFailure > should correctly identify final failure", () => {
  const retryManager = new WebhookRetryManager();

  assertStrictEquals(retryManager.isFinalFailure(5, 5), true);
  assertStrictEquals(retryManager.isFinalFailure(6, 5), true);
  assertStrictEquals(retryManager.isFinalFailure(4, 5), false);
});
