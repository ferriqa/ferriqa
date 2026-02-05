/**
 * @ferriqa/api - Content Service Singleton
 *
 * Singleton instance of ContentService for API handlers
 */

import { ContentService } from "@ferriqa/core/content";
import { ValidationEngine } from "@ferriqa/core/validation";
import { globalFieldRegistry } from "@ferriqa/core/fields";
import { SlugManager } from "@ferriqa/core/slug";
import { hooks } from "@ferriqa/core/hooks";
import { db } from "./db";

/**
 * Initialize dependencies
 */
const validationEngine = new ValidationEngine(globalFieldRegistry);
const slugManager = new SlugManager(db);

/**
 * Singleton ContentService instance
 */
export const contentService = new ContentService({
    db,
    validationEngine,
    slugManager,
    hookRegistry: hooks,
});
