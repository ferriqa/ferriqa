import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { generateTokens, verifyRefreshToken } from "../auth/jwt";
import { userService } from "../auth/user-service";
import type { LoginRequest, RefreshRequest, AuthResponse } from "../auth/types";

export function authLoginHandler() {
  return async (c: Context) => {
    const body = (await c.req.json()) as LoginRequest;
    const { email, password } = body;

    if (!email || !password) {
      throw new HTTPException(400, {
        message: "Email and password are required",
      });
    }

    const user = await userService.validateCredentials(email, password);

    if (!user) {
      throw new HTTPException(401, { message: "Invalid credentials" });
    }

    const tokens = await generateTokens(user);

    const response: AuthResponse = {
      user,
      tokens,
    };

    return c.json({ data: response }, 200);
  };
}

export function authRefreshHandler() {
  return async (c: Context) => {
    const body = (await c.req.json()) as RefreshRequest;
    const { refreshToken } = body;

    if (!refreshToken) {
      throw new HTTPException(400, { message: "Refresh token is required" });
    }

    const { sub } = await verifyRefreshToken(refreshToken);

    const user = await userService.getById(sub);

    if (!user || !user.isActive) {
      throw new HTTPException(401, { message: "User not found or inactive" });
    }

    const tokens = await generateTokens(user);

    const response: AuthResponse = {
      user,
      tokens,
    };

    return c.json({ data: response }, 200);
  };
}

export function authLogoutHandler() {
  return async (c: Context) => {
    return c.json({ success: true }, 200);
  };
}

export function userMeHandler() {
  return async (c: Context) => {
    const user = c.get("user");

    if (!user) {
      throw new HTTPException(401, { message: "Not authenticated" });
    }

    return c.json({ data: user }, 200);
  };
}
