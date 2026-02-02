// @ts-ignore - Deno global for cross-runtime support
const denoEnv = typeof Deno !== "undefined" ? Deno.env.get : undefined;

const JWT_SECRET =
  (typeof process !== "undefined"
    ? process.env.JWT_SECRET
    : denoEnv
      ? denoEnv("JWT_SECRET")
      : "") || "dev-secret-change-in-production";

const ACCESS_TOKEN_EXPIRY = 15 * 60; // 15 minutes
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days

export const authConfig = {
  jwtSecret: JWT_SECRET,
  accessTokenExpiry: ACCESS_TOKEN_EXPIRY,
  refreshTokenExpiry: REFRESH_TOKEN_EXPIRY,
} as const;
