<script lang="ts">
  import { Upload } from 'lucide-svelte';
  import * as m from '$lib/paraglide/messages.js';

  interface Props {
    isDragging?: boolean;
    onFilesDrop: (files: FileList) => void;
    onClick: () => void;
  }

  let { isDragging = false, onFilesDrop, onClick }: Props = $props();
  
  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    isDragging = true;
  }
  
  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    isDragging = false;
  }
  
  function handleDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    isDragging = false;
    
    if (e.dataTransfer?.files) {
      onFilesDrop(e.dataTransfer.files);
    }
  }
</script>

<!-- 
  Preline UI File Upload Drop Zone
  Based on Preline's file-upload plugin styling
-->
<div
  class="relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer
    {isDragging 
      ? 'border-primary bg-primary/5 scale-[1.02]' 
      : 'border-gray-300 bg-card hover:border-gray-400 hover:bg-surface'}"
  ondragover={handleDragOver}
  ondragleave={handleDragLeave}
  ondrop={handleDrop}
  onclick={onClick}
  role="button"
  tabindex="0"
  onkeydown={(e) => e.key === 'Enter' && onClick()}
>
  <div class="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
    <div class="p-4 mb-3 rounded-full bg-primary/10 text-primary">
      <Upload class="w-8 h-8" />
    </div>
    <p class="mb-2 text-sm font-medium text-foreground">
      <span class="font-semibold">{m.media_upload_click_to_upload()}</span> {m.common_or()} {m.media_upload_drag_and_drop()}
    </p>
    <p class="text-xs text-muted-foreground-1">
      SVG, PNG, JPG, GIF, PDF, MP4, MP3 {m.common_or()} {m.media_upload_other_formats()}
    </p>
  </div>
</div>
