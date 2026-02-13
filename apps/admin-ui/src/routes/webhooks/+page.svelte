<script lang="ts">
  import { goto } from "$app/navigation";
  import * as m from "$lib/paraglide/messages.js";
  import WebhookList from "$lib/components/webhooks/WebhookList.svelte";
  import {
    listWebhooks,
    deleteWebhook,
    updateWebhook,
    testWebhook,
  } from "$lib/services/webhookApi";
  import type { Webhook } from "$lib/types";

  let webhooks = $state<Webhook[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let page = $state(1);
  let limit = $state(25);
  let total = $state(0);
  let filters = $state<{
    event?: string;
    isActive?: boolean;
    search?: string;
  }>({});
  let deleteConfirmWebhook = $state<Webhook | null>(null);
  let testingWebhook = $state<Webhook | null>(null);
  let testResult = $state<{ success: boolean; message: string } | null>(null);

  async function loadWebhooks() {
    loading = true;
    error = null;

    try {
      const response = await listWebhooks(page, limit, filters);

      if (response.success && response.data) {
        webhooks = response.data.data;
        total = response.data.pagination.total;
      } else {
        error = response.error || "Failed to load webhooks";
      }
    } catch (err) {
      error = err instanceof Error ? err.message : "An error occurred";
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    loadWebhooks();
  });

  function handleFilterChange(newFilters: typeof filters) {
    filters = newFilters;
    page = 1;
  }

  function handlePageChange(newPage: number) {
    page = newPage;
  }

  function handleEdit(webhook: Webhook) {
    goto(`/webhooks/${webhook.id}/edit`);
  }

  function handleDelete(webhook: Webhook) {
    deleteConfirmWebhook = webhook;
  }

  async function confirmDelete() {
    if (!deleteConfirmWebhook) return;

    try {
      const response = await deleteWebhook(deleteConfirmWebhook.id);

      if (response.success) {
        webhooks = webhooks.filter((w) => w.id !== deleteConfirmWebhook!.id);
        total--;
        deleteConfirmWebhook = null;
      } else {
        alert(response.error || "Failed to delete webhook");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "An error occurred");
    }
  }

  async function handleToggleStatus(webhook: Webhook) {
    try {
      const response = await updateWebhook(webhook.id, {
        isActive: !webhook.isActive,
      });

      if (response.success && response.data) {
        webhooks = webhooks.map((w) =>
          w.id === webhook.id ? { ...w, isActive: !w.isActive } : w,
        );
      } else {
        alert(response.error || "Failed to update webhook status");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "An error occurred");
    }
  }

  async function handleTest(webhook: Webhook) {
    testingWebhook = webhook;
    testResult = null;

    try {
      const response = await testWebhook(webhook.id, "content.created", {
        test: true,
        message: "This is a test webhook delivery",
      });

      if (response.success && response.data) {
        testResult = {
          success: response.data.success,
          message: response.data.success
            ? `Success! Status: ${response.data.statusCode}, Duration: ${response.data.duration}ms`
            : `Failed: ${response.data.error || "Unknown error"}`,
        };
      } else {
        testResult = {
          success: false,
          message: response.error || "Failed to test webhook",
        };
      }
    } catch (err) {
      testResult = {
        success: false,
        message: err instanceof Error ? err.message : "An error occurred",
      };
    } finally {
      testingWebhook = null;
    }
  }

  function handleCreate() {
    goto("/webhooks/new");
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex justify-between items-center">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
        {m.webhooks_title?.() || "Webhooks"}
      </h1>
      <p class="text-gray-500 dark:text-gray-400 mt-1">
        {m.webhooks_description?.() || "Manage webhook endpoints and monitor deliveries"}
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
      {m.webhooks_create_button?.() || "Create Webhook"}
    </button>
  </div>

  <!-- Loading State -->
  {#if loading && webhooks.length === 0}
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
            onclick={loadWebhooks}
            class="mt-3 text-sm font-medium text-red-800 dark:text-gray-200 hover:text-red-600"
          >
            {m.common_retry?.() || "Try again"}
          </button>
        </div>
      </div>
    </div>
  {:else}
    <!-- Webhook List -->
    <WebhookList
      {webhooks}
      {filters}
      {total}
      {page}
      {limit}
      onFilterChange={handleFilterChange}
      onPageChange={handlePageChange}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onToggleStatus={handleToggleStatus}
      onTest={handleTest}
    />
  {/if}
</div>

<!-- Delete Confirmation Modal -->
{#if deleteConfirmWebhook}
  <div class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onclick={() => deleteConfirmWebhook = null}></div>
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
                {m.webhooks_delete_confirm_title?.() || "Delete Webhook"}
              </h3>
              <div class="mt-2">
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {m.webhooks_delete_confirm_message?.({ name: deleteConfirmWebhook.name }) || `Are you sure you want to delete "${deleteConfirmWebhook.name}"? This action cannot be undone.`}
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
            onclick={() => deleteConfirmWebhook = null}
            class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
          >
            {m.common_cancel?.() || "Cancel"}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Test Result Modal -->
{#if testResult}
  <div class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onclick={() => testResult = null}></div>
      <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
      <div class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
        <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="sm:flex sm:items-start">
            <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full {testResult.success ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'} sm:mx-0 sm:h-10 sm:w-10">
              {#if testResult.success}
                <svg class="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              {:else}
                <svg class="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              {/if}
            </div>
            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100" id="modal-title">
                {testResult.success ? (m.webhooks_test_success?.() || "Test Successful") : (m.webhooks_test_failed?.() || "Test Failed")}
              </h3>
              <div class="mt-2">
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {testResult.message}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div class="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button
            type="button"
            onclick={() => testResult = null}
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
          >
            {m.common_close?.() || "Close"}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
