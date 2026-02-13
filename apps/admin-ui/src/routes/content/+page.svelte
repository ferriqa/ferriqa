<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import ContentList from "$lib/components/content/ContentList.svelte";
  import ContentEditor from "$lib/components/content/ContentEditor.svelte";
  import { getContents, deleteContent, publishContent, unpublishContent } from "$lib/services/contentApi";
  import { getBlueprints } from "$lib/services/blueprintApi";
  import type { ContentItem, ContentFilters } from "$lib/components/content/types";
  import type { Blueprint } from "$lib/components/blueprint/types";
  import * as m from "$lib/paraglide/messages.js";

  // State
  let contents = $state<ContentItem[]>([]);
  let blueprints = $state<Blueprint[]>([]);
  let filters = $state<ContentFilters>({});
  let page = $state(1);
  let limit = $state(25);
  let total = $state(0);
  let isLoading = $state(true);
  let error = $state<string | null>(null);
  
  // Modal state
  let showCreateModal = $state(false);
  let selectedBlueprint = $state<Blueprint | null>(null);
  let contentToDelete = $state<ContentItem | null>(null);

  // Load data
  async function loadContents() {
    isLoading = true;
    error = null;

    try {
      const [contentsResult, blueprintsResult] = await Promise.all([
        getContents(filters, page, limit),
        getBlueprints(),
      ]);

      if (contentsResult.success && contentsResult.data) {
        contents = contentsResult.data;
        total = contentsResult.meta?.total || contents.length;
      } else {
        error = contentsResult.error || "Failed to load contents";
      }

      if (blueprintsResult.success && blueprintsResult.data) {
        blueprints = blueprintsResult.data;
      }
    } catch (err) {
      error = err instanceof Error ? err.message : "An error occurred";
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    loadContents();
  });

  // Handle filter changes
  function handleFilterChange(newFilters: ContentFilters) {
    filters = newFilters;
    page = 1;
    loadContents();
  }

  // Handle page changes
  function handlePageChange(newPage: number) {
    page = newPage;
    loadContents();
  }

  // Handle edit
  function handleEdit(content: ContentItem) {
    goto(`/content/${content.id}/edit`);
  }

  // Handle delete
  async function handleDelete(content: ContentItem) {
    if (!confirm(m.content_delete_confirm())) {
      return;
    }

    const result = await deleteContent(content.id);
    if (result.success) {
      await loadContents();
    } else {
      alert(result.error || "Failed to delete content");
    }
  }

  // Handle publish
  async function handlePublish(content: ContentItem) {
    const result = await publishContent(content.id);
    if (result.success) {
      await loadContents();
    } else {
      alert(result.error || "Failed to publish content");
    }
  }

  // Handle unpublish
  async function handleUnpublish(content: ContentItem) {
    const result = await unpublishContent(content.id);
    if (result.success) {
      await loadContents();
    } else {
      alert(result.error || "Failed to unpublish content");
    }
  }

  // Open create modal
  function openCreateModal() {
    if (blueprints.length === 0) {
      alert("Please create a blueprint first");
      return;
    }
    if (blueprints.length === 1) {
      // If only one blueprint, use it directly
      goto(`/content/new?blueprint=${blueprints[0].id}`);
    } else {
      // Show blueprint selector
      showCreateModal = true;
    }
  }

  // Select blueprint and create
  function selectBlueprintAndCreate(blueprint: Blueprint) {
    selectedBlueprint = blueprint;
    goto(`/content/new?blueprint=${blueprint.id}`);
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex justify-between items-center">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">{m.content_title()}</h1>
      <p class="text-gray-600 dark:text-gray-400">{m.content_subtitle()}</p>
    </div>

    <button
      type="button"
      onclick={openCreateModal}
      class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      {m.content_create()}
    </button>
  </div>

  <!-- Error -->
  {#if error}
    <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
      <p class="text-sm text-red-700">{error}</p>
    </div>
  {/if}

  <!-- Loading -->
  {#if isLoading}
    <div class="flex justify-center py-12">
      <svg class="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>
  {:else}
    <!-- Content List -->
    <ContentList
      {contents}
      {blueprints}
      {filters}
      {total}
      {page}
      {limit}
      onFilterChange={handleFilterChange}
      onPageChange={handlePageChange}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onPublish={handlePublish}
      onUnpublish={handleUnpublish}
    />
  {/if}
</div>

<!-- Blueprint Selector Modal -->
{#if showCreateModal}
  <div class="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
    <div class="flex min-h-full items-center justify-center p-4">
      <div class="fixed inset-0 bg-gray-900/50 transition-opacity" onclick={() => showCreateModal = false}></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {m.content_select_blueprint()}
        </h3>
        <div class="space-y-2">
          {#each blueprints as blueprint}
            <button
              type="button"
              onclick={() => selectBlueprintAndCreate(blueprint)}
              class="w-full text-left px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div class="font-medium text-gray-900 dark:text-gray-100">{blueprint.name}</div>
              {#if blueprint.description}
                <div class="text-sm text-gray-500 dark:text-gray-400">{blueprint.description}</div>
              {/if}
            </button>
          {/each}
        </div>
        <button
          type="button"
          onclick={() => showCreateModal = false}
          class="mt-4 w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          {m.common_cancel()}
        </button>
      </div>
    </div>
  </div>
{/if}
