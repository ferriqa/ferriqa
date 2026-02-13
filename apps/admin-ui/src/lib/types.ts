// Shared types across the application
// NOTE: Keep in sync with API schema
// LSP NOTE: BlueprintSummary is for listing pages, Blueprint (from lib/components/blueprint/types.ts) is for builder

export interface BlueprintField {
  name: string;
  type: string;
}

export interface BlueprintSettings {
  draftMode: boolean;
  versioning: boolean;
  apiAccess: "public" | "authenticated" | "private";
}

// NOTE: Renamed from Blueprint to BlueprintSummary to avoid conflict with lib/components/blueprint/types.ts
// This type is used for blueprint listing (API response with metadata)
export interface BlueprintSummary {
  id: string;
  name: string;
  slug: string;
  description?: string;
  fields: BlueprintField[];
  settings: BlueprintSettings;
  createdAt: string;
  updatedAt: string;
  contentCount?: number;
}

export interface PageData {
  blueprints: BlueprintSummary[];
}

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "editor" | "viewer";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Webhook types
export interface Webhook {
  id: number;
  name: string;
  url: string;
  events: string[];
  headers?: Record<string, string>;
  secret?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
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
  createdAt: string;
  completedAt?: string;
}

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

// Available webhook events
export const WEBHOOK_EVENTS = [
  "content.created",
  "content.updated",
  "content.deleted",
  "content.published",
  "content.unpublished",
  "blueprint.created",
  "blueprint.updated",
  "blueprint.deleted",
  "media.uploaded",
  "media.deleted",
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];
