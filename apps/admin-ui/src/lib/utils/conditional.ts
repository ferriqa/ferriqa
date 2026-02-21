import type { FieldDefinition } from "../components/blueprint/types.ts";

export function isFieldVisible(
  field: FieldDefinition,
  formData: Record<string, unknown>,
): boolean {
  const conditional = field.ui?.conditional;
  if (!conditional) return true;

  const targetValue = formData[conditional.when];

  if (conditional.equals !== undefined) {
    return targetValue === conditional.equals;
  }

  if (conditional.notEquals !== undefined) {
    return targetValue !== conditional.notEquals;
  }

  if (conditional.contains !== undefined) {
    if (Array.isArray(targetValue)) {
      return targetValue.includes(conditional.contains);
    }
    if (typeof targetValue === "string") {
      return targetValue.includes(String(conditional.contains));
    }
    return false;
  }

  if (conditional.isEmpty !== undefined) {
    if (conditional.isEmpty) {
      return (
        targetValue === undefined ||
        targetValue === null ||
        targetValue === "" ||
        (Array.isArray(targetValue) && targetValue.length === 0)
      );
    }
    return !isEmptyValue(targetValue);
  }

  if (conditional.isNotEmpty !== undefined) {
    if (conditional.isNotEmpty) {
      return !isEmptyValue(targetValue);
    }
    return isEmptyValue(targetValue);
  }

  return true;
}

function isEmptyValue(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string" && value.trim() === "") return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

export function getVisibleFields(
  fields: FieldDefinition[],
  formData: Record<string, unknown>,
): FieldDefinition[] {
  return fields.filter((field) => isFieldVisible(field, formData));
}
