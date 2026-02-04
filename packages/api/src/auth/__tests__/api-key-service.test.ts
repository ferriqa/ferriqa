/**
 * @ferriqa/api - API Key Service Tests
 *
 * Comprehensive tests for API key generation, validation, and management
 * Tests both in-memory and database persistence modes
 */

import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from "@ferriqa/core/testing";
import { ApiKeyService } from "../api-key-service.ts";
import type { CreateApiKeyRequest } from "../api-key-types.ts";

// Mock database adapter for testing
type MockDbRow = {
  id: string;
  name: string;
  user_id: number;
  key_hash: string;
  key_prefix: string;
  permissions: string;
  is_active: number;
  last_used_at: number | null;
  expires_at: number | null;
  rate_limit_per_minute: number;
  created_at: number;
  updated_at: number;
};

class MockDatabaseAdapter {
  private storage = new Map<string, MockDbRow>();
  private idCounter = 1;

  // Generate UUID v4 format ID to match ApiKeyService.generateApiKeyId()
  private generateId(): string {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10

    const hex = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return [
      hex.slice(0, 8),
      hex.slice(8, 12),
      hex.slice(12, 16),
      hex.slice(16, 20),
      hex.slice(20, 32),
    ].join("-");
  }

  async query<T>(sql: string, params?: unknown[]): Promise<{ rows: T[] }> {
    const rows: T[] = [];

    if (sql.includes("SELECT") && sql.includes("FROM api_keys")) {
      // Parse WHERE clause to find conditions in order they appear in SQL
      const whereMatch = sql.match(/WHERE\s+(.+?)(?:ORDER\s+BY|$)/i);
      const whereClause = whereMatch ? whereMatch[1].trim() : "";

      // Build conditions in the EXACT order they appear in SQL
      const conditions: Array<{ type: string; value: unknown }> = [];
      let paramIdx = 0;

      if (whereClause && params) {
        // Split by AND to get individual conditions in order
        const whereParts = whereClause.split(/\s+AND\s+/i);

        for (const part of whereParts) {
          const trimmedPart = part.trim();
          if (!trimmedPart) continue;

          if (
            trimmedPart.includes("key_hash = ?") &&
            paramIdx < params.length
          ) {
            conditions.push({ type: "key_hash", value: params[paramIdx++] });
          } else if (
            trimmedPart.includes("user_id = ?") &&
            paramIdx < params.length
          ) {
            conditions.push({ type: "user_id", value: params[paramIdx++] });
          } else if (
            trimmedPart.includes("id = ?") &&
            paramIdx < params.length
          ) {
            conditions.push({ type: "id", value: params[paramIdx++] });
          } else if (
            trimmedPart.includes("is_active = ?") &&
            paramIdx < params.length
          ) {
            conditions.push({ type: "is_active", value: params[paramIdx++] });
          }
        }
      }

      for (const row of this.storage.values()) {
        let matches = true;

        // Check each condition in the exact order they appeared in SQL
        for (const condition of conditions) {
          if (!matches) break;

          switch (condition.type) {
            case "key_hash":
              if (row.key_hash !== condition.value) matches = false;
              break;
            case "user_id":
              if (row.user_id !== condition.value) matches = false;
              break;
            case "id":
              if (row.id !== condition.value) matches = false;
              break;
            case "is_active":
              if (row.is_active !== condition.value) matches = false;
              break;
          }
        }

        if (matches) {
          rows.push(row as unknown as T);
        }
      }
    }

    return { rows };
  }

  async execute(
    sql: string,
    params?: unknown[],
  ): Promise<{ changes: number; lastInsertId?: number }> {
    if (sql.includes("INSERT INTO api_keys")) {
      // Use the id provided as the first parameter
      const id = params![0] as string;
      const row: MockDbRow = {
        id,
        name: params![1] as string,
        user_id: params![2] as number,
        key_hash: params![3] as string,
        key_prefix: params![4] as string,
        permissions: params![5] as string,
        is_active: params![6] as number,
        last_used_at: params![7] as number | null,
        expires_at: params![8] as number | null,
        rate_limit_per_minute: params![9] as number,
        created_at: params![10] as number,
        updated_at: params![11] as number,
      };
      this.storage.set(id, row);
      return { changes: 1, lastInsertId: 0 };
    }

    if (sql.includes("UPDATE api_keys")) {
      let changes = 0;

      if (!params) {
        return { changes: 0 };
      }

      // Find SET clause (between SET and WHERE)
      const setMatch = sql.match(/SET\s+(.+?)\s+WHERE/i);
      const setClause = setMatch ? setMatch[1] : "";

      // Count SET placeholders
      const setPlaceholders = (setClause.match(/\?/g) || []).length;

      // WHERE parameters start after SET parameters
      const whereStartIndex = setPlaceholders;

      // Parse WHERE clause
      const whereMatch = sql.match(/WHERE\s+(.+)$/i);
      const whereClause = whereMatch ? whereMatch[1] : "";

      // Find matching rows and apply updates
      for (const [, row] of this.storage.entries()) {
        let matchesWhere = true;
        let paramIdx = whereStartIndex;

        // Parse WHERE conditions - they appear in order in the SQL
        // id = ? AND user_id = ?
        // OR: id = ?
        // OR: expires_at < ? AND expires_at > ? AND is_active = ?

        if (whereClause.includes("id = ?")) {
          if (paramIdx < params.length) {
            const whereId = params[paramIdx++] as string;
            if (row.id !== whereId) matchesWhere = false;
          }
        }

        if (matchesWhere && whereClause.includes("user_id = ?")) {
          if (paramIdx < params.length) {
            const whereUserId = params[paramIdx++] as number;
            if (row.user_id !== whereUserId) matchesWhere = false;
          }
        }

        if (matchesWhere && whereClause.includes("expires_at < ?")) {
          if (paramIdx < params.length) {
            const expiresFilter = params[paramIdx++] as number;
            if (!(row.expires_at !== null && row.expires_at < expiresFilter)) {
              matchesWhere = false;
            }
          }
        }

        if (matchesWhere && whereClause.includes("expires_at > ?")) {
          if (paramIdx < params.length) {
            const expiresFilter = params[paramIdx++] as number;
            if (!(row.expires_at !== null && row.expires_at > expiresFilter)) {
              matchesWhere = false;
            }
          }
        }

        if (matchesWhere && whereClause.includes("is_active = ?")) {
          if (paramIdx < params.length) {
            const isActiveFilter = params[paramIdx++] as number;
            if (row.is_active !== isActiveFilter) matchesWhere = false;
          }
        }

        if (matchesWhere) {
          // Apply SET updates - Parse SET clause fields in order
          // SET name = ?, updated_at = ?
          // OR: SET is_active = 0, updated_at = ?
          const setFields = setClause.split(",").map((f) => f.trim());
          let setParamIdx = 0;

          for (const field of setFields) {
            if (field.includes("=?") || field.includes("= ?")) {
              // This field has a placeholder
              if (field.includes("name") && setParamIdx < setPlaceholders) {
                row.name = params[setParamIdx++] as string;
              } else if (
                field.includes("permissions") &&
                setParamIdx < setPlaceholders
              ) {
                row.permissions = params[setParamIdx++] as string;
              } else if (
                field.includes("is_active") &&
                setParamIdx < setPlaceholders
              ) {
                row.is_active = params[setParamIdx++] as number;
              } else if (
                field.includes("last_used_at") &&
                setParamIdx < setPlaceholders
              ) {
                row.last_used_at = params[setParamIdx++] as number | null;
              } else if (
                field.includes("expires_at") &&
                setParamIdx < setPlaceholders
              ) {
                row.expires_at = params[setParamIdx++] as number | null;
              } else if (
                field.includes("rate_limit_per_minute") &&
                setParamIdx < setPlaceholders
              ) {
                row.rate_limit_per_minute = params[setParamIdx++] as number;
              } else if (
                field.includes("updated_at") &&
                setParamIdx < setPlaceholders
              ) {
                row.updated_at = params[setParamIdx++] as number;
              }
            } else if (field.includes("is_active = 0")) {
              // Handle hardcoded values like is_active = 0
              row.is_active = 0;
            } else if (field.includes("is_active = 1")) {
              row.is_active = 1;
            }
          }

          changes++;
        }
      }

      return { changes };
    }

    return { changes: 0 };
  }

  clear() {
    this.storage.clear();
    this.idCounter = 1;
  }
}

describe("API Key Service", () => {
  describe("In-Memory Mode", () => {
    let service: ApiKeyService;

    beforeEach(() => {
      // Create fresh service instance for each test
      service = new ApiKeyService();
    });

    describe("createApiKey", () => {
      beforeEach(() => {
        service = new ApiKeyService();
      });

      it("creates API key with generated values", async () => {
        const request: CreateApiKeyRequest = {
          name: "Test Key",
          permissions: ["content:read", "blueprint:read"],
        };

        const result = await service.createApiKey(1, request);

        expect(result.apiKey).toBeDefined();
        expect(result.apiKey.name).toBe("Test Key");
        expect(result.apiKey.userId).toBe(1);
        expect(result.apiKey.permissions).toEqual([
          "content:read",
          "blueprint:read",
        ]);
        expect(result.apiKey.isActive).toBe(true);
        expect(result.fullKey).toBeDefined();
        expect(result.fullKey.startsWith("fk_")).toBe(true);
        // NOTE: keyHash is intentionally excluded from ApiKey interface - it should never be exposed in API responses
        // We verify this at compile time via the type system, and at runtime by ensuring it's not in the response object
        expect(
          Object.prototype.hasOwnProperty.call(result.apiKey, "keyHash"),
        ).toBe(false);
      });

      it("generates unique API keys", async () => {
        const request1 = await service.createApiKey(1, { name: "Key 1" });
        const request2 = await service.createApiKey(1, { name: "Key 2" });

        expect(request1.fullKey).not.toBe(request2.fullKey);
        expect(request1.apiKey.id).not.toBe(request2.apiKey.id);
      });

      it("sets default values for optional fields", async () => {
        const request: CreateApiKeyRequest = { name: "Minimal Key" };

        const result = await service.createApiKey(1, request);

        expect(result.apiKey.permissions).toEqual([]);
        expect(result.apiKey.rateLimitPerMinute).toBe(60);
        expect(result.apiKey.expiresAt).toBeNull();
      });
    });

    describe("getRateLimitInfo", () => {
      it("provides rate limit info", () => {
        const info = service.getRateLimitInfo("test-key", 10);

        expect(info.keyId).toBe("test-key");
        expect(info.limit).toBe(10);
        expect(info.remaining).toBe(10);
        expect(info.resetAt).toBeGreaterThan(Date.now());
      });
    });

    describe("Security", () => {
      beforeEach(() => {
        service = new ApiKeyService();
      });

      it("never exposes keyHash in API responses", async () => {
        const { apiKey, fullKey } = await service.createApiKey(1, {
          name: "Test",
        });

        // Check create response
        expect("keyHash" in apiKey).toBe(false);

        // Check validation response
        const validation = await service.validateApiKey(fullKey);
        expect("keyHash" in validation.apiKey!).toBe(false);

        // Check getUserApiKeys response
        const keys = await service.getUserApiKeys(1);
        expect(keys.every((k) => !("keyHash" in k))).toBe(true);

        // Check getApiKey response
        const singleKey = await service.getApiKey(1, apiKey.id);
        expect("keyHash" in singleKey!).toBe(false);

        // Check update response
        const updated = await service.updateApiKey(1, apiKey.id, {
          name: "Updated",
        });
        expect("keyHash" in updated!).toBe(false);
      });

      it("generates cryptographically secure keys", async () => {
        const { fullKey } = await service.createApiKey(1, { name: "Test" });

        expect(fullKey.length).toBeGreaterThan(40); // Should be long
        expect(fullKey.startsWith("fk_")).toBe(true);
        expect(/^[a-f0-9]+$/i.test(fullKey.slice(3))).toBe(true); // Hex after prefix
      });
    });
  });

  describe("Database Mode", () => {
    let service: ApiKeyService;
    let mockDb: MockDatabaseAdapter;

    beforeEach(() => {
      mockDb = new MockDatabaseAdapter();
      service = new ApiKeyService({ db: mockDb });
    });

    afterEach(() => {
      mockDb.clear();
    });

    it("persists keys to database", async () => {
      const request: CreateApiKeyRequest = { name: "DB Test Key" };
      const { fullKey } = await service.createApiKey(1, request);

      // Verify key can be retrieved from database
      const validation = await service.validateApiKey(fullKey);
      expect(validation.valid).toBe(true);
      expect(validation.apiKey!.name).toBe("DB Test Key");
    });

    it("retrieves user keys from database", async () => {
      await service.createApiKey(1, { name: "Key 1" });
      await service.createApiKey(1, { name: "Key 2" });
      await service.createApiKey(2, { name: "Key 3" });

      const keys = await service.getUserApiKeys(1);

      expect(keys.length).toBe(2);
      expect(keys.every((k) => k.userId === 1)).toBe(true);
    });

    it("updates key in database", async () => {
      const { apiKey } = await service.createApiKey(1, { name: "Original" });

      const updated = await service.updateApiKey(1, apiKey.id, {
        name: "Updated",
      });

      expect(updated!.name).toBe("Updated");

      // Verify in database
      const retrieved = await service.getApiKey(1, apiKey.id);
      expect(retrieved!.name).toBe("Updated");
    });

    it("revokes key in database", async () => {
      const { apiKey, fullKey } = await service.createApiKey(1, {
        name: "To Revoke",
      });

      await service.revokeApiKey(1, apiKey.id);

      const validation = await service.validateApiKey(fullKey);
      expect(validation.valid).toBe(false);
      expect(validation.error).toBe("API key has been revoked");
    });

    it("rotates key in database", async () => {
      const { apiKey, fullKey } = await service.createApiKey(1, {
        name: "To Rotate",
      });

      const rotation = await service.rotateApiKey(1, apiKey.id);

      expect(rotation.success).toBe(true);
      const newValidation = await service.validateApiKey(rotation.newKey!);
      expect(newValidation.valid).toBe(true);

      // Verify old key is revoked
      const oldValidation = await service.validateApiKey(fullKey);
      expect(oldValidation.valid).toBe(false);
    });
  });

  describe("Edge Cases", () => {
    let service: ApiKeyService;

    beforeEach(() => {
      service = new ApiKeyService();
    });

    it("handles empty permissions array", async () => {
      const { apiKey } = await service.createApiKey(1, {
        name: "No Permissions",
        permissions: [],
      });

      expect(apiKey.permissions).toEqual([]);
    });

    it("handles null expiresAt", async () => {
      const { apiKey } = await service.createApiKey(1, {
        name: "No Expiration",
        expiresAt: null,
      });

      expect(apiKey.expiresAt).toBeNull();
    });

    it("handles getApiKey for non-existent key", async () => {
      const result = await service.getApiKey(1, "non-existent");
      expect(result).toBeNull();
    });

    it("handles getApiKey for wrong user", async () => {
      const { apiKey } = await service.createApiKey(1, { name: "Test" });
      const result = await service.getApiKey(2, apiKey.id);
      expect(result).toBeNull();
    });

    it("cleanupExpiredKeys handles no expired keys", async () => {
      await service.createApiKey(1, {
        name: "Future Key",
        expiresAt: Date.now() + 86400000,
      });

      const count = await service.cleanupExpiredKeys();
      expect(count).toBe(0);
    });
  });
});
