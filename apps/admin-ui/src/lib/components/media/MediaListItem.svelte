<script lang="ts">
  import { X, Image, FileText, Music, Video, File } from 'lucide-svelte';
  import { formatFileSize, getFileIcon, isImageFile } from '$lib/services/mediaApi';
  import type { MediaFile } from './types.ts';
  
  interface Props {
    media: MediaFile;
    selected?: boolean;
    selectable?: boolean;
    onSelect?: () => void;
    onDelete?: () => void;
    onClick?: () => void;
  }
  
  let { 
    media, 
    selected = false, 
    selectable = false,
    onSelect, 
    onDelete,
    onClick 
  }: Props = $props();
  
  function getIcon() {
    const iconType = getFileIcon(media.mimeType);
    switch (iconType) {
      case 'image': return Image;
      case 'video': return Video;
      case 'audio': return Music;
      case 'pdf':
      case 'word':
      case 'excel':
      case 'powerpoint': return FileText;
      default: return File;
    }
  }
  
  function handleClick(e: MouseEvent) {
    if (selectable && onSelect) {
      e.stopPropagation();
      onSelect();
    } else if (onClick) {
      onClick();
    }
  }
</script>

<!-- 
  Preline UI List View - Table Row Style
  Using Preline's table and list styling
-->
<div 
  class="group flex items-center gap-4 p-3 bg-card border border-card-line rounded-xl transition-all duration-200 cursor-pointer hover:border-gray-300
    {selected ? 'border-primary ring-1 ring-primary bg-primary/5' : ''}"
  onclick={handleClick}
  role="button"
  tabindex="0"
  onkeydown={(e) => e.key === 'Enter' && handleClick(e as unknown as MouseEvent)}
>
  <!-- Selection Checkbox -->
  {#if selectable}
    <div class="flex-shrink-0">
      <div class="w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
        {selected ? 'bg-primary border-primary' : 'bg-white border-gray-300'}">
        {#if selected}
          <svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
          </svg>
        {/if}
      </div>
    </div>
  {/if}
  
  <!-- Thumbnail or Icon -->
  <div class="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-surface">
    {#if isImageFile(media)}
      <img 
        src={media.thumbnailUrl || media.url} 
        alt={media.alt || media.originalName}
        class="w-full h-full object-cover"
        loading="lazy"
      />
    {:else}
      <div class="flex items-center justify-center w-full h-full bg-gray-100">
        <svelte:component this={getIcon()} class="w-6 h-6 text-gray-400" />
      </div>
    {/if}
  </div>
  
  <!-- File Info -->
  <div class="flex-1 min-w-0">
    <p class="text-sm font-medium text-foreground truncate" title={media.originalName}>
      {media.originalName}
    </p>
    <p class="text-xs text-muted-foreground-1">
      {media.mimeType} • {formatFileSize(media.size)}
    </p>
  </div>
  
  <!-- Dimensions (for images) -->
  {#if media.width && media.height}
    <div class="hidden sm:block flex-shrink-0 text-xs text-muted-foreground-1">
      {media.width}×{media.height}
    </div>
  {/if}
  
  <!-- Date -->
  <div class="hidden md:block flex-shrink-0 text-xs text-muted-foreground-1">
    {new Date(media.createdAt).toLocaleDateString()}
  </div>
  
  <!-- Delete Button -->
  {#if onDelete}
    <button
      class="flex-shrink-0 p-2 rounded-lg text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600"
      onclick={(e) => { e.stopPropagation(); onDelete(); }}
      aria-label="Delete media"
    >
      <X class="w-4 h-4" />
    </button>
  {/if}
</div>
