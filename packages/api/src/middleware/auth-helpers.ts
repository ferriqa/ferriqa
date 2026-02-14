/**
 * @ferriqa/api - Authentication Helper Functions
 *
 * Shared authentication logic extracted to eliminate duplication between
 * authMiddleware and combinedAuthMiddleware. This ensures consistent behavior
 * and reduces maintenance burden.
 */

import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { verifyToken } from "../auth/jwt.ts";
import type { User, JWTPayload } from "../auth/types.ts";
import { userService } from "../auth/user-service.ts";
import { apiKeyService } from "../auth/api-key-service.ts";
import { getPermissionResolver } from "../auth/permissions.ts";
import type { Permission } from "../auth/permissions.ts";
import type { ApiKey, ApiKeyRateLimitInfo } from "../auth/api-key-types.ts";

/**
 * Result of successful JWT authentication
 */
export interface JWTAuthResult {
  user: User;
  payload: JWTPayload;
}

/**
 * Result of successful API key authentication
 */
export interface APIKeyAuthResult {
  user: User;
  keyData: ApiKey;
  rateLimitInfo: ApiKeyRateLimitInfo;
}

/**
 * Data needed to set authentication context
 */
export interface AuthContextData {
  user: User;
  role?: string;
  apiKeyData?: {
    id: string;
    userId: number;
    permissions: Permission[];
  };
}

/**
 * Validate and decode JWT token, fetch and validate user
 *
 * @param token - JWT bearer token
 * @returns User and payload if valid
 * @throws HTTPException if token is invalid, expired, or user is not found/inactive
 */
export async function validateJWTAuth(token: string): Promise<JWTAuthResult> {
  let payload: JWTPayload;
  try {
    payload = await verifyToken(token);
  } catch {
    throw new HTTPException(401, { message: "Invalid or expired token" });
  }

  const user = await validateAndGetUser(payload.sub);

  validateUserRole(payload.role);

  return { user, payload };
}

/**
 * Validate API key and fetch associated user
 *
 * @param apiKey - API key string from X-API-Key header
 * @param requiredPermissions - Optional permissions to check
 * @param options - Optional service injection for testing
 * @returns User, key data, and rate limit info
 * @throws HTTPException if key is invalid, expired, or lacks required permissions
 */
export async function validateAPIKeyAuth(
  apiKey: string,
  requiredPermissions?: Permission[],
  options?: { service?: typeof apiKeyService },
): Promise<APIKeyAuthResult> {
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

  const user = await validateAndGetUser(keyData.userId.toString());

  const rateLimitInfo = service.getRateLimitInfo(
    keyData.id,
    keyData.rateLimitPerMinute,
  );

  return { user, keyData, rateLimitInfo };
}

/**
 * Fetch user by ID and validate that user is active
 *
 * @param userId - User ID from JWT or API key
 * @returns User if found and active
 * @throws HTTPException 401 if user not found or inactive
 */
export async function validateAndGetUser(userId: string): Promise<User> {
  const user = await userService.getById(userId);
  if (!user || !user.isActive) {
    throw new HTTPException(401, {
      message: "User not found or inactive",
    });
  }
  return user;
}

/**
 * Validate JWT role against base roles or custom role resolver
 *
 * @param role - Role from JWT payload
 * @throws HTTPException 401 if role is invalid
 */
export function validateUserRole(role: string): void {
  const baseRoles = ["admin", "editor", "viewer", "api"] as const;
  const permissionResolver = getPermissionResolver();
  const isCustomRole = permissionResolver?.isCustomRole(role);

  if (
    !baseRoles.includes(role as (typeof baseRoles)[number]) &&
    !isCustomRole
  ) {
    throw new HTTPException(401, {
      message: "Invalid role in token",
    });
  }
}

/**
 * Set authentication context variables on Hono context
 *
 * @param c - Hono context
 * @param authType - Type of authentication ("jwt" or "apikey" or "dev")
 * @param data - Authentication data
 */
export function setAuthContext(
  c: Context,
  authType: "jwt" | "apikey" | "dev",
  data: AuthContextData,
): void {
  c.set("userId", data.user.id.toString());
  c.set("user", data.user);

  if (authType === "dev" || authType === "jwt") {
    c.set("userRole", data.role || "admin");
  } else {
    c.set("userRole", "api");
    c.set("apiKey", {
      apiKeyId: data.apiKeyData!.id,
      apiKeyUserId: data.apiKeyData!.userId,
      apiKeyPermissions: data.apiKeyData!.permissions,
    });
  }
}

/**
 * Set rate limit headers on Hono response
 *
 * @param c - Hono context
 * @param rateLimitInfo - Rate limit information
 */
export function setRateLimitHeaders(
  c: Context,
  rateLimitInfo: ApiKeyRateLimitInfo,
): void {
  c.header("X-RateLimit-Limit", rateLimitInfo.limit.toString());
  c.header("X-RateLimit-Remaining", rateLimitInfo.remaining.toString());
  c.header(
    "X-RateLimit-Reset",
    Math.floor(rateLimitInfo.resetAt / 1000).toString(),
  );
}
