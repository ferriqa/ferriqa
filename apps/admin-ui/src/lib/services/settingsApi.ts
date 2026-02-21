const API_BASE_URL = import.meta.env.VITE_API_URL || "/api/v1";

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  prefix: string;
  permissions: string[];
  rateLimit: number;
  expiresAt?: string;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateApiKeyRequest {
  name: string;
  permissions: string[];
  rateLimit?: number;
  expiresInDays?: number;
}

export interface UpdateApiKeyRequest {
  name?: string;
  permissions?: string[];
  rateLimit?: number;
  expiresInDays?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ApiKeyListResponse {
  data: ApiKey[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export async function listApiKeys(
  page = 1,
  limit = 25,
): Promise<ApiResponse<ApiKeyListResponse>> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api-keys?page=${page}&limit=${limit}`,
    );

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || "Failed to fetch API keys",
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
        error instanceof Error ? error.message : "Failed to fetch API keys",
    };
  }
}

export async function getApiKey(id: string): Promise<ApiResponse<ApiKey>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api-keys/${id}`);

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || "Failed to fetch API key",
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
      error: error instanceof Error ? error.message : "Failed to fetch API key",
    };
  }
}

export async function createApiKey(
  request: CreateApiKeyRequest,
): Promise<ApiResponse<ApiKey>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api-keys`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || "Failed to create API key",
      };
    }

    // Response is already {success: true, data: {...}}
    return await response.json();
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create API key",
    };
  }
}

export async function updateApiKey(
  id: string,
  request: UpdateApiKeyRequest,
): Promise<ApiResponse<ApiKey>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api-keys/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || "Failed to update API key",
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
        error instanceof Error ? error.message : "Failed to update API key",
    };
  }
}

export async function deleteApiKey(id: string): Promise<ApiResponse<void>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api-keys/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || "Failed to delete API key",
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete API key",
    };
  }
}

export async function rotateApiKey(id: string): Promise<ApiResponse<ApiKey>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api-keys/${id}/rotate`, {
      method: "POST",
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || "Failed to rotate API key",
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
        error instanceof Error ? error.message : "Failed to rotate API key",
    };
  }
}
