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
  auditLogs,
  settings,
  migrations,
};
