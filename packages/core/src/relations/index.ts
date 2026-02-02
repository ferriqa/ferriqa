/**
 * Relations System
 *
 * Content relations management for Ferriqa CMS
 * Based on roadmap 2.3 - Relations System
 */

// Types
export type {
  Relation,
  RelationType,
  CascadeRule,
  CreateRelationInput,
  UpdateRelationInput,
  RelationQuery,
  RelatedContent,
  PopulatedRelation,
  RelationValidationResult,
  RelationValidationError,
  RelationConfig,
  RelationValue,
  RelationCreateContext,
  RelationDeleteContext,
  PopulationOptions,
  FieldRelationInfo,
} from "./types.ts";

// Service
export { RelationService, type RelationServiceOptions } from "./service.ts";
