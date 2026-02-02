import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import type { Permission, Role } from "../auth/permissions";
import { hasPermission } from "../auth/permissions";

export function requirePermission(permission: Permission) {
  return async (c: Context, next: Next) => {
    const userRole = c.get("userRole") as Role;

    if (!userRole) {
      throw new HTTPException(401, { message: "Authentication required" });
    }

    const blueprintSlug =
      c.req.param("blueprint") || c.req.param("blueprintSlug");

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
