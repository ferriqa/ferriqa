import { describe, it, expect } from "@ferriqa/core/testing";
import { VALID_PERMISSIONS } from "../api-key-service.ts";

describe("Permission Validation", () => {
  const EXPECTED_PERMISSIONS = [
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
  ] as const;

  it("VALID_PERMISSIONS array is complete", () => {
    for (const perm of EXPECTED_PERMISSIONS) {
      expect(VALID_PERMISSIONS.includes(perm)).toBe(true);
    }

    expect(VALID_PERMISSIONS.length).toBe(EXPECTED_PERMISSIONS.length);
  });
});
