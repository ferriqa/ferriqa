/**
 * Blueprint Type Definitions
 *
 * Content type schema definitions for Ferriqa CMS
 * Based on roadmap 2.1 - Blueprint Engine
 */

// Import RelationType from relations to avoid duplicate definition
// REVIEW: This creates a circular import (blueprint → relations → content → blueprint)
// This is a DESIGN CHOICE - TypeScript handles type-only circular imports correctly
// Type-only imports are erased at compile time, so no runtime issues occur
// Keeping types synchronized across modules is more important than avoiding this cycle
// If this becomes problematic, move shared types to a dedicated shared/types.ts file
import type { RelationType } from "../relations/types.ts";

export type FieldType =
  | "text" // Single line text
  | "textarea" // Multi-line text
  | "rich-text" // HTML/Markdown editor
  | "number" // Integer veya Float
  | "boolean" // Checkbox
  | "date" // Date picker
  | "datetime" // Date + Time picker
  | "slug" // URL-friendly string (otomatik veya manuel)
  | "email" // Email validation
  | "url" // URL validation
  | "select" // Dropdown (single)
  | "multiselect" // Dropdown (multiple)
  | "relation" // Başka content'e referans
  | "media" // Dosya/resim
  | "json" // Raw JSON
  | "color" // Color picker
  | "location" // Map coordinate
  | "reference"; // Sistem değişkeni (örn: current_user)

export type ValidationRuleType =
  | "required"
  | "min"
  | "max"
  | "minLength"
  | "maxLength"
  | "pattern"
  | "email"
  | "url"
  | "unique"
  | "custom";

export interface ValidationRule {
  type: ValidationRuleType;
  // NOTE: value is number | string only (not RegExp)
  // Review comment: Type inconsistency - RegExp was in union but implementation only handles strings
  // Pattern validation uses string regex patterns that are converted to RegExp at runtime
  value?: number | string;
  message?: string;
  customValidator?: (value: unknown) => boolean | Promise<boolean>;
}

export interface FieldOptions {
  // Common
  defaultValue?: unknown;

  // Text/textarea
  minLength?: number;
  maxLength?: number;

  // Number
  min?: number;
  max?: number;
  step?: number;
  format?: "integer" | "float" | "decimal";

  // Select/Multiselect
  options?: Array<{ label: string; value: string }>;
  allowMultiple?: boolean;

  // Rich text
  toolbar?: string[];
  allowedTags?: string[];

  // Relation
  relation?: {
    blueprintId: string;
    type: RelationType;
    displayField: string; // Hangi field gösterilecek
    filter?: Record<string, unknown>; // Relation filtreleme
  };

  // Media
  media?: {
    allowedTypes?: string[]; // ['image/*', 'video/*']
    maxSize?: number; // MB
    multiple?: boolean;
  };

  // Date
  includeTime?: boolean;
  minDate?: Date;
  maxDate?: Date;

  // Slug
  sourceField?: string; // Hangi field'dan üretilecek
}

export interface FieldUIConfig {
  component?: string; // Custom component adı
  width?: "full" | "half"; // Admin UI'de genişlik
  hidden?: boolean; // Form'da gizle
  disabled?: boolean; // Read-only
  placeholder?: string;
  helpText?: string;
}

export interface FieldDefinition {
  id: string; // UUID
  name: string; // "Başlık"
  key: string; // "title" (API'de kullanılacak)
  type: FieldType;
  required: boolean;
  defaultValue?: unknown;
  description?: string;
  validation?: ValidationRule[];
  options?: FieldOptions;
  ui?: FieldUIConfig;
}

export interface BlueprintSettings {
  // Content davranış ayarları
  draftMode: boolean; // Draft/Publish ayrımı
  versioning: boolean; // Versiyonlama aktif mi
  slugField?: string; // Otomatik slug hangi field'dan üretilir
  defaultStatus: "draft" | "published";

  // API davranışı
  apiAccess: "public" | "authenticated" | "private";
  cacheEnabled: boolean;

  // UI ayarları
  icon?: string; // Admin UI için ikon
  displayField: string; // List view'de gösterilecek field
  sortField?: string; // Varsayılan sıralama field'ı
  sortDirection?: "asc" | "desc";
}

export interface Blueprint {
  id: string; // UUID veya auto-increment
  name: string; // "Blog Posts"
  slug: string; // "posts" (URL-friendly, unique)
  description?: string; // "Blog yazıları için content type"
  fields: FieldDefinition[];
  settings: BlueprintSettings;
  createdAt: Date;
  updatedAt: Date;
}

// Validation result types
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  sanitized: Record<string, unknown>;
}

// Blueprint service types
export type CreateBlueprintInput = Omit<
  Blueprint,
  "id" | "createdAt" | "updatedAt"
> & {
  id?: string;
};

export type UpdateBlueprintInput = Partial<
  Pick<Blueprint, "name" | "slug" | "description" | "fields" | "settings">
>;

export interface BlueprintQuery {
  page?: number;
  limit?: number;
  search?: string;
}

// Re-export PaginatedResult from content to avoid duplication
export type { PaginatedResult } from "../content/types";

// Default blueprints
// NOTE: Default blueprints use proper UUIDs to match BlueprintSchema validation
// Review comment #7: "Schema Validation Mismatch - DEFAULT_BLUEPRINTS used plain string IDs"
// All field IDs and blueprint IDs must be valid UUIDs per the Zod schema
export const DEFAULT_BLUEPRINTS = {
  users: {
    name: "Users",
    slug: "users",
    description: "System users",
    fields: [
      {
        id: "550e8400-e29b-41d4-a716-446655440001", // UUID format
        name: "Email",
        key: "email",
        type: "email" as FieldType,
        required: true,
        validation: [{ type: "required" }, { type: "email" }],
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440002", // UUID format
        name: "Name",
        key: "name",
        type: "text" as FieldType,
        required: true,
      },
    ],
    settings: {
      draftMode: false,
      versioning: false,
      apiAccess: "private" as const,
      cacheEnabled: true,
      displayField: "name",
      defaultStatus: "draft" as const,
    },
  },
  media: {
    name: "Media",
    slug: "media",
    description: "Media files and assets",
    fields: [
      {
        id: "550e8400-e29b-41d4-a716-446655440003", // UUID format
        name: "Filename",
        key: "filename",
        type: "text" as FieldType,
        required: true,
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440004", // UUID format
        name: "URL",
        key: "url",
        type: "url" as FieldType,
        required: true,
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440005", // UUID format
        name: "Type",
        key: "type",
        type: "select" as FieldType,
        required: true,
        options: {
          options: [
            { label: "Image", value: "image" },
            { label: "Video", value: "video" },
            { label: "Document", value: "document" },
            { label: "Audio", value: "audio" },
          ],
        },
      },
    ],
    settings: {
      draftMode: false,
      versioning: false,
      apiAccess: "authenticated" as const,
      cacheEnabled: true,
      displayField: "filename",
      defaultStatus: "draft" as const,
    },
  },
};
