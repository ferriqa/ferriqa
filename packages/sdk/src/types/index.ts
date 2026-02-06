/**
 * @ferriqa/sdk - Core Types
 *
 * Type definitions for the Ferriqa SDK
 */

// SDK Configuration
export interface SDKConfig {
  baseUrl: string;
  apiKey?: string;
  accessToken?: string;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

// HTTP Request/Response Types
export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
}

export interface SDKResponse<T> {
  data: T;
  status: number;
  headers: Record<string, string>;
}

export interface SDKError {
  message: string;
  code: string;
  status: number;
  details?: Record<string, unknown>;
}

// Pagination Types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Content Types
export interface ContentItem {
  id: number;
  slug: string;
  blueprintId: number;
  data: Record<string, unknown>;
  status: "draft" | "published" | "archived";
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContentRequest {
  slug: string;
  data: Record<string, unknown>;
  status?: "draft" | "published";
}

export interface UpdateContentRequest {
  slug?: string;
  data?: Record<string, unknown>;
  status?: "draft" | "published" | "archived";
}

// Blueprint Types
export interface Blueprint {
  id: number;
  name: string;
  slug: string;
  description?: string;
  fields: BlueprintField[];
  createdAt: string;
  updatedAt: string;
}

export interface BlueprintField {
  id: string;
  name: string;
  key: string;
  type: string;
  required?: boolean;
  unique?: boolean;
  default?: unknown;
  options?: Record<string, unknown>;
}

// Authentication Types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

// Webhook Types
export interface Webhook {
  id: number;
  name: string;
  url: string;
  events: string[];
  secret?: string;
  isActive: boolean;
  createdAt: string;
}

// Media Types
export interface MediaFile {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
}
