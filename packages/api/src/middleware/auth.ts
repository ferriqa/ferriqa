import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import {
  validateJWTAuth,
  validateAPIKeyAuth,
  setAuthContext,
  setRateLimitHeaders,
} from "./auth-helpers.ts";

export function authMiddleware() {
  return async (c: Context, next: Next) => {
    const authHeader = c.req.header("Authorization");
    const apiKeyHeader = c.req.header("X-API-Key");

    // Try JWT auth if Authorization header is present
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
      const result = await validateAPIKeyAuth(apiKeyHeader);

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

    // No valid auth found
    throw new HTTPException(401, {
      message: "Missing or invalid authorization header or X-API-Key header",
    });
  };
}
