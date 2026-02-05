/**
 * @ferriqa/api - Webhook Service Singleton
 *
 * Singleton instance of WebhookService for API handlers
 * Uses in-memory database for development. For production, initialize with a real database adapter.
 */

import { WebhookService } from "@ferriqa/core/webhooks";
import { hooks } from "@ferriqa/core/hooks";
import { db } from "./db";

/**
 * Singleton WebhookService instance
 * Uses centralized database adapter from ./db
 */
export const webhookService = new WebhookService({
  db,
  hookRegistry: hooks,
});

/**
 * Cleanup webhook service (call during application shutdown)
 * Stops the queue processor and releases resources
 */
export function cleanupWebhookService(): void {
  webhookService.destroy();
}

/**
 * Register shutdown handlers for cleanup
 */
if (typeof process !== "undefined" && process.on) {
  const shutdown = (signal: string) => {
    console.log(`\n[webhook] Received ${signal}, cleaning up...`);
    cleanupWebhookService();
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}
