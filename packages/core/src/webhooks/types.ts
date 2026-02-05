/**
 * @ferriqa/core/webhooks/types - Webhook Type Definitions
 *
 * Core types for webhook system
 */

export interface Webhook {
  id: number;
  name: string;
  url: string;
  events: string[];
  headers?: Record<string, string>;
  secret?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface WebhookDelivery {
  id: string;
  webhookId: number;
  event: string;
  statusCode?: number;
  success: boolean;
  attempt: number;
  response?: string;
  duration?: number;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface WebhookDeliveryOptions {
  timeout?: number;
  maxRetries?: number;
  initialDelayMs?: number;
  backoffMultiplier?: number;
}

export interface WebhookPayload<T = unknown> {
  event: string;
  timestamp: number;
  deliveryId: string;
  data: T;
}

export type WebhookEvent =
  | "content.created"
  | "content.updated"
  | "content.deleted"
  | "content.published"
  | "content.unpublished"
  | "blueprint.created"
  | "blueprint.updated"
  | "blueprint.deleted"
  | "media.uploaded"
  | "media.deleted";

export interface CreateWebhookRequest {
  name: string;
  url: string;
  events: string[];
  headers?: Record<string, string>;
  secret?: string;
  isActive?: boolean;
}

export interface UpdateWebhookRequest {
  name?: string;
  url?: string;
  events?: string[];
  headers?: Record<string, string>;
  secret?: string | null;
  isActive?: boolean;
}

export interface QueryOptions {
  page?: number;
  limit?: number;
  event?: string;
  isActive?: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface WebhookDeliveryResult {
  success: boolean;
  statusCode?: number;
  error?: Error;
  duration: number;
  attempt: number;
  response?: string;
  completedAt?: number;
}

export interface WebhookJob {
  id: string;
  webhookId: number;
  event: WebhookEvent;
  payload: WebhookPayload;
  attempt: number;
  maxRetries: number;
  delayMs: number;
  priority: number;
  scheduledFor: number;
  timeout?: number;
  initialDelayMs?: number;
  backoffMultiplier?: number;
}

export interface WebhookJobProcessor {
  processJob(job: WebhookJob): Promise<void>;
}
