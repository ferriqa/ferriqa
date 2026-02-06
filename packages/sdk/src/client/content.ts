/**
 * @ferriqa/sdk - Content Client
 *
 * Content CRUD operations for a specific blueprint
 */

import type { HTTPClient } from "../client/http.ts";
import type {
  ContentItem,
  CreateContentRequest,
  UpdateContentRequest,
  PaginationParams,
  PaginatedResponse,
} from "../types/index.ts";

export class ContentClient {
  private http: HTTPClient;
  private blueprintSlug: string;

  constructor(http: HTTPClient, blueprintSlug: string) {
    this.http = http;
    this.blueprintSlug = blueprintSlug;
  }

  /**
   * List all content items for this blueprint
   */
  async list(
    params: PaginationParams = {},
  ): Promise<PaginatedResponse<ContentItem>> {
    const searchParams = new URLSearchParams();

    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));
    if (params.sort) searchParams.set("sort", params.sort);
    if (params.order) searchParams.set("order", params.order);

    const query = searchParams.toString();
    const path = `/api/v1/contents/${this.blueprintSlug}${query ? `?${query}` : ""}`;

    const response = await this.http.get<PaginatedResponse<ContentItem>>(path);
    return response.data;
  }

  /**
   * Get a single content item by slug
   */
  async get(slug: string): Promise<ContentItem> {
    const response = await this.http.get<ContentItem>(
      `/api/v1/contents/${this.blueprintSlug}/${slug}`,
    );
    return response.data;
  }

  /**
   * Get a single content item by ID
   */
  async getById(id: number): Promise<ContentItem> {
    const response = await this.http.get<ContentItem>(
      `/api/v1/contents/${this.blueprintSlug}/id/${id}`,
    );
    return response.data;
  }

  /**
   * Create a new content item
   */
  async create(data: CreateContentRequest): Promise<ContentItem> {
    const response = await this.http.post<ContentItem>(
      `/api/v1/contents/${this.blueprintSlug}`,
      data,
    );
    return response.data;
  }

  /**
   * Update a content item by slug
   */
  async update(slug: string, data: UpdateContentRequest): Promise<ContentItem> {
    const response = await this.http.put<ContentItem>(
      `/api/v1/contents/${this.blueprintSlug}/${slug}`,
      data,
    );
    return response.data;
  }

  /**
   * Update a content item by ID
   */
  async updateById(
    id: number,
    data: UpdateContentRequest,
  ): Promise<ContentItem> {
    const response = await this.http.put<ContentItem>(
      `/api/v1/contents/${this.blueprintSlug}/id/${id}`,
      data,
    );
    return response.data;
  }

  /**
   * Delete a content item by slug
   */
  async delete(slug: string): Promise<void> {
    await this.http.delete(`/api/v1/contents/${this.blueprintSlug}/${slug}`);
  }

  /**
   * Delete a content item by ID
   */
  async deleteById(id: number): Promise<void> {
    await this.http.delete(`/api/v1/contents/${this.blueprintSlug}/id/${id}`);
  }

  /**
   * Publish a content item
   */
  async publish(slug: string): Promise<ContentItem> {
    const response = await this.http.post<ContentItem>(
      `/api/v1/contents/${this.blueprintSlug}/${slug}/publish`,
      {},
    );
    return response.data;
  }

  /**
   * Unpublish a content item
   */
  async unpublish(slug: string): Promise<ContentItem> {
    const response = await this.http.post<ContentItem>(
      `/api/v1/contents/${this.blueprintSlug}/${slug}/unpublish`,
      {},
    );
    return response.data;
  }

  /**
   * Get content versions
   */
  async getVersions(slug: string): Promise<ContentItem[]> {
    const response = await this.http.get<ContentItem[]>(
      `/api/v1/contents/${this.blueprintSlug}/${slug}/versions`,
    );
    return response.data;
  }

  /**
   * Rollback to a specific version
   */
  async rollback(slug: string, versionId: number): Promise<ContentItem> {
    const response = await this.http.post<ContentItem>(
      `/api/v1/contents/${this.blueprintSlug}/${slug}/rollback`,
      { versionId },
    );
    return response.data;
  }
}
