<script lang="ts">
  import { goto } from "$app/navigation";
  import * as m from "$lib/paraglide/messages.js";
  import UserForm from "$lib/components/users/UserForm.svelte";
  import { createUser } from "$lib/services/userApi";

  let saving = $state(false);

  async function handleSubmit(data: {
    name: string;
    email: string;
    role: "admin" | "editor" | "viewer";
    password?: string;
    isActive: boolean;
  }) {
    saving = true;

    try {
      const response = await createUser({
        name: data.name,
        email: data.email,
        role: data.role,
        password: data.password!,
        isActive: data.isActive,
      });

      if (response.success) {
        goto("/users");
      } else {
        alert(response.error || "Failed to create user");
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
        {m.users_create_title?.() || "Create User"}
      </h1>
      <p class="text-gray-500 dark:text-gray-400 mt-1">
        {m.users_create_description?.() || "Add a new user to the system"}
      </p>
    </div>
  </div>

  <!-- User Form -->
  <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
    <UserForm
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    />
  </div>
</div>
