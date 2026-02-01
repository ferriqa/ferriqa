/**
 * @ferriqa/core - Test Fixtures
 *
 * Shared test fixtures for cross-runtime testing.
 * Provides reusable test data and objects.
 */

import type { RuntimeInfo } from "../runtime.ts";
import type { RuntimeCapabilities } from "../capabilities.ts";

/**
 * Mock runtime information for testing
 */
export const mockRuntimeInfo: RuntimeInfo = {
  name: "bun",
  version: "1.1.40",
};

/**
 * Mock capabilities for testing
 */
export const mockRuntimeCapabilities: RuntimeCapabilities = {
  // Core JavaScript features
  asyncAwait: true,
  promises: true,
  generators: true,
  asyncGenerators: true,

  // Web Platform APIs
  fetch: true,
  webCrypto: true,
  webStreams: true,
  webSockets: true,
  abortController: true,

  // File System
  fileSystem: {
    read: true,
    write: true,
    watch: true,
    glob: true,
  },

  // Networking
  http: true,
  https: true,
  http2: false,
  tcp: true,
  udp: true,

  // Process/System
  childProcess: true,
  workerThreads: true,
  cluster: false,
  osInfo: true,
  envVars: true,

  // Data formats
  json: true,
  base64: true,
  blob: true,
  formData: true,

  // Timing
  setTimeout: true,
  setInterval: true,
  performance: true,

  // Console/Debugging
  console: true,
  inspector: true,

  // Module system
  esm: true,
  cjs: true,
  dynamicImport: true,
  importMeta: true,

  // Testing (built-in)
  testRunner: true,

  // SQLite support
  sqlite: true,

  // Package management
  packageManager: "bun",
};

/**
 * Mock environment variables
 */
export const mockEnvironmentVars = {
  FERRIQA_ERROR_LOGGING_ENABLED: "true",
  FERRIQA_ERROR_LOG_LEVEL: "error",
  FERRIQA_ERROR_CONSOLE_OUTPUT: "true",
  FERRIQA_ERROR_CONSOLE_PRETTY: "true",
  FERRIQA_ERROR_FILE_ENABLED: "false",
  NODE_ENV: "test",
};

/**
 * Sample error messages for testing
 */
export const sampleErrorMessages = {
  connection: "Failed to connect to database",
  query: "Query execution failed",
  validation: "Invalid input provided",
  notFound: "Record not found",
  timeout: "Operation timed out",
  unique: "Unique constraint violation",
  auth: "Unauthorized access",
  runtime: "Unsupported runtime environment",
};

/**
 * Sample error codes for testing
 */
export const sampleErrorCodes = {
  connection: "DB_CONNECTION_FAILED",
  query: "DB_QUERY_FAILED",
  validation: "VALIDATION_INVALID_INPUT",
  notFound: "DB_RECORD_NOT_FOUND",
  timeout: "DB_TIMEOUT",
  unique: "DB_UNIQUE_VIOLATION",
  auth: "AUTH_UNAUTHORIZED",
  runtime: "RUNTIME_UNSUPPORTED",
};

/**
 * Sample database configuration
 */
export const mockDatabaseConfig = {
  path: ":memory:",
  walMode: true,
  foreignKeys: true,
  busyTimeout: 5000,
};

/**
 * Sample user data
 */
export const mockUsers = [
  {
    id: 1,
    email: "test@example.com",
    passwordHash: "hashed_password_123",
    role: "admin",
    permissions: ["read", "write", "delete"],
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  },
  {
    id: 2,
    email: "user@example.com",
    passwordHash: "hashed_password_456",
    role: "viewer",
    permissions: ["read"],
    createdAt: new Date("2026-01-02"),
    updatedAt: new Date("2026-01-02"),
  },
];

/**
 * Sample blueprint data
 */
export const mockBlueprints = [
  {
    id: 1,
    name: "Article",
    slug: "article",
    fields: [
      { name: "title", type: "text", required: true },
      { name: "content", type: "rich-text", required: true },
      { name: "author", type: "reference", required: false },
    ],
    settings: {
      enableVersions: true,
      enableDrafts: true,
      slugField: "title",
    },
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  },
  {
    id: 2,
    name: "Category",
    slug: "category",
    fields: [
      { name: "name", type: "text", required: true },
      { name: "description", type: "text", required: false },
    ],
    settings: {
      enableVersions: false,
      enableDrafts: false,
      slugField: "name",
    },
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  },
];

/**
 * Sample content data
 */
export const mockContents = [
  {
    id: 1,
    blueprintId: 1,
    slug: "getting-started",
    data: {
      title: "Getting Started",
      content: "Welcome to Ferriqa...",
      author: 1,
    },
    meta: {
      seoTitle: "Getting Started with Ferriqa",
      seoDescription: "Learn how to use Ferriqa",
    },
    status: "published",
    createdBy: 1,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-02"),
  },
  {
    id: 2,
    blueprintId: 1,
    slug: "advanced-features",
    data: {
      title: "Advanced Features",
      content: "Deep dive into Ferriqa...",
      author: 1,
    },
    meta: {
      seoTitle: "Advanced Ferriqa Features",
      seoDescription: "Explore advanced capabilities",
    },
    status: "draft",
    createdBy: 1,
    createdAt: new Date("2026-01-03"),
    updatedAt: new Date("2026-01-03"),
  },
];

/**
 * Sample migration data
 */
export const mockMigrations = [
  {
    id: "001-create-users-table",
    name: "Create users table",
    up: async () => {
      // Migration up function
    },
    down: async () => {
      // Migration down function
    },
    timestamp: 1704067200000,
  },
  {
    id: "002-create-blueprints-table",
    name: "Create blueprints table",
    up: async () => {
      // Migration up function
    },
    down: async () => {
      // Migration down function
    },
    timestamp: 1704153600000,
  },
];

/**
 * Sample webhook data
 */
export const mockWebhooks = [
  {
    id: 1,
    name: "Content Created Webhook",
    url: "https://example.com/webhooks/content-created",
    events: ["content:afterCreate"],
    headers: {
      "X-API-Key": "test-api-key",
    },
    secret: "webhook-secret-123",
    isActive: true,
    createdAt: new Date("2026-01-01"),
  },
];

/**
 * Fixture utilities
 */

/**
 * Create a deep copy of a fixture
 */
export function cloneFixture<T>(fixture: T): T {
  return JSON.parse(JSON.stringify(fixture));
}

/**
 * Create a modified copy of a fixture
 */
export function modifyFixture<T>(fixture: T, modifications: Partial<T>): T {
  return { ...cloneFixture(fixture), ...modifications };
}

/**
 * Generate unique IDs for test data
 */
export function generateTestId(): number {
  return Math.floor(Math.random() * 1000000) + 1;
}

/**
 * Generate unique slugs for test data
 */
export function generateTestSlug(prefix = "test"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Create temporary test directory path
 */
export function createTempPath(filename: string): string {
  return `/tmp/ferriqa-test-${Date.now()}/${filename}`;
}
