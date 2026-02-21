<script lang="ts">
  import type { Webhook, CreateWebhookRequest, UpdateWebhookRequest } from "$lib/types";
  import { WEBHOOK_EVENTS } from "$lib/types";
  import * as m from "$lib/paraglide/messages.js";

  interface Props {
    webhook?: Webhook;
    onSubmit: (data: CreateWebhookRequest | UpdateWebhookRequest) => void;
    onCancel: () => void;
    loading?: boolean;
  }

  let { webhook, onSubmit, onCancel, loading = false }: Props = $props();

  let name = $state("");
  let url = $state("");
  let secret = $state("");
  let isActive = $state(true);
  let selectedEvents = $state<string[]>([]);
  let headersJson = $state("");
  let errors = $state<Record<string, string>>({});

  // Sync form state when webhook prop changes
  $effect(() => {
    name = webhook?.name || "";
    url = webhook?.url || "";
    secret = webhook?.secret || "";
    isActive = webhook?.isActive ?? true;
    selectedEvents = webhook?.events || [];
    headersJson = webhook?.headers ? JSON.stringify(webhook.headers, null, 2) : "";
  });

  function formatEventName(event: string): string {
    const eventNames: Record<string, () => string> = {
      "content.created": () => m.webhooks_event_content_created?.() || "Content Created",
      "content.updated": () => m.webhooks_event_content_updated?.() || "Content Updated",
      "content.deleted": () => m.webhooks_event_content_deleted?.() || "Content Deleted",
      "content.published": () => m.webhooks_event_content_published?.() || "Content Published",
      "content.unpublished": () => m.webhooks_event_content_unpublished?.() || "Content Unpublished",
      "blueprint.created": () => m.webhooks_event_blueprint_created?.() || "Blueprint Created",
      "blueprint.updated": () => m.webhooks_event_blueprint_updated?.() || "Blueprint Updated",
      "blueprint.deleted": () => m.webhooks_event_blueprint_deleted?.() || "Blueprint Deleted",
      "media.uploaded": () => m.webhooks_event_media_uploaded?.() || "Media Uploaded",
      "media.deleted": () => m.webhooks_event_media_deleted?.() || "Media Deleted",
    };
    return eventNames[event]?.() || event;
  }

  function toggleEvent(event: string) {
    if (selectedEvents.includes(event)) {
      selectedEvents = selectedEvents.filter((e) => e !== event);
    } else {
      selectedEvents = [...selectedEvents, event];
    }
  }

  function validate(): boolean {
    errors = {};

    if (!name.trim()) {
      errors.name = m.validation_required?.() || "Name is required";
    }

    if (!url.trim()) {
      errors.url = m.validation_required?.() || "URL is required";
    } else {
      try {
        new URL(url);
      } catch {
        errors.url = m.validation_url?.() || "Invalid URL";
      }
    }

    if (selectedEvents.length === 0) {
      errors.events = m.validation_required?.() || "At least one event is required";
    }

    if (headersJson.trim()) {
      try {
        JSON.parse(headersJson);
      } catch {
        errors.headers = m.validation_json?.() || "Invalid JSON format";
      }
    }

    return Object.keys(errors).length === 0;
  }

  function handleSubmit(e: Event) {
    e.preventDefault();

    if (!validate()) return;

    const headers = headersJson.trim() ? JSON.parse(headersJson) : undefined;

    const data: CreateWebhookRequest | UpdateWebhookRequest = {
      name: name.trim(),
      url: url.trim(),
      events: selectedEvents,
      isActive,
    };

    if (secret.trim()) {
      data.secret = secret.trim();
    } else {
      data.secret = null;
    }

    if (headers) {
      data.headers = headers;
    }

    onSubmit(data);
  }
</script>

<form onsubmit={handleSubmit} class="space-y-6">
  <!-- Name -->
  <div>
    <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      {m.webhooks_name_label?.() || "Webhook Name"} *
    </label>
    <input
      type="text"
      id="name"
      bind:value={name}
      class="w-full py-2.5 px-4 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 {errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}"
      placeholder={m.webhooks_name_placeholder?.() || "Enter webhook name"}
    />
    {#if errors.name}
      <p class="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
    {/if}
  </div>

  <!-- URL -->
  <div>
    <label for="url" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      {m.webhooks_url?.() || "URL"} *
    </label>
    <input
      type="url"
      id="url"
      bind:value={url}
      class="w-full py-2.5 px-4 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 {errors.url ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}"
      placeholder={m.webhooks_url_placeholder?.() || "https://example.com/webhook"}
    />
    {#if errors.url}
      <p class="mt-1 text-sm text-red-600 dark:text-red-400">{errors.url}</p>
    {/if}
  </div>

  <!-- Events -->
  <fieldset>
    <legend class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      {m.webhooks_events?.() || "Events"} *
    </legend>
    <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {#each WEBHOOK_EVENTS as event}
        <button
          type="button"
          onclick={() => toggleEvent(event)}
          class="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg transition-colors {selectedEvents.includes(event)
            ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-300'
            : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'}"
        >
          <span class="h-4 w-4 rounded border {selectedEvents.includes(event) ? 'bg-blue-500 border-blue-500' : 'border-gray-300 dark:border-gray-500'} flex items-center justify-center">
            {#if selectedEvents.includes(event)}
              <svg class="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
              </svg>
            {/if}
          </span>
          <span class="truncate">{formatEventName(event)}</span>
        </button>
      {/each}
    </div>
    {#if errors.events}
      <p class="mt-2 text-sm text-red-600 dark:text-red-400">{errors.events}</p>
    {/if}
  </fieldset>

  <!-- Secret -->
  <div>
    <label for="secret" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      {m.webhooks_secret?.() || "Secret"}
    </label>
    <input
      type="password"
      id="secret"
      bind:value={secret}
      class="w-full py-2.5 px-4 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
      placeholder={m.webhooks_secret_placeholder?.() || "Enter webhook secret (optional)"}
    />
    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
      {m.webhooks_secret_hint?.() || "Used to sign webhook payloads"}
    </p>
  </div>

  <!-- Headers (JSON) -->
  <div>
    <label for="headers" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      {m.webhooks_headers?.() || "Custom Headers"}
    </label>
    <textarea
      id="headers"
      bind:value={headersJson}
      rows="4"
      class="w-full py-2.5 px-4 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 font-mono {errors.headers ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}"
      placeholder={m.webhooks_headers_placeholder?.() || '{\n  "Authorization": "Bearer token"\n}'}
    ></textarea>
    {#if errors.headers}
      <p class="mt-1 text-sm text-red-600 dark:text-red-400">{errors.headers}</p>
    {:else}
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        JSON format (optional)
      </p>
    {/if}
  </div>

  <!-- Status -->
  <div>
    <label class="flex items-center space-x-3">
      <input
        type="checkbox"
        bind:checked={isActive}
        class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
      />
      <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
        {m.webhooks_status_active?.() || "Active"}
      </span>
    </label>
    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400 ml-7">
      Inactive webhooks will not receive events
    </p>
  </div>

  <!-- Actions -->
  <div class="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
    <button
      type="button"
      onclick={onCancel}
      disabled={loading}
      class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
    >
      {m.common_cancel?.() || "Cancel"}
    </button>
    <button
      type="submit"
      disabled={loading}
      class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center gap-2"
    >
      {#if loading}
        <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      {/if}
      {webhook ? (m.common_save?.() || "Save") : (m.common_create?.() || "Create")}
    </button>
  </div>
</form>
