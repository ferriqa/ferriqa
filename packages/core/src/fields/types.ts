/**
 * Field Types Type Definitions
 *
 * Field type handler interfaces and types
 * Based on roadmap 2.1 - Field Types Registry
 */

import type {
  ValidationRule,
  ValidationError,
  FieldOptions,
  FieldType,
} from "../blueprint/types";

export interface FieldTypeHandler<T = unknown> {
  type: FieldType;

  // Validasyon
  validate(
    value: unknown,
    rules: ValidationRule[],
    options?: FieldOptions,
  ): ValidationError[];

  // Transformasyon
  serialize(value: T): unknown; // DB'ye yazmadan önce
  deserialize(value: unknown): T; // DB'den okuduktan sonra

  // Default value
  getDefaultValue(options?: FieldOptions): T;

  // API response'ta kullanılacak
  toJSON(value: T): unknown;
}

// Relation value type
export interface RelationValue {
  id: string;
  blueprint: string;
  [key: string]: unknown;
}

// Field validation context
export interface FieldValidationContext {
  fieldKey: string;
  fieldName: string;
  fieldType: FieldType;
  options?: FieldOptions;
}

// Registry entry with metadata
export interface FieldRegistryEntry<T = unknown> extends FieldTypeHandler<T> {
  description: string;
  supportedRules: string[];
  defaultComponent: string;
}
