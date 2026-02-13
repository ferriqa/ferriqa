<script lang="ts">
  import type { ContentItem, ContentFilters, ContentStatus } from "./types";
  import type { Blueprint } from "../blueprint/types";
  import * as m from "$lib/paraglide/messages.js";

  interface Props {
    contents: ContentItem[];
    blueprints: Blueprint[];
    filters: ContentFilters;
    total: number;
    page: number;
    limit: number;
    onFilterChange: (filters: ContentFilters) => void;
    onPageChange: (page: number) => void;
    onEdit: (content: ContentItem) => void;
    onDelete: (content: ContentItem) => void;
    onPublish: (content: ContentItem) => void;
    onUnpublish: (content: ContentItem) => void;
  }

  let {
    contents,
    blueprints,
    filters,
    total,
    page,
    limit,
    onFilterChange,
    onPageChange,
    onEdit,
    onDelete,
    onPublish,
    onUnpublish,
  }: Props = $props();

  let searchQuery = $state(filters.search || "");
  let selectedBlueprint = $state(filters.blueprintId || "");
  let selectedStatus = $state(filters.status || "");

  const totalPages = $derived(Math.ceil(total / limit));

  function applyFilters() {
    onFilterChange({
      ...filters,
      search: searchQuery,
      blueprintId: selectedBlueprint || undefined,
      status: (selectedStatus as ContentStatus) || undefined,
    });
  }

  function clearFilters() {
    searchQuery = "";
    selectedBlueprint = "";
    selectedStatus = "";
    onFilterChange({});
  }

  function getBlueprintName(blueprintId: string): string {
    const blueprint = blueprints.find(b => b.id === blueprintId);
    return blueprint?.name || blueprintId;
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function getStatusBadgeClass(status: ContentStatus): string {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "draft":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "archived":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  function getContentTitle(content: ContentItem): string {
    // Try common title fields
    const data = content.data as Record<string, string> || {};
    return (
      data.title ||
      data.name ||
      data.heading ||
      data.headline ||
      content.slug ||
      "Untitled"
    );
  }
</script>

<div class="space-y-6">
  <!-- Filters -->
  <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
    <div class="flex flex-col sm:flex-row gap-4">
      <div class="flex-1">
        <input
          type="text"
          placeholder={m.content_search_placeholder()}
          bind:value={searchQuery}
          oninput={applyFilters}
          class="w-full py-2.5 px-4 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div class="w-full sm:w-48">
        <select
          bind:value={selectedBlueprint}
          onchange={applyFilters}
          class="w-full py-2.5 px-4 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">{m.content_all_blueprints()}</option>
          {#each blueprints as blueprint}
            <option value={blueprint.id}>{blueprint.name}</option>
          {/each}
        </select>
      </div>

      <div class="w-full sm:w-40">
        <select
          bind:value={selectedStatus}
          onchange={applyFilters}
          class="w-full py-2.5 px-4 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">{m.content_all_statuses()}</option>
          <option value="draft">{m.content_status_draft()}</option>
          <option value="published">{m.content_status_published()}</option>
          <option value="archived">{m.content_status_archived()}</option>
        </select>
      </div>

      {#if searchQuery || selectedBlueprint || selectedStatus}
        <button
          type="button"
          onclick={clearFilters}
          class="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
        >
          {m.common_clear()}
        </button>
      {/if}
    </div>
  </div>

  <!-- Results count -->
  <div class="flex justify-between items-center">
    <p class="text-sm text-gray-600 dark:text-gray-400">
      {m.content_results_count({ count: total })}
    </p>
  </div>

  <!-- Content table -->
  {#if contents.length === 0}
    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
      <svg class="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{m.content_no_items()}</h3>
      <p class="text-gray-500 dark:text-gray-400">{m.content_no_items_description()}</p>
    </div>
  {:else}
    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {m.content_title()}
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {m.content_blueprint()}
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {m.content_status()}
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {m.content_updated()}
              </th>
              <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {m.content_actions()}
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {#each contents as content (content.id)}
              <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {getContentTitle(content)}
                  </div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">{content.slug}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm text-gray-900 dark:text-gray-100">{getBlueprintName(content.blueprintId)}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full {getStatusBadgeClass(content.status)}">
                    {content.status}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(content.updatedAt)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex justify-end gap-2">
                    {#if content.status === "published"}
                      <button
                        type="button"
                        onclick={() => onUnpublish(content)}
                        class="text-yellow-600 dark:text-yellow-400 hover:text-yellow-900 dark:hover:text-yellow-300"
                      >
                        {m.content_unpublish()}
                      </button>
                    {:else}
                      <button
                        type="button"
                        onclick={() => onPublish(content)}
                        class="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                      >
                        {m.content_publish()}
                      </button>
                    {/if}
                    <button
                      type="button"
                      onclick={() => onEdit(content)}
                      class="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                    >
                      {m.common_edit()}
                    </button>
                    <button
                      type="button"
                      onclick={() => onDelete(content)}
                      class="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                    >
                      {m.common_delete()}
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
              {m.common_previous()}
            </button>
            <button
              type="button"
              onclick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              class="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              {m.common_next()}
            </button>
          </div>
          <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p class="text-sm text-gray-700 dark:text-gray-300">
                {m.pagination_showing({ start: (page - 1) * limit + 1, end: Math.min(page * limit, total), total })}
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
                  <span class="sr-only">{m.common_previous()}</span>
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
                  <span class="sr-only">{m.common_next()}</span>
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
