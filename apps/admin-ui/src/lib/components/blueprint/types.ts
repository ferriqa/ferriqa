// Field type definitions for Blueprint Builder

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "boolean"
  | "date"
  | "datetime"
  | "email"
  | "url"
  | "select"
  | "multiselect"
  | "relation"
  | "media"
  | "richtext"
  | "slug"
  | "json"
  | "color";

export interface FieldDefinition {
  id: string;
  name: string;
  key: string;
  type: FieldType;
  required: boolean;
  unique?: boolean;
  description?: string;
  options?: FieldOptions;
  ui?: FieldUIOptions;
  validation?: FieldValidation;
}

export interface FieldOptions {
  // Select/Multiselect
  choices?: string[];

  // Relation - full config with displayField, filter, sort
  // NOTE: This type includes all fields used by RelationConfigurator component
  relation?: {
    blueprintId: string;
    blueprintName?: string;
    type: "one-to-one" | "one-to-many" | "many-to-many";
    displayField?: string;
    filter?: Record<string, unknown>;
    sort?: {
      field: string;
      direction: "asc" | "desc";
    };
  };

  // Media
  media?: {
    multiple?: boolean;
    accept?: string[];
  };

  // Number
  min?: number;
  max?: number;
  step?: number;

  // Text/Textarea
  minLength?: number;
  maxLength?: number;

  // Date/Datetime
  minDate?: string;
  maxDate?: string;

  // Slug
  sourceField?: string;
}

export interface FieldUIOptions {
  placeholder?: string;
  helpText?: string;
  defaultValue?: unknown;
  width?: "half" | "full";
  group?: string;
}

export interface FieldValidation {
  // Common validation rules
  pattern?: string;
  patternMessage?: string;
  customValidator?: string;

  // String validation (Text, Textarea, Email, URL, Slug)
  minLength?: number;
  maxLength?: number;

  // Number validation
  min?: number;
  max?: number;

  // Date/DateTime validation
  minDate?: string;
  maxDate?: string;

  // Array validation (MultiSelect, Media multiple)
  minItems?: number;
  maxItems?: number;

  // Email validation options
  allowSubdomains?: boolean;
  allowedDomains?: string[];
  blockedDomains?: string[];

  // URL validation options
  allowedProtocols?: string[];
  requireProtocol?: boolean;

  // File/Media validation
  maxFileSize?: number; // in bytes
  allowedMimeTypes?: string[];

  // RichText validation
  allowedTags?: string[];
  maxChars?: number;

  // Custom error messages
  messages?: {
    required?: string;
    unique?: string;
    minLength?: string;
    maxLength?: string;
    min?: string;
    max?: string;
    pattern?: string;
    minItems?: string;
    maxItems?: string;
    minDate?: string;
    maxDate?: string;
    email?: string;
    url?: string;
  };
}

// Validation rule metadata for UI generation
export interface ValidationRuleMeta {
  id: string;
  name: string;
  description: string;
  applicableTypes: FieldType[];
  valueType: "string" | "number" | "boolean" | "date" | "array" | "text";
  min?: number;
  max?: number;
  placeholder?: string;
}

export interface Blueprint {
  id?: string;
  name: string;
  slug: string;
  description?: string;
  fields: FieldDefinition[];
  settings: BlueprintSettings;
}

export interface BlueprintSettings {
  draftMode: boolean;
  versioning: boolean;
  defaultStatus: "draft" | "published";
}

// Field type categories
export const FIELD_CATEGORIES = {
  BASIC: "basic",
  ADVANCED: "advanced",
  RELATION: "relation",
  MEDIA: "media",
} as const;

export type FieldCategory =
  (typeof FIELD_CATEGORIES)[keyof typeof FIELD_CATEGORIES];

// Field type metadata
export interface FieldTypeMeta {
  id: FieldType;
  name: string;
  description: string;
  category: FieldCategory;
  icon: string;
  configurableOptions: string[];
  validationRules: string[];
}

// Blueprint API types
export interface BlueprintApiResponse {
  success: boolean;
  data?: Blueprint;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface BlueprintListResponse {
  success: boolean;
  data?: Blueprint[];
  error?: string;
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
}

// Relation field configuration
export interface RelationConfig {
  blueprintId: string;
  blueprintName?: string;
  type: "one-to-one" | "one-to-many" | "many-to-many";
  displayField?: string;
  filter?: Record<string, unknown>;
  sort?: {
    field: string;
    direction: "asc" | "desc";
  };
}
