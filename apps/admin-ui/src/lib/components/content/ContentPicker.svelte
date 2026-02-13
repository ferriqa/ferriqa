<script lang="ts">
  import { X, Search, FileText, ChevronLeft, ChevronRight, Loader2 } from 'lucide-svelte';
  import * as m from '$lib/paraglide/messages.js';
  import { getContents } from '$lib/services/contentApi';
  import type { ContentItem } from '$lib/components/content/types';

  interface Props {
    blueprintId: string;
    blueprintName?: string;
    isMulti?: boolean;
    selectedIds?: string[];
    onSelect: (items: ContentItem[]) => void;
    onClose: () => void;
  }

  let {
    blueprintId,
    blueprintName = 'Content',
    isMulti = false,
    selectedIds = [],
    onSelect,
    onClose
  }: Props = $props();

  let searchQuery = $state('');
  let contents = $state<ContentItem[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);

  // Pagination
  let page = $state(1);
  let limit = $state(12);
  let totalPages = $state(1);
  let total = $state(0);

  // Local state for selected IDs to avoid prop mutation
  let localSelectedIds = $state<string[]>([...selectedIds]);
  let selectedItemsMap = $state<Map<string, ContentItem>>(new Map());
  
  // Sync localSelectedIds and selectedItemsMap when selectedIds prop changes
  $effect(() => {
    localSelectedIds = [...selectedIds];
  });

  // Load content on mount and when page/search changes
  $effect(() => {
    loadContents();
  });

  async function loadContents() {
    loading = true;
    error = null;

    const result = await getContents(
      {
        blueprintId,
        status: 'published',
        search: searchQuery || undefined
      },
      page,
      limit,
      'updatedAt',
      'desc'
    );

     if (result.success && result.data) {
       contents = result.data;
       total = result.meta?.total || 0;
       totalPages = result.meta?.totalPages || 1;
       
       // Update selected items map with newly loaded items
       selectedItemsMap = new Map(
         Array.from(selectedItemsMap).concat(
           result.data.filter(item => localSelectedIds.includes(item.id))
             .map(item => [item.id, item])
         )
       );
     } else {
      error = result.error || 'Failed to load content';
    }

    loading = false;
  }

  function handleSearch(e: Event) {
    e.preventDefault();
    page = 1;
    loadContents();
  }

  function toggleSelection(item: ContentItem) {
    if (isMulti) {
      if (localSelectedIds.includes(item.id)) {
        localSelectedIds = localSelectedIds.filter(id => id !== item.id);
      } else {
        localSelectedIds = [...localSelectedIds, item.id];
      }
    } else {
      localSelectedIds = [item.id];
    }
  }

  // Handle confirm - include all selected items from all pages
  function handleConfirm() {
    const allSelectedItems: ContentItem[] = [];
    
    // Add items from current page that are selected
    allSelectedItems.push(...contents.filter(c => localSelectedIds.includes(c.id)));
    
    // Add items from other pages that we stored
    for (const id of localSelectedIds) {
      if (!allSelectedItems.find(i => i.id === id)) {
        const item = selectedItemsMap.get(id);
        if (item) {
          allSelectedItems.push(item);
        }
      }
    }
    
    onSelect(allSelectedItems);
  }

  function getItemTitle(item: ContentItem): string {
    return (item.data?.title as string) || item.slug || 'Untitled';
  }

  function getItemSubtitle(item: ContentItem): string {
    return item.slug || `ID: ${item.id}`;
  }
</script>

<div class="flex flex-col h-full max-h-[80vh]">
  <!-- Header -->
  <div class="flex items-center justify-between p-4 border-b border-card-line flex-shrink-0">
    <div>
      <h3 class="text-lg font-semibold text-foreground">
        {m.relationPicker_title()}
      </h3>
      <p class="text-sm text-muted-foreground-1">
        {blueprintName}
      </p>
    </div>
    <button
      class="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
      onclick={onClose}
      aria-label={m.common_close()}
    >
      <X class="w-5 h-5" />
    </button>
  </div>

  <!-- Search -->
  <form onsubmit={handleSearch} class="p-4 border-b border-card-line">
    <div class="relative">
      <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="text"
        placeholder={m.relationPicker_search()}
        bind:value={searchQuery}
        class="w-full pl-10 pr-4 py-2.5 border border-card-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
      />
    </div>
  </form>

  <!-- Content List -->
  <div class="flex-1 overflow-y-auto p-4">
    {#if loading}
      <div class="flex items-center justify-center py-12">
        <Loader2 class="w-6 h-6 animate-spin text-primary" />
        <span class="ml-2 text-sm text-muted-foreground-1">{m.common_loading()}</span>
      </div>
    {:else if error}
      <div class="text-center py-12">
        <p class="text-sm text-red-600">{error}</p>
        <button
          class="mt-2 text-sm text-primary hover:underline"
          onclick={loadContents}
        >
          {m.common_retry()}
        </button>
      </div>
    {:else if contents.length === 0}
      <div class="text-center py-12">
        <FileText class="w-12 h-12 mx-auto text-gray-300 mb-3" />
        <p class="text-sm text-muted-foreground-1">{m.relationPicker_noContent()}</p>
      </div>
    {:else}
      <div class="space-y-2">
        {#each contents as item}
          {@const isSelected = localSelectedIds.includes(item.id)}
          <button
            type="button"
            class="w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left {isSelected ? 'border-primary bg-primary/5' : 'border-card-line hover:border-gray-300 hover:bg-gray-50'}"
            onclick={() => toggleSelection(item)}
          >
            <!-- Selection Indicator -->
            <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 {isSelected ? 'border-primary bg-primary' : 'border-gray-300'}">
              {#if isSelected}
                <svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                </svg>
              {/if}
            </div>

            <!-- Icon -->
            <div class="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <FileText class="w-5 h-5 text-gray-400" />
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-foreground truncate">
                {getItemTitle(item)}
              </p>
              <p class="text-xs text-muted-foreground-1 truncate">
                {getItemSubtitle(item)}
              </p>
            </div>

            <!-- Status Badge -->
            {#if item.status === 'published'}
              <span class="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                {m.content_status_published()}
              </span>
            {/if}
          </button>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Pagination -->
  {#if totalPages > 1}
    <div class="flex items-center justify-between p-4 border-t border-card-line flex-shrink-0">
      <p class="text-sm text-muted-foreground-1">
        {m.relationPicker_pageInfo({ page, totalPages })}
      </p>
      <div class="flex gap-2">
        <button
          class="p-2 rounded-lg border border-card-line hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={page <= 1}
          onclick={() => { page--; loadContents(); }}
        >
          <ChevronLeft class="w-4 h-4" />
        </button>
        <button
          class="p-2 rounded-lg border border-card-line hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={page >= totalPages}
          onclick={() => { page++; loadContents(); }}
        >
          <ChevronRight class="w-4 h-4" />
        </button>
      </div>
    </div>
  {/if}

  <!-- Footer -->
  <div class="flex items-center justify-between p-4 border-t border-card-line bg-gray-50 flex-shrink-0">
    <p class="text-sm text-muted-foreground-1">
      {#if isMulti}
        {localSelectedIds.length} {m.relationPicker_selected()}
      {:else if localSelectedIds.length > 0}
        1 {m.relationPicker_selected()}
      {:else}
        {m.relationPicker_noneSelected()}
      {/if}
    </p>
    <div class="flex gap-2">
      <button
        class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-card-line rounded-lg hover:bg-gray-50"
        onclick={onClose}
      >
        {m.common_cancel()}
      </button>
      <button
        class="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={localSelectedIds.length === 0}
        onclick={handleConfirm}
      >
        {m.common_select()}
      </button>
    </div>
  </div>
</div>
