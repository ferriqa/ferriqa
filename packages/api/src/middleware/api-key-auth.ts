/**
 * @ferriqa/api - API Key Authentication Middleware
 *
 * Hono middleware for validating API keys from X-API-Key header
 */

import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import { apiKeyService } from "../auth/api-key-service.ts";
import { userService } from "../auth/user-service.ts";
import { verifyToken } from "../auth/jwt.ts";
import type { Permission } from "../auth/permissions.ts";
import { getPermissionResolver } from "../auth/permissions.ts";

// NOTE: This file contains JWT and API key authentication logic that is duplicated
// from auth.ts (authMiddleware). The combinedAuthMiddleware essentially duplicates
// the logic from authMiddleware. See REFACTORING.md for the planned refactoring task
// to extract this duplication into shared helper functions. For now, any bug fixes
// or feature additions should be synced across both files manually.

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
  options?: { service?: typeof apiKeyService },
) {
  return async (c: Context, next: Next) => {
    const apiKey = c.req.header("X-API-Key");

    if (!apiKey) {
      throw new HTTPException(401, {
        message: "Missing X-API-Key header",
      });
    }

    const service = options?.service ?? apiKeyService;
    const validationResult = await service.validateApiKey(apiKey);

    if (!validationResult.valid) {
      throw new HTTPException(401, {
        message: validationResult.error || "Invalid API key",
      });
    }

    const keyData = validationResult.apiKey!;

    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasAllPermissions = requiredPermissions.every((perm) =>
        keyData.permissions.includes(perm),
      );

      if (!hasAllPermissions) {
        throw new HTTPException(403, {
          message: "API key does not have required permissions",
        });
      }
    }

    // Fetch user object for consistency
    // NOTE: Ensures c.get("user") is always available regardless of auth method
    const user = await userService.getById(keyData.userId.toString());
    if (!user || !user.isActive) {
      throw new HTTPException(401, {
        message: "API key owner not found or inactive",
      });
    }

    const rateLimitInfo = service.getRateLimitInfo(
      keyData.id,
      keyData.rateLimitPerMinute,
    );

    c.set("apiKey", {
      apiKeyId: keyData.id,
      apiKeyUserId: keyData.userId,
      apiKeyPermissions: keyData.permissions,
      apiKeyRateLimit: {
        remaining: rateLimitInfo.remaining,
        resetAt: rateLimitInfo.resetAt,
        limit: rateLimitInfo.limit,
      },
    });

    c.set("userId", keyData.userId.toString());
    c.set("userRole", "api");
    c.set("user", user);

    c.header("X-RateLimit-Limit", rateLimitInfo.limit.toString());
    c.header("X-RateLimit-Remaining", rateLimitInfo.remaining.toString());
    c.header(
      "X-RateLimit-Reset",
      Math.floor(rateLimitInfo.resetAt / 1000).toString(),
    );

    await next();
  };
}

/**
 * Combined authentication middleware that supports both JWT and API keys
 * Tries JWT first, then falls back to API key
 * NOTE: Uses static imports instead of dynamic imports for better performance
 * Dynamic imports in hot paths cause unnecessary overhead on every request
 */
export function combinedAuthMiddleware(
  requiredPermissions?: Permission[],
  options?: { service?: typeof apiKeyService },
) {
  return async (c: Context, next: Next) => {
    const authHeader = c.req.header("Authorization");
    const apiKeyHeader = c.req.header("X-API-Key");

    if (authHeader && authHeader.startsWith("Bearer ")) {
      // NOTE: Using static imports for performance - imported at top of file
      // This avoids dynamic import overhead on the hot path

      const token = authHeader.substring(7);

      try {
        const payload = await verifyToken(token);
        const user = await userService.getById(payload.sub);

        if (!user || !user.isActive) {
          throw new HTTPException(401, {
            message: "User not found or inactive",
          });
        }

        // Validate JWT role - check against base roles or custom roles via resolver
        // NOTE: Custom roles are supported via setPermissionResolver().
        // If permissionResolver is set, it will handle custom role validation.
        // If not set, only base roles are valid.
        // PERFORMANCE: Using static import to avoid dynamic import overhead on every request
        const baseRoles = ["admin", "editor", "viewer", "api"] as const;
        const permissionResolver = getPermissionResolver();
        const isCustomRole = permissionResolver?.isCustomRole(payload.role);

        if (
          !baseRoles.includes(payload.role as (typeof baseRoles)[number]) &&
          !isCustomRole
        ) {
          throw new HTTPException(401, {
            message: "Invalid role in token",
          });
        }

        c.set("userId", payload.sub);
        c.set("userRole", payload.role);
        c.set("user", user);

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
      const service = options?.service ?? apiKeyService;
      const validationResult = await service.validateApiKey(apiKeyHeader);

      if (!validationResult.valid) {
        throw new HTTPException(401, {
          message: validationResult.error || "Invalid API key",
        });
      }

      const keyData = validationResult.apiKey!;

      if (requiredPermissions && requiredPermissions.length > 0) {
        const hasAllPermissions = requiredPermissions.every((perm) =>
          keyData.permissions.includes(perm),
        );

        if (!hasAllPermissions) {
          throw new HTTPException(403, {
            message: "API key does not have required permissions",
          });
        }
      }

      // Fetch user object for consistency
      const user = await userService.getById(keyData.userId.toString());
      if (!user || !user.isActive) {
        throw new HTTPException(401, {
          message: "API key owner not found or inactive",
        });
      }

      const rateLimitInfo = service.getRateLimitInfo(
        keyData.id,
        keyData.rateLimitPerMinute,
      );

      c.set("apiKey", {
        apiKeyId: keyData.id,
        apiKeyUserId: keyData.userId,
        apiKeyPermissions: keyData.permissions,
        apiKeyRateLimit: {
          remaining: rateLimitInfo.remaining,
          resetAt: rateLimitInfo.resetAt,
          limit: rateLimitInfo.limit,
        },
      });
      c.set("userId", keyData.userId.toString());
      c.set("userRole", "api");
      c.set("user", user);

      c.header("X-RateLimit-Limit", rateLimitInfo.limit.toString());
      c.header("X-RateLimit-Remaining", rateLimitInfo.remaining.toString());
      c.header(
        "X-RateLimit-Reset",
        Math.floor(rateLimitInfo.resetAt / 1000).toString(),
      );

      await next();
      return;
    }

    throw new HTTPException(401, {
      message:
        "Missing or invalid authorization. Provide Bearer token or X-API-Key header.",
    });
  };
}
