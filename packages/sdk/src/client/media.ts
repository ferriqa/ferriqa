/**
 * @ferriqa/sdk - Media Client
 *
 * Media file operations
 */

import type { HTTPClient } from "./http.ts";
import type {
  MediaFile,
  PaginationParams,
  PaginatedResponse,
} from "../types/index.ts";

export class MediaClient {
  private http: HTTPClient;

  constructor(http: HTTPClient) {
    this.http = http;
  }

  /**
   * List all media files
   */
  async list(
    params: PaginationParams = {},
  ): Promise<PaginatedResponse<MediaFile>> {
    const searchParams = new URLSearchParams();

    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));

    const query = searchParams.toString();
    const path = `/api/v1/media${query ? `?${query}` : ""}`;

    const response = await this.http.get<PaginatedResponse<MediaFile>>(path);
    return response.data;
  }

  /**
   * Get a single media file by ID
   */
  async get(id: number): Promise<MediaFile> {
    const response = await this.http.get<MediaFile>(`/api/v1/media/${id}`);
    return response.data;
  }

  /**
   * Upload a media file
   */
  async upload(file: File | Blob, filename?: string): Promise<MediaFile> {
    const formData = new FormData();
    formData.append("file", file, filename || "upload");

    const response = await this.http.post<MediaFile>(
      "/api/v1/media",
      formData,
      {
        headers: {
          // Don't set Content-Type, let browser set it with boundary
        },
      },
    );
    return response.data;
  }

  /**
   * Delete a media file
   */
  async delete(id: number): Promise<void> {
    await this.http.delete(`/api/v1/media/${id}`);
  }
}
