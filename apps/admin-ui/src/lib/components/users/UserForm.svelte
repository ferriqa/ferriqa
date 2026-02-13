<script lang="ts">
  import type { User } from "$lib/types";
  import * as m from "$lib/paraglide/messages.js";

  interface Props {
    user?: User;
    onSubmit: (data: {
      name: string;
      email: string;
      role: "admin" | "editor" | "viewer";
      password?: string;
      isActive: boolean;
    }) => void;
    onCancel: () => void;
  }

  let { user, onSubmit, onCancel }: Props = $props();

  let name = $state(user?.name || "");
  let email = $state(user?.email || "");
  let role = $state<User["role"]>(user?.role || "viewer");
  let password = $state("");
  let confirmPassword = $state("");
  let isActive = $state(user?.isActive ?? true);
  let errors = $state<Record<string, string>>({});

  function validate(): boolean {
    errors = {};

    if (!name.trim()) {
      errors.name = m.validation_required?.() || "Name is required";
    }

    if (!email.trim()) {
      errors.email = m.validation_required?.() || "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = m.validation_email?.() || "Invalid email address";
    }

    if (!user) {
      // Creating new user - password required
      if (!password) {
        errors.password = m.validation_required?.() || "Password is required";
      } else if (password.length < 8) {
        errors.password = m.validation_min_length?.({ min: 8 }) || "Password must be at least 8 characters";
      }

      if (password !== confirmPassword) {
        errors.confirmPassword = m.validation_password_match?.() || "Passwords do not match";
      }
    } else if (password) {
      // Updating user - password optional but if provided must be valid
      if (password.length < 8) {
        errors.password = m.validation_min_length?.({ min: 8 }) || "Password must be at least 8 characters";
      }

      if (password !== confirmPassword) {
        errors.confirmPassword = m.validation_password_match?.() || "Passwords do not match";
      }
    }

    return Object.keys(errors).length === 0;
  }

  function handleSubmit(e: Event) {
    e.preventDefault();

    if (!validate()) return;

    const data: Parameters<typeof onSubmit>[0] = {
      name: name.trim(),
      email: email.trim(),
      role,
      isActive,
    };

    if (password) {
      data.password = password;
    }

    onSubmit(data);
  }
</script>

<form onsubmit={handleSubmit} class="space-y-6">
  <!-- Name -->
  <div>
    <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      {m.users_name?.() || "Name"} *
    </label>
    <input
      type="text"
      id="name"
      bind:value={name}
      class="w-full py-2.5 px-4 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 {errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}"
      placeholder={m.users_name_placeholder?.() || "Enter full name"}
    />
    {#if errors.name}
      <p class="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
    {/if}
  </div>

  <!-- Email -->
  <div>
    <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      {m.users_email?.() || "Email"} *
    </label>
    <input
      type="email"
      id="email"
      bind:value={email}
      class="w-full py-2.5 px-4 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 {errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}"
      placeholder={m.users_email_placeholder?.() || "Enter email address"}
    />
    {#if errors.email}
      <p class="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
    {/if}
  </div>

  <!-- Role -->
  <div>
    <label for="role" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      {m.users_role?.() || "Role"} *
    </label>
    <select
      id="role"
      bind:value={role}
      class="w-full py-2.5 px-4 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
    >
      <option value="admin">{m.users_role_admin?.() || "Admin"}</option>
      <option value="editor">{m.users_role_editor?.() || "Editor"}</option>
      <option value="viewer">{m.users_role_viewer?.() || "Viewer"}</option>
    </select>
    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
      {m.users_role_description?.() || "Admin: Full access, Editor: Can manage content, Viewer: Read-only access"}
    </p>
  </div>

  <!-- Password -->
  <div>
    <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      {m.users_password?.() || "Password"}
      {#if !user}
        <span class="text-red-500">*</span>
      {:else}
        <span class="text-gray-500 text-xs font-normal ml-1">
          ({m.users_leave_blank?.() || "Leave blank to keep current password"})
        </span>
      {/if}
    </label>
    <input
      type="password"
      id="password"
      bind:value={password}
      class="w-full py-2.5 px-4 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 {errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}"
      placeholder={m.users_password_placeholder?.() || "Enter password"}
    />
    {#if errors.password}
      <p class="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
    {:else}
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {m.users_password_hint?.() || "Minimum 8 characters"}
      </p>
    {/if}
  </div>

  <!-- Confirm Password -->
  {#if password}
    <div>
      <label for="confirmPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {m.users_confirm_password?.() || "Confirm Password"} *
      </label>
      <input
        type="password"
        id="confirmPassword"
        bind:value={confirmPassword}
        class="w-full py-2.5 px-4 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 {errors.confirmPassword ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}"
        placeholder={m.users_confirm_password_placeholder?.() || "Confirm password"}
      />
      {#if errors.confirmPassword}
        <p class="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword}</p>
      {/if}
    </div>
  {/if}

  <!-- Status -->
  <div>
    <label class="flex items-center space-x-3">
      <input
        type="checkbox"
        bind:checked={isActive}
        class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
      />
      <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
        {m.users_active?.() || "Active"}
      </span>
    </label>
    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400 ml-7">
      {m.users_active_description?.() || "Inactive users cannot log in"}
    </p>
  </div>

  <!-- Actions -->
  <div class="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
    <button
      type="button"
      onclick={onCancel}
      class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    >
      {m.common_cancel?.() || "Cancel"}
    </button>
    <button
      type="submit"
      class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    >
      {user ? (m.common_save?.() || "Save") : (m.common_create?.() || "Create")}
    </button>
  </div>
</form>
