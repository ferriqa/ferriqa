<script lang="ts">
  import { m } from '$lib/paraglide/messages.js';
  import { getControls, getCanUndo, getCanRedo } from '$lib/stores/blueprintStore.svelte.js';

  interface Props {
    onSave: () => void;
    onCancel: () => void;
    hasUnsavedChanges?: boolean;
    saving?: boolean;
    isEditing?: boolean;
  }

  let { 
    onSave, 
    onCancel, 
    hasUnsavedChanges = false,
    saving = false,
    isEditing = false
  }: Props = $props();

  const controls = getControls();
  
  // Reactive undo/redo state
  let canUndo = $derived(getCanUndo());
  let canRedo = $derived(getCanRedo());
</script>

<div class="card-footer flex justify-between items-center border-t border-gray-200 bg-white p-4">
  <!-- Undo/Redo Controls -->
  <div class="flex items-center gap-2">
    <button
      class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-800 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:opacity-50 disabled:pointer-events-none"
      disabled={!canUndo || saving}
      onclick={() => controls.back()}
      title={m.common_undo()}
    >
      <svg class="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
      </svg>
      <span class="hidden sm:inline">{m.common_undo()}</span>
    </button>

    <button
      class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-800 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:opacity-50 disabled:pointer-events-none"
      disabled={!canRedo || saving}
      onclick={() => controls.forward()}
      title={m.common_redo()}
    >
      <svg class="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
      </svg>
      <span class="hidden sm:inline">{m.common_redo()}</span>
    </button>

    {#if hasUnsavedChanges}
      <span class="ml-2 text-sm text-yellow-600 font-medium">
        • {m.blueprint_builder_unsaved_changes()}
      </span>
    {/if}
  </div>

  <!-- Action Buttons -->
  <div class="flex items-center gap-2">
    <button
      class="py-2.5 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-800 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:opacity-50 disabled:pointer-events-none"
      onclick={onCancel}
      disabled={saving}
    >
      <svg class="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
      {m.common_cancel()}
    </button>

    <button
      class="py-2.5 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg bg-blue-600 border border-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none"
      onclick={onSave}
      disabled={saving}
    >
      {#if saving}
        <svg class="animate-spin size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Saving...</span>
      {:else}
        <svg class="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <span>{isEditing ? 'Update' : m.common_save()}</span>
      {/if}
    </button>
  </div>
</div>
