/**
 * Content Service
 *
 * Main content management service with CRUD operations
 * Based on roadmap 2.2 - Content API Service
 */

import type { DatabaseAdapter } from "../../../adapters-db/src/types.ts";
import type { Blueprint } from "../blueprint/types.ts";
import type { ValidationEngine } from "../validation/engine.ts";
import type { SlugManager } from "../slug/manager.ts";
import type { IHookRegistry } from "../hooks/types.ts";
import type {
  Content,
  ContentQuery,
  PaginatedResult,
  CreateContentInput,
  UpdateContentInput,
} from "./types.ts";
import { ContentQueryBuilder } from "./query-builder.ts";
import { ValidationException } from "../validation/engine.ts";

export interface ContentServiceOptions {
  db: DatabaseAdapter;
  validationEngine: ValidationEngine;
  slugManager: SlugManager;
  hookRegistry: IHookRegistry;
}

/**
 * Parse timestamp value from database
 * REVIEW: Handles both number and string returns from SQLite (driver-dependent)
 * Some SQLite drivers return timestamps as strings, others as numbers
 */
function parseTimestamp(value: unknown): Date {
  if (value === null || value === undefined) {
    throw new Error(`Cannot parse null/undefined timestamp`);
  }
  // Handle both number and string timestamps from SQLite
  if (typeof value === "number") {
    return new Date(value);
  }
  if (typeof value === "string") {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
      throw new Error(`Invalid timestamp string: ${value}`);
    }
    return new Date(parsed);
  }
  throw new Error(`Invalid timestamp type: ${typeof value}`);
}

export class ContentService {
  private queryBuilder: ContentQueryBuilder;

  constructor(private options: ContentServiceOptions) {
    this.queryBuilder = new ContentQueryBuilder(options.db);
  }

  /**
   * Create new content
   */
  async create(
    blueprintId: string,
    input: CreateContentInput,
    userId?: string,
  ): Promise<Content> {
    // Get blueprint
    const blueprint = await this.getBlueprint(blueprintId);

    // Pre-create hook
    await this.options.hookRegistry.emit("content:beforeCreate", {
      blueprint,
      data: input.data,
      userId,
    });

    // Validate content
    const validation = await this.options.validationEngine.validateContent(
      blueprint,
      input.data,
      "create",
    );

    if (!validation.valid) {
      throw new ValidationException(validation.errors);
    }

    // Generate slug if not provided
    let slug = input.slug;
    if (!slug) {
      const slugSource =
        validation.sanitized[blueprint.settings.slugField || "title"];
      if (slugSource) {
        slug = await this.options.slugManager.generate(
          blueprintId,
          String(slugSource),
        );
      } else {
        // Generate a random slug if no source
        slug = `content-${Date.now()}`;
      }
    } else {
      // Validate provided slug is unique
      const exists = await this.options.slugManager.exists(blueprintId, slug);
      if (exists) {
        throw new ValidationException([
          { field: "slug", message: "Slug already exists" },
        ]);
      }
    }

    // Determine status
    const status = input.status || blueprint.settings.defaultStatus;

    // Insert content
    const now = Date.now();
    const result = await this.options.db.execute(
      `INSERT INTO contents (blueprint_id, slug, status, data, meta, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        blueprintId,
        slug,
        status,
        JSON.stringify(validation.sanitized),
        input.meta ? JSON.stringify(input.meta) : null,
        userId || null,
        now,
        now,
      ],
    );

    const contentId = String(result.lastInsertId);

    // Create initial version if versioning is enabled
    if (blueprint.settings.versioning) {
      await this.createVersion(
        contentId,
        blueprintId,
        validation.sanitized,
        1,
        userId,
        "Initial version",
      );
    }

    // Fetch the created content
    const content = await this.getById(contentId);
    if (!content) {
      throw new Error("Failed to create content");
    }

    // Post-create hook
    await this.options.hookRegistry.emit("content:afterCreate", {
      content,
      blueprint,
      userId,
    });

    return content;
  }

  /**
   * Update existing content
   */
  async update(
    contentId: string,
    input: UpdateContentInput,
    userId?: string,
  ): Promise<Content> {
    // Get existing content
    const content = await this.getById(contentId);
    if (!content) {
      throw new Error("Content not found");
    }

    const blueprint = await this.getBlueprint(content.blueprintId);

    // Pre-update hook
    await this.options.hookRegistry.emit("content:beforeUpdate", {
      content,
      blueprint,
      data: input.data || {},
      userId,
    });

    // Merge data
    const mergedData = input.data
      ? { ...content.data, ...input.data }
      : content.data;

    // Validate merged content
    const validation = await this.options.validationEngine.validateContent(
      blueprint,
      mergedData,
      "update",
    );

    if (!validation.valid) {
      throw new ValidationException(validation.errors);
    }

    // Check if slug needs to be updated
    let slug = content.slug;
    if (input.slug) {
      // User provided new slug
      const exists = await this.options.slugManager.exists(
        content.blueprintId,
        input.slug,
        contentId,
      );
      if (exists) {
        throw new ValidationException([
          { field: "slug", message: "Slug already exists" },
        ]);
      }
      slug = input.slug;
    } else if (
      blueprint.settings.slugField &&
      input.data?.[blueprint.settings.slugField] !==
        content.data[blueprint.settings.slugField]
    ) {
      // Source field changed, regenerate slug
      const slugSource = validation.sanitized[blueprint.settings.slugField];
      if (slugSource) {
        slug = await this.options.slugManager.generate(
          content.blueprintId,
          String(slugSource),
          contentId,
        );
      }
    }

    // Update status if provided
    const status = input.status || content.status;

    // Execute update
    const now = Date.now();
    await this.options.db.execute(
      `UPDATE contents 
       SET slug = ?, status = ?, data = ?, meta = ?, updated_at = ?
       WHERE id = ?`,
      [
        slug,
        status,
        JSON.stringify(validation.sanitized),
        input.meta ? JSON.stringify(input.meta) : null,
        now,
        contentId,
      ],
    );

    // Create new version if versioning is enabled
    if (blueprint.settings.versioning) {
      const latestVersion = await this.getLatestVersion(contentId);
      const changeSummary = this.generateChangeSummary(
        content.data,
        validation.sanitized,
      );
      await this.createVersion(
        contentId,
        content.blueprintId,
        validation.sanitized,
        (latestVersion?.versionNumber || 0) + 1,
        userId,
        changeSummary,
      );
    }

    // Fetch updated content
    const updated = await this.getById(contentId);
    if (!updated) {
      throw new Error("Failed to update content");
    }

    // Post-update hook
    await this.options.hookRegistry.emit("content:afterUpdate", {
      content: updated,
      blueprint,
      userId,
    });

    return updated;
  }

  /**
   * Delete content
   */
  async delete(contentId: string, userId?: string): Promise<void> {
    // Get content
    const content = await this.getById(contentId);
    if (!content) {
      throw new Error("Content not found");
    }

    const blueprint = await this.getBlueprint(content.blueprintId);

    // Pre-delete hook
    await this.options.hookRegistry.emit("content:beforeDelete", {
      content,
      blueprint,
      userId,
    });

    // Delete content (versions will cascade due to foreign key)
    await this.options.db.execute("DELETE FROM contents WHERE id = ?", [
      contentId,
    ]);

    // Post-delete hook
    await this.options.hookRegistry.emit("content:afterDelete", {
      content,
      blueprint,
      userId,
    });
  }

  /**
   * Get content by ID
   */
  async getById(id: string): Promise<Content | null> {
    return this.queryBuilder.getById(id);
  }

  /**
   * Get content by slug within a blueprint
   */
  async getBySlug(blueprintId: string, slug: string): Promise<Content | null> {
    return this.queryBuilder.getBySlug(blueprintId, slug);
  }

  /**
   * Query contents with filters and pagination
   */
  async query(options: ContentQuery): Promise<PaginatedResult<Content>> {
    return this.queryBuilder.query(options);
  }

  /**
   * Publish content
   * REVIEW: Publish allows both "draft" and "archived" content to be published
   * This is intentional - archived content can be re-published
   */
  async publish(contentId: string, userId?: string): Promise<Content> {
    const content = await this.getById(contentId);
    if (!content) {
      throw new Error("Content not found");
    }

    if (content.status === "published") {
      throw new Error("Content is already published");
    }

    // Publish hook
    await this.options.hookRegistry.emit("content:beforePublish", {
      content,
      userId,
    });

    const now = Date.now();
    await this.options.db.execute(
      `UPDATE contents 
       SET status = ?, published_at = ?, published_by = ?, updated_at = ?
       WHERE id = ?`,
      ["published", now, userId || null, now, contentId],
    );

    // Fetch updated content
    const published = await this.getById(contentId);
    if (!published) {
      throw new Error("Failed to publish content");
    }

    // Post-publish hook
    await this.options.hookRegistry.emit("content:afterPublish", {
      content: published,
      userId,
    });

    return published;
  }

  /**
   * Unpublish content
   */
  async unpublish(contentId: string, userId?: string): Promise<Content> {
    const content = await this.getById(contentId);
    if (!content) {
      throw new Error("Content not found");
    }

    // REVIEW: Added guard to ensure only published content can be unpublished
    if (content.status !== "published") {
      throw new Error("Only published content can be unpublished");
    }

    // Unpublish hook
    await this.options.hookRegistry.emit("content:beforeUnpublish", {
      content,
      userId,
    });

    const now = Date.now();
    await this.options.db.execute(
      `UPDATE contents 
       SET status = ?, published_at = NULL, published_by = NULL, updated_at = ?
       WHERE id = ?`,
      ["draft", now, contentId],
    );

    // Fetch updated content
    const unpublished = await this.getById(contentId);
    if (!unpublished) {
      throw new Error("Failed to unpublish content");
    }

    // Post-unpublish hook
    await this.options.hookRegistry.emit("content:afterUnpublish", {
      content: unpublished,
      userId,
    });

    return unpublished;
  }

  /**
   * Rollback content to a specific version
   */
  async rollback(
    contentId: string,
    versionId: string,
    userId?: string,
  ): Promise<Content> {
    const content = await this.getById(contentId);
    if (!content) {
      throw new Error("Content not found");
    }

    const version = await this.getVersionById(versionId);
    if (!version) {
      throw new Error("Version not found");
    }

    if (version.contentId !== contentId) {
      throw new Error("Version does not belong to this content");
    }

    const blueprint = await this.getBlueprint(content.blueprintId);

    // Validate the old data against current blueprint
    const validation = await this.options.validationEngine.validateContent(
      blueprint,
      version.data,
      "update",
    );

    if (!validation.valid) {
      throw new ValidationException(validation.errors);
    }

    // Update content with version data
    const now = Date.now();
    await this.options.db.execute(
      `UPDATE contents 
       SET data = ?, updated_at = ?
       WHERE id = ?`,
      [JSON.stringify(version.data), now, contentId],
    );

    // Create new version from rollback (preserves history chain)
    if (blueprint.settings.versioning) {
      const latestVersion = await this.getLatestVersion(contentId);
      await this.createVersion(
        contentId,
        content.blueprintId,
        version.data,
        (latestVersion?.versionNumber || 0) + 1,
        userId,
        `Rolled back to version ${version.versionNumber}`,
      );
    }

    // Fetch updated content
    return (await this.getById(contentId))!;
  }

  /**
   * Get version by ID
   */
  async getVersionById(versionId: string): Promise<{
    id: string;
    contentId: string;
    blueprintId: string;
    data: Record<string, unknown>;
    versionNumber: number;
    createdBy?: string;
    changeSummary?: string;
    createdAt: Date;
  } | null> {
    const result = await this.options.db.query(
      `SELECT 
        id,
        content_id as contentId,
        blueprint_id as blueprintId,
        data,
        version_number as versionNumber,
        created_by as createdBy,
        change_summary as changeSummary,
        created_at as createdAt
      FROM versions 
      WHERE id = ?`,
      [versionId],
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0] as Record<string, unknown>;
    return {
      id: String(row.id),
      contentId: String(row.contentId),
      blueprintId: String(row.blueprintId),
      data:
        typeof row.data === "string"
          ? JSON.parse(row.data)
          : (row.data as Record<string, unknown>),
      versionNumber: row.versionNumber as number,
      createdBy: row.createdBy ? String(row.createdBy) : undefined,
      changeSummary: row.changeSummary ? String(row.changeSummary) : undefined,
      // FIXED: Use parseTimestamp to handle both number and string returns from SQLite
      createdAt: parseTimestamp(row.createdAt),
    };
  }

  /**
   * Get all versions for content
   */
  async getVersions(contentId: string): Promise<
    Array<{
      id: string;
      versionNumber: number;
      createdBy?: string;
      changeSummary?: string;
      createdAt: Date;
    }>
  > {
    const result = await this.options.db.query(
      `SELECT 
        id,
        version_number as versionNumber,
        created_by as createdBy,
        change_summary as changeSummary,
        created_at as createdAt
      FROM versions 
      WHERE content_id = ?
      ORDER BY version_number DESC`,
      [contentId],
    );

    return result.rows.map((row) => {
      const typedRow = row as Record<string, unknown>;
      return {
        id: String(typedRow.id),
        versionNumber: typedRow.versionNumber as number,
        createdBy: typedRow.createdBy ? String(typedRow.createdBy) : undefined,
        changeSummary: typedRow.changeSummary
          ? String(typedRow.changeSummary)
          : undefined,
        // FIXED: Use parseTimestamp to handle both number and string returns
        createdAt: parseTimestamp(typedRow.createdAt),
      };
    });
  }

  // ========== Private Helpers ==========

  private async getBlueprint(blueprintId: string): Promise<Blueprint> {
    const result = await this.options.db.query(
      `SELECT id, name, slug, fields, settings, created_at as createdAt, updated_at as updatedAt
       FROM blueprints WHERE id = ?`,
      [blueprintId],
    );

    if (result.rows.length === 0) {
      throw new Error(`Blueprint not found: ${blueprintId}`);
    }

    const row = result.rows[0] as Record<string, unknown>;
    return {
      id: String(row.id),
      name: String(row.name),
      slug: String(row.slug),
      fields:
        typeof row.fields === "string"
          ? JSON.parse(row.fields)
          : (row.fields as Blueprint["fields"]),
      settings:
        typeof row.settings === "string"
          ? JSON.parse(row.settings)
          : (row.settings as Blueprint["settings"]),
      // FIXED: Use parseTimestamp for consistent timestamp handling
      createdAt: parseTimestamp(row.createdAt),
      updatedAt: parseTimestamp(row.updatedAt),
    };
  }

  private async createVersion(
    contentId: string,
    blueprintId: string,
    data: Record<string, unknown>,
    versionNumber: number,
    userId?: string,
    changeSummary?: string,
  ): Promise<string> {
    const result = await this.options.db.execute(
      `INSERT INTO versions (content_id, blueprint_id, data, version_number, created_by, change_summary, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        contentId,
        blueprintId,
        JSON.stringify(data),
        versionNumber,
        userId || null,
        changeSummary || null,
        Date.now(),
      ],
    );

    return String(result.lastInsertId);
  }

  private async getLatestVersion(
    contentId: string,
  ): Promise<{ id: string; versionNumber: number } | null> {
    const result = await this.options.db.query(
      `SELECT id, version_number as versionNumber
       FROM versions 
       WHERE content_id = ?
       ORDER BY version_number DESC
       LIMIT 1`,
      [contentId],
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0] as Record<string, unknown>;
    return {
      id: String(row.id),
      versionNumber: row.versionNumber as number,
    };
  }

  private generateChangeSummary(
    oldData: Record<string, unknown>,
    newData: Record<string, unknown>,
  ): string {
    const changes: string[] = [];
    const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);

    for (const key of allKeys) {
      const oldValue = oldData[key];
      const newValue = newData[key];

      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        if (!(key in oldData)) {
          changes.push(`Added ${key}`);
        } else if (!(key in newData)) {
          changes.push(`Removed ${key}`);
        } else {
          changes.push(`Modified ${key}`);
        }
      }
    }

    return changes.join(", ") || "No changes detected";
  }
}

// Export error class for consumers
export { ValidationException } from "../validation/engine.ts";
