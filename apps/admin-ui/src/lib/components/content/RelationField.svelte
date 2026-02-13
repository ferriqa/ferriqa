<script lang="ts">
  import { X, FileText, Plus, Link2, Loader2 } from 'lucide-svelte';
  import * as m from '$lib/paraglide/messages.js';
  import ContentPicker from './ContentPicker.svelte';
  import type { FieldDefinition } from '../blueprint/types';
  import { getContentById } from '$lib/services/contentApi';
  import type { ContentItem } from './types';

  interface Props {
    field: FieldDefinition;
    value?: string | string[] | null;
    error?: string;
    onchange?: (key: string, value: unknown) => void;
  }

  let { field, value = null, error, onchange }: Props = $props();

  const relation = field.options?.relation;
  const isMulti = relation?.type === 'one-to-many' || relation?.type === 'many-to-many';

  let pickerOpen = $state(false);
  let selectedItems = $state<ContentItem[]>([]);
  let loadingItems = $state(false);

  // Parse value into array of IDs
  let selectedIds = $derived(() => {
    if (value === null || value === undefined) return [];
    if (Array.isArray(value)) return value;
    return [value];
  });

  // Load selected items when value changes
  $effect(() => {
    loadSelectedItems();
  });

  async function loadSelectedItems() {
    const ids = selectedIds();
    if (ids.length === 0) {
      selectedItems = [];
      return;
    }

    loadingItems = true;
    const results = await Promise.all(ids.map(id => getContentById(id)));
    selectedItems = results
      .filter(result => result.success && result.data)
      .map(result => result.data!);
    loadingItems = false;
  }

  function handleSelect(items: ContentItem[]) {
    if (isMulti) {
      onchange?.(field.key, items.map(item => item.id));
    } else {
      onchange?.(field.key, items[0]?.id || null);
    }
    pickerOpen = false;
    selectedItems = items;
  }

  function removeItem(id: string) {
    const ids = selectedIds();
    if (isMulti && Array.isArray(value)) {
      const newValue = ids.filter(v => v !== id);
      onchange?.(field.key, newValue.length > 0 ? newValue : null);
      selectedItems = selectedItems.filter(item => item.id !== id);
    } else {
      onchange?.(field.key, null);
      selectedItems = [];
    }
  }

  function getItemTitle(item: ContentItem): string {
    return (item.data?.title as string) || item.slug || 'Untitled';
  }

  function getItemSubtitle(item: ContentItem): string {
    return item.slug || `ID: ${item.id}`;
  }

  function openPicker() {
    pickerOpen = true;
  }
</script>

<div class="space-y-3">
  <label class="block text-sm font-medium text-foreground">
    {field.name}
    {#if field.required}
      <span class="text-red-500">*</span>
    {/if}
    {#if field.description}
      <span class="block text-xs font-normal text-muted-foreground-1 mt-0.5">
        {field.description}
      </span>
    {/if}
  </label>

  <!-- Selected Items Preview -->
  <div class="border border-card-line rounded-xl p-4 space-y-3 bg-card">
    {#if loadingItems}
      <div class="flex items-center justify-center py-4">
        <Loader2 class="w-5 h-5 animate-spin text-primary mr-2" />
        <span class="text-sm text-muted-foreground-1">{m.common_loading()}</span>
      </div>
    {:else if selectedItems.length === 0}
      <p class="text-sm text-muted-foreground-1 text-center py-4">
        {m.relationPicker_noSelection()}
      </p>
    {:else}
      <div class="space-y-2">
        {#each selectedItems as item}
          <div class="flex items-center gap-3 p-2 bg-surface rounded-lg group">
            <!-- Thumbnail -->
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

            <!-- Remove Button -->
            <button
              class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
              onclick={() => removeItem(item.id)}
              aria-label={m.common_remove()}
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        {/each}
      </div>
    {/if}

    <!-- Add Button -->
    <button
      type="button"
      class="w-full py-2.5 px-4 text-sm font-medium text-gray-700 bg-white border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all flex items-center justify-center gap-2"
      onclick={openPicker}
    >
      <Plus class="w-4 h-4" />
      {isMulti ? m.relationPicker_addItems() : m.relationPicker_addItem()}
    </button>
  </div>

  {#if error}
    <p class="text-sm text-red-600">{error}</p>
  {/if}

  {#if field.ui?.helpText}
    <p class="text-sm text-muted-foreground-1">{field.ui.helpText}</p>
  {/if}
</div>

<!-- Content Picker Modal -->
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
      <div class="relative bg-card border border-card-line rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <ContentPicker
          blueprintId={relation?.blueprintId || ''}
          blueprintName={relation?.blueprintName || 'Content'}
          isMulti={isMulti}
          selectedIds={selectedIds()}
          onSelect={handleSelect}
          onClose={() => pickerOpen = false}
        />
      </div>
    </div>
  </div>
{/if}
