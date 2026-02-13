<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import * as m from "$lib/paraglide/messages.js";
  import UserForm from "$lib/components/users/UserForm.svelte";
  import { getUser, updateUser } from "$lib/services/userApi";
  import type { User } from "$lib/types";

  const userId = page.params.id;

  let user = $state<User | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let saving = $state(false);

  async function loadUser() {
    loading = true;
    error = null;

    try {
      const response = await getUser(userId);

      if (response.success && response.data) {
        user = response.data;
      } else {
        error = response.error || "Failed to load user";
      }
    } catch (err) {
      error = err instanceof Error ? err.message : "An error occurred";
    } finally {
      loading = false;
    }
  }

  // Load user on mount
  $effect(() => {
    loadUser();
  });

  async function handleSubmit(data: {
    name: string;
    email: string;
    role: "admin" | "editor" | "viewer";
    password?: string;
    isActive: boolean;
  }) {
    saving = true;

    try {
      const response = await updateUser(userId, data);

      if (response.success) {
        goto("/users");
      } else {
        alert(response.error || "Failed to update user");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "An error occurred");
    } finally {
      saving = false;
    }
  }

  function handleCancel() {
    goto("/users");
  }
</script>

<div class="max-w-2xl mx-auto space-y-6">
  <!-- Header -->
  <div class="flex items-center gap-4">
    <button
      type="button"
      onclick={() => goto("/users")}
      class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
    >
      <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
    </button>
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
        {m.users_edit_title?.() || "Edit User"}
      </h1>
      <p class="text-gray-500 dark:text-gray-400 mt-1">
        {m.users_edit_description?.() || "Update user details and permissions"}
      </p>
    </div>
  </div>

  <!-- Loading State -->
  {#if loading}
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
            onclick={loadUser}
            class="mt-3 text-sm font-medium text-red-800 dark:text-gray-200 hover:text-red-600"
          >
            {m.common_retry?.() || "Try again"}
          </button>
        </div>
      </div>
    </div>
  {:else if user}
    <!-- User Form -->
    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      <UserForm
        {user}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  {/if}
</div>
