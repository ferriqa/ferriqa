import type { User } from "$lib/types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export interface UserListResponse {
  success: boolean;
  data?: {
    data: User[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  error?: string;
}

export interface UserResponse {
  success: boolean;
  data?: User;
  error?: string;
}

export interface CreateUserRequest {
  email: string;
  name: string;
  role: "admin" | "editor" | "viewer";
  password: string;
  isActive?: boolean;
}

export interface UpdateUserRequest {
  email?: string;
  name?: string;
  role?: "admin" | "editor" | "viewer";
  password?: string;
  isActive?: boolean;
}

export interface UserFilters {
  role?: string;
  isActive?: boolean;
  search?: string;
}

/**
 * List all users with pagination and filters
 */
export async function listUsers(
  page = 1,
  limit = 25,
  filters?: UserFilters,
): Promise<UserListResponse> {
  try {
    const params = new URLSearchParams();
    params.set("page", page.toString());
    params.set("limit", limit.toString());

    if (filters?.role) params.set("role", filters.role);
    if (filters?.isActive !== undefined)
      params.set("isActive", filters.isActive.toString());
    if (filters?.search) params.set("search", filters.search);

    const response = await fetch(
      `${API_BASE_URL}/v1/users?${params.toString()}`,
    );

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || "Failed to fetch users",
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
      error: error instanceof Error ? error.message : "Failed to fetch users",
    };
  }
}

/**
 * Get a single user by ID
 */
export async function getUser(id: string): Promise<UserResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/users/${id}`);

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || "Failed to fetch user",
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
      error: error instanceof Error ? error.message : "Failed to fetch user",
    };
  }
}

/**
 * Create a new user
 */
export async function createUser(
  user: CreateUserRequest,
): Promise<UserResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(user),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || "Failed to create user",
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
      error: error instanceof Error ? error.message : "Failed to create user",
    };
  }
}

/**
 * Update an existing user
 */
export async function updateUser(
  id: string,
  user: UpdateUserRequest,
): Promise<UserResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/users/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(user),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || "Failed to update user",
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
      error: error instanceof Error ? error.message : "Failed to update user",
    };
  }
}

/**
 * Delete a user
 */
export async function deleteUser(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/users/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || "Failed to delete user",
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete user",
    };
  }
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<UserResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/users/me`);

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || "Failed to fetch current user",
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
        error instanceof Error ? error.message : "Failed to fetch current user",
    };
  }
}
