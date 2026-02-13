<script lang="ts">
  import { X, Image, Plus, File } from 'lucide-svelte';
  import * as m from '$lib/paraglide/messages.js';
  import MediaLibrary from './MediaLibrary.svelte';
  import type { MediaFile } from './types';
  import { isImageFile, formatFileSize } from '$lib/services/mediaApi';
  
  interface Props {
    value?: number | number[] | null;
    onChange: (value: number | number[] | null) => void;
    multiple?: boolean;
    accept?: string[];
    label?: string;
    error?: string;
  }
  
  let { 
    value = null, 
    onChange, 
    multiple = false,
    accept = ['image/*'],
    label = 'Media',
    error
  }: Props = $props();
  
  let pickerOpen = $state(false);
  let selectedMedia = $state<MediaFile[]>([]);
  
  // Parse value into array of IDs
  let selectedIds = $derived(() => {
    if (value === null || value === undefined) return [];
    if (Array.isArray(value)) return value;
    return [value];
  });
  
  function handleSelect(media: MediaFile | MediaFile[]) {
    if (Array.isArray(media)) {
      selectedMedia = media;
      onChange(multiple ? media.map(m => m.id) : (media[0]?.id ?? null));
    } else {
      selectedMedia = [media];
      onChange(media.id);
    }
    pickerOpen = false;
  }
  
  function removeItem(id: number) {
    if (multiple && Array.isArray(value)) {
      const newValue = value.filter(v => v !== id);
      onChange(newValue.length > 0 ? newValue : null);
    } else {
      onChange(null);
    }
    selectedMedia = selectedMedia.filter(m => m.id !== id);
  }
  

</script>

<div class="space-y-3">
  {#if label}
    <label class="block text-sm font-medium text-foreground">
      {label}
    </label>
  {/if}
  
  <!-- Selected Items Preview -->
  <div class="border border-card-line rounded-xl p-4 space-y-3 bg-card">
    {#if selectedMedia.length === 0}
      <p class="text-sm text-muted-foreground-1 text-center py-4">
        No media selected
      </p>
    {:else}
      <div class="space-y-2">
        {#each selectedMedia as media}
          <div class="flex items-center gap-3 p-2 bg-surface rounded-lg group">
            <!-- Thumbnail -->
            <div class="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
              {#if isImageFile(media)}
                <img 
                  src={media.thumbnailUrl || media.url} 
                  alt={media.originalName}
                  class="w-full h-full object-cover"
                />
              {:else}
                <div class="w-full h-full flex items-center justify-center">
                  <File class="w-6 h-6 text-gray-400" />
                </div>
              {/if}
            </div>
            
            <!-- Info -->
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-foreground truncate">{media.originalName}</p>
              <p class="text-xs text-muted-foreground-1">{formatFileSize(media.size)}</p>
            </div>
            
            <!-- Remove Button -->
            <button
              class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
              onclick={() => removeItem(media.id)}
              aria-label="Remove"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        {/each}
      </div>
    {/if}
    
    <!-- Add Button -->
    <button
      class="w-full py-2.5 px-4 text-sm font-medium text-gray-700 bg-white border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all flex items-center justify-center gap-2"
      onclick={() => pickerOpen = true}
    >
      <Plus class="w-4 h-4" />
      {multiple ? 'Select Media' : 'Select Media File'}
    </button>
  </div>
  
  {#if error}
    <p class="text-sm text-red-600">{error}</p>
  {/if}
</div>

<!-- Media Picker Modal -->
{#if pickerOpen}
  <div 
    class="fixed inset-0 z-50 overflow-y-auto"
    role="dialog"
    aria-modal="true"
  >
    <!-- Backdrop -->
    <div 
      class="fixed inset-0 bg-gray-900/50 transition-opacity"
      onclick={() => pickerOpen = false}
    ></div>
    
    <!-- Modal -->
    <div class="flex min-h-full items-center justify-center p-4">
      <div class="relative bg-card border border-card-line rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-card-line flex-shrink-0">
          <h3 class="text-lg font-semibold text-foreground">
            {m.media_select()}
          </h3>
          <button
            class="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            onclick={() => pickerOpen = false}
            aria-label={m.common_close()}
          >
            <X class="w-5 h-5" />
          </button>
        </div>
        
        <!-- Content -->
        <div class="flex-1 overflow-hidden p-4">
          <MediaLibrary
            selectable={true}
            multiSelect={multiple}
            onSelect={handleSelect}
            selectedIds={selectedIds()}
          />
        </div>
      </div>
    </div>
  </div>
{/if}
