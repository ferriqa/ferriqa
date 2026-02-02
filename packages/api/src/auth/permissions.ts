export type Permission =
  | "blueprint:read"
  | "blueprint:create"
  | "blueprint:update"
  | "blueprint:delete"
  | "content:read"
  | "content:create"
  | "content:update"
  | "content:delete"
  | "content:publish"
  | "content:unpublish"
  | "content:rollback"
  | "media:read"
  | "media:create"
  | "media:delete"
  | "webhook:read"
  | "webhook:create"
  | "webhook:update"
  | "webhook:delete"
  | "user:read"
  | "user:create"
  | "user:update"
  | "user:delete"
  | "settings:read"
  | "settings:update"
  | "*";

export type Role = "admin" | "editor" | "viewer" | "api";

interface RoleConfig {
  permissions: Permission[];
}

const rolePermissions: Record<Role, RoleConfig> = {
  admin: {
    permissions: ["*"],
  },
  editor: {
    permissions: [
      "blueprint:read",
      "content:read",
      "content:create",
      "content:update",
      "content:delete",
      "content:publish",
      "content:unpublish",
      "webhook:read",
      "media:read",
      "media:create",
      "media:delete",
    ],
  },
  viewer: {
    permissions: ["blueprint:read", "content:read", "media:read"],
  },
  api: {
    permissions: ["content:read", "blueprint:read"],
  },
};

export function hasPermission(
  role: Role,
  permission: Permission,
  blueprintSlug?: string,
): boolean {
  const roleConfig = rolePermissions[role];
  const permissions = roleConfig.permissions;

  if (permissions.includes("*" as Permission)) return true;
  if (permissions.includes(permission)) return true;

  if (blueprintSlug) {
    const blueprintPermission =
      `blueprint:${blueprintSlug}:${permission.split(":")[1]}` as Permission;
    if (permissions.includes(blueprintPermission)) return true;
  }

  return false;
}

export function getRolePermissions(role: Role): Permission[] {
  return rolePermissions[role].permissions;
}
