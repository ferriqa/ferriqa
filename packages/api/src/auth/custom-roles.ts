import type { Permission } from "./permissions.ts";
import type { CustomRoleDefinition } from "./permission-inheritance.ts";
import { PermissionInheritanceResolver } from "./permission-inheritance.ts";
import type { BaseRole } from "./permissions.ts";

/**
 * CustomRoleManager
 *
 * Manages custom role definitions with persistence support.
 * Provides CRUD operations for custom roles and integration
 * with the permission inheritance system.
 */

interface CustomRoleManagerOptions {
  baseRoles: readonly string[];
  onRoleChange?: (role: CustomRoleDefinition) => void;
  onRoleDelete?: (roleName: string) => void;
  persistenceAdapter?: RolePersistenceAdapter;
}

interface RolePersistenceAdapter {
  load(): Promise<CustomRoleDefinition[]>;
  save(roles: CustomRoleDefinition[]): Promise<void>;
}

type CustomRole = Omit<CustomRoleDefinition, "inheritsFrom"> & {
  inheritsFrom: BaseRole | string;
};

export class CustomRoleManager {
  private resolver: PermissionInheritanceResolver;
  private onRoleChange?: (role: CustomRoleDefinition) => void;
  private onRoleDelete?: (roleName: string) => void;
  private persistenceAdapter?: RolePersistenceAdapter;
  private initialized = false;

  constructor(options: CustomRoleManagerOptions) {
    this.resolver = new PermissionInheritanceResolver(options.baseRoles);
    this.onRoleChange = options.onRoleChange;
    this.onRoleDelete = options.onRoleDelete;
    this.persistenceAdapter = options.persistenceAdapter;
  }

  /**
   * Initialize the manager, loading persisted roles if available
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    if (this.persistenceAdapter) {
      const roles = await this.persistenceAdapter.load();
      for (const role of roles) {
        this.resolver.registerCustomRole(role);
      }
    }

    this.initialized = true;
  }

  /**
   * Create a new custom role
   */
  async createRole(
    name: string,
    inheritsFrom: BaseRole | string,
    options: CreateRoleOptions = {},
  ): Promise<CustomRole> {
    this.ensureInitialized();

    if (this.resolver.isBaseRole(name)) {
      throw new Error(`Cannot create custom role with base role name: ${name}`);
    }

    if (this.resolver.getCustomRole(name)) {
      throw new Error(`Custom role '${name}' already exists`);
    }

    const definition: CustomRoleDefinition = {
      name,
      inheritsFrom,
      permissions: options.permissions,
      deniedPermissions: options.deniedPermissions,
      description: options.description,
      metadata: options.metadata,
    };

    this.resolver.registerCustomRole(definition);

    if (this.persistenceAdapter) {
      await this.saveRoles();
    }

    this.onRoleChange?.(definition);

    return definition as CustomRole;
  }

  /**
   * Update an existing custom role
   */
  async updateRole(
    name: string,
    updates: UpdateRoleOptions,
  ): Promise<CustomRole> {
    this.ensureInitialized();

    const existing = this.resolver.getCustomRole(name);
    if (!existing) {
      throw new Error(`Custom role '${name}' not found`);
    }

    const updated: CustomRoleDefinition = {
      ...existing,
      ...updates,
      name, // Name cannot be changed
    };

    // Re-register with updated definition
    this.resolver.unregisterCustomRole(name);
    this.resolver.registerCustomRole(updated);

    if (this.persistenceAdapter) {
      await this.saveRoles();
    }

    this.onRoleChange?.(updated);

    return updated as CustomRole;
  }

  /**
   * Delete a custom role
   */
  async deleteRole(name: string): Promise<boolean> {
    this.ensureInitialized();

    const role = this.resolver.getCustomRole(name);
    if (!role) {
      return false;
    }

    // Check if any other roles inherit from this one
    const dependentRoles = this.getRolesInheritingFrom(name);
    if (dependentRoles.length > 0) {
      throw new Error(
        `Cannot delete role '${name}' - roles ${dependentRoles.map((r) => r.name).join(", ")} inherit from it`,
      );
    }

    const deleted = this.resolver.unregisterCustomRole(name);

    if (deleted && this.persistenceAdapter) {
      await this.saveRoles();
    }

    if (deleted) {
      this.onRoleDelete?.(name);
    }

    return deleted;
  }

  /**
   * Get a custom role by name
   */
  getRole(name: string): CustomRole | undefined {
    this.ensureInitialized();
    return this.resolver.getCustomRole(name) as CustomRole | undefined;
  }

  /**
   * Get all custom roles
   */
  getAllRoles(): CustomRole[] {
    this.ensureInitialized();
    return this.resolver.getAllCustomRoles() as CustomRole[];
  }

  /**
   * Get roles that inherit from a specific role
   */
  getRolesInheritingFrom(roleName: string): CustomRole[] {
    this.ensureInitialized();
    return this.resolver
      .getAllCustomRoles()
      .filter((role) => role.inheritsFrom === roleName) as CustomRole[];
  }

  /**
   * Get the inheritance chain for a role
   */
  getInheritanceChain(roleName: string): InheritanceChainResult {
    this.ensureInitialized();
    const chain = this.resolver["getInheritanceChain"](roleName);

    return {
      chain: chain.chain,
      isValid: chain.isValid,
      error: chain.error,
      roles: chain.chain.map((name) => {
        const isBase = this.resolver.isBaseRole(name);
        const isCustom = this.resolver.isCustomRole(name);
        const definition = isCustom
          ? this.resolver.getCustomRole(name)
          : undefined;

        return {
          name,
          type: isBase ? "base" : "custom",
          ...(definition && {
            permissions: definition.permissions,
            deniedPermissions: definition.deniedPermissions,
          }),
        };
      }),
    };
  }

  /**
   * Check if a custom role exists
   */
  hasRole(name: string): boolean {
    this.ensureInitialized();
    return this.resolver.isCustomRole(name);
  }

  /**
   * Check if a role is a custom role
   */
  isCustomRole(name: string): boolean {
    this.ensureInitialized();
    return this.resolver.isCustomRole(name);
  }

  /**
   * Check if a role is a base role
   */
  isBaseRole(name: string): boolean {
    this.ensureInitialized();
    return this.resolver.isBaseRole(name);
  }

  /**
   * Get the underlying permission resolver
   */
  getResolver(): PermissionInheritanceResolver {
    return this.resolver;
  }

  /**
   * Clear all custom roles (useful for testing)
   */
  async clearAllRoles(): Promise<void> {
    this.ensureInitialized();
    const roles = this.resolver.getAllCustomRoles();

    for (const role of roles) {
      this.resolver.unregisterCustomRole(role.name);
    }

    if (this.persistenceAdapter) {
      await this.saveRoles();
    }
  }

  /**
   * Export all custom role definitions
   */
  exportRoles(): CustomRoleDefinition[] {
    this.ensureInitialized();
    return this.resolver.getAllCustomRoles();
  }

  /**
   * Import custom role definitions
   */
  async importRoles(
    roles: CustomRoleDefinition[],
    options: ImportOptions = {},
  ): Promise<ImportResult> {
    this.ensureInitialized();
    const results: ImportResult = {
      created: [],
      updated: [],
      errors: [],
    };

    for (const role of roles) {
      try {
        if (this.resolver.getCustomRole(role.name)) {
          if (options.skipExisting) {
            continue;
          }
          await this.updateRole(role.name, role);
          results.updated.push(role.name);
        } else {
          await this.createRole(
            role.name,
            role.inheritsFrom as BaseRole | string,
            {
              permissions: role.permissions,
              deniedPermissions: role.deniedPermissions,
              description: role.description,
              metadata: role.metadata,
            },
          );
          results.created.push(role.name);
        }
      } catch (error) {
        results.errors.push({
          role: role.name,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return results;
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error(
        "CustomRoleManager not initialized. Call initialize() first.",
      );
    }
  }

  private async saveRoles(): Promise<void> {
    if (!this.persistenceAdapter) return;
    const roles = this.resolver.getAllCustomRoles();
    await this.persistenceAdapter.save(roles);
  }
}

interface CreateRoleOptions {
  permissions?: Permission[];
  deniedPermissions?: Permission[];
  description?: string;
  metadata?: Record<string, unknown>;
}

interface UpdateRoleOptions {
  inheritsFrom?: BaseRole | string;
  permissions?: Permission[];
  deniedPermissions?: Permission[];
  description?: string;
  metadata?: Record<string, unknown>;
}

interface InheritanceChainResult {
  chain: string[];
  isValid: boolean;
  error?: string;
  roles: InheritanceRoleInfo[];
}

interface InheritanceRoleInfo {
  name: string;
  type: "base" | "custom";
  permissions?: Permission[];
  deniedPermissions?: Permission[];
}

interface ImportOptions {
  skipExisting?: boolean;
  overwrite?: boolean;
}

interface ImportResult {
  created: string[];
  updated: string[];
  errors: { role: string; error: string }[];
}

/**
 * Create a file-based persistence adapter
 */
export function createFilePersistenceAdapter(
  filePath: string,
): RolePersistenceAdapter {
  return {
    async load(): Promise<CustomRoleDefinition[]> {
      try {
        const fs = await import("node:fs/promises");
        const data = await fs.readFile(filePath, "utf-8");
        return JSON.parse(data);
      } catch (error) {
        if (
          error instanceof Error &&
          "code" in error &&
          error.code === "ENOENT"
        ) {
          return [];
        }
        throw error;
      }
    },

    async save(roles: CustomRoleDefinition[]): Promise<void> {
      const fs = await import("node:fs/promises");
      await fs.writeFile(filePath, JSON.stringify(roles, null, 2), "utf-8");
    },
  };
}

/**
 * Factory function to create a CustomRoleManager with default options
 */
export function createCustomRoleManager(
  baseRoles: readonly string[],
  options: Partial<CustomRoleManagerOptions> = {},
): CustomRoleManager {
  return new CustomRoleManager({
    baseRoles,
    ...options,
  });
}
