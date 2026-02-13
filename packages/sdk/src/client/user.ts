/**
 * User Client for Ferriqa SDK
 *
 * Type-safe API client for user management operations
 */

import type { HTTPClient } from "./http.ts";
import type {
  User,
  PaginatedResponse,
  PaginationParams,
} from "../types/index.ts";

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

export class UserClient {
  constructor(private http: HTTPClient) {}

  /**
   * List all users with pagination and filters
   */
  async list(
    params?: PaginationParams & UserFilters,
  ): Promise<PaginatedResponse<User>> {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.set("page", params.page.toString());
    if (params?.limit) queryParams.set("limit", params.limit.toString());
    if (params?.sort) queryParams.set("sort", params.sort);
    if (params?.order) queryParams.set("order", params.order);
    if (params?.role) queryParams.set("role", params.role);
    if (params?.isActive !== undefined)
      queryParams.set("isActive", params.isActive.toString());
    if (params?.search) queryParams.set("search", params.search);

    const query = queryParams.toString();
    const url = `/api/v1/users${query ? `?${query}` : ""}`;

    const response = await this.http.get<PaginatedResponse<User>>(url);
    return response.data;
  }

  /**
   * Get a single user by ID
   */
  async get(id: string): Promise<User> {
    const response = await this.http.get<{ data: User }>(`/api/v1/users/${id}`);
    return response.data.data;
  }

  /**
   * Create a new user
   */
  async create(data: CreateUserRequest): Promise<User> {
    const response = await this.http.post<{ data: User }>(
      "/api/v1/users",
      data,
    );
    return response.data.data;
  }

  /**
   * Update an existing user
   */
  async update(id: string, data: UpdateUserRequest): Promise<User> {
    const response = await this.http.put<{ data: User }>(
      `/api/v1/users/${id}`,
      data,
    );
    return response.data.data;
  }

  /**
   * Delete a user
   */
  async delete(id: string): Promise<void> {
    await this.http.delete(`/api/v1/users/${id}`);
  }

  /**
   * Get current authenticated user
   */
  async me(): Promise<User> {
    const response = await this.http.get<{ data: User }>("/api/v1/users/me");
    return response.data.data;
  }
}
