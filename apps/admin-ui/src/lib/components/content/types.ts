// Content item types for Content Management UI

export type ContentStatus = "draft" | "published" | "archived";

export interface ContentItem {
  id: string;
  blueprintId: string;
  slug: string;
  status: ContentStatus;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  publishedBy?: string;
  version?: number;
}

export interface ContentListItem {
  id: string;
  blueprintId: string;
  slug: string;
  status: ContentStatus;
  title?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContentRequest {
  blueprintId: string;
  slug?: string;
  data: Record<string, unknown>;
  status?: ContentStatus;
}

export interface UpdateContentRequest {
  slug?: string;
  data?: Record<string, unknown>;
  status?: ContentStatus;
}

export interface ContentFilters {
  blueprintId?: string;
  status?: ContentStatus;
  search?: string;
  createdBy?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ContentApiResponse {
  success: boolean;
  data?: ContentItem;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface ContentListResponse {
  success: boolean;
  data?: ContentItem[];
  error?: string;
  meta?: PaginationMeta;
}

// REVIEW NOTE (2026-02-13): ContentVersion type verified against backend API
// Backend (packages/core/src/content/service.ts:624-631) returns:
// - id: string (UUID)
// - versionNumber: number
// - createdBy?: string
// - changeSummary?: string
// - createdAt: Date (serialized as string in API response)
export interface ContentVersion {
  id: string;
  versionNumber: number;
  contentId?: string;
  data?: Record<string, unknown>;
  createdAt: string;
  createdBy?: string;
  changeSummary?: string;
}

export interface ContentVersionResponse {
  success: boolean;
  data?: Array<{
    id: string;
    versionNumber: number;
    createdBy?: string;
    changeSummary?: string;
    createdAt: string;
  }>;
  error?: string;
}
