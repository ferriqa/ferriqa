import type { Role } from "./permissions.ts";

export interface User {
  id: string;
  email: string;
  // NOTE: Using Role type from permissions.ts for consistency
  // UserRole is now an alias to Role to avoid duplication
  role: Role;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

// NOTE: UserRole is intentionally kept as an alias for backward compatibility
// and to maintain semantic clarity (user roles vs permission roles)
// Both types should always be kept in sync
export type UserRole = Role;

export interface JWTPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}
