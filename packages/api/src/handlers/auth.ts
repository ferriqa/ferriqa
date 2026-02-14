import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { generateTokens, verifyRefreshToken } from "../auth/jwt";
import { userService } from "../auth/user-service";
import type { LoginRequest, RefreshRequest, AuthResponse } from "../auth/types";
import type { User } from "../auth/types";

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

export function userListHandler() {
  return async (c: Context) => {
    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "25");
    const role = c.req.query("role");
    const isActive = c.req.query("isActive");
    const search = c.req.query("search");

    let users: User[] = await userService.list();

    if (role) {
      users = users.filter((u) => u.role === role);
    }
    if (isActive !== undefined) {
      users = users.filter((u) => u.isActive === (isActive === "true"));
    }
    if (search) {
      const searchLower = search.toLowerCase();
      users = users.filter(
        (u) =>
          u.email.toLowerCase().includes(searchLower) ||
          (u as any).name?.toLowerCase().includes(searchLower),
      );
    }

    const total = users.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const data = users.slice(start, start + limit);

    return c.json(
      {
        data: {
          data,
          pagination: {
            page,
            limit,
            total,
            totalPages,
          },
        },
      },
      200,
    );
  };
}

export function userGetHandler() {
  return async (c: Context) => {
    const id = c.req.param("id");
    const user = await userService.getById(id);

    if (!user) {
      throw new HTTPException(404, { message: "User not found" });
    }

    return c.json({ data: user }, 200);
  };
}
