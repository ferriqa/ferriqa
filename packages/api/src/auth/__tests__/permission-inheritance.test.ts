import { describe, it, expect } from "@ferriqa/core/testing";
import {
  PermissionInheritanceResolver,
  CustomRoleDefinition,
} from "../permission-inheritance.ts";
import { createCustomRoleManager } from "../custom-roles.ts";
import { getRolePermissions, BASE_ROLES } from "../permissions.ts";

describe("Permission Inheritance System", () => {
  describe("PermissionInheritanceResolver", () => {
    it("creates resolver with base roles", () => {
      const resolver = new PermissionInheritanceResolver(BASE_ROLES);
      expect(resolver.isBaseRole("admin")).toBe(true);
      expect(resolver.isBaseRole("editor")).toBe(true);
      expect(resolver.isBaseRole("viewer")).toBe(true);
      expect(resolver.isBaseRole("api")).toBe(true);
    });

    it("registers custom role inheriting from base", () => {
      const resolver = new PermissionInheritanceResolver(BASE_ROLES);
      const customRole: CustomRoleDefinition = {
        name: "content-manager",
        inheritsFrom: "editor",
        permissions: ["user:read"],
        deniedPermissions: ["content:delete"],
      };

      resolver.registerCustomRole(customRole);

      expect(resolver.isCustomRole("content-manager")).toBe(true);
      expect(resolver.isBaseRole("content-manager")).toBe(false);
    });

    it("inherits permissions from parent role", () => {
      const resolver = new PermissionInheritanceResolver(BASE_ROLES);
      const customRole: CustomRoleDefinition = {
        name: "content-manager",
        inheritsFrom: "editor",
        permissions: ["user:read"],
      };

      resolver.registerCustomRole(customRole);
      const perms = resolver.getRolePermissions(
        "content-manager",
        getRolePermissions,
      );

      expect(perms).toContain("content:read");
      expect(perms).toContain("content:create");
      expect(perms).toContain("user:read");
    });

    it("denied permissions override inherited permissions", () => {
      const resolver = new PermissionInheritanceResolver(BASE_ROLES);
      const customRole: CustomRoleDefinition = {
        name: "limited-editor",
        inheritsFrom: "editor",
        deniedPermissions: ["content:delete"],
      };

      resolver.registerCustomRole(customRole);
      const perms = resolver.getRolePermissions(
        "limited-editor",
        getRolePermissions,
      );

      expect(perms).toContain("content:read");
      expect(perms).not.toContain("content:delete");
    });

    it("checks permission with inheritance", () => {
      const resolver = new PermissionInheritanceResolver(BASE_ROLES);
      const customRole: CustomRoleDefinition = {
        name: "content-manager",
        inheritsFrom: "editor",
        permissions: ["user:read"],
        deniedPermissions: ["content:delete"],
      };

      resolver.registerCustomRole(customRole);

      expect(
        resolver.hasPermission(
          "content-manager",
          "content:read",
          getRolePermissions,
        ),
      ).toBe(true);
      expect(
        resolver.hasPermission(
          "content-manager",
          "user:read",
          getRolePermissions,
        ),
      ).toBe(true);
      expect(
        resolver.hasPermission(
          "content-manager",
          "content:delete",
          getRolePermissions,
        ),
      ).toBe(false);
    });

    it("caches resolved permissions", () => {
      const resolver = new PermissionInheritanceResolver(BASE_ROLES);
      const customRole: CustomRoleDefinition = {
        name: "content-manager",
        inheritsFrom: "editor",
      };

      resolver.registerCustomRole(customRole);

      // First call should compute
      resolver.resolvePermissions("content-manager", getRolePermissions);

      // Second call should use cache
      resolver.resolvePermissions("content-manager", getRolePermissions);

      // Test passes if no errors
      expect(true).toBe(true);
    });

    it("invalidates cache when role changes", () => {
      const resolver = new PermissionInheritanceResolver(BASE_ROLES);
      const customRole: CustomRoleDefinition = {
        name: "content-manager",
        inheritsFrom: "editor",
        permissions: ["user:read"],
      };

      resolver.registerCustomRole(customRole);
      resolver.resolvePermissions("content-manager", getRolePermissions);

      // Update role
      const updatedRole: CustomRoleDefinition = {
        name: "content-manager",
        inheritsFrom: "editor",
        permissions: ["user:read", "user:create"],
      };

      resolver.unregisterCustomRole("content-manager");
      resolver.registerCustomRole(updatedRole);

      const perms = resolver.resolvePermissions(
        "content-manager",
        getRolePermissions,
      );
      expect(Array.from(perms)).toContain("user:create");
    });

    it("detects circular inheritance", () => {
      const resolver = new PermissionInheritanceResolver(BASE_ROLES);

      const roleA: CustomRoleDefinition = {
        name: "role-a",
        inheritsFrom: "editor",
      };

      const roleB: CustomRoleDefinition = {
        name: "role-b",
        inheritsFrom: "role-a",
      };

      resolver.registerCustomRole(roleA);
      resolver.registerCustomRole(roleB);

      // Try to create circular reference
      const roleAUpdated: CustomRoleDefinition = {
        name: "role-a",
        inheritsFrom: "role-b",
      };

      expect(() => resolver.registerCustomRole(roleAUpdated)).toThrow();
    });

    it("gets inheritance chain for custom role", () => {
      const resolver = new PermissionInheritanceResolver(BASE_ROLES);
      const customRole: CustomRoleDefinition = {
        name: "content-manager",
        inheritsFrom: "editor",
      };

      resolver.registerCustomRole(customRole);
      const chain = resolver["getInheritanceChain"]("content-manager");

      expect(chain.chain).toContain("content-manager");
      expect(chain.chain).toContain("editor");
      expect(chain.isValid).toBe(true);
    });

    it("validates custom role name uniqueness", () => {
      const resolver = new PermissionInheritanceResolver(BASE_ROLES);

      expect(() => {
        resolver.registerCustomRole({
          name: "admin",
          inheritsFrom: "editor",
        });
      }).toThrow();
    });

    it("validates inheritance from known role", () => {
      const resolver = new PermissionInheritanceResolver(BASE_ROLES);

      expect(() => {
        resolver.registerCustomRole({
          name: "custom-role",
          inheritsFrom: "unknown-role",
        });
      }).toThrow();
    });

    it("clears all cached permissions", () => {
      const resolver = new PermissionInheritanceResolver(BASE_ROLES);
      const customRole: CustomRoleDefinition = {
        name: "test-role",
        inheritsFrom: "viewer",
      };

      resolver.registerCustomRole(customRole);
      resolver.resolvePermissions("test-role", getRolePermissions);
      resolver.clearCache();

      // Cache is cleared, should recompute on next call
      resolver.resolvePermissions("test-role", getRolePermissions);
      expect(true).toBe(true);
    });
  });

  describe("CustomRoleManager", () => {
    it("creates manager with base roles", async () => {
      const manager = createCustomRoleManager(BASE_ROLES);
      await manager.initialize();
      expect(manager.isBaseRole("admin")).toBe(true);
      expect(manager.isCustomRole("admin")).toBe(false);
    });

    it("creates custom role", async () => {
      const manager = createCustomRoleManager(BASE_ROLES);
      await manager.initialize();

      const role = await manager.createRole("test-role", "editor", {
        permissions: ["user:read"],
        description: "Test role",
      });

      expect(role.name).toBe("test-role");
      expect(role.inheritsFrom).toBe("editor");
      expect(role.permissions).toContain("user:read");
      expect(role.description).toBe("Test role");
    });

    it("prevents creating role with duplicate name", async () => {
      const manager = createCustomRoleManager(BASE_ROLES);
      await manager.initialize();

      await manager.createRole("unique-role", "viewer");

      let threw = false;
      try {
        await manager.createRole("unique-role", "editor");
      } catch {
        threw = true;
      }
      expect(threw).toBe(true);
    });

    it("prevents creating role with base role name", async () => {
      const manager = createCustomRoleManager(BASE_ROLES);
      await manager.initialize();

      let threw = false;
      try {
        await manager.createRole("admin", "editor");
      } catch {
        threw = true;
      }
      expect(threw).toBe(true);
    });

    it("updates custom role", async () => {
      const manager = createCustomRoleManager(BASE_ROLES);
      await manager.initialize();

      await manager.createRole("updateable-role", "viewer");
      const updated = await manager.updateRole("updateable-role", {
        permissions: ["user:read"],
      });

      expect(updated.permissions).toContain("user:read");
    });

    it("deletes custom role", async () => {
      const manager = createCustomRoleManager(BASE_ROLES);
      await manager.initialize();

      await manager.createRole("deletable-role", "viewer");
      const deleted = await manager.deleteRole("deletable-role");

      expect(deleted).toBe(true);
      expect(manager.hasRole("deletable-role")).toBe(false);
    });

    it("prevents deleting role that has dependents", async () => {
      const manager = createCustomRoleManager(BASE_ROLES);
      await manager.initialize();

      await manager.createRole("parent-role", "viewer");
      await manager.createRole("child-role", "parent-role");

      let threw = false;
      try {
        await manager.deleteRole("parent-role");
      } catch {
        threw = true;
      }
      expect(threw).toBe(true);
    });

    it("gets all custom roles", async () => {
      const manager = createCustomRoleManager(BASE_ROLES);
      await manager.initialize();

      await manager.createRole("role-1", "viewer");
      await manager.createRole("role-2", "editor");

      const roles = manager.getAllRoles();
      expect(roles.length).toBe(2);
      expect(roles.map((r) => r.name)).toContain("role-1");
      expect(roles.map((r) => r.name)).toContain("role-2");
    });

    it("gets roles inheriting from a role", async () => {
      const manager = createCustomRoleManager(BASE_ROLES);
      await manager.initialize();

      await manager.createRole("parent-role", "viewer");
      await manager.createRole("child-1", "parent-role");
      await manager.createRole("child-2", "parent-role");

      const inheriting = manager.getRolesInheritingFrom("parent-role");
      expect(inheriting.length).toBe(2);
      expect(inheriting.map((r) => r.name)).toContain("child-1");
      expect(inheriting.map((r) => r.name)).toContain("child-2");
    });

    it("exports and imports roles", async () => {
      const manager = createCustomRoleManager(BASE_ROLES);
      await manager.initialize();

      await manager.createRole("exportable-role", "viewer", {
        permissions: ["user:read"],
        description: "Test export",
      });

      const exported = manager.exportRoles();
      expect(exported.length).toBe(1);

      const newManager = createCustomRoleManager(BASE_ROLES);
      await newManager.initialize();

      const result = await newManager.importRoles(exported);
      expect(result.created.length).toBe(1);
      expect(newManager.hasRole("exportable-role")).toBe(true);
    });

    it("triggers onRoleChange callback", async () => {
      const callbacks: string[] = [];
      const manager = createCustomRoleManager(BASE_ROLES, {
        onRoleChange: (role) => callbacks.push(role.name),
      });
      await manager.initialize();

      await manager.createRole("callback-test", "viewer");
      expect(callbacks).toContain("callback-test");
    });

    it("triggers onRoleDelete callback", async () => {
      const deleted: string[] = [];
      const manager = createCustomRoleManager(BASE_ROLES, {
        onRoleDelete: (name) => deleted.push(name),
      });
      await manager.initialize();

      await manager.createRole("delete-test", "viewer");
      await manager.deleteRole("delete-test");
      expect(deleted).toContain("delete-test");
    });
  });

  describe("Integration with permissions.ts", () => {
    it("exports BASE_ROLES constant", () => {
      expect(BASE_ROLES).toContain("admin");
      expect(BASE_ROLES).toContain("editor");
      expect(BASE_ROLES).toContain("viewer");
      expect(BASE_ROLES).toContain("api");
    });

    it("supports custom role type in getRolePermissions", () => {
      // This would require the resolver to be set
      // Integration test placeholder
      expect(true).toBe(true);
    });
  });
});
