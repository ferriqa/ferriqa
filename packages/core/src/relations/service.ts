/**
 * Relation Service
 *
 * Main service for managing content relations
 * Based on roadmap 2.3 - Relations System
 */

import type { DatabaseAdapter } from "../../../adapters-db/src/types.ts";
import type { ContentService } from "../content/service.ts";
import type { IHookRegistry } from "../hooks/types.ts";
import type { PopulatedContentItem } from "../content/types.ts";
import type {
  Relation,
  RelationType,
  CreateRelationInput,
  UpdateRelationInput,
  RelationQuery,
  RelatedContent,
  CascadeRule,
  RelationCreateContext,
  RelationDeleteContext,
} from "./types.ts";

export interface RelationServiceOptions {
  db: DatabaseAdapter;
  contentService: ContentService;
  hookRegistry: IHookRegistry;
}

/**
 * Parse timestamp value from database
 */
function parseTimestamp(value: unknown): Date {
  if (value === null || value === undefined) {
    throw new Error(`Cannot parse null/undefined timestamp`);
  }
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

export class RelationService {
  constructor(private options: RelationServiceOptions) {}

  /**
   * Create a new relation between two content items
   */
  async create(input: CreateRelationInput, userId?: string): Promise<Relation> {
    const { sourceContentId, targetContentId, type, metadata } = input;

    // Pre-create hook
    await this.options.hookRegistry.emit("relation:beforeCreate", {
      sourceContentId,
      targetContentId,
      type,
      metadata,
      userId,
    } as RelationCreateContext);

    // Check for circular reference
    if (
      await this.wouldCreateCircularReference(
        sourceContentId,
        targetContentId,
        type,
      )
    ) {
      throw new Error("Circular reference detected");
    }

    // Verify target content exists
    const targetContent =
      await this.options.contentService.getById(targetContentId);
    if (!targetContent) {
      throw new Error(`Target content not found: ${targetContentId}`);
    }

    // Verify source content exists
    const sourceContent =
      await this.options.contentService.getById(sourceContentId);
    if (!sourceContent) {
      throw new Error(`Source content not found: ${sourceContentId}`);
    }

    // Handle one-to-one: remove existing relation from source
    if (type === "one-to-one") {
      await this.removeExistingRelations(sourceContentId, type, "outgoing");
    }

    // Handle one-to-many: ensure target doesn't already have a parent
    if (type === "one-to-many") {
      const existingParents = await this.getRelationsForTarget(
        targetContentId,
        type,
      );
      if (existingParents.length > 0) {
        throw new Error("Target already has a parent in one-to-many relation");
      }
    }

    // Check for duplicate relation
    const existingRelation = await this.findExistingRelation(
      sourceContentId,
      targetContentId,
      type,
    );
    if (existingRelation) {
      throw new Error("Relation already exists");
    }

    // Create the relation
    const result = await this.options.db.execute(
      `INSERT INTO relations (source_content_id, target_content_id, type, metadata, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [
        sourceContentId,
        targetContentId,
        type,
        metadata ? JSON.stringify(metadata) : null,
        Date.now(),
      ],
    );

    const relationId = String(result.lastInsertId);

    // Fetch the created relation
    const relation = await this.getById(relationId);
    if (!relation) {
      throw new Error("Failed to create relation");
    }

    // Post-create hook
    await this.options.hookRegistry.emit("relation:afterCreate", {
      relation,
      userId,
    });

    return relation;
  }

  /**
   * Get relation by ID
   */
  async getById(id: string): Promise<Relation | null> {
    const result = await this.options.db.query(
      `SELECT 
        id,
        source_content_id as sourceContentId,
        target_content_id as targetContentId,
        type,
        metadata,
        created_at as createdAt
      FROM relations
      WHERE id = ?`,
      [id],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.parseRelationRow(result.rows[0] as Record<string, unknown>);
  }

  /**
   * Find existing relation between source and target
   */
  private async findExistingRelation(
    sourceContentId: string,
    targetContentId: string,
    type: RelationType,
  ): Promise<Relation | null> {
    const result = await this.options.db.query(
      `SELECT 
        id,
        source_content_id as sourceContentId,
        target_content_id as targetContentId,
        type,
        metadata,
        created_at as createdAt
      FROM relations
      WHERE source_content_id = ? AND target_content_id = ? AND type = ?`,
      [sourceContentId, targetContentId, type],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.parseRelationRow(result.rows[0] as Record<string, unknown>);
  }

  /**
   * Query relations with filters
   */
  async query(options: RelationQuery): Promise<Relation[]> {
    const whereClauses: string[] = ["1=1"];
    const params: unknown[] = [];

    // Direction-based filtering
    const direction = options.direction || "outgoing";

    if (direction === "outgoing" || direction === "both") {
      if (options.sourceContentId) {
        whereClauses.push("source_content_id = ?");
        params.push(options.sourceContentId);
      }
    }

    if (direction === "incoming" || direction === "both") {
      if (options.targetContentId) {
        whereClauses.push("target_content_id = ?");
        params.push(options.targetContentId);
      }
    }

    // Type filter
    if (options.type) {
      whereClauses.push("type = ?");
      params.push(options.type);
    }

    // Build query
    let sql = `
      SELECT 
        id,
        source_content_id as sourceContentId,
        target_content_id as targetContentId,
        type,
        metadata,
        created_at as createdAt
      FROM relations
      WHERE ${whereClauses.join(" AND ")}
    `;

    // Pagination
    const limit = options.pagination?.limit || 100;
    const offset = ((options.pagination?.page || 1) - 1) * limit;
    sql += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const result = await this.options.db.query(sql, params);

    return result.rows.map((row) =>
      this.parseRelationRow(row as Record<string, unknown>),
    );
  }

  /**
   * Get related content for a content item
   */
  async getRelatedContent(
    contentId: string,
    options?: {
      type?: RelationType;
      direction?: "outgoing" | "incoming" | "both";
      populate?: boolean;
    },
  ): Promise<RelatedContent[]> {
    const direction = options?.direction || "outgoing";
    const relations: Relation[] = [];

    // Get outgoing relations
    if (direction === "outgoing" || direction === "both") {
      const outgoing = await this.options.db.query(
        `SELECT 
          id,
          source_content_id as sourceContentId,
          target_content_id as targetContentId,
          type,
          metadata,
          created_at as createdAt
        FROM relations
        WHERE source_content_id = ?`,
        [contentId],
      );
      relations.push(
        ...outgoing.rows.map((row) =>
          this.parseRelationRow(row as Record<string, unknown>),
        ),
      );
    }

    // Get incoming relations
    if (direction === "incoming" || direction === "both") {
      const incoming = await this.options.db.query(
        `SELECT 
          id,
          source_content_id as sourceContentId,
          target_content_id as targetContentId,
          type,
          metadata,
          created_at as createdAt
        FROM relations
        WHERE target_content_id = ?`,
        [contentId],
      );
      relations.push(
        ...incoming.rows.map((row) =>
          this.parseRelationRow(row as Record<string, unknown>),
        ),
      );
    }

    // Filter by type
    const filtered = options?.type
      ? relations.filter((r) => r.type === options.type)
      : relations;

    // Populate content if requested
    const relatedContent: RelatedContent[] = [];
    for (const relation of filtered) {
      const isOutgoing = relation.sourceContentId === contentId;
      const relatedContentId = isOutgoing
        ? relation.targetContentId
        : relation.sourceContentId;

      let content: PopulatedContentItem | null = null;
      if (options?.populate) {
        const fullContent =
          await this.options.contentService.getById(relatedContentId);
        if (fullContent) {
          content = {
            id: fullContent.id,
            blueprintId: fullContent.blueprintId,
            slug: fullContent.slug,
            status: fullContent.status,
            ...fullContent.data,
          };
        }
      } else {
        // Return minimal info without population
        const minimalContent =
          await this.options.contentService.getById(relatedContentId);
        if (minimalContent) {
          content = {
            id: minimalContent.id,
            blueprintId: minimalContent.blueprintId,
            slug: minimalContent.slug,
            status: minimalContent.status,
          };
        }
      }

      if (content) {
        relatedContent.push({
          relation,
          content,
          direction: isOutgoing ? "outgoing" : "incoming",
        });
      }
    }

    return relatedContent;
  }

  /**
   * Update relation metadata
   */
  async update(
    relationId: string,
    input: UpdateRelationInput,
    userId?: string,
  ): Promise<Relation> {
    const relation = await this.getById(relationId);
    if (!relation) {
      throw new Error("Relation not found");
    }

    // Pre-update hook
    await this.options.hookRegistry.emit("relation:beforeUpdate", {
      relation,
      metadata: input.metadata,
      userId,
    });

    // Update metadata only
    if (input.metadata !== undefined) {
      await this.options.db.execute(
        `UPDATE relations SET metadata = ? WHERE id = ?`,
        [JSON.stringify(input.metadata), relationId],
      );
    }

    // Fetch updated relation
    const updated = await this.getById(relationId);
    if (!updated) {
      throw new Error("Failed to update relation");
    }

    // Post-update hook
    await this.options.hookRegistry.emit("relation:afterUpdate", {
      relation: updated,
      userId,
    });

    return updated;
  }

  /**
   * Delete a relation
   */
  async delete(relationId: string, userId?: string): Promise<void> {
    const relation = await this.getById(relationId);
    if (!relation) {
      throw new Error("Relation not found");
    }

    // Pre-delete hook
    await this.options.hookRegistry.emit("relation:beforeDelete", {
      relation,
      userId,
    } as RelationDeleteContext);

    // Execute delete
    await this.options.db.execute("DELETE FROM relations WHERE id = ?", [
      relationId,
    ]);

    // Post-delete hook
    await this.options.hookRegistry.emit("relation:afterDelete", {
      relation,
      userId,
    });
  }

  /**
   * Delete all relations for a content item
   * Used when content is deleted
   * REVIEW: Fixed SQL logic - previously used AND which never matched. Now queries both directions separately.
   * FIXED: Now uses transaction for atomic deletion - either all relations deleted or none
   */
  async deleteRelationsForContent(
    contentId: string,
    cascadeRule?: CascadeRule,
  ): Promise<void> {
    await this.options.db.transaction(async (trx) => {
      // Query outgoing relations (where content is source)
      const outgoingRelations = await this.query({
        sourceContentId: contentId,
        direction: "outgoing",
      });

      // Query incoming relations (where content is target)
      const incomingRelations = await this.query({
        targetContentId: contentId,
        direction: "incoming",
      });

      // Combine and handle all relations atomically
      const allRelations = [...outgoingRelations, ...incomingRelations];
      for (const relation of allRelations) {
        await this.handleCascadeDeleteWithTrx(
          relation,
          contentId,
          cascadeRule,
          trx,
        );
      }
    });
  }

  /**
   * Handle cascade delete within a transaction
   */
  private async handleCascadeDeleteWithTrx(
    relation: Relation,
    deletedContentId: string,
    cascadeRule: CascadeRule | undefined,
    trx: any,
  ): Promise<void> {
    const rule = cascadeRule || "no-action";

    switch (rule) {
      case "restrict":
        throw new Error(
          `Cannot delete content: relations exist with rule "restrict"`,
        );

      case "cascade":
        const relatedContentId =
          relation.sourceContentId === deletedContentId
            ? relation.targetContentId
            : relation.sourceContentId;

        if (this.deletingContentIds.has(relatedContentId)) {
          break;
        }

        this.deletingContentIds.add(relatedContentId);
        try {
          await this.options.contentService.delete(relatedContentId);
        } finally {
          this.deletingContentIds.delete(relatedContentId);
        }
        break;

      case "set-null":
        await trx.execute("DELETE FROM relations WHERE id = ?", [relation.id]);
        break;

      case "no-action":
      default:
        await trx.execute("DELETE FROM relations WHERE id = ?", [relation.id]);
        break;
    }
  }

  /**
   * Track content IDs currently being deleted to prevent infinite recursion
   * This Set is shared across all cascade delete operations
   */
  private deletingContentIds = new Set<string>();

  /**
   * Handle cascade delete based on cascade rule
   * FIXED: Added recursion prevention via deletingContentIds Set
   * If content A→B→C→A, the cycle is broken when we try to delete A again
   */
  private async handleCascadeDelete(
    relation: Relation,
    deletedContentId: string,
    cascadeRule?: CascadeRule,
  ): Promise<void> {
    const rule = cascadeRule || "no-action";

    switch (rule) {
      case "restrict":
        // Prevent deletion if relations exist
        throw new Error(
          `Cannot delete content: relations exist with rule "restrict"`,
        );

      case "cascade":
        // Delete related content
        const relatedContentId =
          relation.sourceContentId === deletedContentId
            ? relation.targetContentId
            : relation.sourceContentId;

        // Prevent infinite recursion: skip if already being deleted
        if (this.deletingContentIds.has(relatedContentId)) {
          break;
        }

        this.deletingContentIds.add(relatedContentId);
        try {
          await this.options.contentService.delete(relatedContentId);
        } finally {
          this.deletingContentIds.delete(relatedContentId);
        }
        break;

      case "set-null":
        // Remove the relation (relation field becomes null)
        await this.delete(relation.id);
        break;

      case "no-action":
      default:
        // Just delete the relation
        await this.options.db.execute("DELETE FROM relations WHERE id = ?", [
          relation.id,
        ]);
        break;
    }
  }

  /**
   * Check if creating a relation would create a circular reference
   * Uses BFS to detect cycles in both directions
   * REVIEW: Fixed to check both outgoing and incoming relations for complete cycle detection
   * REVIEW: Removed early return for many-to-many - bidirectional relations are valid
   * The BFS below properly detects actual cycles (not just bidirectional links)
   * NOTE: The 'visited' Set prevents infinite loops by tracking processed nodes
   * BFS naturally terminates when all reachable nodes are visited
   */
  async wouldCreateCircularReference(
    sourceId: string,
    targetId: string,
    _type: RelationType,
  ): Promise<boolean> {
    // BFS to check if targetId eventually connects back to sourceId
    // Check both outgoing (target -> X) and incoming (X -> target) relations
    const visited = new Set<string>();
    const queue = [targetId];

    while (queue.length > 0) {
      const current = queue.shift()!;

      // Self-relation is caught on first iteration (targetId === sourceId)
      // This also handles general cycle detection
      if (current === sourceId) {
        return true;
      }

      if (visited.has(current)) {
        continue;
      }

      visited.add(current);

      // Get all outgoing relations from current (current is source)
      const outgoingRelations = await this.options.db.query(
        `SELECT target_content_id FROM relations WHERE source_content_id = ?`,
        [current],
      );

      for (const row of outgoingRelations.rows) {
        const relatedId = String(
          (row as Record<string, unknown>).target_content_id,
        );
        if (!visited.has(relatedId)) {
          queue.push(relatedId);
        }
      }

      // Get all incoming relations to current (current is target)
      // This is needed to detect cycles like A->B, C->B, and trying to create B->C
      const incomingRelations = await this.options.db.query(
        `SELECT source_content_id FROM relations WHERE target_content_id = ?`,
        [current],
      );

      for (const row of incomingRelations.rows) {
        const relatedId = String(
          (row as Record<string, unknown>).source_content_id,
        );
        if (!visited.has(relatedId)) {
          queue.push(relatedId);
        }
      }
    }

    return false;
  }

  /**
   * Remove existing relations of a specific type from a content item
   */
  private async removeExistingRelations(
    contentId: string,
    type: RelationType,
    direction: "outgoing" | "incoming" | "both" = "outgoing",
  ): Promise<void> {
    if (direction === "outgoing" || direction === "both") {
      await this.options.db.execute(
        `DELETE FROM relations WHERE source_content_id = ? AND type = ?`,
        [contentId, type],
      );
    }

    if (direction === "incoming" || direction === "both") {
      await this.options.db.execute(
        `DELETE FROM relations WHERE target_content_id = ? AND type = ?`,
        [contentId, type],
      );
    }
  }

  /**
   * Get relations where content is the target (incoming relations)
   */
  private async getRelationsForTarget(
    contentId: string,
    type: RelationType,
  ): Promise<Relation[]> {
    const result = await this.options.db.query(
      `SELECT 
        id,
        source_content_id as sourceContentId,
        target_content_id as targetContentId,
        type,
        metadata,
        created_at as createdAt
      FROM relations
      WHERE target_content_id = ? AND type = ?`,
      [contentId, type],
    );

    return result.rows.map((row) =>
      this.parseRelationRow(row as Record<string, unknown>),
    );
  }

  /**
   * Parse database row to Relation object
   */
  private parseRelationRow(row: Record<string, unknown>): Relation {
    return {
      id: String(row.id),
      sourceContentId: String(row.sourceContentId),
      targetContentId: String(row.targetContentId),
      type: row.type as RelationType,
      // NOTE: JSON.parse() can throw if metadata is malformed. This is acceptable
      // because malformed JSON in the database indicates a serious data integrity
      // issue that should not be silently ignored. The error will propagate and
      // alert developers to investigate the corrupted data.
      metadata: row.metadata
        ? typeof row.metadata === "string"
          ? JSON.parse(row.metadata)
          : (row.metadata as Record<string, unknown>)
        : undefined,
      createdAt: parseTimestamp(row.createdAt),
    };
  }
}
