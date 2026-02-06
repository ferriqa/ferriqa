/**
 * @ferriqa/sdk - Blueprint Client
 *
 * Blueprint management operations
 */

import type { HTTPClient } from "./http.ts";
import type {
  Blueprint,
  PaginationParams,
  PaginatedResponse,
} from "../types/index.ts";

export class BlueprintClient {
  private http: HTTPClient;

  constructor(http: HTTPClient) {
    this.http = http;
  }

  /**
   * List all blueprints
   */
  async list(
    params: PaginationParams = {},
  ): Promise<PaginatedResponse<Blueprint>> {
    const searchParams = new URLSearchParams();

    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));

    const query = searchParams.toString();
    const path = `/api/v1/blueprints${query ? `?${query}` : ""}`;

    const response = await this.http.get<PaginatedResponse<Blueprint>>(path);
    return response.data;
  }

  /**
   * Get a single blueprint by slug
   */
  async get(slug: string): Promise<Blueprint> {
    const response = await this.http.get<Blueprint>(
      `/api/v1/blueprints/${slug}`,
    );
    return response.data;
  }

  /**
   * Get a single blueprint by ID
   */
  async getById(id: number): Promise<Blueprint> {
    const response = await this.http.get<Blueprint>(`/api/v1/blueprints/${id}`);
    return response.data;
  }

  /**
   * Create a new blueprint
   */
  async create(
    blueprint: Omit<Blueprint, "id" | "createdAt" | "updatedAt">,
  ): Promise<Blueprint> {
    const response = await this.http.post<Blueprint>(
      "/api/v1/blueprints",
      blueprint,
    );
    return response.data;
  }

  /**
   * Update a blueprint
   */
  async update(
    slug: string,
    blueprint: Partial<Omit<Blueprint, "id" | "createdAt" | "updatedAt">>,
  ): Promise<Blueprint> {
    const response = await this.http.put<Blueprint>(
      `/api/v1/blueprints/${slug}`,
      blueprint,
    );
    return response.data;
  }

  /**
   * Delete a blueprint
   */
  async delete(slug: string): Promise<void> {
    await this.http.delete(`/api/v1/blueprints/${slug}`);
  }
}
