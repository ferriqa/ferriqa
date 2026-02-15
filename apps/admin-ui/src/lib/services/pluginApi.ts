export interface Plugin {
  id: string;
  name: string;
  description?: string;
  version: string;
  author?: string;
  isEnabled: boolean;
  config: Record<string, unknown>;
}

export interface PluginListResponse {
  success: boolean;
  data?: Plugin[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export async function getPlugins(): Promise<PluginListResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/plugins`);

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || "Failed to fetch plugins",
      };
    }

    const responseData = await response.json();
    return {
      success: true,
      data: responseData.data,
      pagination: responseData.pagination,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch plugins",
    };
  }
}

export async function getPlugin(id: string): Promise<{
  success: boolean;
  data?: Plugin;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/plugins/${id}`);

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || "Failed to fetch plugin",
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
      error: error instanceof Error ? error.message : "Failed to fetch plugin",
    };
  }
}
