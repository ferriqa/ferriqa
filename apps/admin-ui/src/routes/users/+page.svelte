<script lang="ts">
  import { goto } from "$app/navigation";
  import * as m from "$lib/paraglide/messages.js";
  import UserList from "$lib/components/users/UserList.svelte";
  import { listUsers, deleteUser, updateUser } from "$lib/services/userApi";
  import type { User } from "$lib/types";

  let users = $state<User[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let page = $state(1);
  let limit = $state(25);
  let total = $state(0);
  let filters = $state<{
    role?: string;
    isActive?: boolean;
    search?: string;
  }>({});
  let deleteConfirmUser = $state<User | null>(null);

  async function loadUsers() {
    loading = true;
    error = null;

    try {
      const response = await listUsers(page, limit, filters);

      if (response.success && response.data) {
        users = response.data.data;
        total = response.data.pagination?.total || 0;
      } else {
        error = response.error || "Failed to load users";
      }
    } catch (err) {
      error = err instanceof Error ? err.message : "An error occurred";
    } finally {
      loading = false;
    }
  }

  // Load users on mount and when filters/page change
  $effect(() => {
    loadUsers();
  });

  function handleFilterChange(newFilters: typeof filters) {
    filters = newFilters;
    page = 1; // Reset to first page when filters change
  }

  function handlePageChange(newPage: number) {
    page = newPage;
  }

  function handleEdit(user: User) {
    goto(`/users/${user.id}`);
  }

  function handleDelete(user: User) {
    deleteConfirmUser = user;
  }

  async function confirmDelete() {
    if (!deleteConfirmUser) return;

    try {
      const response = await deleteUser(deleteConfirmUser.id);

      if (response.success) {
        users = users.filter((u) => u.id !== deleteConfirmUser!.id);
        total--;
        deleteConfirmUser = null;
      } else {
        alert(response.error || "Failed to delete user");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "An error occurred");
    }
  }

  async function handleToggleStatus(user: User) {
    try {
      const response = await updateUser(user.id, {
        isActive: !user.isActive,
      });

      if (response.success && response.data) {
        // Update the user in the list
        users = users.map((u) =>
          u.id === user.id ? { ...u, isActive: !u.isActive } : u,
        );
      } else {
        alert(response.error || "Failed to update user status");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "An error occurred");
    }
  }

  function handleCreate() {
    goto("/users/new");
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex justify-between items-center">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
        {m.users_title?.() || "Users"}
      </h1>
      <p class="text-gray-500 dark:text-gray-400 mt-1">
        {m.users_description?.() || "Manage user accounts and permissions"}
      </p>
    </div>

    <button
      type="button"
      onclick={handleCreate}
      class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    >
      <svg class="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
      {m.users_create_button?.() || "Create User"}
    </button>
  </div>

  <!-- Loading State -->
  {#if loading && users.length === 0}
    <div class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  {:else if error}
    <!-- Error State -->
    <div class="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800 dark:text-gray-200">
            {m.common_error?.() || "Error"}
          </h3>
          <p class="mt-2 text-sm text-red-700 dark:text-gray-300">{error}</p>
          <button
            type="button"
            onclick={loadUsers}
            class="mt-3 text-sm font-medium text-red-800 dark:text-gray-200 hover:text-red-600"
          >
            {m.common_retry?.() || "Try again"}
          </button>
        </div>
      </div>
    </div>
  {:else}
    <!-- User List -->
    <UserList
      {users}
      {filters}
      {total}
      {page}
      {limit}
      onFilterChange={handleFilterChange}
      onPageChange={handlePageChange}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onToggleStatus={handleToggleStatus}
    />
  {/if}
</div>

<!-- Delete Confirmation Modal -->
{#if deleteConfirmUser}
  <div class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onclick={() => deleteConfirmUser = null}></div>
      <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
      <div class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
        <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="sm:flex sm:items-start">
            <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 sm:mx-0 sm:h-10 sm:w-10">
              <svg class="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100" id="modal-title">
                {m.users_delete_confirm_title?.() || "Delete User"}
              </h3>
              <div class="mt-2">
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {m.users_delete_confirm_message?.({ name: deleteConfirmUser.name || deleteConfirmUser.email }) || `Are you sure you want to delete "${deleteConfirmUser.name || deleteConfirmUser.email}"? This action cannot be undone.`}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div class="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button
            type="button"
            onclick={confirmDelete}
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
          >
            {m.common_delete?.() || "Delete"}
          </button>
          <button
            type="button"
            onclick={() => deleteConfirmUser = null}
            class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
          >
            {m.common_cancel?.() || "Cancel"}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
