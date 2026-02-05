/**
 * @ferriqa/adapters-db - Database Schema
 *
 * Drizzle ORM schema definitions for SQLite
 * All tables use JSON columns for flexible data storage
 */

import { sqliteTable, text, integer, unique } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ========== USERS ==========
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("viewer"),
  permissions: text("permissions", { mode: "json" }).$type<string[]>(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// ========== BLUEPRINTS ==========
export const blueprints = sqliteTable("blueprints", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  fields: text("fields", { mode: "json" }).notNull().$type<FieldDefinition[]>(),
  settings: text("settings", { mode: "json" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// ========== CONTENTS ==========
export const contents = sqliteTable(
  "contents",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    blueprintId: integer("blueprint_id").references(() => blueprints.id),
    slug: text("slug").notNull(),
    data: text("data", { mode: "json" }).notNull(), // Actual content data
    meta: text("meta", { mode: "json" }), // SEO, custom metadata
    status: text("status").notNull().default("draft"),
    createdBy: integer("created_by").references(() => users.id),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    publishedAt: integer("published_at", { mode: "timestamp" }),
    publishedBy: integer("published_by").references(() => users.id),
  },
  (table) => ({
    // Composite unique constraint: slug must be unique within a blueprint
    uniqueBlueprintSlug: unique().on(table.blueprintId, table.slug),
  }),
);

// ========== RELATIONS ==========
export const relations = sqliteTable("relations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sourceContentId: integer("source_content_id")
    .notNull()
    .references(() => contents.id, { onDelete: "cascade" }),
  targetContentId: integer("target_content_id")
    .notNull()
    .references(() => contents.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'one-to-one', 'one-to-many', 'many-to-many'
  metadata: text("metadata", { mode: "json" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// ========== VERSIONS ==========
export const versions = sqliteTable("versions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  contentId: integer("content_id").references(() => contents.id),
  blueprintId: integer("blueprint_id").references(() => blueprints.id),
  data: text("data", { mode: "json" }).notNull(),
  versionNumber: integer("version_number").notNull(),
  createdBy: integer("created_by").references(() => users.id),
  changeSummary: text("change_summary"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// ========== WEBHOOKS ==========
export const webhooks = sqliteTable("webhooks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  url: text("url").notNull(),
  events: text("events", { mode: "json" }).notNull().$type<string[]>(),
  headers: text("headers", { mode: "json" }),
  secret: text("secret"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// ========== WEBHOOK DELIVERIES ==========
/**
 * Webhook delivery tracking table
 *
 * DESIGN NOTE: Each HTTP attempt (including retries) creates a new delivery record
 * with a unique ID. To trace all retry attempts for a single webhook dispatch:
 * - Query by (webhook_id, event, created_at) range
 * - Filter by attempt number to see retry chain
 *
 * Example:
 * - Original delivery: id="abc-123", attempt=1, created_at=T+0s
 * - First retry: id="def-456", attempt=2, created_at=T+2s
 * - Second retry: id="ghi-789", attempt=3, created_at=T+6s
 *
 * To get all attempts: SELECT * FROM webhook_deliveries
 *                   WHERE webhook_id=X AND event='content.created'
 *                   AND created_at >= T AND created_at <= T+60
 */
export const webhookDeliveries = sqliteTable("webhook_deliveries", {
  id: text("id").primaryKey(),
  webhookId: integer("webhook_id")
    .notNull()
    .references(() => webhooks.id, { onDelete: "cascade" }),
  event: text("event").notNull(),
  statusCode: integer("status_code"),
  success: integer("success", { mode: "boolean" }).notNull().default(false),
  attempt: integer("attempt").notNull().default(1),
  response: text("response"),
  duration: integer("duration"),
  error: text("error"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  completedAt: integer("completed_at", { mode: "timestamp" }),
});

// ========== AUDIT LOGS ==========
export const auditLogs = sqliteTable("audit_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: integer("entity_id").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  metadata: text("metadata", { mode: "json" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// ========== SETTINGS ==========
export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value", { mode: "json" }),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// ========== API KEYS ==========
export const apiKeys = sqliteTable("api_keys", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  keyHash: text("key_hash").notNull().unique(),
  keyPrefix: text("key_prefix").notNull(), // First 8 chars of key for display
  permissions: text("permissions", { mode: "json" }).$type<string[]>(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  lastUsedAt: integer("last_used_at", { mode: "timestamp" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  rateLimitPerMinute: integer("rate_limit_per_minute").notNull().default(60),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// ========== MIGRATIONS ==========
export const migrations = sqliteTable("migrations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  executedAt: integer("executed_at", { mode: "timestamp" }).notNull(),
  executionTimeMs: integer("execution_time_ms"),
});

// ========== TYPE DEFINITIONS ==========

export interface FieldDefinition {
  name: string;
  type: "text" | "number" | "boolean" | "date" | "json" | "relation";
  required?: boolean;
  default?: unknown;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: string[];
  };
}

// Export all tables
export const tables = {
  users,
  blueprints,
  contents,
  relations,
  versions,
  webhooks,
  webhookDeliveries,
  auditLogs,
  settings,
  migrations,
  apiKeys,
};
