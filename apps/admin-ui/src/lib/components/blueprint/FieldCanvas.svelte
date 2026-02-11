<script lang="ts">
  import { m } from '$lib/paraglide/messages.js';
  import type { FieldDefinition } from './types.js';
  import { removeField, selectField, duplicateField } from '$lib/stores/blueprintStore.svelte.js';

  interface Props {
    fields: FieldDefinition[];
    selectedFieldId: string | null;
    onreorder: (fields: FieldDefinition[]) => void;
    onselect?: (fieldId: string) => void;
  }

  let { fields, selectedFieldId, onreorder, onselect }: Props = $props();

  let activeId = $state<string | null>(null);

  function handleDragStart(event: any) {
    activeId = event.active.id;
  }

  function handleDragEnd(event: any) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((f) => f.id === active.id);
      const newIndex = fields.findIndex((f) => f.id === over.id);

      const newFields = [...fields];
      const [removed] = newFields.splice(oldIndex, 1);
      newFields.splice(newIndex, 0, removed);

      onreorder(newFields);
    }

    activeId = null;
  }

  function handleSelectField(fieldId: string) {
    selectField(fieldId);
  }

  function handleDeleteField(fieldId: string) {
    if (confirm(m.blueprint_builder_delete_field_confirm())) {
      removeField(fieldId);
    }
  }

  function handleDuplicateField(fieldId: string) {
    duplicateField(fieldId);
  }
</script>

<div class="card h-full flex flex-col">
  <div class="card-header flex justify-between items-center">
    <div>
      <h3 class="text-lg font-semibold text-gray-900">
        Fields
      </h3>
      <p class="text-sm text-gray-500 mt-1">Drag to reorder</p>
    </div>
    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
      {fields.length} {fields.length === 1 ? 'field' : 'fields'}
    </span>
  </div>

  <div class="card-body flex-1 overflow-y-auto">
    {#if fields.length === 0}
      <div class="flex flex-col items-center justify-center h-full text-center p-8">
        <div
          class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4"
        >
          <svg
            class="size-8 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h4 class="text-gray-900 font-medium mb-1">No fields yet</h4>
        <p class="text-gray-500 text-sm">
          Add fields from the palette to get started
        </p>
      </div>
    {:else}
      <div class="space-y-2">
        {#each fields as field (field.id)}
          <div
            class="p-4 border rounded-lg cursor-pointer transition-all {selectedFieldId === field.id
              ? 'border-blue-500 bg-blue-50 shadow-sm'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}"
            draggable="true"
            ondragstart={(e) => {
              e.dataTransfer?.setData('text/plain', field.id);
              handleDragStart({ active: { id: field.id } });
            }}
            ondragover={(e) => {
              e.preventDefault();
              if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
            }}
            ondrop={(e) => {
              e.preventDefault();
              const draggedId = e.dataTransfer?.getData('text/plain');
              if (draggedId) {
                handleDragEnd({
                  active: { id: draggedId },
                  over: { id: field.id }
                });
              }
            }}
            onclick={() => handleSelectField(field.id)}
            role="button"
            tabindex="0"
            onkeydown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleSelectField(field.id);
              }
            }}
          >
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-3 flex-1 min-w-0">
                <div class="flex-shrink-0 text-gray-400 hover:text-gray-600 cursor-grab p-1">
                  <svg class="size-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
                  </svg>
                </div>

                <div
                  class="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 text-gray-600"
                >
                  <span class="text-lg font-semibold">{field.type[0].toUpperCase()}</span>
                </div>

                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <h4 class="text-sm font-semibold text-gray-900 truncate">
                      {field.name}
                    </h4>
                    {#if field.required}
                      <span class="text-red-500 text-xs">*</span>
                    {/if}
                  </div>
                  <div class="flex items-center gap-2 mt-1">
                    <span class="text-xs text-gray-500 font-mono">{field.key}</span>
                    <span class="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      {field.type}
                    </span>
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-1">
                <button
                  class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                  onclick={(e) => {
                    e.stopPropagation();
                    handleDuplicateField(field.id);
                  }}
                  aria-label="Duplicate field"
                  title={m.blueprint_builder_duplicate_field()}
                >
                  <svg class="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
                <button
                  class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  onclick={(e) => {
                    e.stopPropagation();
                    handleDeleteField(field.id);
                  }}
                  aria-label="Delete field"
                  title={m.blueprint_builder_delete_field()}
                >
                  <svg class="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
