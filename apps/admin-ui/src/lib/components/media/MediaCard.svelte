<script lang="ts">
  import { X, Image, FileText, Music, Video, File } from 'lucide-svelte';
  import { formatFileSize, getFileIcon, isImageFile } from '$lib/services/mediaApi';
  import type { MediaFile } from './types';

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

  function getIconComponent() {
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
  Preline UI Card Component - Grid View
  Using bg-card, border-card-line, rounded-xl from Preline theme
-->
<div
  class="group relative flex flex-col bg-card border rounded-xl overflow-hidden transition-all duration-200 cursor-pointer
    {selected
      ? 'border-primary ring-2 ring-primary ring-offset-2'
      : 'border-card-line hover:border-gray-300 hover:shadow-md'}"
  onclick={handleClick}
  role="button"
  tabindex="0"
  onkeydown={(e) => e.key === 'Enter' && handleClick(e as unknown as MouseEvent)}
>
  <!-- Image Preview or Icon -->
  <div class="relative aspect-square bg-surface overflow-hidden">
    {#if isImageFile(media)}
      <img
        src={media.thumbnailUrl || media.url}
        alt={media.alt || media.originalName}
        class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />
    {:else}
      <div class="flex items-center justify-center w-full h-full bg-gray-100">
        {#if getIconComponent() === Image}
          <Image class="w-16 h-16 text-gray-400" />
        {:else if getIconComponent() === Video}
          <Video class="w-16 h-16 text-gray-400" />
        {:else if getIconComponent() === Music}
          <Music class="w-16 h-16 text-gray-400" />
        {:else if getIconComponent() === FileText}
          <FileText class="w-16 h-16 text-gray-400" />
        {:else}
          <File class="w-16 h-16 text-gray-400" />
        {/if}
      </div>
    {/if}

    <!-- Selection Overlay -->
    {#if selectable}
      <div class="absolute top-2 left-2">
        <div class="w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
          {selected ? 'bg-primary border-primary' : 'bg-white/90 border-gray-300'}">
          {#if selected}
            <svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
            </svg>
          {/if}
        </div>
      </div>
    {/if}

    <!-- Delete Button -->
    {#if onDelete}
      <button
        class="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600"
        onclick={(e) => { e.stopPropagation(); onDelete(); }}
        aria-label="Delete media"
      >
        <X class="w-4 h-4" />
      </button>
    {/if}
  </div>

  <!-- Card Content -->
  <div class="p-3 border-t border-card-line">
    <p class="text-sm font-medium text-foreground truncate" title={media.originalName}>
      {media.originalName}
    </p>
    <div class="flex items-center justify-between mt-1 text-xs text-muted-foreground-1">
      <span>{formatFileSize(media.size)}</span>
      <span>{new Date(media.createdAt).toLocaleDateString()}</span>
    </div>
  </div>
</div>
