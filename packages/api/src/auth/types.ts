export interface User {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export type UserRole = "admin" | "editor" | "viewer" | "api";

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
