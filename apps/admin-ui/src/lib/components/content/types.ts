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

export interface ContentVersion {
  id: number;
  contentId: string;
  data: Record<string, unknown>;
  createdAt: string;
  createdBy?: string;
  changeSummary?: string;
}

export interface ContentVersionResponse {
  success: boolean;
  data?: ContentVersion[];
  error?: string;
}
