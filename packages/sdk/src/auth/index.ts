/**
 * @ferriqa/sdk - Authentication
 *
 * Authentication and token management
 */

import type { HTTPClient } from "../client/http.ts";
import type { AuthTokens, LoginCredentials, User } from "../types/index.ts";

export class AuthClient {
  private http: HTTPClient;
  private tokens: AuthTokens | null = null;
  private refreshPromise: Promise<AuthTokens> | null = null;

  constructor(http: HTTPClient) {
    this.http = http;
  }

  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthTokens> {
    const response = await this.http.post<AuthTokens>(
      "/api/v1/auth/login",
      credentials,
    );
    this.tokens = response.data;
    return response.data;
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    await this.http.post("/api/v1/auth/logout", {});
    this.tokens = null;
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken?: string): Promise<AuthTokens> {
    const token = refreshToken || this.tokens?.refreshToken;

    if (!token) {
      throw new Error("No refresh token available");
    }

    // Prevent multiple simultaneous refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.http
      .post<AuthTokens>("/api/v1/auth/refresh", { refreshToken: token })
      .then((response) => {
        this.tokens = response.data;
        return response.data;
      })
      .finally(() => {
        this.refreshPromise = null;
      });

    return this.refreshPromise;
  }

  /**
   * Get current user info
   */
  async me(): Promise<User> {
    const response = await this.http.get<User>("/api/v1/users/me");
    return response.data;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.tokens !== null;
  }

  /**
   * Get current tokens
   */
  getTokens(): AuthTokens | null {
    return this.tokens;
  }

  /**
   * Set tokens (useful for restoring session)
   */
  setTokens(tokens: AuthTokens): void {
    this.tokens = tokens;
  }

  /**
   * Clear tokens (logout)
   */
  clearTokens(): void {
    this.tokens = null;
  }
}
