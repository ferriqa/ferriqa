/**
 * Field Type Registry
 *
 * Central registry for field type handlers
 * Based on roadmap 2.1 - Field Types Registry
 *
 * @note Empty String Handling Inconsistency
 * Review comment noted: "Inconsistent empty input handling across field types"
 * Different field types handle empty strings ("") differently for non-required fields:
 * - TextField, TextareaField, EmailField, URLField: Empty strings pass validation (treated as "no value")
 * - DateField: Empty strings are explicitly rejected ("Date cannot be empty")
 * - NumberField: Empty strings are treated as null
 * - BooleanField: Empty strings are treated as false
 *
 * This is intentional design - each field type has semantics that make sense for its data type.
 * For example, dates require a valid date or nothing, while text fields can be genuinely empty.
 *
 * If standardization is needed in the future, consider adding a global "allowEmpty" option
 * or standardizing on one behavior across all types.
 */

import type {
  FieldTypeHandler,
  FieldRegistryEntry,
  FieldValidationContext,
  RelationValue,
} from "./types.ts";
import type {
  ValidationRule,
  ValidationError,
  FieldOptions,
  FieldType,
} from "../blueprint/types.ts";

// Text field handler (P0)
export const TextField: FieldTypeHandler<string> = {
  type: "text",

  validate(value, rules, options): ValidationError[] {
    const errors: ValidationError[] = [];
    const str = String(value ?? "");

    for (const rule of rules) {
      if (rule.type === "required" && !str.trim()) {
        errors.push({ field: "value", message: rule.message || "Required" });
      }
      if (rule.type === "minLength" && str.length < (rule.value as number)) {
        errors.push({
          field: "value",
          message: rule.message || `Min ${rule.value} chars`,
        });
      }
      if (rule.type === "maxLength" && str.length > (rule.value as number)) {
        errors.push({
          field: "value",
          message: rule.message || `Max ${rule.value} chars`,
        });
      }
      // FIX: Wrapped RegExp creation in try-catch to handle invalid regex patterns
      // Review comment noted: "Unhandled RegExp compilation error in TextField"
      // Review comment #5: "TextField RegExp Error Handling Could Be More Specific"
      // Only catch SyntaxError (invalid regex), re-throw other unexpected errors
      if (rule.type === "pattern") {
        try {
          const pattern = new RegExp(rule.value as string);
          if (!pattern.test(str)) {
            errors.push({
              field: "value",
              message: rule.message || "Invalid format",
            });
          }
        } catch (error) {
          if (error instanceof SyntaxError) {
            errors.push({
              field: "value",
              message: "Invalid regex pattern in validation rule",
            });
          } else {
            // Re-throw unexpected errors (not regex syntax errors)
            throw error;
          }
        }
      }
    }

    // Check field-specific options
    if (options?.minLength !== undefined && str.length < options.minLength) {
      errors.push({
        field: "value",
        message: `Minimum ${options.minLength} characters required`,
      });
    }
    if (options?.maxLength !== undefined && str.length > options.maxLength) {
      errors.push({
        field: "value",
        message: `Maximum ${options.maxLength} characters allowed`,
      });
    }

    return errors;
  },

  serialize(value) {
    return String(value ?? "").trim();
  },

  deserialize(value) {
    return String(value ?? "");
  },

  getDefaultValue(options) {
    return (options?.defaultValue as string) ?? "";
  },

  toJSON(value) {
    return value;
  },
};

// Textarea field handler (P1 - extends text)
export const TextareaField: FieldTypeHandler<string> = {
  ...TextField,
  type: "textarea",
};

// Number field handler (P0)
export const NumberField: FieldTypeHandler<number | null> = {
  type: "number",

  validate(value, rules, options): ValidationError[] {
    const errors: ValidationError[] = [];

    // Null/undefined handling
    if (value === null || value === undefined) {
      for (const rule of rules) {
        if (rule.type === "required") {
          errors.push({ field: "value", message: rule.message || "Required" });
        }
      }
      return errors;
    }

    const num = Number(value);
    if (isNaN(num)) {
      errors.push({ field: "value", message: "Invalid number" });
      return errors;
    }

    for (const rule of rules) {
      if (rule.type === "min" && num < (rule.value as number)) {
        errors.push({
          field: "value",
          message: rule.message || `Min value is ${rule.value}`,
        });
      }
      if (rule.type === "max" && num > (rule.value as number)) {
        errors.push({
          field: "value",
          message: rule.message || `Max value is ${rule.value}`,
        });
      }
    }

    // Check field-specific options
    if (options?.min !== undefined && num < options.min) {
      errors.push({
        field: "value",
        message: `Minimum value is ${options.min}`,
      });
    }
    if (options?.max !== undefined && num > options.max) {
      errors.push({
        field: "value",
        message: `Maximum value is ${options.max}`,
      });
    }

    // Check format (integer, float, decimal)
    if (options?.format === "integer" && !Number.isInteger(num)) {
      errors.push({ field: "value", message: "Must be an integer" });
    }

    return errors;
  },

  serialize(value) {
    if (value === null || value === undefined) return null;
    return Number(value);
  },

  deserialize(value) {
    if (value === null || value === undefined) return null;
    const num = Number(value);
    return isNaN(num) ? null : num;
  },

  getDefaultValue(options) {
    if (options?.defaultValue !== undefined) {
      const num = Number(options.defaultValue);
      return isNaN(num) ? null : num;
    }
    return null;
  },

  toJSON(value) {
    return value;
  },
};

// Boolean field handler (P0)
// FIX: Changed type to boolean | null to support "no value" state
// Review comment #5: "BooleanField Silently Converts Empty String to False"
// Empty strings from forms should be treated as "no value" (null), not coerced to false
export const BooleanField: FieldTypeHandler<boolean | null> = {
  type: "boolean",

  validate(value, rules): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const rule of rules) {
      if (rule.type === "required" && (value === null || value === undefined)) {
        errors.push({ field: "value", message: rule.message || "Required" });
      }
    }

    return errors;
  },

  serialize(value) {
    return value === null || value === undefined ? null : Boolean(value);
  },

  deserialize(value) {
    // FIX: Empty string is treated as "no value" (null), not false
    // Review comment: Empty string from forms represents "clear the field"
    // This prevents data integrity issues where clearing a boolean saves as false
    if (value === "" || value === null || value === undefined) return null;
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      return value.toLowerCase() === "true" || value === "1";
    }
    if (typeof value === "number") {
      return value !== 0;
    }
    return null; // Changed from false to null for consistency
  },

  getDefaultValue(options) {
    if (options?.defaultValue !== undefined) {
      return Boolean(options.defaultValue);
    }
    return null; // Changed from false to null (no value is default)
  },

  toJSON(value) {
    return value;
  },
};

/**
 * Date field handler (P0)
 *
 * @note Date Format: ISO 8601 String (YYYY-MM-DD or full ISO with time)
 * Review comment #9: "DateField Type/Behavior Mismatch"
 * This handler stores and returns dates as ISO 8601 strings, not Date objects.
 * - serialize(): Converts value to ISO string (e.g., "2024-01-15T00:00:00.000Z")
 * - deserialize(): Returns the ISO string as-is
 * - validate(): Accepts any valid date string, returns ISO format errors if invalid
 *
 * This design choice ensures:
 * 1. Consistent string format for database storage (JSON-friendly)
 * 2. Easy serialization/deserialization without Date object overhead
 * 3. UTC timezone handling by default
 *
 * If you need Date objects, convert after deserialization:
 *   const date = new Date(fieldValue)
 */
export const DateField: FieldTypeHandler<string | null> = {
  type: "date",

  validate(value, rules, options): ValidationError[] {
    const errors: ValidationError[] = [];

    // FIX: Empty string should be treated as "no value" (like null/undefined)
    // Review comment #4: "DateField inconsistently rejects empty strings for optional fields"
    // For non-required fields, empty string represents "clear the date" from form inputs
    // For required fields, empty string triggers the "Required" validation error
    if (value === null || value === undefined || value === "") {
      for (const rule of rules) {
        if (rule.type === "required") {
          errors.push({ field: "value", message: rule.message || "Required" });
        }
      }
      return errors;
    }

    const date = new Date(value as string);
    if (isNaN(date.getTime())) {
      errors.push({ field: "value", message: "Invalid date" });
      return errors;
    }

    // Check min/max dates
    if (options?.minDate && date < options.minDate) {
      errors.push({
        field: "value",
        message: `Date must be after ${options.minDate.toISOString().split("T")[0]}`,
      });
    }
    if (options?.maxDate && date > options.maxDate) {
      errors.push({
        field: "value",
        message: `Date must be before ${options.maxDate.toISOString().split("T")[0]}`,
      });
    }

    return errors;
  },

  serialize(value) {
    if (value === null || value === undefined) return null;
    // Store as ISO string
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date.toISOString();
  },

  deserialize(value) {
    if (value === null || value === undefined) return null;
    if (typeof value === "string") return value;
    if (value instanceof Date) return value.toISOString();
    return null;
  },

  getDefaultValue() {
    return null;
  },

  toJSON(value) {
    return value;
  },
};

// Datetime field handler (P2 - extends date)
export const DatetimeField: FieldTypeHandler<string | null> = {
  ...DateField,
  type: "datetime",
};

// Slug field handler (P0)
export const SlugField: FieldTypeHandler<string> = {
  type: "slug",

  validate(value, rules, options): ValidationError[] {
    const errors: ValidationError[] = [];
    const str = String(value ?? "");

    for (const rule of rules) {
      if (rule.type === "required" && !str.trim()) {
        errors.push({ field: "value", message: rule.message || "Required" });
      }
    }

    // Slug format validation
    if (str && !/^[a-z0-9-]+$/.test(str)) {
      errors.push({
        field: "value",
        message:
          "Slug must contain only lowercase letters, numbers, and hyphens",
      });
    }

    return errors;
  },

  serialize(value) {
    return String(value ?? "")
      .toLowerCase()
      .trim();
  },

  deserialize(value) {
    return String(value ?? "");
  },

  getDefaultValue(options) {
    return (options?.defaultValue as string) ?? "";
  },

  toJSON(value) {
    return value;
  },
};

/**
 * Email field handler (P1)
 *
 * @note Auto-Validation Behavior
 * Review comment #9: "EmailField/URLField Silent Behavior Change"
 * Email fields automatically validate format using regex regardless of validation rules.
 * This is different from TextField which only validates when explicit rules are provided.
 *
 * Validation behavior:
 * - Empty string: Passes (treated as "no value")
 * - Non-empty string: Must match email format or returns "Invalid email address" error
 * - Required rule: Checked separately from format validation
 *
 * The email regex used: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
 * This validates basic email structure (user@domain.tld)
 */
export const EmailField: FieldTypeHandler<string> = {
  type: "email",

  validate(value, rules): ValidationError[] {
    const errors: ValidationError[] = [];
    const str = String(value ?? "").trim();

    for (const rule of rules) {
      if (rule.type === "required" && !str) {
        errors.push({ field: "value", message: rule.message || "Required" });
      }
    }

    // Email type always validates format, regardless of validation rules
    if (str) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(str)) {
        errors.push({
          field: "value",
          message: "Invalid email address",
        });
      }
    }

    return errors;
  },

  serialize(value) {
    return String(value ?? "")
      .trim()
      .toLowerCase();
  },

  deserialize(value) {
    return String(value ?? "");
  },

  getDefaultValue(options) {
    return (options?.defaultValue as string) ?? "";
  },

  toJSON(value) {
    return value;
  },
};

/**
 * URL field handler (P1)
 *
 * @note Auto-Validation Behavior
 * Review comment #9: "EmailField/URLField Silent Behavior Change"
 * URL fields automatically validate format using native URL constructor regardless of validation rules.
 * This is different from TextField which only validates when explicit rules are provided.
 *
 * Validation behavior:
 * - Empty string: Passes (treated as "no value")
 * - Non-empty string: Must be valid URL format or returns "Invalid URL" error
 * - Required rule: Checked separately from format validation
 *
 * Uses native JavaScript URL constructor for validation, which supports:
 * - http:// and https:// protocols
 * - ftp://, file://, and other standard protocols
 * - Relative URLs (if base URL provided, but this handler requires absolute URLs)
 */
export const URLField: FieldTypeHandler<string> = {
  type: "url",

  validate(value, rules): ValidationError[] {
    const errors: ValidationError[] = [];
    const str = String(value ?? "").trim();

    for (const rule of rules) {
      if (rule.type === "required" && !str) {
        errors.push({ field: "value", message: rule.message || "Required" });
      }
    }

    // URL type always validates format, regardless of validation rules
    if (str) {
      try {
        new URL(str);
      } catch {
        errors.push({
          field: "value",
          message: "Invalid URL",
        });
      }
    }

    return errors;
  },

  serialize(value) {
    return String(value ?? "").trim();
  },

  deserialize(value) {
    return String(value ?? "");
  },

  getDefaultValue(options) {
    return (options?.defaultValue as string) ?? "";
  },

  toJSON(value) {
    return value;
  },
};

// Select field handler (P1)
export const SelectField: FieldTypeHandler<string | string[]> = {
  type: "select",

  validate(value, rules, options): ValidationError[] {
    const errors: ValidationError[] = [];

    const validOptions = options?.options?.map((o) => o.value) ?? [];
    const allowMultiple = options?.allowMultiple ?? false;

    if (value === null || value === undefined || value === "") {
      for (const rule of rules) {
        if (rule.type === "required") {
          errors.push({ field: "value", message: rule.message || "Required" });
        }
      }
      return errors;
    }

    if (allowMultiple) {
      const values = Array.isArray(value) ? value : [value];
      for (const v of values) {
        if (!validOptions.includes(v as string)) {
          errors.push({ field: "value", message: `Invalid option: ${v}` });
        }
      }
    } else {
      if (!validOptions.includes(value as string)) {
        errors.push({ field: "value", message: `Invalid option: ${value}` });
      }
    }

    return errors;
  },

  serialize(value) {
    return value;
  },

  deserialize(value) {
    return value as string | string[];
  },

  getDefaultValue(options) {
    if (options?.allowMultiple) {
      return [];
    }
    return (options?.defaultValue as string) ?? "";
  },

  toJSON(value) {
    return value;
  },
};

// Multiselect field handler (P1 - same as select with allowMultiple)
export const MultiselectField: FieldTypeHandler<string[]> = {
  ...SelectField,
  type: "multiselect",

  deserialize(value) {
    if (value === null || value === undefined) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === "string") return [value];
    return [];
  },

  getDefaultValue() {
    return [];
  },
};

// JSON field handler (P1)
export const JSONField: FieldTypeHandler<unknown> = {
  type: "json",

  validate(value, rules): ValidationError[] {
    const errors: ValidationError[] = [];

    if (value === null || value === undefined) {
      for (const rule of rules) {
        if (rule.type === "required") {
          errors.push({ field: "value", message: rule.message || "Required" });
        }
      }
      return errors;
    }

    return errors;
  },

  serialize(value) {
    // Return value as-is; the content service will JSON.stringify the entire data object
    // This prevents double-encoding when JSON fields are stored in the database
    return value;
  },

  deserialize(value) {
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        // NOTE: Returns null on parse error without logging
        // This is intentional design - JSON field accepts any valid JSON or null
        // Invalid JSON strings are treated as null (empty/reset state)
        // Review comment noted: "JSON parsing silently fails" - this is by design
        return null;
      }
    }
    return value;
  },

  getDefaultValue(options) {
    return options?.defaultValue ?? null;
  },

  toJSON(value) {
    return value;
  },
};

// Rich text field handler (P1)
export const RichTextField: FieldTypeHandler<string> = {
  type: "rich-text",

  validate(value, rules): ValidationError[] {
    const errors: ValidationError[] = [];
    const str = String(value ?? "");

    for (const rule of rules) {
      if (rule.type === "required" && !str.trim()) {
        errors.push({ field: "value", message: rule.message || "Required" });
      }
    }

    return errors;
  },

  serialize(value) {
    return String(value ?? "");
  },

  deserialize(value) {
    return String(value ?? "");
  },

  getDefaultValue(options) {
    return (options?.defaultValue as string) ?? "";
  },

  toJSON(value) {
    return value;
  },
};

// Media field handler (P1)
export const MediaField: FieldTypeHandler<string | string[] | null> = {
  type: "media",

  validate(value, rules, options): ValidationError[] {
    const errors: ValidationError[] = [];

    const multiple = options?.media?.multiple ?? false;
    const values = multiple
      ? Array.isArray(value)
        ? value
        : value
          ? [value]
          : []
      : value
        ? [value as string]
        : [];

    if (values.length === 0) {
      for (const rule of rules) {
        if (rule.type === "required") {
          errors.push({ field: "value", message: rule.message || "Required" });
        }
      }
    }

    // Note: File type and size validation would happen at upload time
    // This is just for reference validation

    return errors;
  },

  serialize(value) {
    return value;
  },

  deserialize(value) {
    return value as string | string[] | null;
  },

  getDefaultValue(options) {
    if (options?.media?.multiple) {
      return [];
    }
    return null;
  },

  toJSON(value) {
    return value;
  },
};

// Relation field handler (P0)
export const RelationField: FieldTypeHandler<
  RelationValue | RelationValue[] | null
> = {
  type: "relation",

  validate(value, rules, options): ValidationError[] {
    const errors: ValidationError[] = [];
    const { relation } = options || {};

    if (!relation) {
      errors.push({ field: "relation", message: "Relation config required" });
      return errors;
    }

    // Check if value is present when required
    const isEmpty =
      value === null ||
      value === undefined ||
      (Array.isArray(value) && value.length === 0) ||
      (typeof value === "object" && value !== null && !("id" in value));

    if (isEmpty) {
      for (const rule of rules) {
        if (rule.type === "required") {
          errors.push({ field: "value", message: rule.message || "Required" });
        }
      }
    }

    // Validate value structure
    if (!isEmpty) {
      const values = Array.isArray(value) ? value : [value];
      for (const v of values) {
        if (!v || typeof v !== "object" || !("id" in v)) {
          errors.push({ field: "value", message: "Invalid relation value" });
        }
      }
    }

    // Note: Target content existence validation and circular reference detection
    // would be handled at a higher level (content service)

    return errors;
  },

  serialize(value) {
    return value;
  },

  deserialize(value) {
    return value as RelationValue | RelationValue[] | null;
  },

  getDefaultValue() {
    return null;
  },

  toJSON(value) {
    return value;
  },
};

// Color field handler (P2)
export const ColorField: FieldTypeHandler<string> = {
  type: "color",

  validate(value, rules): ValidationError[] {
    const errors: ValidationError[] = [];
    const str = String(value ?? "");

    for (const rule of rules) {
      if (rule.type === "required" && !str) {
        errors.push({ field: "value", message: rule.message || "Required" });
      }
    }

    // Basic hex color validation
    if (str && !/^#[0-9A-Fa-f]{6}$/.test(str)) {
      errors.push({
        field: "value",
        message: "Invalid color format (use #RRGGBB)",
      });
    }

    return errors;
  },

  serialize(value) {
    return String(value ?? "").toUpperCase();
  },

  deserialize(value) {
    return String(value ?? "");
  },

  getDefaultValue(options) {
    return (options?.defaultValue as string) ?? "#000000";
  },

  toJSON(value) {
    return value;
  },
};

// Location field handler (P2)
export const LocationField: FieldTypeHandler<{
  lat: number;
  lng: number;
} | null> = {
  type: "location",

  validate(value, rules): ValidationError[] {
    const errors: ValidationError[] = [];

    if (value === null || value === undefined) {
      for (const rule of rules) {
        if (rule.type === "required") {
          errors.push({ field: "value", message: rule.message || "Required" });
        }
      }
      return errors;
    }

    if (typeof value !== "object" || !("lat" in value) || !("lng" in value)) {
      errors.push({ field: "value", message: "Invalid location format" });
      return errors;
    }

    const { lat, lng } = value as { lat: number; lng: number };

    if (typeof lat !== "number" || lat < -90 || lat > 90) {
      errors.push({
        field: "lat",
        message: "Latitude must be between -90 and 90",
      });
    }
    if (typeof lng !== "number" || lng < -180 || lng > 180) {
      errors.push({
        field: "lng",
        message: "Longitude must be between -180 and 180",
      });
    }

    return errors;
  },

  serialize(value) {
    return value;
  },

  deserialize(value) {
    return value as { lat: number; lng: number } | null;
  },

  getDefaultValue() {
    return null;
  },

  toJSON(value) {
    return value;
  },
};

// Reference field handler (P2 - system variables)
export const ReferenceField: FieldTypeHandler<string> = {
  type: "reference",

  validate(value, rules): ValidationError[] {
    const errors: ValidationError[] = [];
    const str = String(value ?? "");

    for (const rule of rules) {
      if (rule.type === "required" && !str) {
        errors.push({ field: "value", message: rule.message || "Required" });
      }
    }

    return errors;
  },

  serialize(value) {
    return String(value ?? "");
  },

  deserialize(value) {
    return String(value ?? "");
  },

  getDefaultValue(options) {
    return (options?.defaultValue as string) ?? "";
  },

  toJSON(value) {
    return value;
  },
};

// Field registry class
export class FieldRegistry {
  private handlers: Map<string, FieldTypeHandler<unknown>> = new Map();

  constructor() {
    // Register P0 and P1 field types by default
    this.register(TextField);
    this.register(TextareaField);
    this.register(NumberField);
    this.register(BooleanField);
    this.register(DateField);
    this.register(DatetimeField);
    this.register(SlugField);
    this.register(EmailField);
    this.register(URLField);
    this.register(SelectField);
    this.register(MultiselectField);
    this.register(JSONField);
    this.register(RichTextField);
    this.register(MediaField);
    this.register(RelationField);
    this.register(ColorField);
    this.register(LocationField);
    this.register(ReferenceField);
  }

  register<T>(handler: FieldTypeHandler<T>): void {
    this.handlers.set(handler.type, handler as FieldTypeHandler<unknown>);
  }

  get(type: string): FieldTypeHandler<unknown> | undefined {
    return this.handlers.get(type);
  }

  has(type: string): boolean {
    return this.handlers.has(type);
  }

  getAllTypes(): string[] {
    return Array.from(this.handlers.keys());
  }

  getSupportedTypes(): FieldRegistryEntry[] {
    return Array.from(this.handlers.entries()).map(([type, handler]) => ({
      ...handler,
      description: this.getFieldDescription(type),
      supportedRules: this.getSupportedRules(type),
      defaultComponent: this.getDefaultComponent(type),
    }));
  }

  private getFieldDescription(type: string): string {
    const descriptions: Record<string, string> = {
      text: "Single line text input",
      textarea: "Multi-line text input",
      "rich-text": "HTML/Markdown editor",
      number: "Numeric value (integer or float)",
      boolean: "True/false checkbox",
      date: "Date picker",
      datetime: "Date and time picker",
      slug: "URL-friendly string",
      email: "Email address with validation",
      url: "URL with validation",
      select: "Dropdown selection",
      multiselect: "Multiple selection dropdown",
      relation: "Reference to another content",
      media: "File or image upload",
      json: "Raw JSON data",
      color: "Color picker",
      location: "Map coordinates",
      reference: "System variable reference",
    };
    return descriptions[type] || "Unknown field type";
  }

  private getSupportedRules(type: string): string[] {
    const commonRules = ["required"];
    const specificRules: Record<string, string[]> = {
      text: [...commonRules, "minLength", "maxLength", "pattern"],
      textarea: [...commonRules, "minLength", "maxLength"],
      number: [...commonRules, "min", "max"],
      boolean: commonRules,
      date: [...commonRules, "min", "max"],
      email: [...commonRules, "email"],
      url: [...commonRules, "url"],
      select: commonRules,
      multiselect: commonRules,
      relation: commonRules,
      media: commonRules,
      slug: [...commonRules, "pattern"],
    };
    return specificRules[type] || commonRules;
  }

  private getDefaultComponent(type: string): string {
    const components: Record<string, string> = {
      text: "TextInput",
      textarea: "TextArea",
      "rich-text": "RichTextEditor",
      number: "NumberInput",
      boolean: "Checkbox",
      date: "DatePicker",
      datetime: "DateTimePicker",
      slug: "SlugInput",
      email: "EmailInput",
      url: "URLInput",
      select: "Select",
      multiselect: "MultiSelect",
      relation: "RelationPicker",
      media: "MediaUploader",
      json: "JSONEditor",
      color: "ColorPicker",
      location: "LocationPicker",
      reference: "ReferenceSelect",
    };
    return components[type] || "UnknownComponent";
  }
}

// Global registry instance
export const globalFieldRegistry = new FieldRegistry();

// Helper function to get handler
export function getFieldHandler(
  type: string,
): FieldTypeHandler<unknown> | undefined {
  return globalFieldRegistry.get(type);
}

// Helper function to validate value for a field type
export function validateFieldValue(
  type: string,
  value: unknown,
  rules: ValidationRule[],
  options?: FieldOptions,
): ValidationError[] {
  const handler = getFieldHandler(type);
  if (!handler) {
    return [{ field: "type", message: `Unknown field type: ${type}` }];
  }
  return handler.validate(value, rules, options);
}

// Helper function to serialize value for a field type
export function serializeFieldValue(type: string, value: unknown): unknown {
  const handler = getFieldHandler(type);
  if (!handler) return value;
  return handler.serialize(value);
}

// Helper function to deserialize value for a field type
export function deserializeFieldValue<T>(type: string, value: unknown): T {
  const handler = getFieldHandler(type);
  if (!handler) return value as T;
  return handler.deserialize(value) as T;
}
