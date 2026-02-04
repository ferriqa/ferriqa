import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import type { Permission, Role } from "../auth/permissions.ts";
import { hasPermission } from "../auth/permissions.ts";

export function requirePermission(permission: Permission) {
  return async (c: Context, next: Next) => {
    const userRole = c.get("userRole") as Role;

    if (!userRole) {
      throw new HTTPException(401, { message: "Authentication required" });
    }

    const blueprintSlug =
      c.req.param("blueprint") || c.req.param("blueprintSlug");

    // DESIGN DECISION: API keys extend the base "api" role permissions
    // API keys can have custom permissions that go BEYOND the base "api" role.
    // This is intentional - API keys are meant to be flexible access tokens
    // that can be granted specific permissions for specific use cases.
    // SECURITY NOTE: The base "api" role provides the minimum permissions.
    // API key permissions are ADDITIVE - they extend, not replace, the base role.
    // Example: api role has ["content:read"], API key can have ["content:delete"]
    const apiKeyContext = c.get("apiKey") as
      | { apiKeyPermissions?: Permission[] }
      | undefined;
    if (apiKeyContext?.apiKeyPermissions) {
      if (apiKeyContext.apiKeyPermissions.includes(permission)) {
        // API key has this permission - allow access
        // This allows API keys to have permissions beyond the base "api" role
        await next();
        return;
      }
    }

    // Fall back to base role permission check
    if (!hasPermission(userRole, permission, blueprintSlug)) {
      throw new HTTPException(403, {
        message: `Insufficient permissions. Required: ${permission}`,
      });
    }

    await next();
  };
}

export function requireAnyPermission(...permissions: Permission[]) {
  return async (c: Context, next: Next) => {
    const userRole = c.get("userRole") as Role;

    if (!userRole) {
      throw new HTTPException(401, { message: "Authentication required" });
    }

    const blueprintSlug =
      c.req.param("blueprint") || c.req.param("blueprintSlug");

    // DESIGN DECISION: API keys extend the base "api" role permissions
    // API keys can have custom permissions that go BEYOND the base "api" role.
    // This is intentional - API keys are meant to be flexible access tokens.
    // SECURITY NOTE: API key permissions are ADDITIVE to the base "api" role.
    const apiKeyContext = c.get("apiKey") as
      | { apiKeyPermissions?: Permission[] }
      | undefined;
    if (apiKeyContext?.apiKeyPermissions) {
      const hasAnyFromKey = permissions.some((p) =>
        apiKeyContext.apiKeyPermissions!.includes(p),
      );
      if (hasAnyFromKey) {
        // API key has at least one of the required permissions
        // This allows API keys to have permissions beyond the base "api" role
        await next();
        return;
      }
    }

    // Fall back to base role permission check
    const hasAny = permissions.some((p) =>
      hasPermission(userRole, p, blueprintSlug),
    );

    if (!hasAny) {
      throw new HTTPException(403, {
        message: `Insufficient permissions. Required one of: ${permissions.join(", ")}`,
      });
    }

    await next();
  };
}

export function requireAllPermissions(...permissions: Permission[]) {
  return async (c: Context, next: Next) => {
    const userRole = c.get("userRole") as Role;

    if (!userRole) {
      throw new HTTPException(401, { message: "Authentication required" });
    }

    const blueprintSlug =
      c.req.param("blueprint") || c.req.param("blueprintSlug");

    // DESIGN DECISION: API keys extend the base "api" role permissions
    // API keys can have custom permissions that go BEYOND the base "api" role.
    // This is intentional - API keys are meant to be flexible access tokens.
    // SECURITY NOTE: API key permissions are ADDITIVE to the base "api" role.
    const apiKeyContext = c.get("apiKey") as
      | { apiKeyPermissions?: Permission[] }
      | undefined;
    if (apiKeyContext?.apiKeyPermissions) {
      const hasAllFromKey = permissions.every((p) =>
        apiKeyContext.apiKeyPermissions!.includes(p),
      );
      if (hasAllFromKey) {
        // API key has all of the required permissions
        // This allows API keys to have permissions beyond the base "api" role
        await next();
        return;
      }
    }

    // Fall back to base role permission check
    const hasAll = permissions.every((p) =>
      hasPermission(userRole, p, blueprintSlug),
    );

    if (!hasAll) {
      throw new HTTPException(403, {
        message: `Insufficient permissions. Required all of: ${permissions.join(", ")}`,
      });
    }

    await next();
  };
}
