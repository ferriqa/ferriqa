/**
 * Relations Types
 *
 * Type definitions for the relations system
 * Based on roadmap 2.3 - Relations System
 */

// Relation types
export type RelationType = "one-to-one" | "one-to-many" | "many-to-many";

// Cascade rules for delete/update operations
export type CascadeRule = "restrict" | "cascade" | "set-null" | "no-action";

// Main Relation interface
export interface Relation {
  id: string;
  sourceContentId: string;
  targetContentId: string;
  type: RelationType;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

// Relation with populated content
export interface PopulatedRelation extends Relation {
  sourceContent?: import("../content/types.ts").PopulatedContentItem;
  targetContent?: import("../content/types.ts").PopulatedContentItem;
}

// Create relation input
export interface CreateRelationInput {
  sourceContentId: string;
  targetContentId: string;
  type: RelationType;
  metadata?: Record<string, unknown>;
  cascadeOnDelete?: CascadeRule;
}

// Update relation input
export interface UpdateRelationInput {
  metadata?: Record<string, unknown>;
}

// Relation query options
export interface RelationQuery {
  sourceContentId?: string;
  targetContentId?: string;
  type?: RelationType;
  direction?: "outgoing" | "incoming" | "both";
  populate?: boolean;
  pagination?: {
    page: number;
    limit: number;
  };
}

// Related content result
// REVIEW: Fixed type safety - content field now uses PopulatedContentItem instead of Record<string, unknown>
export interface RelatedContent {
  relation: Relation;
  content: import("../content/types.ts").PopulatedContentItem;
  direction: "outgoing" | "incoming";
}

// Relation validation result
export interface RelationValidationResult {
  valid: boolean;
  errors: RelationValidationError[];
}

export interface RelationValidationError {
  field: string;
  message: string;
}

// Relation configuration in blueprint field
export interface RelationConfig {
  blueprintId: string;
  type: RelationType;
  displayField: string;
  filter?: Record<string, unknown>;
  cascadeOnDelete?: CascadeRule;
}

// Relation field value
// REVIEW: This interface uses 'blueprintId' consistently across the codebase
// RelationValue is re-exported from fields/types.ts for convenience
// There is no type mismatch - all usages reference this single definition
export interface RelationValue {
  id: string;
  blueprintId: string;
  [key: string]: unknown;
}

// Relation hooks context types
export interface RelationCreateContext {
  sourceContentId: string;
  targetContentId: string;
  type: RelationType;
  metadata?: Record<string, unknown>;
  userId?: string;
}

export interface RelationDeleteContext {
  relation: Relation;
  userId?: string;
}

// Population options for content queries
export interface PopulationOptions {
  [field: string]: {
    fields?: string[];
    populate?: PopulationOptions;
  };
}

// Field-level relation info
export interface FieldRelationInfo {
  fieldKey: string;
  relationConfig: RelationConfig;
}
