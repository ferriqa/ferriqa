import type { Permission, BaseRole } from "./permissions.ts";

/**
 * PermissionInheritanceResolver
 *
 * Handles the resolution of permissions for custom roles that inherit
 * from base roles with support for permission overrides and caching.
 */

interface PermissionCacheEntry {
  permissions: Set<Permission>;
  timestamp: number;
}

interface InheritanceChain {
  chain: string[];
  isValid: boolean;
  error?: string;
}

export class PermissionInheritanceResolver {
  private cache = new Map<string, PermissionCacheEntry>();
  private cacheTTL = 5 * 60 * 1000; // 5 minutes
  private maxInheritanceDepth = 5;

  private baseRoles: Set<string>;
  private customRoleDefinitions: Map<string, CustomRoleDefinition>;

  constructor(
    baseRoles: readonly string[],
    customRoleDefinitions: Map<string, CustomRoleDefinition> = new Map(),
  ) {
    this.baseRoles = new Set(baseRoles);
    this.customRoleDefinitions = new Map(customRoleDefinitions);
  }

  /**
   * Resolve permissions for a role (base or custom) with inheritance
   */
  resolvePermissions(
    role: string,
    getBaseRolePermissions: (role: BaseRole) => Permission[],
  ): Set<Permission> {
    const cached = this.getFromCache(role);
    if (cached) return cached;

    const permissions = this.computePermissions(role, getBaseRolePermissions);
    this.setCache(role, permissions);
    return permissions;
  }

  /**
   * Check if a role has a specific permission using inheritance
   */
  hasPermission(
    role: string,
    permission: Permission,
    getBaseRolePermissions: (role: BaseRole) => Permission[],
    blueprintSlug?: string,
  ): boolean {
    const resolvedPermissions = this.resolvePermissions(
      role,
      getBaseRolePermissions,
    );

    if (resolvedPermissions.has("*" as Permission)) return true;
    if (resolvedPermissions.has(permission)) return true;

    if (blueprintSlug) {
      const blueprintPermission =
        `blueprint:${blueprintSlug}:${permission.split(":")[1]}` as Permission;
      if (resolvedPermissions.has(blueprintPermission)) return true;
    }

    return false;
  }

  /**
   * Get all permissions for a role
   */
  getRolePermissions(
    role: string,
    getBaseRolePermissions: (role: BaseRole) => Permission[],
  ): Permission[] {
    const permissions = this.resolvePermissions(role, getBaseRolePermissions);
    return Array.from(permissions);
  }

  /**
   * Register a custom role definition
   */
  registerCustomRole(definition: CustomRoleDefinition): void {
    this.validateCustomRole(definition);
    this.customRoleDefinitions.set(definition.name, definition);
    this.invalidateCache(definition.name);
  }

  /**
   * Unregister a custom role
   */
  unregisterCustomRole(roleName: string): boolean {
    this.invalidateCache(roleName);
    return this.customRoleDefinitions.delete(roleName);
  }

  /**
   * Get custom role definition
   */
  getCustomRole(roleName: string): CustomRoleDefinition | undefined {
    return this.customRoleDefinitions.get(roleName);
  }

  /**
   * Check if a role is a custom role
   */
  isCustomRole(role: string): boolean {
    return this.customRoleDefinitions.has(role);
  }

  /**
   * Check if a role is a base role
   */
  isBaseRole(role: string): boolean {
    return this.baseRoles.has(role);
  }

  /**
   * Get the inheritance chain for a custom role
   */
  getInheritanceChain(role: string): InheritanceChain {
    const chain: string[] = [];
    const visited = new Set<string>();
    let current: string | undefined = role;
    let depth = 0;

    while (current && depth < this.maxInheritanceDepth) {
      if (visited.has(current)) {
        return {
          chain,
          isValid: false,
          error: `Circular inheritance detected: ${current}`,
        };
      }

      visited.add(current);
      chain.push(current);

      const definition = this.customRoleDefinitions.get(current);
      if (definition) {
        current = definition.inheritsFrom;
      } else if (this.baseRoles.has(current)) {
        // BUG FIX: Removed duplicate chain.push(current) - current was already added at line 146
        // The base role is already in the chain, just break to end the inheritance chain
        break;
      } else {
        return {
          chain,
          isValid: false,
          error: `Unknown role in inheritance chain: ${current}`,
        };
      }

      depth++;
    }

    if (depth >= this.maxInheritanceDepth) {
      return {
        chain,
        isValid: false,
        error: `Maximum inheritance depth (${this.maxInheritanceDepth}) exceeded`,
      };
    }

    return { chain, isValid: true };
  }

  /**
   * Clear the permission cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Invalidate cache for a specific role and all roles that inherit from it
   */
  invalidateCache(role: string): void {
    this.cache.delete(role);

    for (const [name] of this.customRoleDefinitions) {
      if (this.inheritsFrom(name, role)) {
        this.cache.delete(name);
      }
    }
  }

  /**
   * Set cache TTL in milliseconds
   */
  setCacheTTL(ms: number): void {
    this.cacheTTL = ms;
  }

  /**
   * Get all registered custom roles
   */
  getAllCustomRoles(): CustomRoleDefinition[] {
    return Array.from(this.customRoleDefinitions.values());
  }

  /**
   * Validate a custom role definition
   */
  private validateCustomRole(definition: CustomRoleDefinition): void {
    if (!definition.name || definition.name.trim() === "") {
      throw new Error("Custom role name is required");
    }

    if (this.baseRoles.has(definition.name)) {
      throw new Error(
        `Cannot use base role name '${definition.name}' as custom role`,
      );
    }

    if (!definition.inheritsFrom) {
      throw new Error(
        `Custom role '${definition.name}' must inherit from a base role`,
      );
    }

    if (
      !this.baseRoles.has(definition.inheritsFrom) &&
      !this.customRoleDefinitions.has(definition.inheritsFrom)
    ) {
      throw new Error(
        `Custom role '${definition.name}' inherits from unknown role '${definition.inheritsFrom}'`,
      );
    }

    // Check if inheritsFrom is the same as the role name
    if (definition.inheritsFrom === definition.name) {
      throw new Error(
        `Custom role '${definition.name}' cannot inherit from itself`,
      );
    }

    // Check if adding this role would create a circular inheritance
    if (this.wouldCreateCycle(definition.name, definition.inheritsFrom)) {
      throw new Error(
        `Custom role '${definition.name}' would create circular inheritance with '${definition.inheritsFrom}'`,
      );
    }
  }

  /**
   * Check if adding a role that inherits from parent would create a cycle
   */
  private wouldCreateCycle(roleName: string, parentName: string): boolean {
    // Temporarily track if parent eventually leads back to roleName
    const visited = new Set<string>();
    let current = parentName;
    let depth = 0;

    while (current && depth < this.maxInheritanceDepth) {
      if (current === roleName) {
        return true; // Found a cycle
      }

      if (visited.has(current)) {
        return true; // Cycle detected
      }

      visited.add(current);

      const definition = this.customRoleDefinitions.get(current);
      if (definition) {
        current = definition.inheritsFrom;
      } else if (this.baseRoles.has(current)) {
        break; // Reached base role, no cycle
      } else {
        return true; // Unknown role in chain
      }

      depth++;
    }

    return depth >= this.maxInheritanceDepth;
  }

  /**
   * Compute permissions by traversing the inheritance chain
   */
  private computePermissions(
    role: string,
    getBaseRolePermissions: (role: BaseRole) => Permission[],
  ): Set<Permission> {
    const chain = this.getInheritanceChain(role);

    if (!chain.isValid) {
      if (this.baseRoles.has(role as BaseRole)) {
        return new Set(getBaseRolePermissions(role as BaseRole));
      }
      return new Set();
    }

    const permissions = new Set<Permission>();
    const deniedPermissions = new Set<Permission>();

    for (let i = chain.chain.length - 1; i >= 0; i--) {
      const currentRole = chain.chain[i];
      const definition = this.customRoleDefinitions.get(currentRole);

      if (definition) {
        // Add additional permissions
        if (definition.permissions) {
          for (const perm of definition.permissions) {
            if (!deniedPermissions.has(perm)) {
              permissions.add(perm);
            }
          }
        }

        // Apply denied permissions (override)
        // NOTE: deniedPermissions are PERMANENT in the inheritance chain.
        // Once a permission is denied at any level, it cannot be re-added by
        // child roles. For example, if "editor" denies "content:delete", then
        // a custom role inheriting from "editor" CANNOT add it back even if
        // they explicitly include it in their permissions array.
        // This is intentional security behavior - parent roles can permanently
        // revoke dangerous permissions from the entire inheritance subtree.
        if (definition.deniedPermissions) {
          for (const perm of definition.deniedPermissions) {
            deniedPermissions.add(perm);
            permissions.delete(perm);
          }
        }
      } else if (this.baseRoles.has(currentRole)) {
        const basePermissions = getBaseRolePermissions(currentRole as BaseRole);
        for (const perm of basePermissions) {
          if (!deniedPermissions.has(perm)) {
            permissions.add(perm);
          }
        }
      }
    }

    return permissions;
  }

  /**
   * Check if roleA inherits from roleB (directly or indirectly)
   */
  private inheritsFrom(roleA: string, roleB: string): boolean {
    const chain = this.getInheritanceChain(roleA);
    if (!chain.isValid) return false;
    return chain.chain.includes(roleB);
  }

  private getFromCache(role: string): Set<Permission> | undefined {
    const entry = this.cache.get(role);
    if (!entry) return undefined;

    if (Date.now() - entry.timestamp > this.cacheTTL) {
      this.cache.delete(role);
      return undefined;
    }

    return new Set(entry.permissions);
  }

  private setCache(role: string, permissions: Set<Permission>): void {
    this.cache.set(role, {
      permissions: new Set(permissions),
      timestamp: Date.now(),
    });
  }
}

/**
 * Custom role definition interface
 */
export interface CustomRoleDefinition {
  name: string;
  inheritsFrom: string;
  permissions?: Permission[];
  deniedPermissions?: Permission[];
  description?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Create a singleton instance with base roles
 */
export function createPermissionResolver(
  baseRoles: readonly string[],
): PermissionInheritanceResolver {
  return new PermissionInheritanceResolver(baseRoles);
}
