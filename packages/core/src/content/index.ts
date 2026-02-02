/**
 * Content Module Index
 *
 * Main exports for content storage module
 * Based on roadmap 2.2 - Dynamic Content Storage
 */

// Types
export type {
  Content,
  ContentBaseFields,
  ContentStatus,
  PopulatedContent,
  PopulatedContentItem,
  CreateContentInput,
  UpdateContentInput,
  ContentQuery,
  FilterCondition,
  SortCondition,
  PaginationOptions,
  PopulateOptions,
  PaginatedResult,
  ContentMetadata,
  ChangeSummary,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ContentCreateContext,
  ContentUpdateContext,
  ContentDeleteContext,
  ContentPublishContext,
} from "./types.ts";

// Query Builder
export {
  ContentQueryBuilder,
  type ContentQueryBuilderOptions,
} from "./query-builder.ts";

// Service
export { ContentService } from "./service.ts";
export type { ContentServiceOptions } from "./service.ts";

// Error classes (re-export for convenience)
export { ValidationException } from "../validation/engine.ts";
