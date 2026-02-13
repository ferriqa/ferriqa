<script lang="ts">
  import { X, Upload, Loader2, File } from 'lucide-svelte';
  import * as m from '$lib/paraglide/messages.js';
  import UploadDropZone from './UploadDropZone.svelte';
  import { uploadMultipleMedia, formatFileSize } from '$lib/services/mediaApi';
  
  interface Props {
    isOpen: boolean;
    onClose: () => void;
    onUploadComplete: () => void;
  }
  
  let { isOpen, onClose, onUploadComplete }: Props = $props();
  
  let files = $state<File[]>([]);
  let isUploading = $state(false);
  let uploadProgress = $state<Record<string, number>>({});
  let uploadErrors = $state<string[]>([]);
  
  function handleFileSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files) {
      addFiles(input.files);
    }
  }
  
  function handleDrop(fileList: FileList) {
    addFiles(fileList);
  }
  
  function addFiles(fileList: FileList) {
    const newFiles = Array.from(fileList);
    files = [...files, ...newFiles];
    
    // Initialize progress for new files
    newFiles.forEach(file => {
      uploadProgress[file.name] = 0;
    });
  }
  
  function removeFile(index: number) {
    files = files.filter((_, i) => i !== index);
  }
  
  async function handleUpload() {
    if (files.length === 0) return;
    
    isUploading = true;
    uploadErrors = [];
    
    const result = await uploadMultipleMedia(files, (fileIndex, progress) => {
      uploadProgress[files[fileIndex].name] = progress.percentage;
    });
    
    isUploading = false;
    
    if (result.success) {
      files = [];
      uploadProgress = {};
      onUploadComplete();
      onClose();
    } else {
      uploadErrors = result.errors;
    }
  }
  
  function handleClose() {
    if (!isUploading) {
      files = [];
      uploadProgress = {};
      uploadErrors = [];
      onClose();
    }
  }
</script>

{#if isOpen}
  <!-- 
    Preline UI Modal Component
    Based on Preline's modal overlay styling
  -->
  <div 
    class="fixed inset-0 z-50 overflow-y-auto"
    role="dialog"
    aria-modal="true"
  >
    <!-- Backdrop -->
    <div 
      class="fixed inset-0 bg-gray-900/50 transition-opacity"
      onclick={handleClose}
    ></div>
    
    <!-- Modal Panel -->
    <div class="flex min-h-full items-center justify-center p-4">
      <div class="relative bg-card border border-card-line rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-card-line">
          <h3 class="text-lg font-semibold text-foreground">
            {m.media_upload()}
          </h3>
          <button
            class="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            onclick={handleClose}
            disabled={isUploading}
            aria-label={m.common_close()}
          >
            <X class="w-5 h-5" />
          </button>
        </div>
        
        <!-- Content -->
        <div class="p-6 overflow-y-auto max-h-[60vh]">
          {#if files.length === 0}
            <!-- Empty State - Drop Zone -->
            <UploadDropZone 
              isDragging={false}
              onFilesDrop={handleDrop}
              onClick={() => document.getElementById('file-input')?.click()}
            />
            <input
              type="file"
              id="file-input"
              class="hidden"
              multiple
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt"
              onchange={handleFileSelect}
            />
          {:else}
            <!-- File List -->
            <div class="space-y-3">
              {#each files as file, index}
                <div class="flex items-center gap-3 p-3 bg-surface border border-card-line rounded-lg">
                  <!-- File Icon -->
                  <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    {#if file.type.startsWith('image/')}
                      <img 
                        src={URL.createObjectURL(file)} 
                        alt={file.name}
                        class="w-full h-full object-cover rounded-lg"
                      />
                    {:else}
                      <File class="w-5 h-5 text-primary" />
                    {/if}
                  </div>
                  
                  <!-- File Info -->
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-foreground truncate">{file.name}</p>
                    <p class="text-xs text-muted-foreground-1">{formatFileSize(file.size)}</p>
                  </div>
                  
                  <!-- Progress or Remove -->
                  {#if isUploading}
                    <div class="flex items-center gap-2">
                      <div class="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          class="h-full bg-primary transition-all duration-300"
                          style="width: {uploadProgress[file.name] || 0}%"
                        ></div>
                      </div>
                      <span class="text-xs text-muted-foreground-1 w-10 text-right">
                        {uploadProgress[file.name] || 0}%
                      </span>
                    </div>
                  {:else}
                    <button
                      class="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      onclick={() => removeFile(index)}
                      aria-label="Remove file"
                    >
                      <X class="w-4 h-4" />
                    </button>
                  {/if}
                </div>
              {/each}
              
              <!-- Add More Button -->
              {#if !isUploading}
                <button
                  class="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-muted-foreground-1 hover:border-gray-400 hover:text-foreground transition-colors"
                  onclick={() => document.getElementById('file-input-add')?.click()}
                >
                  + {m.common_add()} {m.media_upload()}
                </button>
                <input
                  type="file"
                  id="file-input-add"
                  class="hidden"
                  multiple
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt"
                  onchange={handleFileSelect}
                />
              {/if}
            </div>
          {/if}
          
          <!-- Errors -->
          {#if uploadErrors.length > 0}
            <div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p class="text-sm font-medium text-red-800 mb-2">Upload errors:</p>
              <ul class="text-sm text-red-600 space-y-1">
                {#each uploadErrors as error}
                  <li>{error}</li>
                {/each}
              </ul>
            </div>
          {/if}
        </div>
        
        <!-- Footer -->
        {#if files.length > 0}
          <div class="flex justify-end gap-3 p-4 border-t border-card-line bg-surface">
            <button
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
              onclick={handleClose}
              disabled={isUploading}
            >
              {m.common_cancel()}
            </button>
            <button
              class="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 flex items-center gap-2"
              onclick={handleUpload}
              disabled={isUploading}
            >
              {#if isUploading}
                <Loader2 class="w-4 h-4 animate-spin" />
              {:else}
                <Upload class="w-4 h-4" />
              {/if}
              {isUploading ? 'Uploading...' : m.media_upload()}
            </button>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
