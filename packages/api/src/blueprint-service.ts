/**
 * @ferriqa/api - Blueprint Service Singleton
 *
 * Singleton instance of BlueprintService for API handlers
 */

import { BlueprintService } from "@ferriqa/core/blueprint";
import { db } from "./db";

/**
 * Singleton BlueprintService instance
 */
export const blueprintService = new BlueprintService({ db });
