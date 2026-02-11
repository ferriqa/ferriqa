import type {
  FieldValidation,
  FieldDefinition,
} from "$lib/components/blueprint/types";

/**
 * Validates a field value based on field definition and validation rules
 */
export function validateFieldValue(
  value: unknown,
  field: FieldDefinition,
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const validation = field.validation || {};

  // Required check
  if (
    field.required &&
    (value === undefined || value === null || value === "")
  ) {
    errors.push(validation.messages?.required || "This field is required");
    return { isValid: false, errors };
  }

  // Skip other validations if value is empty and not required
  if (
    !field.required &&
    (value === undefined || value === null || value === "")
  ) {
    return { isValid: true, errors };
  }

  switch (field.type) {
    case "text":
    case "textarea":
    case "email":
    case "url":
    case "slug":
      validateString(value as string, validation, errors);
      break;
    case "number":
      validateNumber(value as number, validation, errors);
      break;
    case "date":
    case "datetime":
      validateDate(value as string, validation, errors);
      break;
    case "select":
    case "multiselect":
      validateArray(value as unknown[], validation, errors);
      break;
  }

  return { isValid: errors.length === 0, errors };
}

function validateString(
  value: string,
  validation: FieldValidation,
  errors: string[],
): void {
  // Min length
  if (
    validation.minLength !== undefined &&
    value.length < validation.minLength
  ) {
    errors.push(
      validation.messages?.minLength ||
        `Must be at least ${validation.minLength} characters`,
    );
  }

  // Max length
  if (
    validation.maxLength !== undefined &&
    value.length > validation.maxLength
  ) {
    errors.push(
      validation.messages?.maxLength ||
        `Must be at most ${validation.maxLength} characters`,
    );
  }

  // Pattern
  if (validation.pattern) {
    const regex = new RegExp(validation.pattern);
    if (!regex.test(value)) {
      errors.push(validation.messages?.pattern || "Invalid format");
    }
  }
}

function validateNumber(
  value: number,
  validation: FieldValidation,
  errors: string[],
): void {
  if (isNaN(value)) {
    errors.push("Must be a valid number");
    return;
  }

  // Min value
  if (validation.min !== undefined && value < validation.min) {
    errors.push(
      validation.messages?.min || `Must be at least ${validation.min}`,
    );
  }

  // Max value
  if (validation.max !== undefined && value > validation.max) {
    errors.push(
      validation.messages?.max || `Must be at most ${validation.max}`,
    );
  }
}

function validateDate(
  value: string,
  validation: FieldValidation,
  errors: string[],
): void {
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    errors.push("Must be a valid date");
    return;
  }

  // Min date
  if (validation.minDate) {
    const minDate = new Date(validation.minDate);
    if (date < minDate) {
      errors.push(
        validation.messages?.minDate ||
          `Date must be on or after ${validation.minDate}`,
      );
    }
  }

  // Max date
  if (validation.maxDate) {
    const maxDate = new Date(validation.maxDate);
    if (date > maxDate) {
      errors.push(
        validation.messages?.maxDate ||
          `Date must be on or before ${validation.maxDate}`,
      );
    }
  }
}

function validateArray(
  value: unknown[],
  validation: FieldValidation,
  errors: string[],
): void {
  if (!Array.isArray(value)) {
    errors.push("Must be a valid array");
    return;
  }

  // Min items
  if (validation.minItems !== undefined && value.length < validation.minItems) {
    errors.push(
      validation.messages?.minItems ||
        `Must have at least ${validation.minItems} items`,
    );
  }

  // Max items
  if (validation.maxItems !== undefined && value.length > validation.maxItems) {
    errors.push(
      validation.messages?.maxItems ||
        `Must have at most ${validation.maxItems} items`,
    );
  }
}

/**
 * Validates a complete blueprint before saving
 */
export function validateBlueprint(blueprint: {
  name?: string;
  slug?: string;
  fields?: FieldDefinition[];
}): { isValid: boolean; errors: Record<string, string[]> } {
  const errors: Record<string, string[]> = {};

  // Validate name
  if (!blueprint.name || blueprint.name.trim() === "") {
    errors.name = errors.name || [];
    errors.name.push("Name is required");
  }

  // Validate slug
  if (!blueprint.slug || blueprint.slug.trim() === "") {
    errors.slug = errors.slug || [];
    errors.slug.push("Slug is required");
  } else if (!/^[a-z0-9-]+$/.test(blueprint.slug)) {
    errors.slug = errors.slug || [];
    errors.slug.push(
      "Slug can only contain lowercase letters, numbers, and hyphens",
    );
  }

  // Validate fields
  if (!blueprint.fields || blueprint.fields.length === 0) {
    errors.fields = ["At least one field is required"];
  } else {
    // Check for duplicate field keys
    const keys = blueprint.fields.map((f) => f.key);
    const duplicateKeys = keys.filter(
      (key, index) => keys.indexOf(key) !== index,
    );
    if (duplicateKeys.length > 0) {
      errors.fields = errors.fields || [];
      errors.fields.push(`Duplicate field keys: ${duplicateKeys.join(", ")}`);
    }

    // Validate each field
    blueprint.fields.forEach((field, index) => {
      if (!field.name || field.name.trim() === "") {
        errors[`field_${index}_name`] = ["Field name is required"];
      }
      if (!field.key || field.key.trim() === "") {
        errors[`field_${index}_key`] = ["Field key is required"];
      }
    });
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

/**
 * Generates a slug from a name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Generates a field key from a field name
 */
export function generateFieldKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
