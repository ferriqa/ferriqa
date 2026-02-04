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

/**
 * Base role type - the source of truth for all role definitions
 * NOTE: This is the authoritative type. UserRole in types.ts is an alias.
 * When adding new roles, update both the Permission type above and this Role type.
 */
export type Role = "admin" | "editor" | "viewer" | "api";

// NOTE: BaseRole is an alias to Role for semantic clarity in inheritance contexts
// Use Role for general purposes, BaseRole when specifically discussing inheritance
export type BaseRole = Role;

interface RoleConfig {
  permissions: Permission[];
}

const rolePermissions: Record<BaseRole, RoleConfig> = {
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

export const BASE_ROLES = Object.keys(rolePermissions) as BaseRole[];

export const BASE_ROLE_NAMES = BASE_ROLES as readonly string[];

// NOTE: Permission resolver is initialized lazily via setPermissionResolver()
// This allows the application to bootstrap base roles first, then inject the
// custom role resolver when custom roles are loaded from persistence
let permissionResolver: PermissionResolver | null = null;

export interface PermissionResolver {
  resolvePermissions(role: string): Set<Permission>;
  hasPermission(
    role: string,
    permission: Permission,
    blueprintSlug?: string,
  ): boolean;
  getRolePermissions(role: string): Permission[];
  isBaseRole(role: string): boolean;
  isCustomRole(role: string): boolean;
}

/**
 * Set the permission resolver for custom role inheritance
 * NOTE: This MUST be called during application bootstrap to enable custom role support
 *
 * Example initialization:
 * ```typescript
 * import { PermissionInheritanceResolver, setPermissionResolver } from '@ferriqa/api/auth';
 *
 * const resolver = new PermissionInheritanceResolver(BASE_ROLES);
 * setPermissionResolver(resolver);
 * ```
 *
 * If not called, only base roles (admin, editor, viewer, api) will work.
 * Custom roles defined via CustomRoleManager will not be recognized.
 *
 * @param resolver - The permission resolver instance to use for custom role resolution
 */
export function setPermissionResolver(resolver: PermissionResolver): void {
  permissionResolver = resolver;
}

export function getPermissionResolver(): PermissionResolver | null {
  return permissionResolver;
}

export function hasPermission(
  role: Role | string,
  permission: Permission,
  blueprintSlug?: string,
): boolean {
  if (permissionResolver && permissionResolver.isCustomRole(role)) {
    return permissionResolver.hasPermission(role, permission, blueprintSlug);
  }

  const baseRole = role as BaseRole;
  if (!rolePermissions[baseRole]) {
    // DEBUG: Log unknown role access attempts to help identify configuration issues
    // TODO: Replace with proper logger when available (e.g., FerriqaErrorLogger)
    // This currently returns false silently to maintain security (fail-closed)
    if (typeof console !== "undefined" && console.warn) {
      console.warn(
        `[permissions] Unknown role "${role}" - denying access. Consider configuring a custom role resolver.`,
      );
    }
    return false;
  }

  const roleConfig = rolePermissions[baseRole];
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

export function getRolePermissions(role: Role | string): Permission[] {
  if (permissionResolver && permissionResolver.isCustomRole(role)) {
    return permissionResolver.getRolePermissions(role);
  }

  const baseRole = role as BaseRole;
  if (!rolePermissions[baseRole]) {
    // DEBUG: Log unknown role access attempts to help identify configuration issues
    // TODO: Replace with proper logger when available (e.g., FerriqaErrorLogger)
    if (typeof console !== "undefined" && console.warn) {
      console.warn(
        `[permissions] Unknown role "${role}" - returning empty permissions. Consider configuring a custom role resolver.`,
      );
    }
    return [];
  }

  return rolePermissions[baseRole].permissions;
}
