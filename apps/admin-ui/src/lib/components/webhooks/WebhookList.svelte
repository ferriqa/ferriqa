<script lang="ts">
  import type { Webhook } from "$lib/types";
  import * as m from "$lib/paraglide/messages.js";

  interface Props {
    webhooks: Webhook[];
    filters: {
      event?: string;
      isActive?: boolean;
      search?: string;
    };
    total: number;
    page: number;
    limit: number;
    onFilterChange: (filters: { event?: string; isActive?: boolean; search?: string }) => void;
    onPageChange: (page: number) => void;
    onEdit: (webhook: Webhook) => void;
    onDelete: (webhook: Webhook) => void;
    onToggleStatus: (webhook: Webhook) => void;
    onTest: (webhook: Webhook) => void;
  }

  let {
    webhooks,
    filters,
    total,
    page,
    limit,
    onFilterChange,
    onPageChange,
    onEdit,
    onDelete,
    onToggleStatus,
    onTest,
  }: Props = $props();

  let searchQuery = $state("");
  let selectedEvent = $state("");
  let selectedStatus = $state("");

  $effect(() => {
    searchQuery = filters.search || "";
    selectedEvent = filters.event || "";
    selectedStatus = filters.isActive !== undefined ? filters.isActive.toString() : "";
  });

  const totalPages = $derived(Math.ceil(total / limit));

  function applyFilters() {
    onFilterChange({
      ...filters,
      search: searchQuery,
      event: selectedEvent || undefined,
      isActive: selectedStatus === "" ? undefined : selectedStatus === "true",
    });
  }

  function clearFilters() {
    searchQuery = "";
    selectedEvent = "";
    selectedStatus = "";
    onFilterChange({});
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function getStatusBadgeClass(isActive: boolean): string {
    return isActive
      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
  }

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
</script>

<div class="space-y-6">
  <!-- Filters -->
  <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
    <div class="flex flex-col sm:flex-row gap-4">
      <div class="flex-1">
        <input
          type="text"
          placeholder={m.webhooks_search_placeholder?.() || "Search webhooks..."}
          bind:value={searchQuery}
          oninput={applyFilters}
          class="w-full py-2.5 px-4 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div class="w-full sm:w-48">
        <select
          bind:value={selectedEvent}
          onchange={applyFilters}
          class="w-full py-2.5 px-4 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">{m.webhooks_filter_all?.() || "All Events"}</option>
          <option value="content.created">{m.webhooks_event_content_created?.() || "Content Created"}</option>
          <option value="content.updated">{m.webhooks_event_content_updated?.() || "Content Updated"}</option>
          <option value="content.deleted">{m.webhooks_event_content_deleted?.() || "Content Deleted"}</option>
          <option value="content.published">{m.webhooks_event_content_published?.() || "Content Published"}</option>
          <option value="content.unpublished">{m.webhooks_event_content_unpublished?.() || "Content Unpublished"}</option>
          <option value="blueprint.created">{m.webhooks_event_blueprint_created?.() || "Blueprint Created"}</option>
          <option value="blueprint.updated">{m.webhooks_event_blueprint_updated?.() || "Blueprint Updated"}</option>
          <option value="blueprint.deleted">{m.webhooks_event_blueprint_deleted?.() || "Blueprint Deleted"}</option>
          <option value="media.uploaded">{m.webhooks_event_media_uploaded?.() || "Media Uploaded"}</option>
          <option value="media.deleted">{m.webhooks_event_media_deleted?.() || "Media Deleted"}</option>
        </select>
      </div>

      <div class="w-full sm:w-40">
        <select
          bind:value={selectedStatus}
          onchange={applyFilters}
          class="w-full py-2.5 px-4 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">{m.webhooks_filter_all?.() || "All"}</option>
          <option value="true">{m.webhooks_filter_active?.() || "Active"}</option>
          <option value="false">{m.webhooks_filter_inactive?.() || "Inactive"}</option>
        </select>
      </div>

      {#if searchQuery || selectedEvent || selectedStatus}
        <button
          type="button"
          onclick={clearFilters}
          class="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
        >
          {m.common_clear?.() || "Clear"}
        </button>
      {/if}
    </div>
  </div>

  <!-- Results count -->
  <div class="flex justify-between items-center">
    <p class="text-sm text-gray-600 dark:text-gray-400">
      {#if m.webhooks_results_count}
        {m.webhooks_results_count({ count: total })}
      {:else}
        {total} webhooks
      {/if}
    </p>
  </div>

  <!-- Webhooks table -->
  {#if webhooks.length === 0}
    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
      <svg class="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        {m.webhooks_no_items?.() || "No webhooks configured"}
      </h3>
      <p class="text-gray-500 dark:text-gray-400">
        {m.webhooks_no_items_description?.() || "Get started by creating your first webhook."}
      </p>
    </div>
  {:else}
    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {m.webhooks_name?.() || "Name"}
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {m.webhooks_url?.() || "URL"}
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {m.webhooks_events?.() || "Events"}
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {m.webhooks_status?.() || "Status"}
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {m.webhooks_created?.() || "Created"}
              </th>
              <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {m.webhooks_actions?.() || "Actions"}
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {#each webhooks as webhook (webhook.id)}
              <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {webhook.name}
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                    {webhook.url}
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="flex flex-wrap gap-1">
                    {#each webhook.events.slice(0, 3) as event}
                      <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {formatEventName(event)}
                      </span>
                    {/each}
                    {#if webhook.events.length > 3}
                      <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                        +{webhook.events.length - 3}
                      </span>
                    {/if}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full {getStatusBadgeClass(webhook.isActive)}">
                    {webhook.isActive ? (m.webhooks_status_active?.() || "Active") : (m.webhooks_status_inactive?.() || "Inactive")}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(webhook.createdAt)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex justify-end gap-2">
                    <button
                      type="button"
                      onclick={() => onTest(webhook)}
                      class="text-purple-600 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300"
                      title={m.webhooks_test?.() || "Test"}
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onclick={() => onToggleStatus(webhook)}
                      class={webhook.isActive ? "text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300" : "text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"}
                    >
                      {webhook.isActive ? (m.webhooks_deactivate?.() || "Deactivate") : (m.webhooks_activate?.() || "Activate")}
                    </button>
                    <button
                      type="button"
                      onclick={() => onEdit(webhook)}
                      class="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                    >
                      {m.common_edit?.() || "Edit"}
                    </button>
                    <button
                      type="button"
                      onclick={() => onDelete(webhook)}
                      class="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                    >
                      {m.common_delete?.() || "Delete"}
                    </button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      {#if totalPages > 1}
        <div class="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
          <div class="flex-1 flex justify-between sm:hidden">
            <button
              type="button"
              onclick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              class="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              {m.common_previous?.() || "Previous"}
            </button>
            <button
              type="button"
              onclick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              class="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              {m.common_next?.() || "Next"}
            </button>
          </div>
          <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p class="text-sm text-gray-700 dark:text-gray-300">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} webhooks
              </p>
            </div>
            <div>
              <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  type="button"
                  onclick={() => onPageChange(page - 1)}
                  disabled={page <= 1}
                  class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  <span class="sr-only">{m.common_previous?.() || "Previous"}</span>
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                {#each Array(totalPages) as _, i}
                  {@const pageNum = i + 1}
                  <button
                    type="button"
                    onclick={() => onPageChange(pageNum)}
                    class="relative inline-flex items-center px-4 py-2 border text-sm font-medium {page === pageNum ? 'z-10 bg-blue-50 dark:bg-blue-900 border-blue-500 text-blue-600 dark:text-blue-200' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'}"
                  >
                    {pageNum}
                  </button>
                {/each}
                <button
                  type="button"
                  onclick={() => onPageChange(page + 1)}
                  disabled={page >= totalPages}
                  class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  <span class="sr-only">{m.common_next?.() || "Next"}</span>
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>
