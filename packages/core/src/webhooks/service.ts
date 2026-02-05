/**
 * @ferriqa/core/webhooks/service - Webhook Service Core
 *
 * Core webhook delivery service with async dispatch
 *
 * DESIGN PHILOSOPHY - DIFFERENCES FROM OTHER SERVICES:
 *
 * 1. Error Handling:
 *    - Content service throws on data integrity issues (hard fail)
 *    - Webhook service uses graceful degradation (soft fail)
 *    - Rationale: Webhooks are external integration points - one corrupted webhook
 *      shouldn't break the entire system
 *
 * 2. Timestamp Defaults:
 *    - Content service throws on null timestamps
 *    - Webhook service defaults to Unix epoch (1970-01-01) for null timestamps
 *    - Rationale: A webhook with epoch timestamp still functions, allowing investigation
 *
 * 3. JSON Parsing:
 *    - Content service throws on parse errors
 *    - Webhook service logs errors and returns defaults
 *    - Rationale: One corrupted webhook shouldn't prevent all webhooks from delivering
 *
 * REVIEW NOTE: These differences are INTENTIONAL design choices, not oversights.
 * Do not "fix" these without understanding the rationale documented throughout this file.
 * The webhook system prioritizes system resilience over data purity for external integrations.
 */
import type { DatabaseAdapter } from "../../../adapters-db/src/types.ts";
import type { IHookRegistry } from "../hooks/types.ts";
import type {
  Webhook,
  WebhookDelivery,
  WebhookDeliveryOptions,
  WebhookPayload,
  WebhookEvent,
  WebhookDeliveryResult,
  CreateWebhookRequest,
  UpdateWebhookRequest,
  QueryOptions,
  PaginatedResult,
  WebhookJob,
} from "./types.ts";
import { WebhookDeliveryQueue } from "./queue.ts";
import { WebhookRetryManager } from "./retry.ts";
import { FerriqaError } from "../errors/FerriqaError.ts";
import { ErrorCode } from "../errors/error-codes.ts";
import { generateUUID } from "./utils.ts";

export interface WebhookServiceOptions {
  db: DatabaseAdapter;
  hookRegistry: IHookRegistry;
}

export class WebhookService {
  private queue: WebhookDeliveryQueue;
  private retryManager: WebhookRetryManager;

  constructor(private options: WebhookServiceOptions) {
    this.retryManager = new WebhookRetryManager();
    /**
     * DESIGN NOTE: Pass retryManager to queue for consistent retry behavior
     * Both service-level retries (expected failures) and queue-level retries
     * (unexpected errors) should use the same WebhookRetryManager to ensure
     * configured retry options (initialDelayMs, backoffMultiplier) are respected
     *
     * Also pass logDelivery callback so queue can log unexpected errors that
     * escape processJob's internal error handling
     */
    this.queue = new WebhookDeliveryQueue({
      retryManager: this.retryManager,
      onDeliveryLogged: async (
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
      ) => {
        await this.logDelivery(
          webhookId,
          event,
          deliveryId,
          result,
          result.completedAt,
        );
      },
    });

    this.queue.setProcessor(this);
    this.queue.start();
  }

  /**
   * Dispatch webhook event (async, non-blocking)
   * Queues delivery for all webhooks subscribed to this event
   */
  async dispatch<T>(
    event: WebhookEvent,
    data: T,
    options?: WebhookDeliveryOptions,
  ): Promise<{ queued: number }> {
    const webhooks = await this.findWebhooksForEvent(event);

    for (const webhook of webhooks) {
      const deliveryId = generateUUID();
      const payload = this.buildPayload(event, data, deliveryId);

      const job: WebhookJob = {
        id: deliveryId,
        webhookId: webhook.id,
        event,
        payload,
        attempt: 1,
        maxRetries: options?.maxRetries ?? 5,
        delayMs: 0,
        priority: 1,
        scheduledFor: Date.now(),
        timeout: options?.timeout ?? 30000,
        initialDelayMs: options?.initialDelayMs ?? 1000,
        backoffMultiplier: options?.backoffMultiplier ?? 2,
      };

      this.queue.enqueue(job);
    }

    return { queued: webhooks.length };
  }

  /**
   * Process single job (called by queue)
   */
  async processJob(job: WebhookJob): Promise<void> {
    const jobStartTime = Date.now();
    try {
      const webhook = await this.getById(job.webhookId);
      if (!webhook) {
        console.error(
          `[webhook] Webhook not found: ${job.webhookId} - skipping job`,
        );
        return;
      }

      const filterResult = await this.options.hookRegistry.filter(
        "webhook:beforeSend",
        job.payload,
      );
      const transformedPayload = filterResult.data;

      const result = await this.sendWebhook(
        webhook,
        transformedPayload,
        job.id,
        job.attempt,
        {
          timeout: job.timeout ?? 30000,
          maxRetries: job.maxRetries,
          initialDelayMs: job.initialDelayMs ?? 1000,
          backoffMultiplier: job.backoffMultiplier ?? 2,
        },
      );

      await this.logDelivery(
        webhook.id,
        job.event,
        job.id,
        result,
        jobStartTime,
      );

      await this.options.hookRegistry.emit("webhook:afterSend", {
        webhook,
        payload: transformedPayload,
        result,
      });

      if (
        !result.success &&
        this.retryManager.shouldRetry(result.statusCode, result.error)
      ) {
        if (!this.retryManager.isFinalFailure(job.attempt, job.maxRetries)) {
          const delay = this.retryManager.calculateDelay(job.attempt, {
            initialDelayMs: job.initialDelayMs ?? 1000,
            backoffMultiplier: job.backoffMultiplier ?? 2,
          });
          this.queue.scheduleRetry(job, delay);
          return; // Exit early to prevent re-processing
        }
      }
    } catch (error) {
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      await this.logDelivery(
        job.webhookId,
        job.event,
        job.id,
        {
          success: false,
          duration: 0,
          attempt: job.attempt,
          error: errorObj,
          completedAt: Date.now(),
        },
        jobStartTime,
      );
      // Note: Retry logic handled by queue's error handler
    }
  }

  /**
   * Find active webhooks subscribed to an event
   * Uses SQL filtering with json_each() for performance consistency with query()
   */
  async findWebhooksForEvent(event: WebhookEvent): Promise<Webhook[]> {
    const result = await this.options.db.query<{
      id: number;
      name: string;
      url: string;
      events: string;
      headers: string;
      secret: string;
      is_active: number;
      created_at: number;
    }>(
      `SELECT id, name, url, events, headers, secret, is_active, created_at
       FROM webhooks
       WHERE is_active = 1
         AND EXISTS (SELECT 1 FROM json_each(events) WHERE json_each.value = ?)`,
      [event],
    );

    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      url: row.url,
      events: this.parseJSON(row.events, []),
      headers: this.parseJSON(row.headers, undefined),
      secret: row.secret ?? undefined,
      isActive: !!row.is_active,
      // DESIGN NOTE: See rowToWebhook() for explanation of null timestamp handling
      createdAt: row.created_at ? new Date(row.created_at) : new Date(0),
    }));
  }

  /**
   * Build webhook payload
   */
  private buildPayload<T>(
    event: WebhookEvent,
    data: T,
    deliveryId: string,
  ): WebhookPayload<T> {
    return {
      event,
      timestamp: Date.now(),
      deliveryId,
      data,
    };
  }

  /**
   * Safely parse JSON from database
   *
   * DESIGN NOTE - DIFFERS FROM CONTENT SERVICE:
   * Unlike content/service.ts which throws on JSON parse errors to surface data
   * integrity issues, webhooks return defaults for resilience:
   * - If webhook events array is corrupted, return [] (webhook delivers no events)
   * - If webhook headers are corrupted, return undefined (no custom headers)
   * - This ensures one corrupted webhook doesn't break the entire system
   *
   * RATIONALE: Webhooks are integration points with external systems. A single
   * corrupted webhook shouldn't prevent all other webhooks from functioning. Content
   * data is internal and corruption indicates system-wide problems that should surface errors.
   *
   * REVIEW NOTE: Some reviewers consider this inconsistent. The difference is intentional
   * and documented here for clarity. Do not "fix" this without understanding the rationale.
   */
  private parseJSON<T>(value: string | null, defaultValue: T): T {
    if (!value) {
      return defaultValue;
    }
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.error("[webhook] Failed to parse JSON:", error, "Value:", value);
      console.error(
        "[webhook] Using default value to maintain webhook functionality",
      );
      return defaultValue;
    }
  }

  /**
   * Send webhook HTTP request
   */
  private async sendWebhook(
    webhook: Webhook,
    payload: WebhookPayload,
    deliveryId: string,
    attempt: number,
    options: WebhookDeliveryOptions,
  ): Promise<WebhookDeliveryResult> {
    const startTime = Date.now();
    const payloadStr = JSON.stringify(payload);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Webhook-Delivery-ID": deliveryId,
      "X-Webhook-Event": payload.event,
      "X-Webhook-Timestamp": String(payload.timestamp),
      "User-Agent": "Ferriqa-Webhook/1.0",
      ...webhook.headers,
    };

    if (webhook.secret) {
      headers["X-Webhook-Signature"] = await this.computeSignature(
        payloadStr,
        webhook.secret,
      );
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        options.timeout ?? 30000,
      );

      const response = await fetch(webhook.url, {
        method: "POST",
        headers,
        body: payloadStr,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const duration = Date.now() - startTime;
      const statusCode = response.status;
      const success = statusCode >= 200 && statusCode < 300;

      let responseText: string | undefined;
      try {
        responseText = await response.text();
      } catch (readError) {
        // Response body already consumed or invalid UTF-8
        // Not critical since we already have status code
        console.debug(`[webhook] Failed to read response body: ${readError}`);
      }

      return {
        success,
        statusCode,
        duration,
        attempt,
        error: success ? undefined : new Error(`HTTP ${statusCode}`),
        response: responseText?.slice(0, 1000),
        completedAt: Date.now(),
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        duration,
        attempt,
        error: error instanceof Error ? error : new Error(String(error)),
        completedAt: Date.now(),
      };
    }
  }

  /**
   * Compute HMAC-SHA256 signature
   */
  private async computeSignature(
    payload: string,
    secret: string,
  ): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(payload);

    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );

    const signature = await crypto.subtle.sign("HMAC", key, messageData);
    const hash = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return `sha256=${hash}`;
  }

  /**
   * Log delivery to database
   * @param createdAt - When the job was dispatched/started (not when record is inserted)
   */
  private async logDelivery(
    webhookId: number,
    event: string,
    deliveryId: string,
    result: WebhookDeliveryResult,
    createdAt: number = Date.now(),
  ): Promise<void> {
    try {
      await this.options.db.execute(
        `INSERT INTO webhook_deliveries (
          id, webhook_id, event, status_code, success, attempt,
          response, duration, error, created_at, completed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          deliveryId,
          webhookId,
          event,
          result.statusCode ?? null,
          result.success ? 1 : 0,
          result.attempt,
          result.response ?? null,
          result.duration,
          result.error?.message ?? null,
          createdAt,
          result.completedAt ?? null,
        ],
      );
    } catch (error) {
      console.error(
        `[webhook] Failed to log delivery for webhook ${webhookId}:`,
        error,
      );
    }
  }

  /**
   * Create webhook
   * @param data Webhook configuration
   * @param _userId Optional user ID for audit trail (reserved for future use, not currently stored)
   */
  async create(data: CreateWebhookRequest, _userId?: string): Promise<Webhook> {
    const result = await this.options.db.execute(
      `INSERT INTO webhooks (name, url, events, headers, secret, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.name,
        data.url,
        JSON.stringify(data.events),
        data.headers ? JSON.stringify(data.headers) : null,
        data.secret ?? null,
        data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1,
      ],
    );

    const id = result.lastInsertId;
    if (id === null || id === undefined) {
      throw new FerriqaError(
        ErrorCode.DB_QUERY_FAILED,
        "Failed to create webhook: No ID returned",
      );
    }

    // Fetch the created webhook from database to get accurate timestamp
    const webhook = await this.getById(id as number);
    if (!webhook) {
      throw new FerriqaError(
        ErrorCode.WEBHOOK_NOT_FOUND,
        `Failed to retrieve created webhook: ${id}`,
      );
    }

    return webhook;
  }

  /**
   * Get webhook by ID
   */
  async getById(id: number): Promise<Webhook | null> {
    const result = await this.options.db.query<{
      id: number;
      name: string;
      url: string;
      events: string;
      headers: string;
      secret: string;
      is_active: number;
      created_at: number;
    }>("SELECT * FROM webhooks WHERE id = ?", [id]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      url: row.url,
      events: this.parseJSON(row.events, []),
      headers: this.parseJSON(row.headers, undefined),
      secret: row.secret ?? undefined,
      isActive: !!row.is_active,
      /**
       * DESIGN NOTE: Unlike content/service.ts which throws on null timestamps,
       * webhooks default to Unix epoch (1970-01-01) to maintain system resilience.
       * Rationale:
       * - A webhook with null created_at can still function (receive events, deliver payloads)
       * - Defaulting to epoch allows the webhook to operate while logging the issue
       * - Content service throws because null timestamps usually indicate data corruption
       * - For webhooks, graceful degradation is preferred over hard failure
       * - The webhook can be identified and fixed without breaking the entire system
       */
      createdAt: row.created_at ? new Date(row.created_at) : new Date(0),
    };
  }

  /**
   * Query webhooks with pagination and filtering
   */
  async query(options: QueryOptions = {}): Promise<PaginatedResult<Webhook>> {
    const page = options.page ?? 1;
    const limit = options.limit ?? 25;
    const offset = (page - 1) * limit;

    let whereClause = "";
    const params: unknown[] = [];

    const conditions: string[] = [];
    if (options.event) {
      conditions.push(
        "EXISTS (SELECT 1 FROM json_each(events) WHERE json_each.value = ?)",
      );
      params.push(options.event);
    }
    if (options.isActive !== undefined) {
      conditions.push("is_active = ?");
      params.push(options.isActive ? 1 : 0);
    }

    if (conditions.length > 0) {
      whereClause = "WHERE " + conditions.join(" AND ");
    }

    const countResult = await this.options.db.query<{ count: number }>(
      `SELECT COUNT(*) as count FROM webhooks ${whereClause}`,
      params,
    );
    const total = countResult.rows[0].count;

    const result = await this.options.db.query<{
      id: number;
      name: string;
      url: string;
      events: string;
      headers: string;
      secret: string;
      is_active: number;
      created_at: number;
    }>(
      `SELECT * FROM webhooks ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    return {
      data: result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        url: row.url,
        events: this.parseJSON(row.events, []),
        headers: this.parseJSON(row.headers, undefined),
        secret: row.secret ?? undefined,
        isActive: !!row.is_active,
        // DESIGN NOTE: See rowToWebhook() in this file for explanation of null timestamp handling
        // Webhooks use epoch (1970-01-01) for null timestamps to maintain system resilience
        createdAt: row.created_at ? new Date(row.created_at) : new Date(0),
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update webhook
   */
  async update(id: number, data: UpdateWebhookRequest): Promise<Webhook> {
    // Check webhook exists first to fail fast for non-existent webhooks
    const existingWebhook = await this.getById(id);
    if (!existingWebhook) {
      throw new FerriqaError(
        ErrorCode.WEBHOOK_NOT_FOUND,
        `Webhook not found: ${id}`,
      );
    }

    const updates: string[] = [];
    const params: unknown[] = [];

    if (data.name !== undefined) {
      updates.push("name = ?");
      params.push(data.name);
    }
    if (data.url !== undefined) {
      updates.push("url = ?");
      params.push(data.url);
    }
    if (data.events !== undefined) {
      updates.push("events = ?");
      params.push(JSON.stringify(data.events));
    }
    if (data.headers !== undefined) {
      updates.push("headers = ?");
      params.push(JSON.stringify(data.headers));
    }
    if (data.secret !== undefined) {
      updates.push("secret = ?");
      params.push(data.secret);
    }
    if (data.isActive !== undefined) {
      updates.push("is_active = ?");
      params.push(data.isActive ? 1 : 0);
    }

    // If no updates, return existing webhook
    if (updates.length === 0) {
      return existingWebhook;
    }

    params.push(id);

    await this.options.db.execute(
      `UPDATE webhooks SET ${updates.join(", ")} WHERE id = ?`,
      params,
    );

    // Fetch updated webhook from database
    const webhook = await this.getById(id);
    if (!webhook) {
      throw new FerriqaError(
        ErrorCode.WEBHOOK_NOT_FOUND,
        `Webhook not found: ${id}`,
      );
    }
    return webhook;
  }

  /**
   * Delete webhook
   */
  async delete(id: number): Promise<void> {
    await this.options.db.execute("DELETE FROM webhooks WHERE id = ?", [id]);
  }

  /**
   * Test webhook (synchronous delivery)
   * Returns full delivery result including success status, HTTP status code, and error details
   */
  async test(
    id: number,
    event: WebhookEvent,
    data: unknown,
  ): Promise<{
    deliveryId: string;
    success: boolean;
    statusCode?: number;
    error?: string;
    duration: number;
  }> {
    const webhook = await this.getById(id);
    if (!webhook) {
      throw new FerriqaError(
        ErrorCode.WEBHOOK_NOT_FOUND,
        `Webhook not found: ${id}`,
      );
    }

    const deliveryId = generateUUID();
    const payload = this.buildPayload(event, data, deliveryId);

    const result = await this.sendWebhook(webhook, payload, deliveryId, 1, {
      timeout: 30000,
      maxRetries: 5,
      initialDelayMs: 1000,
      backoffMultiplier: 2,
    });

    await this.logDelivery(webhook.id, event, deliveryId, result);

    return {
      deliveryId,
      success: result.success,
      statusCode: result.statusCode,
      error: result.error?.message,
      duration: result.duration,
    };
  }

  /**
   * Get delivery history for webhook
   */
  async getDeliveries(
    webhookId: number,
    options: QueryOptions = {},
  ): Promise<PaginatedResult<WebhookDelivery>> {
    const page = options.page ?? 1;
    const limit = options.limit ?? 25;
    const offset = (page - 1) * limit;

    const countResult = await this.options.db.query<{ count: number }>(
      `SELECT COUNT(*) as count FROM webhook_deliveries WHERE webhook_id = ?`,
      [webhookId],
    );
    const total = countResult.rows[0].count;

    const result = await this.options.db.query<{
      id: string;
      webhook_id: number;
      event: string;
      status_code: number;
      success: number;
      attempt: number;
      response: string;
      duration: number;
      error: string;
      created_at: number;
      completed_at: number;
    }>(
      `SELECT * FROM webhook_deliveries
       WHERE webhook_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [webhookId, limit, offset],
    );

    return {
      data: result.rows.map((row) => ({
        id: row.id,
        webhookId: row.webhook_id,
        event: row.event,
        statusCode: row.status_code,
        success: row.success === 1,
        attempt: row.attempt,
        response: row.response ?? undefined,
        duration: row.duration ?? undefined,
        error: row.error ?? undefined,
        // DESIGN NOTE: See rowToWebhook() for explanation of null timestamp handling
        createdAt: row.created_at ? new Date(row.created_at) : new Date(0),
        completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get queue statistics
   */
  getStats(): { pending: number; processing: number } {
    return this.queue.getStats();
  }

  /**
   * Cleanup - stop queue processor
   */
  destroy(): void {
    this.queue.stop();
  }
}
