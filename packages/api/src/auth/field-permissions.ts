import type { Role, Permission } from "./permissions.ts";
import { hasPermission } from "./permissions.ts";

interface FieldUIConfig {
  permission?: string;
  editPermission?: string;
}

interface FieldDefinition {
  key: string;
  ui?: FieldUIConfig;
}

interface Blueprint {
  fields: FieldDefinition[];
}

interface ContentData {
  [key: string]: unknown;
}

interface Content {
  data: ContentData;
  blueprint?: Blueprint;
}

export function filterFieldsByPermission(
  content: Content,
  blueprint: Blueprint,
  role: Role,
): Content {
  const visibleFields = blueprint.fields.filter((field: FieldDefinition) => {
    const fieldPermission = field.ui?.permission;
    if (!fieldPermission) return true;
    return hasPermission(role, fieldPermission as Permission);
  });

  const filteredData: ContentData = {};
  for (const field of visibleFields) {
    if (field.key in content.data) {
      filteredData[field.key] = content.data[field.key];
    }
  }

  return {
    ...content,
    data: filteredData,
  };
}

export function filterBlueprintFieldsByPermission(
  blueprint: Blueprint,
  role: Role,
): Blueprint {
  const visibleFields = blueprint.fields.filter((field: FieldDefinition) => {
    const fieldPermission = field.ui?.permission;
    if (!fieldPermission) return true;
    return hasPermission(role, fieldPermission as Permission);
  });

  return {
    ...blueprint,
    fields: visibleFields,
  };
}

export function canViewField(field: FieldDefinition, role: Role): boolean {
  const fieldPermission = field.ui?.permission;
  if (!fieldPermission) return true;
  return hasPermission(role, fieldPermission as Permission);
}

export function canEditField(field: FieldDefinition, role: Role): boolean {
  const editPermission = field.ui?.editPermission;
  if (!editPermission) {
    const viewPermission = field.ui?.permission;
    if (!viewPermission) return true;
    return hasPermission(role, viewPermission as Permission);
  }
  return hasPermission(role, editPermission as Permission);
}
