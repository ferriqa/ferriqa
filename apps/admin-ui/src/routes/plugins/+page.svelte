<script lang="ts">
  import { onMount } from "svelte";
  import { getPlugins, type Plugin } from "$lib/services/pluginApi";
  import * as m from "$lib/paraglide/messages.js";

  let plugins = $state<Plugin[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);

  async function loadPlugins() {
    loading = true;
    error = null;

    try {
      const response = await getPlugins();
      if (response.success && response.data) {
        plugins = response.data;
      } else {
        error = response.error || "Failed to load plugins";
      }
    } catch (err) {
      error = err instanceof Error ? err.message : "An error occurred";
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    loadPlugins();
  });
</script>

<div class="space-y-6">
  <div class="flex justify-between items-center">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
      {m.plugins_title?.() || "Plugins"}
    </h1>
  </div>

  {#if loading}
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p class="text-gray-600">{m.common_loading()}</p>
    </div>
  {:else if error}
    <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
      {error}
    </div>
  {:else if plugins.length === 0}
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
      <div class="mb-4">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      </div>
      <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        No plugins configured
      </h3>
      <p class="text-gray-500 dark:text-gray-400">
        Get started by enabling plugins in your configuration
      </p>
    </div>
  {:else}
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {#each plugins as plugin}
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {plugin.name}
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                v{plugin.version}
              </p>
            </div>
            <span
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {plugin.isEnabled
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}"
            >
              {plugin.isEnabled ? 'Active' : 'Inactive'}
            </span>
          </div>

          {#if plugin.description}
            <p class="mt-3 text-sm text-gray-600 dark:text-gray-300">
              {plugin.description}
            </p>
          {/if}

          {#if plugin.author}
            <p class="mt-4 text-xs text-gray-500 dark:text-gray-400">
              Author: {plugin.author}
            </p>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>
