<script lang="ts">
  import { onMount } from "svelte";
  import * as m from "$lib/paraglide/messages.js";
  import {
    listApiKeys,
    createApiKey,
    deleteApiKey,
    rotateApiKey,
    type ApiKey,
    type CreateApiKeyRequest,
  } from "$lib/services/settingsApi";

  let activeTab = $state<"general" | "api-keys" | "appearance">("general");

  let siteName = $state("Ferriqa");
  let siteDescription = $state("Headless CMS Admin Panel");
  let siteUrl = $state("http://localhost:3000");
  let language = $state("tr");
  let saving = $state(false);
  let saveSuccess = $state(false);

  let apiKeys = $state<ApiKey[]>([]);
  let apiKeysLoading = $state(true);
  let apiKeysError = $state<string | null>(null);
  let showCreateKeyModal = $state(false);
  let newKeyName = $state("");
  let newKeyPermissions = $state<string[]>(["content:read"]);
  let creatingKey = $state(false);
  let createdKey = $state<string | null>(null);

  let darkMode = $state(false);
  let mounted = $state(false);

  onMount(() => {
    const savedDarkMode = localStorage.getItem("theme");
    darkMode = savedDarkMode === "dark";
    mounted = true;

    if (darkMode) {
      document.documentElement.classList.add("dark");
    }

    loadApiKeys();
  });

  function toggleDarkMode() {
    darkMode = !darkMode;
    localStorage.setItem("theme", darkMode ? "dark" : "light");
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }

  async function loadApiKeys() {
    apiKeysLoading = true;
    apiKeysError = null;

    try {
      const response = await listApiKeys();

      if (response.success && response.data) {
        apiKeys = response.data.data;
      } else {
        apiKeysError = response.error || "Failed to load API keys";
      }
    } catch (err) {
      apiKeysError = err instanceof Error ? err.message : "An error occurred";
    } finally {
      apiKeysLoading = false;
    }
  }

  async function handleSaveGeneral() {
    saving = true;
    saveSuccess = false;

    localStorage.setItem("siteName", siteName);
    localStorage.setItem("siteDescription", siteDescription);
    localStorage.setItem("siteUrl", siteUrl);
    localStorage.setItem("language", language);

    saving = false;
    saveSuccess = true;

    setTimeout(() => {
      saveSuccess = false;
    }, 3000);
  }

  async function handleCreateApiKey() {
    if (!newKeyName.trim()) return;

    creatingKey = true;

    try {
      const request: CreateApiKeyRequest = {
        name: newKeyName,
        permissions: newKeyPermissions,
        rateLimit: 100,
        expiresInDays: 365,
      };

      const response = await createApiKey(request);

      if (response.success && response.data) {
        createdKey = response.data.key;
        apiKeys = [...apiKeys, response.data];
      } else {
        alert(response.error || "Failed to create API key");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "An error occurred");
    } finally {
      creatingKey = false;
    }
  }

  async function handleDeleteApiKey(id: string) {
    if (!confirm("Are you sure you want to delete this API key?")) return;

    try {
      const response = await deleteApiKey(id);

      if (response.success) {
        apiKeys = apiKeys.filter((k) => k.id !== id);
      } else {
        alert(response.error || "Failed to delete API key");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "An error occurred");
    }
  }

  async function handleRotateApiKey(id: string) {
    if (!confirm("Are you sure you want to rotate this API key? The old key will become invalid.")) {
      return;
    }

    try {
      const response = await rotateApiKey(id);

      if (response.success && response.data) {
        apiKeys = apiKeys.map((k) => (k.id === id ? response.data! : k));
        alert("API key rotated successfully");
      } else {
        alert(response.error || "Failed to rotate API key");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "An error occurred");
    }
  }

  function closeCreateModal() {
    showCreateKeyModal = false;
    newKeyName = "";
    newKeyPermissions = ["content:read"];
    createdKey = null;
  }

  const availablePermissions = [
    { value: "content:read", label: "Content: Read" },
    { value: "content:write", label: "Content: Write" },
    { value: "content:delete", label: "Content: Delete" },
    { value: "blueprint:read", label: "Blueprint: Read" },
    { value: "blueprint:write", label: "Blueprint: Write" },
    { value: "blueprint:delete", label: "Blueprint: Delete" },
    { value: "media:read", label: "Media: Read" },
    { value: "media:write", label: "Media: Write" },
    { value: "media:delete", label: "Media: Delete" },
    { value: "user:read", label: "User: Read" },
    { value: "user:write", label: "User: Write" },
    { value: "user:delete", label: "User: Delete" },
    { value: "webhook:read", label: "Webhook: Read" },
    { value: "webhook:write", label: "Webhook: Write" },
    { value: "webhook:delete", label: "Webhook: Delete" },
  ];
</script>

<div class="space-y-6">
  <div class="flex justify-between items-center">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
        {m.settings_title?.() || "Settings"}
      </h1>
      <p class="text-gray-500 dark:text-gray-400 mt-1">
        {m.settings_description?.() || "Manage your application settings"}
      </p>
    </div>
  </div>

  <div class="border-b border-gray-200 dark:border-gray-700">
    <nav class="-mb-px flex gap-6">
      <button
        class="py-4 px-1 border-b-2 font-medium text-sm transition-colors {activeTab ===
        'general'
          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'}"
        onclick={() => (activeTab = "general")}
      >
        {m.settings_tab_general?.() || "General"}
      </button>
      <button
        class="py-4 px-1 border-b-2 font-medium text-sm transition-colors {activeTab ===
        'api-keys'
          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'}"
        onclick={() => (activeTab = "api-keys")}
      >
        {m.settings_tab_api_keys?.() || "API Keys"}
      </button>
      <button
        class="py-4 px-1 border-b-2 font-medium text-sm transition-colors {activeTab ===
        'appearance'
          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'}"
        onclick={() => (activeTab = "appearance")}
      >
        {m.settings_tab_appearance?.() || "Appearance"}
      </button>
    </nav>
  </div>

  {#if activeTab === "general"}
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <form
        class="space-y-6"
        onsubmit={(e) => {
          e.preventDefault();
          handleSaveGeneral();
        }}
      >
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              for="siteName"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {m.settings_site_name?.() || "Site Name"}
            </label>
            <input
              type="text"
              id="siteName"
              bind:value={siteName}
              class="py-2.5 px-4 block w-full border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          <div>
            <label
              for="siteUrl"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {m.settings_site_url?.() || "Site URL"}
            </label>
            <input
              type="url"
              id="siteUrl"
              bind:value={siteUrl}
              class="py-2.5 px-4 block w-full border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>
        </div>

        <div>
          <label
            for="siteDescription"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            {m.settings_site_description?.() || "Site Description"}
          </label>
          <textarea
            id="siteDescription"
            bind:value={siteDescription}
            rows={3}
            class="py-2.5 px-4 block w-full border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
          ></textarea>
        </div>

        <div>
          <label
            for="language"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            {m.settings_language?.() || "Language"}
          </label>
          <select
            id="language"
            bind:value={language}
            class="py-2.5 px-4 block w-full border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="tr">Türkçe</option>
            <option value="en">English</option>
          </select>
        </div>

        <div class="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {#if saving}
              <svg
                class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            {/if}
            {m.common_save?.() || "Save"}
          </button>

          {#if saveSuccess}
            <span class="text-green-600 dark:text-green-400 text-sm flex items-center">
              <svg
                class="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {m.settings_save_success?.() || "Saved successfully"}
            </span>
          {/if}
        </div>
      </form>
    </div>
  {:else if activeTab === "api-keys"}
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {m.settings_api_keys_title?.() || "API Keys"}
          </h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {m.settings_api_keys_description?.() ||
              "Manage API keys for programmatic access"}
          </p>
        </div>
        <button
          type="button"
          onclick={() => (showCreateKeyModal = true)}
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg
            class="-ml-1 mr-2 h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          {m.settings_create_api_key?.() || "Create API Key"}
        </button>
      </div>

      {#if apiKeysLoading}
        <div class="flex justify-center items-center py-12">
          <div
            class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
          ></div>
        </div>
      {:else if apiKeysError}
        <div
          class="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4"
        >
          <p class="text-sm text-red-700 dark:text-gray-300">{apiKeysError}</p>
          <button
            type="button"
            onclick={loadApiKeys}
            class="mt-2 text-sm font-medium text-red-800 dark:text-gray-200 hover:text-red-600"
          >
            {m.common_retry?.() || "Try again"}
          </button>
        </div>
      {:else if apiKeys.length === 0}
        <div class="text-center py-12">
          <svg
            class="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
            />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            {m.settings_no_api_keys?.() || "No API keys"}
          </h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {m.settings_no_api_keys_description?.() ||
              "Create your first API key to get started"}
          </p>
        </div>
      {:else}
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th
                  scope="col"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  {m.common_name?.() || "Name"}
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  {m.settings_key_prefix?.() || "Key Prefix"}
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  {m.common_type?.() || "Type"}
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  {m.settings_created?.() || "Created"}
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  {m.common_actions?.() || "Actions"}
                </th>
              </tr>
            </thead>
            <tbody
              class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700"
            >
              {#each apiKeys as key}
                <tr>
                  <td
                    class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100"
                  >
                    {key.name}
                  </td>
                  <td
                    class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono"
                  >
                    {key.prefix}...
                  </td>
                  <td
                    class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"
                  >
                    {key.permissions.length} {m.settings_permissions?.() || "permissions"}
                  </td>
                  <td
                    class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"
                  >
                    {new Date(key.createdAt).toLocaleDateString()}
                  </td>
                  <td
                    class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
                  >
                    <button
                      type="button"
                      onclick={() => handleRotateApiKey(key.id)}
                      class="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 mr-4"
                    >
                      {m.settings_rotate?.() || "Rotate"}
                    </button>
                    <button
                      type="button"
                      onclick={() => handleDeleteApiKey(key.id)}
                      class="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                    >
                      {m.common_delete?.() || "Delete"}
                    </button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  {:else if activeTab === "appearance"}
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
        {m.settings_appearance_title?.() || "Appearance"}
      </h2>

      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-sm font-medium text-gray-900 dark:text-gray-100">
              {m.settings_dark_mode?.() || "Dark Mode"}
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {m.settings_dark_mode_description?.() ||
                "Enable dark mode for the admin interface"}
            </p>
          </div>
          <button
            type="button"
            onclick={toggleDarkMode}
            aria-label={darkMode ? 'Disable dark mode' : 'Enable dark mode'}
            class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 {darkMode
              ? 'bg-blue-600'
              : 'bg-gray-200'}"
            role="switch"
            aria-checked={darkMode}
          >
            <span
              class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out {darkMode
                ? 'translate-x-5'
                : 'translate-x-0'}"
            ></span>
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

{#if showCreateKeyModal}
  <div
    class="fixed inset-0 z-50 overflow-y-auto"
    aria-labelledby="modal-title"
    role="dialog"
    aria-modal="true"
  >
    <div
      class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"
    >
      <div
        class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity cursor-default"
        aria-hidden="true"
        onclick={closeCreateModal}
      ></div>
      <span
        class="hidden sm:inline-block sm:align-middle sm:h-screen"
        aria-hidden="true">&#8203;</span
      >
      <div
        class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
      >
        {#if createdKey}
          <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="sm:flex sm:items-start">
              <div
                class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 sm:mx-0 sm:h-10 sm:w-10"
              >
                <svg
                  class="h-6 w-6 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3
                  class="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100"
                  id="modal-title"
                >
                  {m.settings_api_key_created?.() || "API Key Created"}
                </h3>
                <div class="mt-4">
                  <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    {m.settings_copy_key_warning?.() ||
                      "Copy this key now. You won't be able to see it again!"}
                  </p>
                  <div class="flex items-center gap-2">
                    <code
                      class="flex-1 bg-gray-100 dark:bg-gray-700 rounded p-2 text-sm font-mono break-all"
                      >{createdKey}</code
                    >
                    <button
                      type="button"
                      aria-label="Copy API key to clipboard"
                      onclick={async () => {
                        try {
                          await navigator.clipboard.writeText(createdKey || "");
                        } catch {
                          alert("Failed to copy to clipboard");
                        }
                      }}
                      class="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      <svg
                        class="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div
            class="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse"
          >
            <button
              type="button"
              onclick={closeCreateModal}
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              {m.common_close?.() || "Close"}
            </button>
          </div>
        {:else}
          <form
            onsubmit={(e) => {
              e.preventDefault();
              handleCreateApiKey();
            }}
          >
            <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div class="sm:flex sm:items-start">
                <div
                  class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 sm:mx-0 sm:h-10 sm:w-10"
                >
                  <svg
                    class="h-6 w-6 text-blue-600 dark:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                    />
                  </svg>
                </div>
                <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                  <h3
                    class="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100"
                    id="modal-title"
                  >
                    {m.settings_create_api_key?.() || "Create API Key"}
                  </h3>
                  <div class="mt-4 space-y-4">
                    <div>
                      <label
                        for="keyName"
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        {m.common_name?.() || "Name"}
                      </label>
                      <input
                        type="text"
                        id="keyName"
                        bind:value={newKeyName}
                        placeholder="My API Key"
                        class="mt-1 py-2.5 px-4 block w-full border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                        required
                      />
                    </div>
                    <div>
                      <span
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        {m.settings_permissions?.() || "Permissions"}
                      </span>
                      <div class="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                        {#each availablePermissions as permission}
                          <label
                            class="inline-flex items-center text-sm text-gray-700 dark:text-gray-300"
                          >
                            <input
                              type="checkbox"
                              bind:group={newKeyPermissions}
                              value={permission.value}
                              class="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
                            />
                            <span class="ml-2">{permission.label}</span>
                          </label>
                        {/each}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div
              class="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse"
            >
              <button
                type="submit"
                disabled={creatingKey || !newKeyName.trim()}
                class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {#if creatingKey}
                  <svg
                    class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    ></circle>
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                {/if}
                {m.common_create?.() || "Create"}
              </button>
              <button
                type="button"
                onclick={closeCreateModal}
                class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                {m.common_cancel?.() || "Cancel"}
              </button>
            </div>
          </form>
        {/if}
      </div>
    </div>
  </div>
{/if}
