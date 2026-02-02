import { describe, test, expect } from "bun:test";
import {
  hasPermission,
  getRolePermissions,
  type Permission,
} from "../permissions";

describe("RBAC Permissions", () => {
  describe("hasPermission", () => {
    test("Admin role has all permissions", () => {
      expect(hasPermission("admin", "blueprint:read")).toBe(true);
      expect(hasPermission("admin", "content:delete")).toBe(true);
      expect(hasPermission("admin", "settings:update")).toBe(true);
    });

    test("Editor role has expected permissions", () => {
      expect(hasPermission("editor", "blueprint:read")).toBe(true);
      expect(hasPermission("editor", "content:create")).toBe(true);
      expect(hasPermission("editor", "content:publish")).toBe(true);
      expect(hasPermission("editor", "media:delete")).toBe(true);
    });

    test("Editor role does not have restricted permissions", () => {
      expect(hasPermission("editor", "blueprint:create")).toBe(false);
      expect(hasPermission("editor", "blueprint:update")).toBe(false);
      expect(hasPermission("editor", "blueprint:delete")).toBe(false);
      expect(hasPermission("editor", "content:rollback")).toBe(false);
      expect(hasPermission("editor", "user:delete")).toBe(false);
      expect(hasPermission("editor", "settings:update")).toBe(false);
    });

    test("Viewer role has read-only permissions", () => {
      expect(hasPermission("viewer", "blueprint:read")).toBe(true);
      expect(hasPermission("viewer", "content:read")).toBe(true);
      expect(hasPermission("viewer", "media:read")).toBe(true);
    });

    test("Viewer role does not have write permissions", () => {
      expect(hasPermission("viewer", "content:create")).toBe(false);
      expect(hasPermission("viewer", "content:update")).toBe(false);
      expect(hasPermission("viewer", "content:delete")).toBe(false);
      expect(hasPermission("viewer", "media:create")).toBe(false);
    });

    test("API role has limited permissions", () => {
      expect(hasPermission("api", "content:read")).toBe(true);
      expect(hasPermission("api", "blueprint:read")).toBe(true);
    });

    test("API role does not have write permissions", () => {
      expect(hasPermission("api", "content:create")).toBe(false);
      expect(hasPermission("api", "blueprint:create")).toBe(false);
    });
  });

  describe("getRolePermissions", () => {
    test("Admin returns wildcard", () => {
      const permissions = getRolePermissions("admin");
      expect(permissions).toEqual(["*"]);
    });

    test("Editor returns expected permissions", () => {
      const permissions = getRolePermissions("editor");
      expect(permissions.length).toBeGreaterThan(0);
      expect(permissions).toContain("blueprint:read");
      expect(permissions).toContain("content:create");
    });

    test("Viewer returns read-only permissions", () => {
      const permissions = getRolePermissions("viewer");
      expect(permissions).toContain("blueprint:read");
      expect(permissions).toContain("content:read");
      expect(permissions).not.toContain("content:create");
    });
  });

  describe("Permission Matrix", () => {
    const allPermissions: Permission[] = [
      "blueprint:read",
      "blueprint:create",
      "blueprint:update",
      "blueprint:delete",
      "content:read",
      "content:create",
      "content:update",
      "content:delete",
      "content:publish",
      "content:unpublish",
      "content:rollback",
      "media:read",
      "media:create",
      "media:delete",
      "webhook:read",
      "webhook:create",
      "webhook:update",
      "webhook:delete",
      "user:read",
      "user:create",
      "user:update",
      "user:delete",
      "settings:read",
      "settings:update",
      "*",
    ];

    test("All permissions are defined in type", () => {
      const validPermissions: Permission[] = [
        "blueprint:read",
        "blueprint:create",
        "blueprint:update",
        "blueprint:delete",
        "content:read",
        "content:create",
        "content:update",
        "content:delete",
        "content:publish",
        "content:unpublish",
        "content:rollback",
        "media:read",
        "media:create",
        "media:delete",
        "webhook:read",
        "webhook:create",
        "webhook:update",
        "webhook:delete",
        "user:read",
        "user:create",
        "user:update",
        "user:delete",
        "settings:read",
        "settings:update",
        "*",
      ];

      expect(allPermissions).toEqual(validPermissions);
    });
  });
});
