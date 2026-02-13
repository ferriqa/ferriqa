<script lang="ts">
  import { goto } from "$app/navigation";
  import * as m from "$lib/paraglide/messages.js";
  import WebhookForm from "$lib/components/webhooks/WebhookForm.svelte";
  import { createWebhook } from "$lib/services/webhookApi";
  import type { CreateWebhookRequest, UpdateWebhookRequest } from "$lib/types";

  let loading = $state(false);
  let error = $state<string | null>(null);

  async function handleSubmit(data: CreateWebhookRequest | UpdateWebhookRequest) {
    loading = true;
    error = null;

    try {
      const response = await createWebhook(data as CreateWebhookRequest);

      if (response.success && response.data) {
        goto(`/webhooks/${response.data.id}/edit`);
      } else {
        error = response.error || "Failed to create webhook";
      }
    } catch (err) {
      error = err instanceof Error ? err.message : "An error occurred";
    } finally {
      loading = false;
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
      {m.webhooks_create_title?.() || "Create Webhook"}
    </h1>
    <p class="text-gray-500 dark:text-gray-400 mt-1">
      {m.webhooks_create_description?.() || "Add a new webhook endpoint"}
    </p>
  </div>

  <!-- Error State -->
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
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      {loading}
    />
  </div>
</div>
