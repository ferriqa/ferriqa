/**
 * @ferriqa/api - API Key Authentication Middleware Tests
 *
 * Tests for apiKeyAuthMiddleware and combinedAuthMiddleware
 * Tests both middleware functions with mocked Hono context
 */

import { describe, it, expect, beforeEach } from "@ferriqa/core/testing";
import {
  apiKeyAuthMiddleware,
  combinedAuthMiddleware,
} from "../api-key-auth.ts";
import { ApiKeyService } from "../../auth/api-key-service.ts";
import type { Permission } from "../../auth/permissions.ts";

// Simple mock context factory
type MockContext = {
  req: {
    header: (name: string) => string | undefined;
  };
  set: (key: string, value: unknown) => void;
  header: (key: string, value: string) => void;
  get: (key: string) => unknown;
  _context: Map<string, unknown>;
  _headers: Map<string, string>;
};

function createMockContext(headers: Record<string, string> = {}): MockContext {
  const context = new Map<string, unknown>();
  const responseHeaders = new Map<string, string>();

  const mockContext: MockContext = {
    req: {
      header: (name: string) => headers[name.toLowerCase()],
    },
    set: (key: string, value: unknown) => {
      context.set(key, value);
    },
    header: (key: string, value: string) => {
      responseHeaders.set(key, value);
    },
    get: (key: string) => context.get(key),
    _context: context,
    _headers: responseHeaders,
  };

  return mockContext;
}

describe("API Key Authentication Middleware", () => {
  let service: ApiKeyService;

  beforeEach(() => {
    service = new ApiKeyService();
  });

  describe("apiKeyAuthMiddleware", () => {
    beforeEach(() => {
      service = new ApiKeyService();
    });

    it("rejects requests without X-API-Key header", async () => {
      const middleware = apiKeyAuthMiddleware(undefined, { service });
      const c = createMockContext();

      let error: Error | null = null;
      try {
        await middleware(c as any, async () => {});
      } catch (e) {
        error = e as Error;
      }

      expect(error).not.toBeNull();
      expect(error!.message).toBe("Missing X-API-Key header");
    });

    it("rejects invalid API keys", async () => {
      const middleware = apiKeyAuthMiddleware(undefined, { service });
      const c = createMockContext({ "x-api-key": "invalid-key" });

      let error: Error | null = null;
      try {
        await middleware(c as any, async () => {});
      } catch (e) {
        error = e as Error;
      }

      expect(error).not.toBeNull();
      expect(error!.message).toBe("Invalid API key");
    });

    it("accepts valid API keys and sets context", async () => {
      const { apiKey, fullKey } = await service.createApiKey(1, {
        name: "Test Key",
        permissions: ["content:read"],
      });

      const middleware = apiKeyAuthMiddleware(undefined, { service });
      const c = createMockContext({ "x-api-key": fullKey });

      let nextCalled = false;
      await middleware(c as any, async () => {
        nextCalled = true;
      });

      expect(nextCalled).toBe(true);
      expect(c.get("userId")).toBe("1");
      expect(c.get("userRole")).toBe("api");
      expect(c.get("user")).toBeDefined(); // User context should be set
      expect(c.get("apiKey")).toBeDefined();
      expect((c.get("apiKey") as any).apiKeyId).toBe(apiKey.id);
      expect((c.get("apiKey") as any).apiKeyPermissions).toEqual([
        "content:read",
      ]);

      // Verify rate limit headers
      expect(c._headers.get("X-RateLimit-Limit")).toBeDefined();
      expect(c._headers.get("X-RateLimit-Remaining")).toBeDefined();
      expect(c._headers.get("X-RateLimit-Reset")).toBeDefined();
    });

    it("checks required permissions", async () => {
      const { fullKey } = await service.createApiKey(1, {
        name: "Test Key",
        permissions: ["content:read"],
      });

      // Middleware requiring permission that key doesn't have
      const middleware = apiKeyAuthMiddleware(
        ["content:delete"] as Permission[],
        { service },
      );
      const c = createMockContext({ "x-api-key": fullKey });

      let error: Error | null = null;
      try {
        await middleware(c as any, async () => {});
      } catch (e) {
        error = e as Error;
      }

      expect(error).not.toBeNull();
      expect(error!.message).toBe("API key does not have required permissions");
    });

    it("allows access with sufficient permissions", async () => {
      const { fullKey } = await service.createApiKey(1, {
        name: "Test Key",
        permissions: ["content:read", "content:delete"],
      });

      const middleware = apiKeyAuthMiddleware(
        ["content:delete"] as Permission[],
        { service },
      );
      const c = createMockContext({ "x-api-key": fullKey });

      let nextCalled = false;
      await middleware(c as any, async () => {
        nextCalled = true;
      });

      expect(nextCalled).toBe(true);
    });

    it("handles multiple required permissions", async () => {
      const { fullKey } = await service.createApiKey(1, {
        name: "Test Key",
        permissions: ["content:read", "content:update", "content:delete"],
      });

      const middleware = apiKeyAuthMiddleware(
        ["content:read", "content:update"] as Permission[],
        { service },
      );
      const c = createMockContext({ "x-api-key": fullKey });

      let nextCalled = false;
      await middleware(c as any, async () => {
        nextCalled = true;
      });

      expect(nextCalled).toBe(true);
    });
  });

  describe("combinedAuthMiddleware", () => {
    beforeEach(() => {
      service = new ApiKeyService();
    });

    it("authenticates with Bearer token", async () => {
      // Mock a valid token - in real tests, this would be a real JWT
      // For now, we'll test that it tries JWT auth first
      const middleware = combinedAuthMiddleware(undefined, { service });
      const c = createMockContext({
        authorization: "Bearer invalid-token",
      });

      let error: Error | null = null;
      try {
        await middleware(c as any, async () => {});
      } catch (e) {
        error = e as Error;
      }

      // Should fail because token is invalid, not because no auth provided
      expect(error).not.toBeNull();
    });

    it("falls back to API key auth", async () => {
      const { fullKey } = await service.createApiKey(1, {
        name: "Fallback Key",
        permissions: ["content:read"],
      });

      const middleware = combinedAuthMiddleware(undefined, { service });
      const c = createMockContext({ "x-api-key": fullKey });

      let nextCalled = false;
      await middleware(c as any, async () => {
        nextCalled = true;
      });

      expect(nextCalled).toBe(true);
      expect(c.get("userId")).toBe("1");
      expect(c.get("userRole")).toBe("api");
    });

    it("rejects when no auth provided", async () => {
      const middleware = combinedAuthMiddleware(undefined, { service });
      const c = createMockContext();

      let error: Error | null = null;
      try {
        await middleware(c as any, async () => {});
      } catch (e) {
        error = e as Error;
      }

      expect(error).not.toBeNull();
      expect(error!.message).toBe(
        "Missing or invalid authorization. Provide Bearer token or X-API-Key header.",
      );
    });

    it("checks permissions with combined auth", async () => {
      const { fullKey } = await service.createApiKey(1, {
        name: "Permitted Key",
        permissions: ["content:read"],
      });

      const middleware = combinedAuthMiddleware(
        ["content:read"] as Permission[],
        { service },
      );
      const c = createMockContext({ "x-api-key": fullKey });

      let nextCalled = false;
      await middleware(c as any, async () => {
        nextCalled = true;
      });

      expect(nextCalled).toBe(true);
    });

    it("rejects with insufficient permissions", async () => {
      const { fullKey } = await service.createApiKey(1, {
        name: "Limited Key",
        permissions: ["content:read"],
      });

      const middleware = combinedAuthMiddleware(
        ["content:delete"] as Permission[],
        { service },
      );
      const c = createMockContext({ "x-api-key": fullKey });

      let error: Error | null = null;
      try {
        await middleware(c as any, async () => {});
      } catch (e) {
        error = e as Error;
      }

      expect(error).not.toBeNull();
      expect(error!.message).toBe("API key does not have required permissions");
    });

    it("sets rate limit headers", async () => {
      const { fullKey } = await service.createApiKey(1, {
        name: "Rate Limited Key",
        rateLimitPerMinute: 100,
      });

      const middleware = combinedAuthMiddleware(undefined, { service });
      const c = createMockContext({ "x-api-key": fullKey });

      await middleware(c as any, async () => {});

      expect(c._headers.get("X-RateLimit-Limit")).toBe("100");
      expect(c._headers.has("X-RateLimit-Remaining")).toBe(true);
      expect(c._headers.has("X-RateLimit-Reset")).toBe(true);
    });
  });

  describe("Context Consistency", () => {
    beforeEach(() => {
      service = new ApiKeyService();
    });

    it("sets consistent user context across auth methods", async () => {
      // API Key auth should set user context like JWT auth does
      const { fullKey } = await service.createApiKey(1, {
        name: "Consistency Test",
      });

      const middleware = apiKeyAuthMiddleware(undefined, { service });
      const c = createMockContext({ "x-api-key": fullKey });

      await middleware(c as any, async () => {});

      // All standard context variables should be present
      expect(c.get("userId")).toBeDefined();
      expect(c.get("userRole")).toBeDefined();
      expect(c.get("user")).toBeDefined();
      expect(c.get("apiKey")).toBeDefined();
    });

    it("provides apiKey context with all required fields", async () => {
      const { apiKey, fullKey } = await service.createApiKey(1, {
        name: "Context Test",
        permissions: ["content:read", "blueprint:read"],
      });

      const middleware = apiKeyAuthMiddleware(undefined, { service });
      const c = createMockContext({ "x-api-key": fullKey });

      await middleware(c as any, async () => {});

      const apiKeyContext = c.get("apiKey") as any;
      expect(apiKeyContext.apiKeyId).toBe(apiKey.id);
      expect(apiKeyContext.apiKeyUserId).toBe(1);
      expect(apiKeyContext.apiKeyPermissions).toEqual([
        "content:read",
        "blueprint:read",
      ]);
      expect(apiKeyContext.apiKeyRateLimit).toBeDefined();
      expect(apiKeyContext.apiKeyRateLimit.remaining).toBeGreaterThanOrEqual(0);
      expect(apiKeyContext.apiKeyRateLimit.limit).toBeGreaterThan(0);
    });
  });
});
