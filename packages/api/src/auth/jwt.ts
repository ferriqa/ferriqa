import { sign, verify } from "hono/jwt";
import type { JWTPayload, AuthTokens, User } from "./types";
import { authConfig } from "../config/auth";

export async function generateTokens(user: User): Promise<AuthTokens> {
  const now = Math.floor(Date.now() / 1000);

  const accessToken = await sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      iat: now,
      exp: now + authConfig.accessTokenExpiry,
    },
    authConfig.jwtSecret,
  );

  const refreshToken = await sign(
    {
      sub: user.id,
      type: "refresh",
      iat: now,
      exp: now + authConfig.refreshTokenExpiry,
    },
    authConfig.jwtSecret,
  );

  return { accessToken, refreshToken };
}

export async function verifyToken(token: string): Promise<JWTPayload> {
  try {
    const payload = await verify(token, authConfig.jwtSecret, "HS256");
    return payload as unknown as JWTPayload;
  } catch {
    throw new Error("Invalid or expired token");
  }
}

export async function verifyRefreshToken(
  token: string,
): Promise<{ sub: string }> {
  try {
    const payload = (await verify(token, authConfig.jwtSecret, "HS256")) as {
      sub: string;
      type?: string;
    };

    if (payload.type !== "refresh") {
      throw new Error("Invalid refresh token");
    }

    return { sub: payload.sub };
  } catch {
    throw new Error("Invalid or expired refresh token");
  }
}
