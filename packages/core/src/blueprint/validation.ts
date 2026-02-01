/**
 * Blueprint Validation Schemas
 *
 * Zod schemas for validating blueprint definitions
 * Based on roadmap 2.1 - Blueprint Engine
 */

import { z } from "zod";

// Field type enum
export const FieldTypeSchema = z.enum([
  "text",
  "textarea",
  "rich-text",
  "number",
  "boolean",
  "date",
  "datetime",
  "slug",
  "email",
  "url",
  "select",
  "multiselect",
  "relation",
  "media",
  "json",
  "color",
  "location",
  "reference",
]);

// Validation rule type enum
export const ValidationRuleTypeSchema = z.enum([
  "required",
  "min",
  "max",
  "minLength",
  "maxLength",
  "pattern",
  "email",
  "url",
  "unique",
  "custom",
]);

// Validation rule schema
export const ValidationRuleSchema = z.object({
  type: ValidationRuleTypeSchema,
  // NOTE: Only number and string (not RegExp) - patterns use string regex
  // Review comment: RegExp removed to match ValidationRule interface and implementation
  value: z.union([z.number(), z.string()]).optional(),
  message: z.string().optional(),
  // Note: customValidator cannot be validated by Zod (function type)
  // It will be checked at runtime
});

// Field options schema
export const FieldOptionsSchema = z.object({
  // Text/textarea
  minLength: z.number().int().positive().optional(),
  maxLength: z.number().int().positive().optional(),

  // Number
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().positive().optional(),
  format: z.enum(["integer", "float", "decimal"]).optional(),

  // Select/Multiselect
  options: z
    .array(
      z.object({
        label: z.string(),
        value: z.string(),
      }),
    )
    .optional(),
  allowMultiple: z.boolean().optional(),

  // Rich text
  toolbar: z.array(z.string()).optional(),
  allowedTags: z.array(z.string()).optional(),

  // Relation
  relation: z
    .object({
      blueprintId: z.string(),
      type: z.enum(["one-to-one", "one-to-many", "many-to-many"]),
      displayField: z.string(),
      filter: z.record(z.string(), z.unknown()).optional(),
    })
    .optional(),

  // Media
  media: z
    .object({
      allowedTypes: z.array(z.string()).optional(),
      maxSize: z.number().positive().optional(), // MB
      multiple: z.boolean().optional(),
    })
    .optional(),

  // Date
  includeTime: z.boolean().optional(),
  minDate: z.date().optional(),
  maxDate: z.date().optional(),

  // Slug
  sourceField: z.string().optional(),
});

// Field UI config schema
export const FieldUIConfigSchema = z.object({
  component: z.string().optional(),
  width: z.enum(["full", "half"]).optional(),
  hidden: z.boolean().optional(),
  disabled: z.boolean().optional(),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
});

// Field definition schema
export const FieldDefinitionSchema = z.object({
  id: z.string().min(1), // UUID veya benzersiz ID
  name: z.string().min(1).max(100),
  key: z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, {
    message:
      "Field key must start with a letter and contain only letters, numbers, and underscores",
  }),
  type: FieldTypeSchema,
  required: z.boolean(),
  defaultValue: z.unknown().optional(),
  description: z.string().max(500).optional(),
  validation: z.array(ValidationRuleSchema).optional(),
  options: FieldOptionsSchema.optional(),
  ui: FieldUIConfigSchema.optional(),
});

// Blueprint settings schema
export const BlueprintSettingsSchema = z.object({
  draftMode: z.boolean(),
  versioning: z.boolean(),
  slugField: z.string().optional(),
  defaultStatus: z.enum(["draft", "published"]),
  apiAccess: z.enum(["public", "authenticated", "private"]),
  cacheEnabled: z.boolean(),
  icon: z.string().optional(),
  displayField: z.string(),
  sortField: z.string().optional(),
  sortDirection: z.enum(["asc", "desc"]).optional(),
});

// Main blueprint schema
export const BlueprintSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, {
      message: "Slug must contain only lowercase letters, numbers, and hyphens",
    })
    .min(1)
    .max(100),
  description: z.string().max(500).optional(),
  fields: z.array(FieldDefinitionSchema).min(1),
  settings: BlueprintSettingsSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Schema for creating a new blueprint (id, timestamps auto-generated)
export const CreateBlueprintSchema = BlueprintSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  // Allow optional id for import scenarios
  id: z.string().uuid().optional(),
});

// Schema for updating a blueprint
export const UpdateBlueprintSchema = BlueprintSchema.partial().omit({
  id: true,
  createdAt: true,
});

// Type exports
export type BlueprintValidationResult =
  | { success: true; data: z.infer<typeof BlueprintSchema> }
  | { success: false; errors: z.ZodError };

// Validation functions
export function validateBlueprint(data: unknown): BlueprintValidationResult {
  const result = BlueprintSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, errors: result.error };
  }
}

export function validateCreateBlueprint(data: unknown) {
  return CreateBlueprintSchema.safeParse(data);
}

export function validateUpdateBlueprint(data: unknown) {
  return UpdateBlueprintSchema.safeParse(data);
}

export function validateFieldDefinition(data: unknown) {
  return FieldDefinitionSchema.safeParse(data);
}

// Slug uniqueness validation helper
export function validateSlugFormat(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug);
}

export function sanitizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Field key uniqueness check helper
export function validateFieldKeysUniqueness(
  fields: z.infer<typeof FieldDefinitionSchema>[],
): { valid: boolean; duplicates: string[] } {
  const keys = fields.map((f) => f.key);
  const duplicates = keys.filter((key, index) => keys.indexOf(key) !== index);
  const uniqueDuplicates = [...new Set(duplicates)];

  return {
    valid: uniqueDuplicates.length === 0,
    duplicates: uniqueDuplicates,
  };
}

// Display field validation helper
export function validateDisplayField(
  fields: z.infer<typeof FieldDefinitionSchema>[],
  displayField: string,
): boolean {
  return fields.some((f) => f.key === displayField);
}

// Slug field validation helper
export function validateSlugField(
  fields: z.infer<typeof FieldDefinitionSchema>[],
  slugField?: string,
): boolean {
  if (!slugField) return true;
  const field = fields.find((f) => f.key === slugField);
  return (
    field !== undefined && (field.type === "text" || field.type === "slug")
  );
}
