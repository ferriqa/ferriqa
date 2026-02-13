<script lang="ts">
  import { getContentVersions, rollbackContent } from "../../services/contentApi";
  import * as m from "$lib/paraglide/messages.js";

  interface Props {
    contentId: string;
    onRollback?: () => void;
  }

  let { contentId, onRollback }: Props = $props();

  interface Version {
    id: string;
    versionNumber: number;
    createdBy?: string;
    changeSummary?: string;
    createdAt: string;
  }

  let versions = $state<Version[]>([]);
  let isLoading = $state(true);
  let error = $state<string | null>(null);
  let isRollingBack = $state(false);
  let selectedVersion = $state<Version | null>(null);
  let showConfirmDialog = $state(false);

  async function loadVersions() {
    isLoading = true;
    error = null;

    const result = await getContentVersions(contentId);

    if (result.success && result.data) {
      versions = result.data;
    } else {
      error = result.error || "Failed to load versions";
    }

    isLoading = false;
  }

  async function handleRollback() {
    if (!selectedVersion) return;

    isRollingBack = true;
    error = null;

    const result = await rollbackContent(contentId, selectedVersion.id);

    if (result.success) {
      showConfirmDialog = false;
      selectedVersion = null;
      onRollback?.();
    } else {
      error = result.error || "Failed to rollback";
    }

    isRollingBack = false;
  }

  function confirmRollback(version: Version) {
    selectedVersion = version;
    showConfirmDialog = true;
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  $effect(() => {
    if (contentId) {
      loadVersions();
    }
  });
</script>

<div class="space-y-4">
  {#if isLoading}
    <div class="flex justify-center py-8">
      <svg class="animate-spin h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>
  {:else if error}
    <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
      <p class="text-sm text-red-700">{error}</p>
      <button
        type="button"
        onclick={loadVersions}
        class="mt-2 text-sm text-blue-600 hover:text-blue-800"
      >
        {m.common_retry()}
      </button>
    </div>
  {:else if versions.length === 0}
    <div class="text-center py-8">
      <p class="text-gray-500 dark:text-gray-400">{m.versionHistory_noVersions()}</p>
    </div>
  {:else}
    <div class="divide-y divide-gray-200 dark:divide-gray-700">
      {#each versions as version, index (version.id)}
        <div class="py-4 flex items-start justify-between">
          <div class="flex items-start gap-4">
            <div class="flex flex-col items-center">
              <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <span class="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {version.versionNumber}
                </span>
              </div>
              {#if index < versions.length - 1}
                <div class="w-0.5 h-full bg-gray-200 dark:bg-gray-700 mt-2"></div>
              {/if}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {m.versionHistory_version()} #{version.versionNumber}
                </span>
                {#if index === 0}
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    {m.versionHistory_current()}
                  </span>
                {/if}
              </div>
              {#if version.changeSummary}
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {version.changeSummary}
                </p>
              {/if}
              <div class="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-500">
                {#if version.createdBy}
                  <span>{version.createdBy}</span>
                {/if}
                <span>{formatDate(version.createdAt)}</span>
              </div>
            </div>
          </div>
          {#if index !== 0}
            <button
              type="button"
              onclick={() => confirmRollback(version)}
              class="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path>
              </svg>
              {m.versionHistory_rollback()}
            </button>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

{#if showConfirmDialog}
  <div class="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
    <div class="flex min-h-full items-center justify-center p-4">
      <div class="fixed inset-0 bg-gray-900/50 transition-opacity" onclick={() => showConfirmDialog = false}></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {m.versionHistory_confirmRollback()}
        </h3>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {m.versionHistory_confirmRollbackMessage({ versionNumber: selectedVersion?.versionNumber || 0 })}
        </p>
        <div class="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onclick={() => showConfirmDialog = false}
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            {m.common_cancel()}
          </button>
          <button
            type="button"
            onclick={handleRollback}
            disabled={isRollingBack}
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {#if isRollingBack}
              <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            {:else}
              {m.versionHistory_rollback()}
            {/if}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
