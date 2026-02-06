/**
 * @ferriqa/sdk - Main SDK Client
 *
 * Ferriqa SDK - Type-safe API client for Ferriqa Headless CMS
 */

import { HTTPClient } from "./http.ts";
import { ContentClient } from "./content.ts";
import { BlueprintClient } from "./blueprint.ts";
import { MediaClient } from "./media.ts";
import { AuthClient } from "../auth/index.ts";
import type { SDKConfig, AuthTokens } from "../types/index.ts";

export class FerriqaClient {
  private http: HTTPClient;
  public auth: AuthClient;
  public blueprints: BlueprintClient;
  public media: MediaClient;
  private contentClients: Map<string, ContentClient> = new Map();

  constructor(config: SDKConfig) {
    this.http = new HTTPClient(config);
    this.auth = new AuthClient(this.http);
    this.blueprints = new BlueprintClient(this.http);
    this.media = new MediaClient(this.http);
  }

  /**
   * Get a content client for a specific blueprint
   * Creates and caches the client on first access
   */
  contents(blueprintSlug: string): ContentClient {
    if (!this.contentClients.has(blueprintSlug)) {
      this.contentClients.set(
        blueprintSlug,
        new ContentClient(this.http, blueprintSlug),
      );
    }
    return this.contentClients.get(blueprintSlug)!;
  }

  /**
   * Set API key for authentication
   */
  setApiKey(apiKey: string): void {
    this.http.setApiKey(apiKey);
  }

  /**
   * Set access token for authentication
   */
  setAccessToken(token: string): void {
    this.http.setAccessToken(token);
  }

  /**
   * Check authentication status
   */
  isAuthenticated(): boolean {
    return this.auth.isAuthenticated();
  }

  /**
   * Restore session from stored tokens
   */
  restoreSession(tokens: AuthTokens): void {
    this.auth.setTokens(tokens);
  }

  /**
   * Get health status of the API
   */
  async health(): Promise<{ status: string; timestamp: string }> {
    const response = await this.http.get<{ status: string; timestamp: string }>(
      "/health",
    );
    return response.data;
  }
}

// Re-export all types
export * from "../types/index.ts";
export * from "./http.ts";
export { AuthClient } from "../auth/index.ts";
export { ContentClient } from "./content.ts";
export { BlueprintClient } from "./blueprint.ts";
export { MediaClient } from "./media.ts";

// Default export
export default FerriqaClient;
