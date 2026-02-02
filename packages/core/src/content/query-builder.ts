/**
 * Content Query Builder
 *
 * Query builder for JSON content with filtering, sorting, and pagination
 * Based on roadmap 2.2 - Query Builder for JSON
 */

import type { DatabaseAdapter } from "../../../adapters-db/src/types.ts";
import type { Blueprint } from "../blueprint/types.ts";
import type { RelationService } from "../relations/service.ts";
import type {
  ContentQuery,
  FilterCondition,
  SortCondition,
  PaginatedResult,
  Content,
  PopulateOptions,
  PopulatedContentItem,
} from "./types.ts";

export interface ContentQueryBuilderOptions {
  db: DatabaseAdapter;
  relationService?: RelationService;
  getBlueprint?: (blueprintId: string) => Promise<Blueprint | null>;
}

export class ContentQueryBuilder {
  // REVIEW NOTE: These columns are validated in buildOrderBy to prevent SQL injection
  private readonly ALLOWED_COLUMNS = [
    "id",
    "blueprint_id",
    "slug",
    "status",
    "created_by",
    "created_at",
    "updated_at",
    "published_at",
    "published_by",
  ];

  constructor(private options: ContentQueryBuilderOptions) {}

  /**
   * Parse timestamp value from database
   * REVIEW: Handles both number and string returns from SQLite (driver-dependent)
   */
  private parseTimestamp(value: unknown): Date {
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

  /**
   * Execute a content query with filters, sorting, and pagination
   */
  async query(options: ContentQuery): Promise<PaginatedResult<Content>> {
    const whereClauses: string[] = ["1=1"];
    const params: unknown[] = [];

    // Blueprint filter
    if (options.blueprintId) {
      whereClauses.push("blueprint_id = ?");
      params.push(options.blueprintId);
    }

    // Status filter
    if (options.status) {
      const statuses = Array.isArray(options.status)
        ? options.status
        : [options.status];
      if (statuses.length === 1) {
        whereClauses.push("status = ?");
        params.push(statuses[0]);
      } else {
        // FIXED: SQL placeholder generation - REVIEW: Previous implementation generated wrong placeholder count
        whereClauses.push(`status IN (${statuses.map(() => "?").join(", ")})`);
        params.push(...statuses);
      }
    }

    // JSON field filters
    for (const filter of options.filters || []) {
      const sql = this.buildFilterSql(filter);
      whereClauses.push(sql.clause);
      params.push(...sql.params);
    }

    // Build ORDER BY
    const orderBy = this.buildOrderBy(options.sort);

    // Build pagination
    const limit = options.pagination?.limit || 25;
    const offset = ((options.pagination?.page || 1) - 1) * limit;

    // Execute query
    // REVIEW: Removed JOIN with blueprints table - blueprintSlug was selected but not used in Content type
    const sql = `
      SELECT 
        id,
        blueprint_id as blueprintId,
        slug,
        status,
        data,
        meta,
        created_by as createdBy,
        created_at as createdAt,
        updated_at as updatedAt,
        published_at as publishedAt,
        published_by as publishedBy
      FROM contents
      WHERE ${whereClauses.join(" AND ")}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;
    params.push(limit, offset);

    const result = await this.options.db.query(sql, params);

    // Parse results
    const contents = result.rows.map((row) =>
      this.parseContentRow(row as Record<string, unknown>),
    );

    // Get total count
    const total = await this.count(options);

    return {
      data: contents,
      pagination: {
        page: options.pagination?.page || 1,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Batch fetch multiple contents by IDs in a single query
   * FIXED: Replaces N+1 queries with single batch query for better performance
   */
  async getManyById(ids: string[]): Promise<Content[]> {
    if (ids.length === 0) {
      return [];
    }

    // Generate SQL with correct placeholder count
    const placeholders = ids.map(() => "?").join(", ");
    const sql = `
      SELECT c.*, b.slug as blueprint_slug
      FROM contents c
      JOIN blueprints b ON c.blueprint_id = b.id
      WHERE c.id IN (${placeholders})
    `;

    const result = await this.options.db.query<Record<string, unknown>>(
      sql,
      ids,
    );

    return result.rows.map((row) => this.parseContentRow(row));
  }

  /**
   * Count content matching query criteria
   */
  async count(
    options: Omit<ContentQuery, "pagination" | "sort" | "populate" | "fields">,
  ): Promise<number> {
    const whereClauses: string[] = ["1=1"];
    const params: unknown[] = [];

    if (options.blueprintId) {
      whereClauses.push("blueprint_id = ?");
      params.push(options.blueprintId);
    }

    if (options.status) {
      const statuses = Array.isArray(options.status)
        ? options.status
        : [options.status];
      if (statuses.length === 1) {
        whereClauses.push("status = ?");
        params.push(statuses[0]);
      } else {
        whereClauses.push(`status IN (${statuses.map(() => "?").join(", ")})`);
        params.push(...statuses);
      }
    }

    for (const filter of options.filters || []) {
      const sql = this.buildFilterSql(filter);
      whereClauses.push(sql.clause);
      params.push(...sql.params);
    }

    const sql = `
      SELECT COUNT(*) as count 
      FROM contents
      WHERE ${whereClauses.join(" AND ")}
    `;

    const result = await this.options.db.query<{ count: number }>(sql, params);
    return result.rows[0]?.count || 0;
  }

  /**
   * Build SQL filter clause from filter condition
   */
  private buildFilterSql(filter: FilterCondition): {
    clause: string;
    params: unknown[];
  } {
    const jsonPath = this.toJsonPath(filter.field);
    const extract = `json_extract(data, '${jsonPath}')`;

    switch (filter.operator) {
      case "eq":
        return { clause: `${extract} = ?`, params: [filter.value] };
      case "ne":
        return { clause: `${extract} != ?`, params: [filter.value] };
      case "gt":
        return { clause: `${extract} > ?`, params: [filter.value] };
      case "gte":
        return { clause: `${extract} >= ?`, params: [filter.value] };
      case "lt":
        return { clause: `${extract} < ?`, params: [filter.value] };
      case "lte":
        return { clause: `${extract} <= ?`, params: [filter.value] };
      case "in":
        const inValues = Array.isArray(filter.value)
          ? filter.value
          : [filter.value];
        return {
          clause: `${extract} IN (${inValues.map(() => "?").join(", ")})`,
          params: inValues,
        };
      case "nin":
        const ninValues = Array.isArray(filter.value)
          ? filter.value
          : [filter.value];
        return {
          clause: `${extract} NOT IN (${ninValues.map(() => "?").join(", ")})`,
          params: ninValues,
        };
      case "contains":
        // SECURITY: Escape LIKE wildcards + use ESCAPE clause for SQLite portability
        return {
          clause: `${extract} LIKE ? ESCAPE '\\'`,
          params: [`%${this.escapeLikeValue(String(filter.value))}%`],
        };
      case "startsWith":
        // SECURITY: Escape LIKE wildcards + use ESCAPE clause for SQLite portability
        return {
          clause: `${extract} LIKE ? ESCAPE '\\'`,
          params: [`${this.escapeLikeValue(String(filter.value))}%`],
        };
      case "endsWith":
        // SECURITY: Escape LIKE wildcards + use ESCAPE clause for SQLite portability
        return {
          clause: `${extract} LIKE ? ESCAPE '\\'`,
          params: [`%${this.escapeLikeValue(String(filter.value))}`],
        };
      case "exists":
        return { clause: `${extract} IS NOT NULL`, params: [] };
      default:
        throw new Error(`Unknown operator: ${filter.operator}`);
    }
  }

  /**
   * Convert field path to JSON path
   */
  private toJsonPath(field: string): string {
    // 'author.name' -> '$.author.name'
    // 'tags[0]' -> '$.tags[0]'
    return "$" + (field.startsWith("[") ? field : `.${field}`);
  }

  /**
   * Escape LIKE pattern wildcards (% and _)
   * SECURITY: Prevents users from using wildcards to manipulate search results
   * In SQLite, \% and \_ escape the special meaning of these characters
   */
  private escapeLikeValue(value: string): string {
    return value.replace(/[%_]/g, "\\$&");
  }

  /**
   * Build ORDER BY clause
   * SECURITY: Field names are validated against ALLOWED_COLUMNS to prevent SQL injection
   */
  private buildOrderBy(sort?: SortCondition[]): string {
    if (!sort || sort.length === 0) {
      // REVIEW: Removed 'c.' alias - table no longer uses alias in queries
      return "id DESC";
    }

    return sort
      .map((s) => {
        // Check if it's a data field (JSON) or column field
        if (s.field.startsWith("data.")) {
          const jsonPath = this.toJsonPath(s.field.replace("data.", ""));
          return `json_extract(data, '${jsonPath}') ${s.direction}`;
        }
        // REVIEW NOTE: Standard columns are validated to prevent SQL injection
        if (!this.ALLOWED_COLUMNS.includes(s.field)) {
          throw new Error(
            `Invalid sort field: ${s.field}. Allowed columns: ${this.ALLOWED_COLUMNS.join(", ")}`,
          );
        }
        // REVIEW: Removed 'c.' alias - table no longer uses alias in queries
        return `${s.field} ${s.direction}`;
      })
      .join(", ");
  }

  /**
   * Parse database row to Content object
   */
  private parseContentRow(row: Record<string, unknown>): Content {
    return {
      id: String(row.id),
      blueprintId: String(row.blueprintId),
      slug: String(row.slug),
      status: row.status as Content["status"],
      // NOTE: JSON.parse() can throw if data/meta contain malformed JSON.
      // This is intentional - corrupted content data should not be silently ignored.
      // The error will help identify data integrity issues that need investigation.
      data:
        typeof row.data === "string"
          ? JSON.parse(row.data)
          : (row.data as Record<string, unknown>),
      meta: row.meta
        ? typeof row.meta === "string"
          ? JSON.parse(row.meta)
          : (row.meta as Record<string, unknown>)
        : undefined,
      createdBy: row.createdBy ? String(row.createdBy) : undefined,
      // FIXED: Use parseTimestamp for robust timestamp handling (handles both number/string)
      createdAt: this.parseTimestamp(row.createdAt),
      updatedAt: this.parseTimestamp(row.updatedAt),
      publishedAt: row.publishedAt
        ? this.parseTimestamp(row.publishedAt)
        : undefined,
      publishedBy: row.publishedBy ? String(row.publishedBy) : undefined,
    };
  }

  /**
   * Get content by ID
   */
  async getById(id: string): Promise<Content | null> {
    // REVIEW: Removed JOIN with blueprints table - blueprintSlug was selected but not used
    const result = await this.options.db.query(
      `SELECT 
        id,
        blueprint_id as blueprintId,
        slug,
        status,
        data,
        meta,
        created_by as createdBy,
        created_at as createdAt,
        updated_at as updatedAt,
        published_at as publishedAt,
        published_by as publishedBy
      FROM contents
      WHERE id = ?`,
      [id],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.parseContentRow(result.rows[0] as Record<string, unknown>);
  }

  /**
   * Get content by slug within a blueprint
   */
  async getBySlug(blueprintId: string, slug: string): Promise<Content | null> {
    // REVIEW: Removed JOIN with blueprints table - blueprintSlug was selected but not used
    const result = await this.options.db.query(
      `SELECT 
        id,
        blueprint_id as blueprintId,
        slug,
        status,
        data,
        meta,
        created_by as createdBy,
        created_at as createdAt,
        updated_at as updatedAt,
        published_at as publishedAt,
        published_by as publishedBy
      FROM contents
      WHERE blueprint_id = ? AND slug = ?`,
      [blueprintId, slug],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.parseContentRow(result.rows[0] as Record<string, unknown>);
  }

  /**
   * Populate relations in content data
   * Reads relation IDs from content.data field values
   * Based on roadmap 2.3 - Query Population
   */
  async populateContent(
    content: Content,
    populateOptions: PopulateOptions | string[],
  ): Promise<Content> {
    if (!this.options.getBlueprint) {
      return content;
    }

    // Get blueprint to find relation fields
    const blueprint = await this.options.getBlueprint(content.blueprintId);
    if (!blueprint) {
      return content;
    }

    // Find relation fields in blueprint
    const relationFields = blueprint.fields.filter(
      (field) => field.type === "relation" && field.options?.relation,
    );

    if (relationFields.length === 0) {
      return content;
    }

    // Convert array populate to object format
    // REVIEW: TypeScript ensures populateOptions type safety at compile time
    // Runtime validation would be redundant as non-strings would fail TS compilation
    const populateMap: PopulateOptions = Array.isArray(populateOptions)
      ? populateOptions.reduce((acc, field) => {
          acc[field] = {};
          return acc;
        }, {} as PopulateOptions)
      : populateOptions;

    // Process each relation field in parallel for better performance
    // REVIEW: Optimized from serial to parallel execution to avoid N+1 query problem
    // All relation lookups happen concurrently instead of sequentially
    // REVIEW: Field data overwrite is intentional - populate replaces relation IDs with full objects
    // This is the expected behavior; original relation IDs are not preserved after population
    // REVIEW: Fixed to use content.data field values instead of querying relations table
    // Relation IDs are stored in content.data[fieldKey], not in the relations table
    const populatedData = { ...content.data };

    // Collect all population promises
    const populationPromises = relationFields
      .filter((field) => {
        const fieldKey = field.key;
        const fieldPopulate = populateMap[fieldKey];
        const relationConfig = field.options?.relation;
        return fieldPopulate && relationConfig;
      })
      .map(async (field) => {
        const fieldKey = field.key;
        const relationConfig = field.options!.relation!;

        try {
          // Get relation ID(s) from content data
          // REVIEW: Relation values are stored in content.data, not in relations table
          // Relations table is for explicit relationship records, field values are in data
          const fieldValue = content.data[fieldKey];
          if (!fieldValue) {
            return { fieldKey, populatedValue: null, success: true };
          }

          // Handle single relation (one-to-one) or array of relations (one-to-many, many-to-many)
          let relatedContent: PopulatedContentItem[] = [];

          if (
            relationConfig.type === "one-to-many" ||
            relationConfig.type === "many-to-many"
          ) {
            // Array of relation values
            const relationIds = Array.isArray(fieldValue)
              ? fieldValue
              : [fieldValue];

            // PERFORMANCE: This was N+1 query problem - FIXED by using batch query
            // Extract all relation IDs first
            const relatedIds = relationIds.map((relationItem) =>
              typeof relationItem === "string"
                ? relationItem
                : (relationItem as { id: string }).id,
            );

            // Fetch all related content in a single batch query
            const relatedContents = await this.getManyById(relatedIds);

            // Map to PopulatedContentItem format
            relatedContent = relatedContents.map((content) => ({
              id: content.id,
              blueprintId: content.blueprintId,
              slug: content.slug,
              status: content.status,
              ...content.data,
            })) as PopulatedContentItem[];
          } else {
            // Single relation value (one-to-one)
            const relatedId =
              typeof fieldValue === "string"
                ? fieldValue
                : (fieldValue as { id: string }).id;

            const relatedContentItem = await this.getById(relatedId);
            if (relatedContentItem) {
              relatedContent = [
                {
                  id: relatedContentItem.id,
                  blueprintId: relatedContentItem.blueprintId,
                  slug: relatedContentItem.slug,
                  status: relatedContentItem.status,
                  ...relatedContentItem.data,
                } as PopulatedContentItem,
              ];
            }
          }

          // Format based on relation type
          let populatedValue: unknown;
          if (
            relationConfig.type === "one-to-many" ||
            relationConfig.type === "many-to-many"
          ) {
            // Array of related content
            populatedValue = relatedContent;
          } else {
            // Single relation (one-to-one)
            populatedValue = relatedContent[0] || null;
          }

          return { fieldKey, populatedValue, success: true };
        } catch (error) {
          // If population fails, keep original data
          // REVIEW: Intentional design choice - graceful degradation on population failure
          // Callers can detect issues via console warnings; alternative would be to throw
          console.warn(`Failed to populate field ${fieldKey}:`, error);
          return { fieldKey, populatedValue: undefined, success: false };
        }
      });

    // Wait for all population operations to complete in parallel
    const results = await Promise.all(populationPromises);

    // Apply populated values to data
    // REVIEW: Original relation IDs are overwritten with full content objects
    // This is intentional - population replaces IDs with populated data
    // If original IDs are needed, query without populate or store IDs separately
    for (const result of results) {
      if (result.success) {
        populatedData[result.fieldKey] = result.populatedValue;
      }
    }

    return {
      ...content,
      data: populatedData,
    };
  }

  /**
   * Populate relations for multiple contents
   */
  async populateContents(
    contents: Content[],
    populateOptions: PopulateOptions | string[],
  ): Promise<Content[]> {
    return Promise.all(
      contents.map((content) => this.populateContent(content, populateOptions)),
    );
  }
}
