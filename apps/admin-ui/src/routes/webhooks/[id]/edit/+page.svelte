<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import * as m from "$lib/paraglide/messages.js";
  import WebhookForm from "$lib/components/webhooks/WebhookForm.svelte";
  import { getWebhook, updateWebhook } from "$lib/services/webhookApi";
  import type { Webhook, UpdateWebhookRequest, CreateWebhookRequest } from "$lib/types";

  let webhook = $state<Webhook | null>(null);
  let loading = $state(true);
  let submitting = $state(false);
  let error = $state<string | null>(null);

  const webhookId = $derived(page.params.id ? parseInt(page.params.id) : 0);

  async function loadWebhook() {
    loading = true;
    error = null;

    try {
      const response = await getWebhook(webhookId);

      if (response.success && response.data) {
        webhook = response.data;
      } else {
        error = response.error || "Failed to load webhook";
      }
    } catch (err) {
      error = err instanceof Error ? err.message : "An error occurred";
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    loadWebhook();
  });

  async function handleSubmit(data: UpdateWebhookRequest) {
    submitting = true;
    error = null;

    try {
      const response = await updateWebhook(webhookId, data);

      if (response.success && response.data) {
        webhook = response.data;
        goto("/webhooks");
      } else {
        error = response.error || "Failed to update webhook";
      }
    } catch (err) {
      error = err instanceof Error ? err.message : "An error occurred";
    } finally {
      submitting = false;
    }
  }

  function handleCancel() {
    goto("/webhooks");
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div>
    <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
      {m.webhooks_edit_title?.() || "Edit Webhook"}
    </h1>
    <p class="text-gray-500 dark:text-gray-400 mt-1">
      {m.webhooks_edit_description?.() || "Update webhook configuration"}
    </p>
  </div>

  <!-- Loading State -->
  {#if loading}
    <div class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  {:else if error && !webhook}
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
            onclick={loadWebhook}
            class="mt-3 text-sm font-medium text-red-800 dark:text-gray-200 hover:text-red-600"
          >
            {m.common_retry?.() || "Try again"}
          </button>
        </div>
      </div>
    </div>
  {:else if webhook}
    <!-- Error State (for form submissions) -->
    {#if error}
      <div class="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-red-700 dark:text-gray-300">{error}</p>
          </div>
        </div>
      </div>
    {/if}

    <!-- Form -->
    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      <WebhookForm
        {webhook}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={submitting}
      />
    </div>
  {/if}
</div>
