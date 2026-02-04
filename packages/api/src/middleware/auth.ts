import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import { verifyToken } from "../auth/jwt.ts";
import { userService } from "../auth/user-service.ts";
import { apiKeyService } from "../auth/api-key-service.ts";
import { getPermissionResolver } from "../auth/permissions.ts";

// NOTE: This file contains JWT and API key authentication logic that is duplicated
// in api-key-auth.ts (combinedAuthMiddleware). See REFACTORING.md for the planned
// refactoring task to extract this duplication into shared helper functions.
// For now, any bug fixes or features must be synced across both files manually.

export function authMiddleware() {
  return async (c: Context, next: Next) => {
    const authHeader = c.req.header("Authorization");
    const apiKeyHeader = c.req.header("X-API-Key");

    // Try JWT auth if Authorization header is present
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);

      let payload;
      try {
        payload = await verifyToken(token);
      } catch {
        throw new HTTPException(401, { message: "Invalid or expired token" });
      }

      try {
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
        // Rationale: See api-key-auth.ts combinedAuthMiddleware for detailed explanation.
        // Trade-off: Fail-secure over fail-open. System errors block requests
        // even with valid API keys to prevent potential auth bypass attacks.
        throw new HTTPException(500, {
          message: "Authentication service error",
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

    // Try API key auth if X-API-Key header is present
    if (apiKeyHeader) {
      const validationResult = await apiKeyService.validateApiKey(apiKeyHeader);

      if (!validationResult.valid) {
        throw new HTTPException(401, {
          message: validationResult.error || "Invalid API key",
        });
      }

      const keyData = validationResult.apiKey!;

      // Fetch user object for consistency with JWT auth
      // NOTE: This ensures downstream middleware and route handlers can always access
      // c.get("user") regardless of authentication method (JWT or API key)
      const user = await userService.getById(keyData.userId.toString());
      if (!user || !user.isActive) {
        throw new HTTPException(401, {
          message: "API key owner not found or inactive",
        });
      }

      // Get rate limit info and set headers
      const rateLimitInfo = apiKeyService.getRateLimitInfo(
        keyData.id,
        keyData.rateLimitPerMinute,
      );

      // Set context variables
      // NOTE: keyData.permissions contains custom permissions for this API key.
      // These permissions should be validated in route handlers using hasPermission()
      // with a custom permission check that combines base "api" role permissions
      // with the API key's specific permissions from keyData.permissions
      c.set("userId", keyData.userId.toString());
      c.set("userRole", "api");
      c.set("user", user);
      c.set("apiKey", {
        apiKeyId: keyData.id,
        apiKeyUserId: keyData.userId,
        apiKeyPermissions: keyData.permissions,
      });

      // Add rate limit headers
      c.header("X-RateLimit-Limit", rateLimitInfo.limit.toString());
      c.header("X-RateLimit-Remaining", rateLimitInfo.remaining.toString());
      c.header(
        "X-RateLimit-Reset",
        Math.floor(rateLimitInfo.resetAt / 1000).toString(),
      );

      await next();
      return;
    }

    // No valid auth found
    throw new HTTPException(401, {
      message: "Missing or invalid authorization header or X-API-Key header",
    });
  };
}
