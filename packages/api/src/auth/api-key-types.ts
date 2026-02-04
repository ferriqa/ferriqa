/**
 * @ferriqa/api - API Key Types
 *
 * Type definitions for API key authentication and management
 */

import type { Permission } from "./permissions";

/**
 * API Key entity stored in database (without sensitive keyHash)
 * The keyHash is stored separately in the database and never exposed in API responses
 */
export interface ApiKey {
  id: string;
  name: string;
  userId: number;
  // NOTE: keyHash is intentionally excluded from this interface
  // It should never be exposed in API responses, only stored in database
  keyPrefix: string;
  permissions: Permission[];
  isActive: boolean;
  lastUsedAt: number | null;
  expiresAt: number | null;
  rateLimitPerMinute: number;
  createdAt: number;
  updatedAt: number;
}

/**
 * API Key creation request
 */
export interface CreateApiKeyRequest {
  name: string;
  permissions?: Permission[];
  expiresAt?: number | null;
  rateLimitPerMinute?: number;
}

/**
 * API Key update request
 */
export interface UpdateApiKeyRequest {
  name?: string;
  permissions?: Permission[];
  isActive?: boolean;
  expiresAt?: number | null;
  rateLimitPerMinute?: number;
}

/**
 * API Key response (without sensitive data)
 */
export interface ApiKeyResponse {
  id: string;
  name: string;
  userId: number;
  keyPrefix: string;
  permissions: Permission[];
  isActive: boolean;
  lastUsedAt: number | null;
  expiresAt: number | null;
  rateLimitPerMinute: number;
  createdAt: number;
  updatedAt: number;
}

/**
 * API Key creation response (only time the full key is shown)
 */
export interface CreateApiKeyResponse extends ApiKeyResponse {
  key: string;
}

/**
 * API Key validation result
 */
export interface ApiKeyValidationResult {
  valid: boolean;
  apiKey?: ApiKey;
  error?: string;
}

/**
 * Rate limit information for API keys
 */
export interface ApiKeyRateLimitInfo {
  keyId: string;
  remaining: number;
  resetAt: number;
  limit: number;
}
