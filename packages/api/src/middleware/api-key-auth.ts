/**
 * @ferriqa/api - API Key Authentication Middleware
 *
 * Hono middleware for validating API keys from X-API-Key header
 */

import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import type { Permission } from "../auth/permissions.ts";
import {
  validateJWTAuth,
  validateAPIKeyAuth,
  setAuthContext,
  setRateLimitHeaders,
} from "./auth-helpers.ts";

export interface ApiKeyAuthContext {
  apiKeyId: string;
  apiKeyUserId: number;
  apiKeyPermissions: Permission[];
  apiKeyRateLimit: {
    remaining: number;
    resetAt: number;
    limit: number;
  };
}

/**
 * Middleware to validate API keys from X-API-Key header
 * Supports optional permission checking
 */
export function apiKeyAuthMiddleware(
  requiredPermissions?: Permission[],
  options?: {
    service?: typeof import("../auth/api-key-service.ts").apiKeyService;
  },
) {
  return async (c: Context, next: Next) => {
    const apiKey = c.req.header("X-API-Key");

    if (!apiKey) {
      throw new HTTPException(401, {
        message: "Missing X-API-Key header",
      });
    }

    const result = await validateAPIKeyAuth(
      apiKey,
      requiredPermissions,
      options,
    );

    setAuthContext(c, "apikey", {
      user: result.user,
      apiKeyData: {
        id: result.keyData.id,
        userId: result.keyData.userId,
        permissions: result.keyData.permissions,
      },
    });

    setRateLimitHeaders(c, result.rateLimitInfo);

    await next();
  };
}

/**
 * Combined authentication middleware that supports both JWT and API keys
 * Tries JWT first, then falls back to API key
 */
export function combinedAuthMiddleware(
  requiredPermissions?: Permission[],
  options?: {
    service?: typeof import("../auth/api-key-service.ts").apiKeyService;
  },
) {
  return async (c: Context, next: Next) => {
    const authHeader = c.req.header("Authorization");
    const apiKeyHeader = c.req.header("X-API-Key");

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);

      try {
        const result = await validateJWTAuth(token);
        setAuthContext(c, "jwt", {
          user: result.user,
          role: result.payload.role,
        });
        await next();
        return;
      } catch (error) {
        if (error instanceof HTTPException) {
          throw error;
        }
        // SECURITY DESIGN: Do NOT fall through to API key authentication on ANY JWT error
        // This includes both auth failures (invalid token) AND system errors.
        // Rationale: See detailed explanation below.
        // Trade-off: Fail-secure over fail-open. System errors block requests
        // even with valid API keys to prevent potential auth bypass attacks.
        // ERROR HANDLING: Return 500 for system errors (not 401) to distinguish from auth failures
        throw new HTTPException(500, {
          message: "JWT authentication failed",
        });
      }
    }

    // SECURITY: Reject malformed Authorization headers before falling through to API key auth
    // If Authorization header is present but doesn't use Bearer scheme, reject immediately.
    // This prevents auth bypass where an invalid JWT format falls through to API key auth.
    if (authHeader && !authHeader.startsWith("Bearer ")) {
      throw new HTTPException(401, {
        message:
          "Invalid authorization header format. Expected 'Bearer <token>'.",
      });
    }

    if (apiKeyHeader) {
      const result = await validateAPIKeyAuth(
        apiKeyHeader,
        requiredPermissions,
        options,
      );

      setAuthContext(c, "apikey", {
        user: result.user,
        apiKeyData: {
          id: result.keyData.id,
          userId: result.keyData.userId,
          permissions: result.keyData.permissions,
        },
      });

      setRateLimitHeaders(c, result.rateLimitInfo);

      await next();
      return;
    }

    throw new HTTPException(401, {
      message:
        "Missing or invalid authorization. Provide Bearer token or X-API-Key header.",
    });
  };
}
