/**
 * Validation Engine
 *
 * Blueprint-based content validation system
 * Based on roadmap 2.1 - Validation Engine
 */

import type {
  Blueprint,
  FieldDefinition,
  ValidationError as ValidationErrorType,
  ValidationWarning,
  ValidationResult,
} from "../blueprint/types.ts";
import { FieldRegistry } from "../fields/registry.ts";

export class ValidationEngine {
  constructor(private fieldRegistry: FieldRegistry) {}

  async validateContent(
    blueprint: Blueprint,
    content: Record<string, unknown>,
    mode: "create" | "update",
  ): Promise<ValidationResult> {
    const errors: ValidationErrorType[] = [];
    const warnings: ValidationWarning[] = [];
    const sanitized: Record<string, unknown> = {};

    // Validate each field in the blueprint
    for (const field of blueprint.fields) {
      const value = content[field.key];
      const handler = this.fieldRegistry.get(field.type);

      if (!handler) {
        errors.push({
          field: field.key,
          message: `Unknown field type: ${field.type}`,
        });
        continue;
      }

      // Check required
      if (field.required && (value === undefined || value === null)) {
        errors.push({
          field: field.key,
          message: `${field.name} is required`,
        });
        continue;
      }

      // Skip optional empty fields
      if (!field.required && (value === undefined || value === null)) {
        sanitized[field.key] = handler.getDefaultValue(field.options);
        continue;
      }

      // Validate using field handler
      const fieldErrors = handler.validate(
        value,
        field.validation || [],
        field.options,
      );

      // Map field errors to include field key
      errors.push(
        ...fieldErrors.map((e: ValidationErrorType) => ({
          ...e,
          field: field.key,
        })),
      );

      // Sanitize if no errors
      if (fieldErrors.length === 0) {
        sanitized[field.key] = handler.serialize(value);
      }
    }

    // Check for unknown fields in content
    const allowedFields = new Set(
      blueprint.fields.map((f: FieldDefinition) => f.key),
    );
    for (const key of Object.keys(content)) {
      if (!allowedFields.has(key)) {
        warnings.push({
          field: key,
          message: `Unknown field will be ignored`,
        });
      }
    }

    // Blueprint-level validations
    const blueprintErrors = await this.validateBlueprintConstraints(
      blueprint,
      sanitized,
      mode,
    );
    errors.push(...blueprintErrors);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      sanitized,
    };
  }

  private async validateBlueprintConstraints(
    blueprint: Blueprint,
    _content: Record<string, unknown>, // Prefixed - unused but reserved for future content-aware validation
    _mode: "create" | "update", // Prefixed - unused but reserved for future mode-specific validation
  ): Promise<ValidationErrorType[]> {
    const errors: ValidationErrorType[] = [];

    // NOTE: _content and _mode are currently unused but intentionally kept
    // Review comment: Unused parameters indicate incomplete implementation
    // These are reserved for future blueprint-level validations that depend on content data
    // For example: cross-field validation, unique constraints, etc.

    // Validate slug field exists if configured
    if (blueprint.settings.slugField) {
      const slugField = blueprint.fields.find(
        (f: FieldDefinition) => f.key === blueprint.settings.slugField,
      );
      if (!slugField) {
        errors.push({
          field: "settings.slugField",
          message: `Slug field "${blueprint.settings.slugField}" does not exist in blueprint`,
        });
      } else if (slugField.type !== "text" && slugField.type !== "slug") {
        errors.push({
          field: "settings.slugField",
          message: `Slug field must be of type "text" or "slug", got "${slugField.type}"`,
        });
      }
    }

    // Validate display field exists
    const displayField = blueprint.fields.find(
      (f: FieldDefinition) => f.key === blueprint.settings.displayField,
    );
    if (!displayField) {
      errors.push({
        field: "settings.displayField",
        message: `Display field "${blueprint.settings.displayField}" does not exist in blueprint`,
      });
    }

    // Validate sort field if configured
    if (blueprint.settings.sortField) {
      const sortField = blueprint.fields.find(
        (f: FieldDefinition) => f.key === blueprint.settings.sortField,
      );
      if (!sortField) {
        errors.push({
          field: "settings.sortField",
          message: `Sort field "${blueprint.settings.sortField}" does not exist in blueprint`,
        });
      }
    }

    // Validate relation fields have proper configuration
    for (const field of blueprint.fields) {
      if (field.type === "relation") {
        if (!field.options?.relation) {
          errors.push({
            field: field.key,
            message: `Relation field "${field.name}" is missing relation configuration`,
          });
        } else {
          const { relation } = field.options;
          if (!relation.blueprintId) {
            errors.push({
              field: field.key,
              message: `Relation field "${field.name}" is missing target blueprint ID`,
            });
          }
          if (!relation.displayField) {
            errors.push({
              field: field.key,
              message: `Relation field "${field.name}" is missing display field configuration`,
            });
          }
        }
      }

      // Validate select fields have options
      if (
        (field.type === "select" || field.type === "multiselect") &&
        (!field.options?.options || field.options.options.length === 0)
      ) {
        errors.push({
          field: field.key,
          message: `Select field "${field.name}" must have at least one option defined`,
        });
      }

      // Validate select field option values are non-empty
      if (
        (field.type === "select" || field.type === "multiselect") &&
        field.options?.options
      ) {
        const hasEmptyValue = field.options.options.some(
          (opt: { value: string }) => !opt.value || opt.value.trim() === "",
        );
        if (hasEmptyValue) {
          errors.push({
            field: field.key,
            message: `Select field "${field.name}" has options with empty values`,
          });
        }
      }
    }

    return errors;
  }

  // Validate a single field value
  validateFieldValue(
    field: FieldDefinition,
    value: unknown,
  ): ValidationErrorType[] {
    const handler = this.fieldRegistry.get(field.type);
    if (!handler) {
      return [
        {
          field: field.key,
          message: `Unknown field type: ${field.type}`,
        },
      ];
    }

    // Check required
    if (field.required && (value === undefined || value === null)) {
      return [
        {
          field: field.key,
          message: `${field.name} is required`,
        },
      ];
    }

    // Skip validation for optional empty fields
    if (!field.required && (value === undefined || value === null)) {
      return [];
    }

    const errors = handler.validate(
      value,
      field.validation || [],
      field.options,
    );
    return errors.map((e) => ({ ...e, field: field.key }));
  }

  // Sanitize content according to blueprint
  sanitizeContent(
    blueprint: Blueprint,
    content: Record<string, unknown>,
  ): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};

    for (const field of blueprint.fields) {
      const handler = this.fieldRegistry.get(field.type);
      const value = content[field.key];

      if (handler && value !== undefined && value !== null) {
        sanitized[field.key] = handler.serialize(value);
      } else if (handler) {
        sanitized[field.key] = handler.getDefaultValue(field.options);
      }
    }

    return sanitized;
  }
}

// Error class for validation failures
export class ValidationException extends Error {
  constructor(
    public errors: ValidationErrorType[],
    message = "Validation failed",
  ) {
    super(message);
    this.name = "ValidationException";
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      errors: this.errors,
    };
  }
}

// Helper to format validation errors for API response
export function formatValidationErrors(
  errors: ValidationErrorType[],
): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};

  for (const error of errors) {
    if (!formatted[error.field]) {
      formatted[error.field] = [];
    }
    formatted[error.field].push(error.message);
  }

  return formatted;
}
