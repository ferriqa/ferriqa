/**
 * Media types for the admin UI
 */

export interface MediaFile {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  alt?: string;
  caption?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MediaApiResponse {
  success: boolean;
  data?: MediaFile;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface MediaListResponse {
  success: boolean;
  data?: MediaFile[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  error?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export type ViewMode = "grid" | "list";
export type MediaType = "all" | "image" | "video" | "audio" | "document";
