import type {
  Webhook,
  WebhookDelivery,
  CreateWebhookRequest,
  UpdateWebhookRequest,
} from "$lib/types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export interface WebhookListResponse {
  success: boolean;
  data?: {
    data: Webhook[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  error?: string;
}

export interface WebhookResponse {
  success: boolean;
  data?: Webhook;
  error?: string;
}

export interface WebhookDeliveryListResponse {
  success: boolean;
  data?: {
    data: WebhookDelivery[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  error?: string;
}

export interface WebhookTestResponse {
  success: boolean;
  data?: {
    success: boolean;
    statusCode?: number;
    duration: number;
    error?: string;
  };
  error?: string;
}

export interface WebhookFilters {
  event?: string;
  isActive?: boolean;
  search?: string;
}

/**
 * List all webhooks with pagination and filters
 */
export async function listWebhooks(
  page = 1,
  limit = 25,
  filters?: WebhookFilters,
): Promise<WebhookListResponse> {
  try {
    const params = new URLSearchParams();
    params.set("page", page.toString());
    params.set("limit", limit.toString());

    if (filters?.event) params.set("event", filters.event);
    if (filters?.isActive !== undefined)
      params.set("isActive", filters.isActive.toString());
    if (filters?.search) params.set("search", filters.search);

    const response = await fetch(
      `${API_BASE_URL}/v1/webhooks?${params.toString()}`,
    );

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || "Failed to fetch webhooks",
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
        error instanceof Error ? error.message : "Failed to fetch webhooks",
    };
  }
}

/**
 * Get a single webhook by ID
 */
export async function getWebhook(id: number): Promise<WebhookResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/webhooks/${id}`);

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || "Failed to fetch webhook",
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
      error: error instanceof Error ? error.message : "Failed to fetch webhook",
    };
  }
}

/**
 * Create a new webhook
 */
export async function createWebhook(
  webhook: CreateWebhookRequest,
): Promise<WebhookResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/webhooks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(webhook),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || "Failed to create webhook",
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
        error instanceof Error ? error.message : "Failed to create webhook",
    };
  }
}

/**
 * Update an existing webhook
 */
export async function updateWebhook(
  id: number,
  webhook: UpdateWebhookRequest,
): Promise<WebhookResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/webhooks/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(webhook),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || "Failed to update webhook",
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
        error instanceof Error ? error.message : "Failed to update webhook",
    };
  }
}

/**
 * Delete a webhook
 */
export async function deleteWebhook(
  id: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/webhooks/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || "Failed to delete webhook",
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete webhook",
    };
  }
}

/**
 * Test a webhook by sending a test request
 */
export async function testWebhook(
  id: number,
  event = "content.created",
  data?: unknown,
): Promise<WebhookTestResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/webhooks/${id}/test`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ event, data }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || "Failed to test webhook",
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
      error: error instanceof Error ? error.message : "Failed to test webhook",
    };
  }
}

/**
 * Get webhook delivery history
 */
export async function getWebhookDeliveries(
  id: number,
  page = 1,
  limit = 25,
): Promise<WebhookDeliveryListResponse> {
  try {
    const params = new URLSearchParams();
    params.set("page", page.toString());
    params.set("limit", limit.toString());

    const response = await fetch(
      `${API_BASE_URL}/v1/webhooks/${id}/deliveries?${params.toString()}`,
    );

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || "Failed to fetch deliveries",
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
        error instanceof Error ? error.message : "Failed to fetch deliveries",
    };
  }
}
