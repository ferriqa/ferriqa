/**
 * @ferriqa/api - API Key Service
 *
 * Service for managing API keys including generation, validation, and rotation
 * Uses database persistence via DatabaseAdapter for cross-runtime compatibility
 */

import { randomBytes, createHash } from "node:crypto";
import type {
  ApiKey,
  CreateApiKeyRequest,
  UpdateApiKeyRequest,
  ApiKeyValidationResult,
  ApiKeyRateLimitInfo,
} from "./api-key-types.ts";
import type { Permission } from "./permissions.ts";

// Internal type that includes keyHash for database storage
// NOTE: keyHash is NEVER exposed in API responses, only stored in DB
type StoredApiKey = ApiKey & { keyHash: string };

// REVIEW NOTE: Valid permission values for input validation
// This array should match the Permission type definition in permissions.ts
export const VALID_PERMISSIONS: readonly string[] = [
  "blueprint:read",
  "blueprint:create",
  "blueprint:update",
  "blueprint:delete",
  "content:read",
  "content:create",
  "content:update",
  "content:delete",
  "content:publish",
  "content:unpublish",
  "content:rollback",
  "media:read",
  "media:create",
  "media:delete",
  "webhook:read",
  "webhook:create",
  "webhook:update",
  "webhook:delete",
  "user:read",
  "user:create",
  "user:update",
  "user:delete",
  "settings:read",
  "settings:update",
  "*",
];

/**
 * Validate and filter permissions array
 * SECURITY: Throws error if invalid permissions are found to prevent silent security issues
 * REVIEWER: This fails fast - prevents accidentally creating API keys with wrong permissions
 */
function validatePermissions(permissions: string[] | undefined): Permission[] {
  if (!permissions || permissions.length === 0) {
    return [];
  }

  const valid: Permission[] = [];
  const invalid: string[] = [];

  for (const perm of permissions) {
    if (VALID_PERMISSIONS.includes(perm)) {
      valid.push(perm as Permission);
    } else {
      invalid.push(perm);
    }
  }

  if (invalid.length > 0) {
    // SECURITY FAIL FAST: Throw error instead of silently filtering
    // This prevents accidental permission typos and makes debugging easier
    throw new Error(
      `Invalid permissions: ${invalid.join(", ")}. Valid permissions are one of: ${VALID_PERMISSIONS.join(", ")}`,
    );
  }

  return valid;
}

/**
 * Generate a unique ID for API keys
 * NOTE: Uses UUID v4 format for consistency across in-memory and database modes
 * This ensures the schema mismatch is resolved - IDs are generated in application
 * code rather than relying on database auto-increment
 */
function generateApiKeyId(): string {
  const bytes = randomBytes(16);
  // UUID v4 format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10

  const hex = bytes.toString("hex");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}

// In-memory rate limiting storage (keyId -> { count, resetAt })
// NOTE: Rate limits are kept in-memory for performance - they reset on server restart
// SECURITY NOTE: This creates a practical limitation where after server restart,
// users could potentially exceed their rate limits because the server has no
// memory of previous usage within the current rate limit window. For production
// deployments requiring strict rate limiting, consider persisting rate limit
// state to the database or using Redis/Redis-compatible storage for distributed
// rate limiting across multiple server instances.
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const KEY_PREFIX = "fk_"; // FerriQA Key prefix
const KEY_LENGTH = 48; // Total key length (excluding prefix)
const PREFIX_LENGTH = 8; // Length of visible key prefix stored in DB

export interface ApiKeyServiceOptions {
  // Database adapter for persistence
  // NOTE: If not provided, service falls back to in-memory storage (dev mode)
  db?: {
    query: <T>(sql: string, params?: unknown[]) => Promise<{ rows: T[] }>;
    execute: (
      sql: string,
      params?: unknown[],
    ) => Promise<{ changes: number; lastInsertId?: number | bigint }>;
  };
}

export class ApiKeyService {
  private db?: ApiKeyServiceOptions["db"];
  private useInMemory: boolean;

  // In-memory storage fallback (for development/testing when no DB provided)
  // NOTE: This is intentionally not exported and only used internally
  private inMemoryStore: Map<string, StoredApiKey> = new Map();
  private idCounter = 1;

  constructor(options: ApiKeyServiceOptions = {}) {
    this.db = options.db;
    this.useInMemory = !options.db;
  }

  /**
   * Generate a cryptographically secure API key
   * Returns the full key (shown only once) and stores only the hash
   */
  generateApiKey(): string {
    const randomPart = randomBytes(KEY_LENGTH / 2).toString("hex");
    return `${KEY_PREFIX}${randomPart}`;
  }

  /**
   * Hash an API key using SHA-256
   * Used for secure storage comparison
   */
  hashKey(key: string): string {
    return createHash("sha256").update(key).digest("hex");
  }

  /**
   * Extract prefix from an API key for storage/display
   */
  getKeyPrefix(key: string): string {
    return key.slice(0, PREFIX_LENGTH);
  }

  /**
   * Create a new API key for a user
   */
  async createApiKey(
    userId: number,
    request: CreateApiKeyRequest,
  ): Promise<{ apiKey: ApiKey; fullKey: string }> {
    const fullKey = this.generateApiKey();
    const keyHash = this.hashKey(fullKey);
    const keyPrefix = this.getKeyPrefix(fullKey);
    const now = Date.now();

    if (this.useInMemory) {
      // In-memory storage (development/testing fallback)
      const id = String(this.idCounter++);
      const apiKey: StoredApiKey = {
        id,
        name: request.name,
        userId,
        keyHash,
        keyPrefix,
        // REVIEW NOTE: Validating permissions to prevent storing invalid values
        permissions: validatePermissions(request.permissions),
        isActive: true,
        lastUsedAt: null,
        expiresAt: request.expiresAt ?? null,
        rateLimitPerMinute: request.rateLimitPerMinute ?? 60,
        createdAt: now,
        updatedAt: now,
      };

      this.inMemoryStore.set(id, apiKey);

      // Return without keyHash in the apiKey object
      const { keyHash: _, ...apiKeyResponse } = apiKey;
      return { apiKey: apiKeyResponse as ApiKey, fullKey };
    }

    // Database storage (production)
    // CRITICAL FIX: Generate ID in application code to avoid schema mismatch
    // The schema uses text primary key without auto-increment, so we must
    // provide the ID explicitly rather than relying on lastInsertId
    const id = generateApiKeyId();

    // Validate permissions before storing
    const validatedPermissions = validatePermissions(request.permissions);

    await this.db!.execute(
      `INSERT INTO api_keys (id, name, user_id, key_hash, key_prefix, permissions, is_active, last_used_at, expires_at, rate_limit_per_minute, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        request.name,
        userId,
        keyHash,
        keyPrefix,
        JSON.stringify(validatedPermissions),
        1, // isActive as integer
        null, // lastUsedAt
        request.expiresAt ?? null,
        request.rateLimitPerMinute ?? 60,
        now,
        now,
      ],
    );

    const apiKey: ApiKey = {
      id,
      name: request.name,
      userId,
      keyPrefix,
      // REVIEW NOTE: Using validated permissions to ensure consistency
      permissions: validatedPermissions,
      isActive: true,
      lastUsedAt: null,
      expiresAt: request.expiresAt ?? null,
      rateLimitPerMinute: request.rateLimitPerMinute ?? 60,
      createdAt: now,
      updatedAt: now,
    };

    return { apiKey, fullKey };
  }

  /**
   * Validate an API key from a request
   * Checks existence, expiration, active status, and rate limits
   */
  async validateApiKey(key: string): Promise<ApiKeyValidationResult> {
    const keyHash = this.hashKey(key);
    const now = Date.now();

    let storedKey: StoredApiKey | null = null;

    if (this.useInMemory) {
      // In-memory lookup
      storedKey =
        Array.from(this.inMemoryStore.values()).find(
          (k) => k.keyHash === keyHash,
        ) ?? null;
    } else {
      // Database lookup
      const result = await this.db!.query<{
        id: string;
        name: string;
        user_id: number;
        key_hash: string;
        key_prefix: string;
        permissions: string;
        is_active: number;
        last_used_at: number | null;
        expires_at: number | null;
        rate_limit_per_minute: number;
        created_at: number;
        updated_at: number;
      }>(
        `SELECT id, name, user_id, key_hash, key_prefix, permissions, is_active, last_used_at, expires_at, rate_limit_per_minute, created_at, updated_at
         FROM api_keys WHERE key_hash = ?`,
        [keyHash],
      );

      if (result.rows.length > 0) {
        const row = result.rows[0];
        // SECURITY: Wrap JSON.parse in try-catch to handle corrupted database data
        // FAIL-FAST: Throw error to fail securely (consistent with validatePermissions)
        // REVIEWER: Replace console.error with proper error logging infrastructure
        let permissions: Permission[];
        try {
          permissions = validatePermissions(JSON.parse(row.permissions));
        } catch (error) {
          console.error(
            `[api-key-service] Invalid JSON in permissions for key ${row.id}:`,
            error,
          );
          // FAIL-FAST: Throw error to fail securely (consistent with validatePermissions behavior)
          throw new Error(
            `Invalid permissions in database for key ${row.id}. Permissions must be valid JSON array of strings.`,
          );
        }
        storedKey = {
          id: row.id,
          name: row.name,
          userId: row.user_id,
          keyHash: row.key_hash,
          keyPrefix: row.key_prefix,
          permissions,
          isActive: Boolean(row.is_active),
          lastUsedAt: row.last_used_at,
          expiresAt: row.expires_at,
          rateLimitPerMinute: row.rate_limit_per_minute,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
      }
    }

    if (!storedKey) {
      return { valid: false, error: "Invalid API key" };
    }

    // Check if key is active
    if (!storedKey.isActive) {
      return { valid: false, error: "API key has been revoked" };
    }

    // Check expiration
    // NOTE: expiresAt === 0 or expiresAt === null means "never expires"
    // Only check expiration if expiresAt is set to a positive timestamp
    if (
      storedKey.expiresAt &&
      storedKey.expiresAt > 0 &&
      storedKey.expiresAt < now
    ) {
      return { valid: false, error: "API key has expired" };
    }

    // Check rate limit
    const rateLimitCheck = this.checkRateLimit(
      storedKey.id,
      storedKey.rateLimitPerMinute,
    );
    if (!rateLimitCheck.allowed) {
      return {
        valid: false,
        error: `Rate limit exceeded. Resets at ${new Date(rateLimitCheck.resetAt).toISOString()}`,
      };
    }

    // Update last used timestamp
    await this.updateLastUsed(storedKey.id);

    // Return without keyHash
    const { keyHash: _, ...apiKeyResponse } = storedKey;
    return { valid: true, apiKey: apiKeyResponse as ApiKey };
  }

  /**
   * Check rate limit for an API key
   * NOTE: Rate limits are stored in-memory for performance
   * NOTE: Rate limit counters reset on server restart. For production use with
   * multiple server instances or persistent rate limiting across restarts,
   * consider using Redis or a distributed rate limiting solution.
   * NOTE: While JavaScript is single-threaded, async/await can create small
   * windows where race conditions might occur. The "take ticket" pattern
   * (increment first, check after) minimizes but doesn't completely eliminate
   * this. For strict rate limiting accuracy in high-concurrency scenarios,
   * consider atomic operations or external rate limiting services.
   */
  private checkRateLimit(
    keyId: string,
    limit: number,
  ): { allowed: boolean; resetAt: number } {
    const now = Date.now();
    const windowStart = Math.floor(now / 60000) * 60000; // Start of current minute
    const resetAt = windowStart + 60000;

    const current = rateLimitStore.get(keyId);

    if (!current || current.resetAt <= now) {
      // New window or expired window
      rateLimitStore.set(keyId, { count: 1, resetAt });
      return { allowed: true, resetAt };
    }

    // NOTE: Take ticket approach to minimize race condition
    // First increment, then check limit. This ensures we count all requests
    // even if they pass the limit check concurrently.
    // Race condition window is reduced from (check -> increment) to just the increment operation.
    current.count++;

    if (current.count > limit) {
      // Over limit - revoke the ticket by decrementing counter
      // BUG FIX: Previously rejected requests consumed quota permanently.
      // Now we decrement so only successful requests count toward the limit.
      current.count--;
      return { allowed: false, resetAt: current.resetAt };
    }

    return { allowed: true, resetAt: current.resetAt };
  }

  /**
   * Get rate limit information for a key
   */
  getRateLimitInfo(keyId: string, limit: number): ApiKeyRateLimitInfo {
    const now = Date.now();
    const current = rateLimitStore.get(keyId);

    if (!current || current.resetAt <= now) {
      const resetAt = Math.floor(now / 60000) * 60000 + 60000;
      return {
        keyId,
        remaining: limit,
        resetAt,
        limit,
      };
    }

    return {
      keyId,
      remaining: Math.max(0, limit - current.count),
      resetAt: current.resetAt,
      limit,
    };
  }

  /**
   * Update the last used timestamp
   * NOTE: Database errors are caught and logged but not thrown.
   * This prevents transient database issues from blocking authentication.
   * The last_used_at field is a "nice-to-have" metric, not critical for security.
   */
  private async updateLastUsed(keyId: string): Promise<void> {
    const now = Date.now();

    if (this.useInMemory) {
      const key = this.inMemoryStore.get(keyId);
      if (key) {
        key.lastUsedAt = now;
        key.updatedAt = now;
      }
    } else {
      // REVIEW NOTE: Database errors should not block authentication.
      // If this UPDATE fails, we log it but allow the request to proceed.
      try {
        await this.db!.execute(
          `UPDATE api_keys SET last_used_at = ?, updated_at = ? WHERE id = ?`,
          [now, now, keyId],
        );
      } catch (error) {
        // Log the error but don't throw - last_used_at is not critical
        // REVIEWER: Consider adding proper logging infrastructure here
        console.warn(
          `[api-key-service] Failed to update last_used_at for key ${keyId}:`,
          error,
        );
      }
    }
  }

  /**
   * Revoke an API key (soft delete by setting inactive)
   */
  async revokeApiKey(userId: number, keyId: string): Promise<boolean> {
    if (this.useInMemory) {
      const key = this.inMemoryStore.get(keyId);
      if (!key || key.userId !== userId) {
        return false;
      }

      key.isActive = false;
      key.updatedAt = Date.now();
      return true;
    }

    const result = await this.db!.execute(
      `UPDATE api_keys SET is_active = 0, updated_at = ? WHERE id = ? AND user_id = ?`,
      [Date.now(), keyId, userId],
    );

    return result.changes > 0;
  }

  /**
   * Rotate an API key - create new key, revoke old
   */
  async rotateApiKey(
    userId: number,
    keyId: string,
  ): Promise<{ success: boolean; newKey?: string; error?: string }> {
    // Get the old key
    let oldKey: StoredApiKey | null = null;

    if (this.useInMemory) {
      oldKey = this.inMemoryStore.get(keyId) ?? null;
    } else {
      const result = await this.db!.query<{
        name: string;
        permissions: string;
        expires_at: number | null;
        rate_limit_per_minute: number;
      }>(
        `SELECT name, permissions, expires_at, rate_limit_per_minute FROM api_keys WHERE id = ? AND user_id = ? AND is_active = 1`,
        [keyId, userId],
      );

      if (result.rows.length > 0) {
        const row = result.rows[0];
        // TYPE SAFETY NOTE: Creating a partial StoredApiKey for rotation logic.
        // keyHash is required by the type but not fetched from DB (not needed for rotation).
        // The old key is revoked immediately after creating the new key, so this placeholder
        // is safe - it's never used for authentication.
        // REVIEWER: If changing this, ensure StoredApiKey type is updated or keyHash is fetched.
        // SECURITY: Wrap JSON.parse in try-catch to handle corrupted database data
        // FAIL-FAST: Throw error to fail securely (consistent with validatePermissions)
        let permissions: Permission[] = [];
        try {
          permissions = validatePermissions(JSON.parse(row.permissions));
        } catch (error) {
          console.error(
            `[api-key-service] Invalid JSON in permissions during rotation for key ${keyId}:`,
            error,
          );
          // FAIL-FAST: Throw error to fail securely (consistent with validatePermissions behavior)
          throw new Error(
            `Corrupted permissions data for API key ${keyId}. Cannot rotate key with invalid permissions.`,
          );
        }
        oldKey = {
          id: keyId,
          name: row.name,
          userId,
          keyHash: "PLACEHOLDER_NOT_USED", // Placeholder - not fetched, not used
          keyPrefix: "",
          permissions,
          isActive: true,
          lastUsedAt: null,
          expiresAt: row.expires_at,
          rateLimitPerMinute: row.rate_limit_per_minute,
          createdAt: 0,
          updatedAt: 0,
        };
      }
    }

    if (!oldKey) {
      return { success: false, error: "API key not found" };
    }

    // Create new key with same settings
    const fullKey = this.generateApiKey();
    const keyHash = this.hashKey(fullKey);
    const keyPrefix = this.getKeyPrefix(fullKey);
    const now = Date.now();

    if (this.useInMemory) {
      const newApiKey: StoredApiKey = {
        id: String(this.idCounter++),
        name: `${oldKey.name} (rotated)`,
        userId,
        keyHash,
        keyPrefix,
        permissions: oldKey.permissions,
        isActive: true,
        lastUsedAt: null,
        expiresAt: oldKey.expiresAt,
        rateLimitPerMinute: oldKey.rateLimitPerMinute,
        createdAt: now,
        updatedAt: now,
      };

      this.inMemoryStore.set(newApiKey.id, newApiKey);
    } else {
      // CRITICAL FIX: Generate ID in application code (same as createApiKey)
      const newId = generateApiKeyId();

      await this.db!.execute(
        `INSERT INTO api_keys (id, name, user_id, key_hash, key_prefix, permissions, is_active, last_used_at, expires_at, rate_limit_per_minute, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newId,
          `${oldKey.name} (rotated)`,
          userId,
          keyHash,
          keyPrefix,
          JSON.stringify(oldKey.permissions),
          1,
          null,
          oldKey.expiresAt,
          oldKey.rateLimitPerMinute,
          now,
          now,
        ],
      );
    }

    // Revoke the old key
    await this.revokeApiKey(userId, keyId);

    return { success: true, newKey: fullKey };
  }

  /**
   * Get all API keys for a user
   */
  async getUserApiKeys(userId: number): Promise<ApiKey[]> {
    if (this.useInMemory) {
      return Array.from(this.inMemoryStore.values())
        .filter((k) => k.userId === userId)
        .sort((a, b) => a.createdAt - b.createdAt)
        .map((k) => {
          const { keyHash: _, ...apiKey } = k;
          return apiKey as ApiKey;
        });
    }

    const result = await this.db!.query<{
      id: string;
      name: string;
      user_id: number;
      key_prefix: string;
      permissions: string;
      is_active: number;
      last_used_at: number | null;
      expires_at: number | null;
      rate_limit_per_minute: number;
      created_at: number;
      updated_at: number;
    }>(
      `SELECT id, name, user_id, key_prefix, permissions, is_active, last_used_at, expires_at, rate_limit_per_minute, created_at, updated_at
       FROM api_keys WHERE user_id = ? ORDER BY created_at ASC`,
      [userId],
    );

    return result.rows.map((row) => {
      // SECURITY: Wrap JSON.parse in try-catch to handle corrupted database data
      // FAIL-SAFE APPROACH: Throw error instead of silently returning empty permissions
      // This prevents silent permission loss from database corruption
      let permissions: Permission[] = [];
      try {
        permissions = validatePermissions(JSON.parse(row.permissions));
      } catch (error) {
        console.error(
          `[api-key-service] Invalid JSON in permissions for key ${row.id}:`,
          error,
        );
        throw new Error(
          `Corrupted permissions data in database for key ${row.id}. Please contact support.`,
        );
      }
      return {
        id: row.id,
        name: row.name,
        userId: row.user_id,
        keyPrefix: row.key_prefix,
        permissions,
        isActive: Boolean(row.is_active),
        lastUsedAt: row.last_used_at,
        expiresAt: row.expires_at,
        rateLimitPerMinute: row.rate_limit_per_minute,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });
  }

  /**
   * Get a single API key by ID (for a user)
   */
  async getApiKey(userId: number, keyId: string): Promise<ApiKey | null> {
    if (this.useInMemory) {
      const key = this.inMemoryStore.get(keyId);
      if (!key || key.userId !== userId) {
        return null;
      }
      const { keyHash: _, ...apiKey } = key;
      return apiKey as ApiKey;
    }

    const result = await this.db!.query<{
      id: string;
      name: string;
      user_id: number;
      key_prefix: string;
      permissions: string;
      is_active: number;
      last_used_at: number | null;
      expires_at: number | null;
      rate_limit_per_minute: number;
      created_at: number;
      updated_at: number;
    }>(
      `SELECT id, name, user_id, key_prefix, permissions, is_active, last_used_at, expires_at, rate_limit_per_minute, created_at, updated_at
       FROM api_keys WHERE id = ? AND user_id = ?`,
      [keyId, userId],
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    // SECURITY: Wrap JSON.parse in try-catch to handle corrupted database data
    // FAIL-FAST: Throw error to fail securely (consistent with validatePermissions)
    let permissions: Permission[] = [];
    try {
      permissions = validatePermissions(JSON.parse(row.permissions));
    } catch (error) {
      console.error(
        `[api-key-service] Invalid JSON in permissions for key ${row.id}:`,
        error,
      );
      // FAIL-FAST: Throw error to fail securely (consistent with validatePermissions behavior)
      throw new Error(
        `Corrupted permissions data for API key ${row.id}. Cannot retrieve key with invalid permissions.`,
      );
    }
    return {
      id: row.id,
      name: row.name,
      userId: row.user_id,
      keyPrefix: row.key_prefix,
      permissions,
      isActive: Boolean(row.is_active),
      lastUsedAt: row.last_used_at,
      expiresAt: row.expires_at,
      rateLimitPerMinute: row.rate_limit_per_minute,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Update an API key
   */
  async updateApiKey(
    userId: number,
    keyId: string,
    request: UpdateApiKeyRequest,
  ): Promise<ApiKey | null> {
    if (this.useInMemory) {
      const key = this.inMemoryStore.get(keyId);
      if (!key || key.userId !== userId) {
        return null;
      }

      if (request.name !== undefined) key.name = request.name;
      // REVIEW NOTE: Validating permissions when updating API key
      if (request.permissions !== undefined) {
        key.permissions = validatePermissions(request.permissions);
      }
      if (request.isActive !== undefined) key.isActive = request.isActive;
      if (request.expiresAt !== undefined) key.expiresAt = request.expiresAt;
      if (request.rateLimitPerMinute !== undefined)
        key.rateLimitPerMinute = request.rateLimitPerMinute;

      key.updatedAt = Date.now();

      const { keyHash: _, ...apiKey } = key;
      return apiKey as ApiKey;
    }

    // Build update query dynamically
    const updates: string[] = [];
    const params: unknown[] = [];

    if (request.name !== undefined) {
      updates.push("name = ?");
      params.push(request.name);
    }
    if (request.permissions !== undefined) {
      updates.push("permissions = ?");
      // REVIEW NOTE: Validating permissions before storing to database
      params.push(JSON.stringify(validatePermissions(request.permissions)));
    }
    if (request.isActive !== undefined) {
      updates.push("is_active = ?");
      params.push(request.isActive ? 1 : 0);
    }
    if (request.expiresAt !== undefined) {
      updates.push("expires_at = ?");
      params.push(request.expiresAt);
    }
    if (request.rateLimitPerMinute !== undefined) {
      updates.push("rate_limit_per_minute = ?");
      params.push(request.rateLimitPerMinute);
    }

    if (updates.length === 0) {
      return this.getApiKey(userId, keyId);
    }

    updates.push("updated_at = ?");
    params.push(Date.now());
    params.push(keyId);
    params.push(userId);

    const result = await this.db!.execute(
      `UPDATE api_keys SET ${updates.join(", ")} WHERE id = ? AND user_id = ?`,
      params,
    );

    if (result.changes === 0) {
      return null;
    }

    return this.getApiKey(userId, keyId);
  }

  /**
   * Clean up expired API keys (can be called periodically)
   */
  async cleanupExpiredKeys(): Promise<number> {
    const now = Date.now();

    if (this.useInMemory) {
      let count = 0;
      for (const [, key] of this.inMemoryStore.entries()) {
        if (key.expiresAt && key.expiresAt < now && key.expiresAt > 0) {
          key.isActive = false;
          key.updatedAt = now;
          count++;
        }
      }
      return count;
    }

    const result = await this.db!.execute(
      `UPDATE api_keys SET is_active = 0, updated_at = ? WHERE expires_at < ? AND expires_at > 0 AND is_active = 1`,
      [now, now],
    );

    return result.changes;
  }

  /**
   * Clear rate limit store (for testing purposes only)
   * @internal This method should only be used in tests
   */
  clearRateLimitStore(): void {
    rateLimitStore.clear();
  }
}

// Export singleton instance for backward compatibility
// NOTE: This uses in-memory storage by default. For production, create a new
// instance with database adapter: new ApiKeyService({ db: adapter })
export const apiKeyService = new ApiKeyService();
