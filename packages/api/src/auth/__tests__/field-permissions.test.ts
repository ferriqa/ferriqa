import { describe, it, expect } from "@ferriqa/core/testing";
import {
  filterFieldsByPermission,
  filterBlueprintFieldsByPermission,
  canViewField,
  canEditField,
} from "../field-permissions.ts";

describe("Field-Level Permissions", () => {
  const mockBlueprint = {
    id: "bp-1",
    name: "Test Blueprint",
    slug: "test",
    fields: [
      { key: "title", ui: {} },
      { key: "content", ui: { permission: "content:read" } },
      { key: "secret", ui: { permission: "content:delete" } },
      { key: "adminOnly", ui: { permission: "settings:update" } },
    ],
    settings: {
      draftMode: true,
      versioning: true,
      apiAccess: "public" as const,
      cacheEnabled: true,
      defaultStatus: "draft" as const,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockContent = {
    id: "c-1",
    data: {
      title: "Test Title",
      content: "Test Content",
      secret: "Secret Data",
      adminOnly: "Admin Only Data",
    },
    blueprint: mockBlueprint,
    blueprintId: "bp-1",
    slug: "test-content",
    status: "published" as const,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  describe("filterFieldsByPermission", () => {
    it("Admin role sees all fields", () => {
      const result = filterFieldsByPermission(
        mockContent,
        mockBlueprint,
        "admin",
      );
      expect("title" in result.data).toBe(true);
      expect("content" in result.data).toBe(true);
      expect("secret" in result.data).toBe(true);
      expect("adminOnly" in result.data).toBe(true);
      expect(result.data.title).toBe("Test Title");
      expect(result.data.secret).toBe("Secret Data");
    });

    it("Editor role sees allowed fields", () => {
      const result = filterFieldsByPermission(
        mockContent,
        mockBlueprint,
        "editor",
      );
      expect("title" in result.data).toBe(true);
      expect("content" in result.data).toBe(true);
      expect("secret" in result.data).toBe(true);
      expect("adminOnly" in result.data).toBe(false);
      expect(result.data.content).toBe("Test Content");
      expect(result.data.secret).toBe("Secret Data");
    });

    it("Viewer role sees only public fields", () => {
      const result = filterFieldsByPermission(
        mockContent,
        mockBlueprint,
        "viewer",
      );
      expect("title" in result.data).toBe(true);
      expect("content" in result.data).toBe(true);
      expect("secret" in result.data).toBe(false);
      expect("adminOnly" in result.data).toBe(false);
      expect(result.data.content).toBe("Test Content");
    });

    it("API role sees only read fields", () => {
      const result = filterFieldsByPermission(
        mockContent,
        mockBlueprint,
        "api",
      );
      expect("title" in result.data).toBe(true);
      expect("content" in result.data).toBe(true);
      expect("secret" in result.data).toBe(false);
      expect("adminOnly" in result.data).toBe(false);
    });
  });

  describe("filterBlueprintFieldsByPermission", () => {
    it("Admin sees all blueprint fields", () => {
      const result = filterBlueprintFieldsByPermission(mockBlueprint, "admin");
      expect(result.fields.length).toBe(4);
      const keys = result.fields.map((f: { key: string }) => f.key);
      expect(keys).toContain("adminOnly");
    });

    it("Editor doesn't see admin-only fields", () => {
      const result = filterBlueprintFieldsByPermission(mockBlueprint, "editor");
      expect(result.fields.length).toBe(3);
      const keys = result.fields.map((f: { key: string }) => f.key);
      expect(keys).not.toContain("adminOnly");
      expect(keys).toContain("secret");
    });

    it("Viewer sees only basic fields", () => {
      const result = filterBlueprintFieldsByPermission(mockBlueprint, "viewer");
      expect(result.fields.length).toBe(2);
      const keys = result.fields.map((f: { key: string }) => f.key);
      expect(keys).toContain("title");
      expect(keys).toContain("content");
    });
  });

  describe("canViewField", () => {
    it("Returns true for fields without permission", () => {
      const field = { key: "title", ui: {} };
      expect(canViewField(field, "viewer")).toBe(true);
    });

    it("Returns true for fields with matching permission", () => {
      const field = { key: "content", ui: { permission: "content:read" } };
      expect(canViewField(field, "editor")).toBe(true);
    });

    it("Returns false for fields without matching permission", () => {
      const field = { key: "secret", ui: { permission: "content:delete" } };
      expect(canViewField(field, "viewer")).toBe(false);
    });
  });

  describe("canEditField", () => {
    it("Returns true when no edit permission is set", () => {
      const field = { key: "title", ui: { permission: "content:read" } };
      expect(canEditField(field, "editor")).toBe(true);
    });

    it("Uses edit permission when set", () => {
      const field = {
        key: "secret",
        ui: { permission: "content:read", editPermission: "content:delete" },
      };
      expect(canEditField(field, "editor")).toBe(true);
      expect(canEditField(field, "viewer")).toBe(false);
    });

    it("Falls back to view permission for edit check", () => {
      const field = { key: "content", ui: { permission: "content:read" } };
      expect(canEditField(field, "viewer")).toBe(true);
    });
  });
});
