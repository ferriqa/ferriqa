import type {
  ContentApiResponse,
  ContentListResponse,
  ContentVersionResponse,
  CreateContentRequest,
  UpdateContentRequest,
  ContentFilters,
} from "../components/content/types.ts";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api/v1";

/**
 * Build query string from filters and pagination
 */
function buildQueryString(
  filters: ContentFilters = {},
  page = 1,
  limit = 25,
  sort?: string,
  order: "asc" | "desc" = "desc",
): string {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));

  if (filters.blueprintId) params.set("blueprintId", filters.blueprintId);
  if (filters.status) params.set("status", filters.status);
  if (filters.search) params.set("search", filters.search);
  if (filters.createdBy) params.set("createdBy", filters.createdBy);
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  if (sort) {
    params.set("sort", sort);
    params.set("order", order);
  }

  return params.toString();
}

/**
 * Get all content items with filtering and pagination
 */
export async function getContents(
  filters: ContentFilters = {},
  page = 1,
  limit = 25,
  sort?: string,
  order: "asc" | "desc" = "desc",
): Promise<ContentListResponse> {
  try {
    const queryString = buildQueryString(filters, page, limit, sort, order);
    const response = await fetch(`${API_BASE_URL}/contents?${queryString}`);

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || "Failed to fetch contents",
      };
    }

    const responseData = await response.json();
    return {
      success: true,
      data: responseData.data,
      meta: responseData.meta,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch contents",
    };
  }
}

/**
 * Get a single content item by ID
 */
export async function getContentById(id: string): Promise<ContentApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/contents/${id}`);

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || "Failed to fetch content",
      };
    }

    const responseData = await response.json();
    return {
      success: true,
      data: responseData.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch content",
    };
  }
}

/**
 * Create a new content item
 */
export async function createContent(
  content: CreateContentRequest,
): Promise<ContentApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/contents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(content),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || "Failed to create content",
        errors: error.errors,
      };
    }

    const responseData = await response.json();
    return {
      success: true,
      data: responseData.data,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create content",
    };
  }
}

/**
 * Update an existing content item
 */
export async function updateContent(
  id: string,
  content: UpdateContentRequest,
): Promise<ContentApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/contents/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(content),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || "Failed to update content",
        errors: error.errors,
      };
    }

    const responseData = await response.json();
    return {
      success: true,
      data: responseData.data,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update content",
    };
  }
}

/**
 * Delete a content item
 */
export async function deleteContent(id: string): Promise<ContentApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/contents/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || "Failed to delete content",
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete content",
    };
  }
}

/**
 * Publish a content item
 */
export async function publishContent(id: string): Promise<ContentApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/contents/${id}/publish`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || "Failed to publish content",
      };
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to publish content",
    };
  }
}

/**
 * Unpublish a content item
 */
export async function unpublishContent(
  id: string,
): Promise<ContentApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/contents/${id}/unpublish`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || "Failed to unpublish content",
      };
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to unpublish content",
    };
  }
}

/**
 * Get content versions
 */
export async function getContentVersions(
  id: string,
): Promise<ContentVersionResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/contents/${id}/versions`);

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || "Failed to fetch content versions",
      };
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch content versions",
    };
  }
}

/**
 * Rollback content to a specific version
 */
export async function rollbackContent(
  id: string,
  versionId: string,
): Promise<ContentApiResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/contents/${id}/rollback/${versionId}`,
      {
        method: "POST",
      },
    );

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || "Failed to rollback content",
      };
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to rollback content",
    };
  }
}

/**
 * Bulk delete content items
 */
export async function bulkDeleteContents(
  ids: string[],
): Promise<{ success: boolean; deleted: number; errors: string[] }> {
  const errors: string[] = [];
  let deleted = 0;

  for (const id of ids) {
    const result = await deleteContent(id);
    if (result.success) {
      deleted++;
    } else {
      errors.push(`Failed to delete content ${id}: ${result.error}`);
    }
  }

  return {
    success: errors.length === 0,
    deleted,
    errors,
  };
}

/**
 * Bulk publish content items
 */
export async function bulkPublishContents(
  ids: string[],
): Promise<{ success: boolean; published: number; errors: string[] }> {
  const errors: string[] = [];
  let published = 0;

  for (const id of ids) {
    const result = await publishContent(id);
    if (result.success) {
      published++;
    } else {
      errors.push(`Failed to publish content ${id}: ${result.error}`);
    }
  }

  return {
    success: errors.length === 0,
    published,
    errors,
  };
}

/**
 * Bulk unpublish content items
 */
export async function bulkUnpublishContents(
  ids: string[],
): Promise<{ success: boolean; unpublished: number; errors: string[] }> {
  const errors: string[] = [];
  let unpublished = 0;

  for (const id of ids) {
    const result = await unpublishContent(id);
    if (result.success) {
      unpublished++;
    } else {
      errors.push(`Failed to unpublish content ${id}: ${result.error}`);
    }
  }

  return {
    success: errors.length === 0,
    unpublished,
    errors,
  };
}
