/**
 * @ferriqa/api/handlers/validators - Common Validators
 *
 * Shared validation helpers for API handlers
 */

import { HTTPException } from "hono/http-exception";

/**
 * Validate and parse webhook ID from request parameter
 * Ensures the ID is a valid integer string before parsing
 *
 * @param id - The ID string from request parameters
 * @returns Parsed webhook ID as number
 * @throws HTTPException 400 if ID is invalid
 */
export function validateWebhookId(id: string): number {
  if (!/^\d+$/.test(id)) {
    throw new HTTPException(400, { message: "Invalid webhook ID" });
  }
  return parseInt(id, 10);
}
