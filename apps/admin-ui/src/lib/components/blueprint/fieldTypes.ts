import type { FieldTypeMeta, FieldType, FieldCategory } from "./types.js";

export const FIELD_CATEGORIES = {
  BASIC: "basic",
  ADVANCED: "advanced",
  RELATION: "relation",
  MEDIA: "media",
} as const;

export const FIELD_TYPES: FieldTypeMeta[] = [
  // Basic Fields
  {
    id: "text",
    name: "field_text",
    description: "Single line text input",
    category: "basic",
    icon: "Type",
    configurableOptions: [
      "minLength",
      "maxLength",
      "pattern",
      "placeholder",
      "helpText",
      "defaultValue",
    ],
    validationRules: ["minLength", "maxLength", "pattern", "messages"],
  },
  {
    id: "textarea",
    name: "field_textarea",
    description: "Multi-line text input",
    category: "basic",
    icon: "AlignLeft",
    configurableOptions: [
      "minLength",
      "maxLength",
      "placeholder",
      "helpText",
      "defaultValue",
    ],
    validationRules: ["minLength", "maxLength", "messages"],
  },
  {
    id: "number",
    name: "field_number",
    description: "Numeric input",
    category: "basic",
    icon: "Hash",
    configurableOptions: [
      "min",
      "max",
      "step",
      "placeholder",
      "helpText",
      "defaultValue",
    ],
    validationRules: ["min", "max", "messages"],
  },
  {
    id: "boolean",
    name: "field_boolean",
    description: "True/False checkbox",
    category: "basic",
    icon: "CheckSquare",
    configurableOptions: ["defaultValue", "helpText"],
    validationRules: ["messages"],
  },
  {
    id: "email",
    name: "field_email",
    description: "Email address input",
    category: "basic",
    icon: "Mail",
    configurableOptions: ["placeholder", "helpText", "defaultValue"],
    validationRules: [
      "allowedDomains",
      "blockedDomains",
      "allowSubdomains",
      "messages",
    ],
  },
  {
    id: "url",
    name: "field_url",
    description: "URL input",
    category: "basic",
    icon: "Link",
    configurableOptions: ["placeholder", "helpText", "defaultValue"],
    validationRules: ["allowedProtocols", "requireProtocol", "messages"],
  },

  // Advanced Fields
  {
    id: "date",
    name: "field_date",
    description: "Date picker",
    category: "advanced",
    icon: "Calendar",
    configurableOptions: [
      "minDate",
      "maxDate",
      "placeholder",
      "helpText",
      "defaultValue",
    ],
    validationRules: ["minDate", "maxDate", "messages"],
  },
  {
    id: "datetime",
    name: "field_datetime",
    description: "Date and time picker",
    category: "advanced",
    icon: "CalendarClock",
    configurableOptions: [
      "minDate",
      "maxDate",
      "placeholder",
      "helpText",
      "defaultValue",
    ],
    validationRules: ["minDate", "maxDate", "messages"],
  },
  {
    id: "select",
    name: "field_select",
    description: "Single select dropdown",
    category: "advanced",
    icon: "ChevronDown",
    configurableOptions: ["choices", "placeholder", "helpText", "defaultValue"],
    validationRules: ["messages"],
  },
  {
    id: "multiselect",
    name: "field_multiselect",
    description: "Multi select dropdown",
    category: "advanced",
    icon: "List",
    configurableOptions: ["choices", "placeholder", "helpText", "defaultValue"],
    validationRules: ["minItems", "maxItems", "messages"],
  },
  {
    id: "slug",
    name: "field_slug",
    description: "URL-friendly slug",
    category: "advanced",
    icon: "Link2",
    configurableOptions: ["sourceField", "placeholder", "helpText"],
    validationRules: ["pattern", "messages"],
  },
  {
    id: "json",
    name: "field_json",
    description: "JSON data editor",
    category: "advanced",
    icon: "Code",
    configurableOptions: ["placeholder", "helpText"],
    validationRules: ["messages"],
  },
  {
    id: "color",
    name: "field_color",
    description: "Color picker",
    category: "advanced",
    icon: "Palette",
    configurableOptions: ["defaultValue", "helpText"],
    validationRules: ["messages"],
  },

  // Relation Fields
  {
    id: "relation",
    name: "field_relation",
    description: "Relation to other content",
    category: "relation",
    icon: "GitBranch",
    configurableOptions: ["relation", "helpText"],
    validationRules: ["messages"],
  },

  // Media Fields
  {
    id: "media",
    name: "field_media",
    description: "Media file selector",
    category: "media",
    icon: "Image",
    configurableOptions: ["media", "helpText"],
    validationRules: [
      "minItems",
      "maxItems",
      "maxFileSize",
      "allowedMimeTypes",
      "messages",
    ],
  },
  {
    id: "richtext",
    name: "field_richtext",
    description: "Rich text editor",
    category: "media",
    icon: "FileText",
    configurableOptions: ["placeholder", "helpText"],
    validationRules: ["maxChars", "allowedTags", "messages"],
  },
];

export function getFieldType(type: FieldType): FieldTypeMeta | undefined {
  return FIELD_TYPES.find((ft) => ft.id === type);
}

export function getFieldTypesByCategory(
  category: FieldCategory,
): FieldTypeMeta[] {
  return FIELD_TYPES.filter((ft) => ft.category === category);
}

export function generateFieldKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function createField(
  type: FieldType,
  index: number,
): import("./types.js").FieldDefinition {
  const fieldType = getFieldType(type);
  return {
    id: crypto.randomUUID(),
    name: `New ${fieldType?.name || "Field"}`,
    key: `field_${index + 1}`,
    type,
    required: false,
    description: "",
    options: {},
    ui: {
      width: "half",
    },
    validation: {},
  };
}

// Validation rules metadata
export const VALIDATION_RULES = {
  minLength: {
    id: "minLength",
    name: "Minimum Length",
    description: "Minimum number of characters allowed",
    applicableTypes: ["text", "textarea", "email", "url", "slug"],
    valueType: "number",
    min: 0,
    placeholder: "0",
  },
  maxLength: {
    id: "maxLength",
    name: "Maximum Length",
    description: "Maximum number of characters allowed",
    applicableTypes: ["text", "textarea", "email", "url", "slug", "richtext"],
    valueType: "number",
    min: 1,
    placeholder: "255",
  },
  min: {
    id: "min",
    name: "Minimum Value",
    description: "Minimum numeric value allowed",
    applicableTypes: ["number"],
    valueType: "number",
    placeholder: "0",
  },
  max: {
    id: "max",
    name: "Maximum Value",
    description: "Maximum numeric value allowed",
    applicableTypes: ["number"],
    valueType: "number",
    placeholder: "100",
  },
  pattern: {
    id: "pattern",
    name: "Pattern (Regex)",
    description: "Regular expression pattern for validation",
    applicableTypes: ["text", "textarea", "slug"],
    valueType: "string",
    placeholder: "^[a-zA-Z0-9]+$",
  },
  minDate: {
    id: "minDate",
    name: "Minimum Date",
    description: "Earliest date allowed",
    applicableTypes: ["date", "datetime"],
    valueType: "date",
    placeholder: "",
  },
  maxDate: {
    id: "maxDate",
    name: "Maximum Date",
    description: "Latest date allowed",
    applicableTypes: ["date", "datetime"],
    valueType: "date",
    placeholder: "",
  },
  minItems: {
    id: "minItems",
    name: "Minimum Items",
    description: "Minimum number of items required",
    applicableTypes: ["multiselect", "media"],
    valueType: "number",
    min: 0,
    placeholder: "0",
  },
  maxItems: {
    id: "maxItems",
    name: "Maximum Items",
    description: "Maximum number of items allowed",
    applicableTypes: ["multiselect", "media"],
    valueType: "number",
    min: 1,
    placeholder: "10",
  },
  maxFileSize: {
    id: "maxFileSize",
    name: "Maximum File Size",
    description: "Maximum file size in MB",
    applicableTypes: ["media"],
    valueType: "number",
    min: 0.1,
    placeholder: "5",
  },
  maxChars: {
    id: "maxChars",
    name: "Maximum Characters",
    description: "Maximum number of characters in rich text",
    applicableTypes: ["richtext"],
    valueType: "number",
    min: 1,
    placeholder: "5000",
  },
  messages: {
    id: "messages",
    name: "Custom Error Messages",
    description: "Customize validation error messages",
    applicableTypes: [
      "text",
      "textarea",
      "number",
      "email",
      "url",
      "date",
      "datetime",
      "select",
      "multiselect",
      "slug",
      "json",
      "color",
      "relation",
      "media",
      "richtext",
      "boolean",
    ],
    valueType: "text",
    placeholder: "",
  },
} as const;

export function getValidationRulesForType(type: FieldType): string[] {
  const fieldType = getFieldType(type);
  return fieldType?.validationRules || [];
}
