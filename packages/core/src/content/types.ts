/**
 * Content Type Definitions
 *
 * Dynamic content storage types for Ferriqa CMS
 * Based on roadmap 2.2 - Dynamic Content Storage
 */

import type { Blueprint } from "../blueprint/types";

// Content status types
export type ContentStatus = "draft" | "published" | "archived";

// Main Content interface
export interface Content {
  id: string;
  blueprintId: string;
  slug: string;
  status: ContentStatus;
  data: Record<string, unknown>;
  meta?: Record<string, unknown>;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  publishedBy?: string;
}

// Content with populated relations
export interface PopulatedContent extends Content {
  data: Record<string, unknown>;
}

// Create content input
export interface CreateContentInput {
  slug?: string;
  status?: ContentStatus;
  data: Record<string, unknown>;
  meta?: Record<string, unknown>;
}

// Update content input
export interface UpdateContentInput {
  slug?: string;
  status?: ContentStatus;
  data?: Record<string, unknown>;
  meta?: Record<string, unknown>;
}

// Content query options
export interface ContentQuery {
  blueprintId?: string;
  status?: ContentStatus | ContentStatus[];
  filters?: FilterCondition[];
  sort?: SortCondition[];
  populate?: string[] | PopulateOptions;
  fields?: string[];
  pagination?: PaginationOptions;
}

// Filter condition for querying
export interface FilterCondition {
  field: string; // JSON path: 'title', 'author.name', 'tags[0]'
  operator:
    | "eq"
    | "ne"
    | "gt"
    | "gte"
    | "lt"
    | "lte"
    | "in"
    | "nin"
    | "contains"
    | "startsWith"
    | "endsWith"
    | "exists";
  value?: unknown;
}

// Sort condition
export interface SortCondition {
  field: string;
  direction: "asc" | "desc";
}

// Pagination options
export interface PaginationOptions {
  page: number;
  limit: number;
}

// Population options for relations
export interface PopulateOptions {
  [field: string]: {
    fields?: string[];
    populate?: PopulateOptions;
  };
}

// Paginated result
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Content metadata (for API responses)
export interface ContentMetadata {
  publishedAt?: Date;
  publishedBy?: string;
  firstPublishedAt?: Date;
}

// Content change summary
export interface ChangeSummary {
  added: string[];
  removed: string[];
  modified: string[];
}

// Content validation result (extends from blueprint)
export {
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from "../blueprint/types";

// Content hooks context types
export interface ContentCreateContext {
  blueprint: Blueprint;
  data: Record<string, unknown>;
  userId?: string;
}

export interface ContentUpdateContext {
  content: Content;
  blueprint: Blueprint;
  data: Record<string, unknown>;
  userId?: string;
}

export interface ContentDeleteContext {
  content: Content;
  blueprint: Blueprint;
  userId?: string;
}

export interface ContentPublishContext {
  content: Content;
  userId?: string;
}
