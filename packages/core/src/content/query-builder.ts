/**
 * Content Query Builder
 *
 * Query builder for JSON content with filtering, sorting, and pagination
 * Based on roadmap 2.2 - Query Builder for JSON
 */

import type { DatabaseAdapter } from "../../../adapters-db/src/types.ts";
import type {
  ContentQuery,
  FilterCondition,
  SortCondition,
  PaginatedResult,
  Content,
} from "./types.ts";

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

  constructor(private db: DatabaseAdapter) {}

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

    const result = await this.db.query(sql, params);

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
   * Count total records matching query conditions
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

    const result = await this.db.query<{ count: number }>(sql, params);
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
    const result = await this.db.query(
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
    const result = await this.db.query(
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
}
