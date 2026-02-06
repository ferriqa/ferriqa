/**
 * @ferriqa/sdk - HTTP Client
 *
 * Core HTTP client with error handling and retry logic
 */

import type {
  SDKConfig,
  RequestOptions,
  SDKResponse,
  SDKError,
} from "../types/index.ts";

export class HTTPClient {
  private config: SDKConfig;
  private baseUrl: string;

  constructor(config: SDKConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl.replace(/\/$/, ""); // Remove trailing slash
  }

  async request<T>(
    path: string,
    options: RequestOptions = {},
  ): Promise<SDKResponse<T>> {
    const url = `${this.baseUrl}${path}`;
    const method = options.method || "GET";
    const timeout = options.timeout || this.config.timeout || 30000;
    const maxRetries = this.config.retries || 3;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...this.config.headers,
      ...options.headers,
    };

    // Add authentication
    if (this.config.apiKey) {
      headers["X-API-Key"] = this.config.apiKey;
    }
    if (this.config.accessToken) {
      headers["Authorization"] = `Bearer ${this.config.accessToken}`;
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const fetchOptions: RequestInit = {
          method,
          headers,
          signal: controller.signal,
        };

        if (options.body && method !== "GET") {
          fetchOptions.body = JSON.stringify(options.body);
        }

        const response = await fetch(url, fetchOptions);
        clearTimeout(timeoutId);

        // Parse response
        let data: T;
        const contentType = response.headers.get("content-type");

        if (contentType?.includes("application/json")) {
          data = (await response.json()) as T;
        } else {
          data = (await response.text()) as unknown as T;
        }

        // Handle error responses
        if (!response.ok) {
          const error: SDKError = {
            message:
              ((data as Record<string, unknown>)?.message as string) ||
              `HTTP ${response.status}`,
            code:
              ((data as Record<string, unknown>)?.code as string) ||
              "UNKNOWN_ERROR",
            status: response.status,
            details: (data as Record<string, unknown>)?.details as Record<
              string,
              unknown
            >,
          };
          throw new SDKRequestError(error);
        }

        // Extract headers
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        return {
          data,
          status: response.status,
          headers: responseHeaders,
        };
      } catch (error) {
        lastError = error as Error;

        // Don't retry on 4xx errors (client errors)
        if (
          error instanceof SDKRequestError &&
          error.status >= 400 &&
          error.status < 500
        ) {
          throw error;
        }

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries - 1) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error("Request failed after max retries");
  }

  get<T>(
    path: string,
    options?: Omit<RequestOptions, "method">,
  ): Promise<SDKResponse<T>> {
    return this.request<T>(path, { ...options, method: "GET" });
  }

  post<T>(
    path: string,
    body: unknown,
    options?: Omit<RequestOptions, "method" | "body">,
  ): Promise<SDKResponse<T>> {
    return this.request<T>(path, { ...options, method: "POST", body });
  }

  put<T>(
    path: string,
    body: unknown,
    options?: Omit<RequestOptions, "method" | "body">,
  ): Promise<SDKResponse<T>> {
    return this.request<T>(path, { ...options, method: "PUT", body });
  }

  patch<T>(
    path: string,
    body: unknown,
    options?: Omit<RequestOptions, "method" | "body">,
  ): Promise<SDKResponse<T>> {
    return this.request<T>(path, { ...options, method: "PATCH", body });
  }

  delete<T>(
    path: string,
    options?: Omit<RequestOptions, "method">,
  ): Promise<SDKResponse<T>> {
    return this.request<T>(path, { ...options, method: "DELETE" });
  }

  /**
   * Set or update the API key
   */
  setApiKey(apiKey: string): void {
    this.config.apiKey = apiKey;
  }

  /**
   * Set or update the access token
   */
  setAccessToken(token: string): void {
    this.config.accessToken = token;
  }

  /**
   * Clear authentication credentials
   */
  clearAuth(): void {
    this.config.apiKey = undefined;
    this.config.accessToken = undefined;
  }
}

export class SDKRequestError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details?: Record<string, unknown>;

  constructor(error: SDKError) {
    super(error.message);
    this.name = "SDKRequestError";
    this.code = error.code;
    this.status = error.status;
    this.details = error.details;
  }
}
