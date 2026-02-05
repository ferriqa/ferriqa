/**
 * Blueprint Service
 *
 * Blueprint management service with CRUD operations
 * Based on roadmap 3.1 - RESTful Endpoints Implementation
 */

import type { DatabaseAdapter } from "../../../adapters-db/src/types.ts";
import type { WebhookService } from "../webhooks/service.ts";
import type {
  Blueprint,
  CreateBlueprintInput,
  UpdateBlueprintInput,
  BlueprintQuery,
} from "./types.ts";
import type { PaginatedResult } from "../content/types.ts";

export interface BlueprintServiceOptions {
  db: DatabaseAdapter;
  webhookService?: WebhookService;
}

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

export class BlueprintService {
  constructor(private options: BlueprintServiceOptions) {}

  async create(input: CreateBlueprintInput): Promise<Blueprint> {
    const now = Date.now();

    const result = await this.options.db.execute(
      `INSERT INTO blueprints (id, name, slug, description, fields, settings, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.id || crypto.randomUUID(),
        input.name,
        input.slug,
        input.description || null,
        JSON.stringify(input.fields),
        JSON.stringify(input.settings),
        now,
        now,
      ],
    );

    const blueprintId = String(result.lastInsertId);
    const blueprint = (await this.getById(blueprintId)) as Blueprint;

    // Dispatch webhook (async, non-blocking)
    if (this.options.webhookService) {
      await this.options.webhookService.dispatch("blueprint.created", {
        blueprint,
      });
    }

    return blueprint;
  }

  async update(
    blueprintId: string,
    input: UpdateBlueprintInput,
  ): Promise<Blueprint> {
    const existing = await this.getById(blueprintId);
    if (!existing) {
      throw new Error("Blueprint not found");
    }

    const now = Date.now();
    const fields = input.fields || existing.fields;
    const settings = input.settings || existing.settings;

    await this.options.db.execute(
      `UPDATE blueprints 
       SET name = ?, slug = ?, description = ?, fields = ?, settings = ?, updated_at = ?
       WHERE id = ?`,
      [
        input.name || existing.name,
        input.slug || existing.slug,
        input.description !== undefined
          ? input.description
          : existing.description || null,
        JSON.stringify(fields),
        JSON.stringify(settings),
        now,
        blueprintId,
      ],
    );

    const updated = (await this.getById(blueprintId)) as Blueprint;

    // Dispatch webhook (async, non-blocking)
    if (this.options.webhookService) {
      await this.options.webhookService.dispatch("blueprint.updated", {
        blueprint: updated,
        previousBlueprint: existing,
      });
    }

    return updated;
  }

  async delete(blueprintId: string): Promise<void> {
    const existing = await this.getById(blueprintId);
    if (!existing) {
      throw new Error("Blueprint not found");
    }

    await this.options.db.execute("DELETE FROM blueprints WHERE id = ?", [
      blueprintId,
    ]);

    // Dispatch webhook (async, non-blocking)
    if (this.options.webhookService) {
      await this.options.webhookService.dispatch("blueprint.deleted", {
        blueprint: existing,
      });
    }
  }

  async getById(id: string): Promise<Blueprint | null> {
    const result = await this.options.db.query(
      `SELECT id, name, slug, description, fields, settings, created_at as createdAt, updated_at as updatedAt
       FROM blueprints WHERE id = ?`,
      [id],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRow(result.rows[0] as Record<string, unknown>);
  }

  async getBySlug(slug: string): Promise<Blueprint | null> {
    const result = await this.options.db.query(
      `SELECT id, name, slug, description, fields, settings, created_at as createdAt, updated_at as updatedAt
       FROM blueprints WHERE slug = ?`,
      [slug],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRow(result.rows[0] as Record<string, unknown>);
  }

  async query(
    options: BlueprintQuery = {},
  ): Promise<PaginatedResult<Blueprint>> {
    const { page = 1, limit = 25, search } = options;

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (search) {
      conditions.push("(name LIKE ? OR description LIKE ?)");
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const offset = (page - 1) * limit;

    const countResult = await this.options.db.query(
      `SELECT COUNT(*) as total FROM blueprints ${whereClause}`,
      params,
    );
    const total = (countResult.rows[0] as { total: number }).total;

    const dataResult = await this.options.db.query(
      `SELECT id, name, slug, description, fields, settings, created_at as createdAt, updated_at as updatedAt
       FROM blueprints
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    const data = dataResult.rows.map((row) =>
      this.mapRow(row as Record<string, unknown>),
    );

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private mapRow(row: Record<string, unknown>): Blueprint {
    return {
      id: String(row.id),
      name: String(row.name),
      slug: String(row.slug),
      description: row.description ? String(row.description) : undefined,
      fields:
        typeof row.fields === "string"
          ? JSON.parse(row.fields)
          : (row.fields as Blueprint["fields"]),
      settings:
        typeof row.settings === "string"
          ? JSON.parse(row.settings)
          : (row.settings as Blueprint["settings"]),
      createdAt: parseTimestamp(row.createdAt),
      updatedAt: parseTimestamp(row.updatedAt),
    };
  }
}
