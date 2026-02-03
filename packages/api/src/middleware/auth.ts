import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import { verifyToken } from "../auth/jwt.ts";
import { userService } from "../auth/user-service.ts";

export function authMiddleware() {
  return async (c: Context, next: Next) => {
    const authHeader = c.req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new HTTPException(401, {
        message: "Missing or invalid authorization header",
      });
    }

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
        throw new HTTPException(401, { message: "User not found or inactive" });
      }

      c.set("userId", payload.sub);
      c.set("userRole", payload.role);
      c.set("user", user);

      await next();
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      throw new HTTPException(500, { message: "Authentication service error" });
    }
  };
}
