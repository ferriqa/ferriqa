<script lang="ts">
  import type { User } from "$lib/types";
  import * as m from "$lib/paraglide/messages.js";

  interface Props {
    users: User[];
    filters: {
      role?: string;
      isActive?: boolean;
      search?: string;
    };
    total: number;
    page: number;
    limit: number;
    onFilterChange: (filters: { role?: string; isActive?: boolean; search?: string }) => void;
    onPageChange: (page: number) => void;
    onEdit: (user: User) => void;
    onDelete: (user: User) => void;
    onToggleStatus: (user: User) => void;
  }

  let {
    users,
    filters,
    total,
    page,
    limit,
    onFilterChange,
    onPageChange,
    onEdit,
    onDelete,
    onToggleStatus,
  }: Props = $props();

  let searchQuery = $state(filters.search || "");
  let selectedRole = $state(filters.role || "");
  let selectedStatus = $state(filters.isActive !== undefined ? filters.isActive.toString() : "");

  const totalPages = $derived(Math.ceil(total / limit));

  function applyFilters() {
    onFilterChange({
      ...filters,
      search: searchQuery,
      role: selectedRole || undefined,
      isActive: selectedStatus === "" ? undefined : selectedStatus === "true",
    });
  }

  function clearFilters() {
    searchQuery = "";
    selectedRole = "";
    selectedStatus = "";
    onFilterChange({});
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function getRoleBadgeClass(role: string): string {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "editor":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "viewer":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  function getStatusBadgeClass(isActive: boolean): string {
    return isActive
      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
  }
</script>

<div class="space-y-6">
  <!-- Filters -->
  <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
    <div class="flex flex-col sm:flex-row gap-4">
      <div class="flex-1">
        <input
          type="text"
          placeholder={m.users_search_placeholder?.() || "Search users..."}
          bind:value={searchQuery}
          oninput={applyFilters}
          class="w-full py-2.5 px-4 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div class="w-full sm:w-48">
        <select
          bind:value={selectedRole}
          onchange={applyFilters}
          class="w-full py-2.5 px-4 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="editor">Editor</option>
          <option value="viewer">Viewer</option>
        </select>
      </div>

      <div class="w-full sm:w-40">
        <select
          bind:value={selectedStatus}
          onchange={applyFilters}
          class="w-full py-2.5 px-4 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {#if searchQuery || selectedRole || selectedStatus}
        <button
          type="button"
          onclick={clearFilters}
          class="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
        >
          {m.common_clear?.() || "Clear"}
        </button>
      {/if}
    </div>
  </div>

  <!-- Results count -->
  <div class="flex justify-between items-center">
    <p class="text-sm text-gray-600 dark:text-gray-400">
      {#if m.users_results_count}
        {m.users_results_count({ count: total })}
      {:else}
        {total} users
      {/if}
    </p>
  </div>

  <!-- Users table -->
  {#if users.length === 0}
    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
      <svg class="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
      <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        {m.users_no_items?.() || "No users found"}
      </h3>
      <p class="text-gray-500 dark:text-gray-400">
        {m.users_no_items_description?.() || "Get started by creating a new user."}
      </p>
    </div>
  {:else}
    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {m.users_name?.() || "Name"}
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {m.users_email?.() || "Email"}
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {m.users_role?.() || "Role"}
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {m.users_status?.() || "Status"}
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {m.users_created?.() || "Created"}
              </th>
              <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {m.users_actions?.() || "Actions"}
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {#each users as user (user.id)}
              <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                      <div class="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                        <span class="text-sm font-medium text-gray-600 dark:text-gray-300">
                          {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {user.name || "-"}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm text-gray-900 dark:text-gray-100">{user.email}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full {getRoleBadgeClass(user.role)}">
                    {user.role}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full {getStatusBadgeClass(user.isActive)}">
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(user.createdAt)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex justify-end gap-2">
                    <button
                      type="button"
                      onclick={() => onToggleStatus(user)}
                      class={user.isActive ? "text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300" : "text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"}
                    >
                      {user.isActive ? (m.users_deactivate?.() || "Deactivate") : (m.users_activate?.() || "Activate")}
                    </button>
                    <button
                      type="button"
                      onclick={() => onEdit(user)}
                      class="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                    >
                      {m.common_edit?.() || "Edit"}
                    </button>
                    <button
                      type="button"
                      onclick={() => onDelete(user)}
                      class="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                    >
                      {m.common_delete?.() || "Delete"}
                    </button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      {#if totalPages > 1}
        <div class="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
          <div class="flex-1 flex justify-between sm:hidden">
            <button
              type="button"
              onclick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              class="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              {m.common_previous?.() || "Previous"}
            </button>
            <button
              type="button"
              onclick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              class="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              {m.common_next?.() || "Next"}
            </button>
          </div>
          <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p class="text-sm text-gray-700 dark:text-gray-300">
                {#if m.pagination_showing}
                  {m.pagination_showing({ start: (page - 1) * limit + 1, end: Math.min(page * limit, total), total })}
                {:else}
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} users
                {/if}
              </p>
            </div>
            <div>
              <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  type="button"
                  onclick={() => onPageChange(page - 1)}
                  disabled={page <= 1}
                  class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  <span class="sr-only">{m.common_previous?.() || "Previous"}</span>
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                {#each Array(totalPages) as _, i}
                  {@const pageNum = i + 1}
                  <button
                    type="button"
                    onclick={() => onPageChange(pageNum)}
                    class="relative inline-flex items-center px-4 py-2 border text-sm font-medium {page === pageNum ? 'z-10 bg-blue-50 dark:bg-blue-900 border-blue-500 text-blue-600 dark:text-blue-200' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'}"
                  >
                    {pageNum}
                  </button>
                {/each}
                <button
                  type="button"
                  onclick={() => onPageChange(page + 1)}
                  disabled={page >= totalPages}
                  class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  <span class="sr-only">{m.common_next?.() || "Next"}</span>
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>
