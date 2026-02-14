<script lang="ts">
  import { browser } from '$app/environment';
  import { Trash2, Grid, List, Search, X, Image, Upload } from 'lucide-svelte';
  import * as m from '$lib/paraglide/messages.js';
  import type { MediaFile, ViewMode, MediaType } from './types.ts';
  import MediaCard from './MediaCard.svelte';
  import MediaListItem from './MediaListItem.svelte';
  import UploadDialog from './UploadDialog.svelte';
  import { getMedia, deleteMedia, deleteMultipleMedia } from '$lib/services/mediaApi';
  
  interface Props {
    selectable?: boolean;
    multiSelect?: boolean;
    onSelect?: (media: MediaFile | MediaFile[]) => void;
    selectedIds?: number[];
  }
  
  let { 
    selectable = false, 
    multiSelect = false,
    onSelect,
    selectedIds = []
  }: Props = $props();
  
  // State
  let media = $state<MediaFile[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let viewMode = $state<ViewMode>('grid');
  let searchQuery = $state('');
  let selectedType = $state<MediaType>('all');
  let selectedItems = $state<Set<number>>(new Set());

  $effect(() => {
    selectedItems = new Set(selectedIds);
  });
  let uploadDialogOpen = $state(false);
  let page = $state(1);
  let hasMore = $state(true);
  let isLoadingMore = $state(false);
  
  // Filtered media
  let filteredMedia = $derived(media.filter(item => {
    if (searchQuery && !item.originalName.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (selectedType !== 'all') {
      if (selectedType === 'image' && !item.mimeType.startsWith('image/')) return false;
      if (selectedType === 'video' && !item.mimeType.startsWith('video/')) return false;
      if (selectedType === 'audio' && !item.mimeType.startsWith('audio/')) return false;
      if (selectedType === 'document' && (item.mimeType.startsWith('image/') || item.mimeType.startsWith('video/') || item.mimeType.startsWith('audio/'))) return false;
    }
    return true;
  }));
  
  // Load media
  async function loadMedia(reset = false) {
    if (reset) {
      page = 1;
      media = [];
    }
    
    if (reset) {
      loading = true;
    } else {
      isLoadingMore = true;
    }
    error = null;
    
    const result = await getMedia(page, 24, searchQuery, selectedType);
    
    if (result.success && result.data) {
      if (reset) {
        media = result.data;
      } else {
        media = [...media, ...result.data];
      }
      hasMore = result.meta ? page < result.meta.totalPages : false;
    } else {
      error = result.error || 'Failed to load media';
    }
    
    loading = false;
    isLoadingMore = false;
  }
  
  // Initial load - only on client side
  $effect(() => {
    if (browser) {
      loadMedia(true);
    }
  });
  
  // Handle selection
  function toggleSelection(mediaItem: MediaFile) {
    if (!selectable) return;
    
    const newSelected = new Set(selectedItems);
    if (newSelected.has(mediaItem.id)) {
      newSelected.delete(mediaItem.id);
    } else {
      if (!multiSelect) {
        newSelected.clear();
      }
      newSelected.add(mediaItem.id);
    }
    selectedItems = newSelected;
    
    if (onSelect) {
      const selected = media.filter(m => selectedItems.has(m.id));
      onSelect(multiSelect ? selected : selected[0]);
    }
  }
  
  // Handle delete
  async function handleDelete(id: number) {
    if (!confirm(m.media_delete_confirm())) return;
    
    const result = await deleteMedia(id);
    if (result.success) {
      media = media.filter(m => m.id !== id);
      selectedItems.delete(id);
      selectedItems = new Set(selectedItems);
    } else {
      alert(result.error || 'Failed to delete media');
    }
  }
  
  // Handle bulk delete
  async function handleBulkDelete() {
    if (selectedItems.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedItems.size} items?`)) return;
    
    const result = await deleteMultipleMedia(Array.from(selectedItems));
    if (result.success) {
      media = media.filter(m => !selectedItems.has(m.id));
      selectedItems = new Set();
    } else {
      alert(`Deleted ${result.deleted} items. Errors: ${result.errors.join(', ')}`);
    }
  }
  
  // Handle upload complete
  function handleUploadComplete() {
    loadMedia(true);
  }
</script>

<div class="space-y-4">
  <!-- Toolbar -->
  <div class="flex flex-wrap items-center justify-between gap-4">
    <!-- Left: Upload & Bulk Actions -->
    <div class="flex items-center gap-2">
      <button
        class="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        onclick={() => uploadDialogOpen = true}
      >
        <Upload class="w-4 h-4" />
        {m.media_upload()}
      </button>
      
      {#if selectedItems.size > 0}
        <button
          class="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          onclick={handleBulkDelete}
        >
          <Trash2 class="w-4 h-4" />
          {m.common_delete()} ({selectedItems.size})
        </button>
      {/if}
    </div>
    
    <!-- Right: Search, Filter & View -->
    <div class="flex items-center gap-2">
      <!-- Search -->
      <div class="relative">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder={m.common_search()}
          bind:value={searchQuery}
          oninput={() => loadMedia(true)}
          class="pl-9 pr-4 py-2 w-48 sm:w-64 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
        {#if searchQuery}
          <button
            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            onclick={() => { searchQuery = ''; loadMedia(true); }}
          >
            <X class="w-4 h-4" />
          </button>
        {/if}
      </div>
      
      <!-- Type Filter -->
      <select
        bind:value={selectedType}
        onchange={() => loadMedia(true)}
        class="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
      >
        <option value="all">All Types</option>
        <option value="image">Images</option>
        <option value="video">Videos</option>
        <option value="audio">Audio</option>
        <option value="document">Documents</option>
      </select>
      
      <!-- View Toggle -->
      <div class="flex items-center bg-gray-100 rounded-lg p-1">
        <button
          class="p-1.5 rounded-md transition-colors {viewMode === 'grid' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}"
          onclick={() => viewMode = 'grid'}
          aria-label="Grid view"
        >
          <Grid class="w-4 h-4" />
        </button>
        <button
          class="p-1.5 rounded-md transition-colors {viewMode === 'list' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}"
          onclick={() => viewMode = 'list'}
          aria-label="List view"
        >
          <List class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
  
  <!-- Media Display -->
  {#if loading && media.length === 0}
    <div class="flex items-center justify-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  {:else if error}
    <div class="flex flex-col items-center justify-center h-64 text-center">
      <p class="text-red-600 mb-4">{error}</p>
      <button
        class="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover"
        onclick={() => loadMedia(true)}
      >
        Retry
      </button>
    </div>
  {:else if filteredMedia.length === 0}
    <div class="flex flex-col items-center justify-center h-64 text-center">
      <Image class="w-16 h-16 text-gray-300 mb-4" />
      <p class="text-gray-500">{m.media_no_items()}</p>
      {#if searchQuery}
        <button
          class="mt-2 text-primary hover:underline"
          onclick={() => { searchQuery = ''; loadMedia(true); }}
        >
          Clear search
        </button>
      {/if}
    </div>
  {:else}
    {#if viewMode === 'grid'}
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {#each filteredMedia as item (item.id)}
          <MediaCard
            media={item}
            selected={selectedItems.has(item.id)}
            selectable={selectable}
            onSelect={() => toggleSelection(item)}
            onDelete={() => handleDelete(item.id)}
          />
        {/each}
      </div>
    {:else}
      <div class="space-y-2">
        {#each filteredMedia as item (item.id)}
          <MediaListItem
            media={item}
            selected={selectedItems.has(item.id)}
            selectable={selectable}
            onSelect={() => toggleSelection(item)}
            onDelete={() => handleDelete(item.id)}
          />
        {/each}
      </div>
    {/if}
    
    <!-- Load More -->
    {#if hasMore}
      <div class="flex justify-center pt-4">
        <button
          class="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          onclick={() => { page++; loadMedia(); }}
          disabled={isLoadingMore}
        >
          {#if isLoadingMore}
            <span class="inline-block animate-spin mr-2">⟳</span>
          {/if}
          Load More
        </button>
      </div>
    {/if}
  {/if}
</div>

<UploadDialog
  isOpen={uploadDialogOpen}
  onClose={() => uploadDialogOpen = false}
  onUploadComplete={handleUploadComplete}
/>
