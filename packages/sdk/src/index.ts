/**
 * @ferriqa/sdk - SDK Entry Point
 *
 * Ferriqa SDK - Type-safe API client for Ferriqa Headless CMS
 *
 * @example
 * ```typescript
 * import { FerriqaClient } from '@ferriqa/sdk';
 *
 * const client = new FerriqaClient({
 *   baseUrl: 'http://localhost:3000',
 *   apiKey: 'your-api-key'
 * });
 *
 * // List posts
 * const posts = await client.contents('posts').list();
 *
 * // Create a new post
 * const post = await client.contents('posts').create({
 *   slug: 'hello-world',
 *   data: {
 *     title: 'Hello World',
 *     content: 'My first post!'
 *   }
 * });
 * ```
 */

// Main SDK Client
export { FerriqaClient } from "./client/index.ts";

// HTTP Client and Errors
export { HTTPClient, SDKRequestError } from "./client/http.ts";

// Authentication
export { AuthClient } from "./auth/index.ts";

// Content Operations
export { ContentClient } from "./client/content.ts";

// Blueprint Operations
export { BlueprintClient } from "./client/blueprint.ts";

// Media Operations
export { MediaClient } from "./client/media.ts";

// All Types
export type {
  SDKConfig,
  RequestOptions,
  SDKResponse,
  SDKError,
  PaginationParams,
  PaginatedResponse,
  ContentItem,
  CreateContentRequest,
  UpdateContentRequest,
  Blueprint,
  BlueprintField,
  AuthTokens,
  LoginCredentials,
  User,
  Webhook,
  MediaFile,
} from "./types/index.ts";

// Default export
export { FerriqaClient as default } from "./client/index.ts";
