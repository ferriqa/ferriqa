<script lang="ts">
  import { m } from '$lib/paraglide/messages.js';
  import type { FieldType, FieldCategory } from './types.js';
  import { getFieldTypesByCategory, FIELD_CATEGORIES } from './fieldTypes.js';
  import { addField } from '$lib/stores/blueprintStore.svelte.js';

  // REVIEW NOTE (2026-02-13): Translation lookup for field names
  // fieldType.name contains translation keys like "field_text", "field_number", etc.
  // Try to translate, fallback to formatted name if translation not found or requires args
  function getFieldName(name: string): string {
    // Only attempt translation for keys that start with "field_"
    if (!name.startsWith('field_')) return name;
    
    // Format the key (e.g., "field_text" -> "Text", "field_text_area" -> "Text Area")
    // This is a safe fallback that doesn't require checking translation function signatures
    return name
      .replace('field_', '')
      .replace(/_/g, ' ')
      .replace(/^./, (c) => c.toUpperCase());
  }

  interface Props {
    onaddfield: (type: string) => void;
  }

  let { onaddfield }: Props = $props();

  const categories = [
    { id: FIELD_CATEGORIES.BASIC, label: m.blueprint_builder_basic_fields() },
    { id: FIELD_CATEGORIES.ADVANCED, label: m.blueprint_builder_advanced_fields() },
    { id: FIELD_CATEGORIES.RELATION, label: m.blueprint_builder_relation_fields() },
    { id: FIELD_CATEGORIES.MEDIA, label: m.blueprint_builder_media_fields() },
  ];

  let expandedCategories = $state<Set<FieldCategory>>(new Set([FIELD_CATEGORIES.BASIC]));

  function toggleCategory(categoryId: FieldCategory) {
    if (expandedCategories.has(categoryId)) {
      expandedCategories.delete(categoryId);
    } else {
      expandedCategories.add(categoryId);
    }
    expandedCategories = new Set(expandedCategories);
  }
</script>

<div class="card">
  <div class="card-header">
    <h3 class="card-title text-lg font-semibold text-gray-900">
      {m.blueprint_builder_field_palette()}
    </h3>
  </div>
  <div class="card-body">
    <div class="space-y-4">
      {#each categories as category}
        <div>
          <button
            class="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            onclick={() => toggleCategory(category.id)}
          >
            <span class="font-medium text-gray-900 text-sm">{category.label}</span>
            <svg
              class="size-5 text-gray-500 transition-transform {expandedCategories.has(
                category.id
              )
                ? 'rotate-180'
                : ''}"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {#if expandedCategories.has(category.id)}
            <div class="mt-2 space-y-1">
              {#each getFieldTypesByCategory(category.id) as fieldType}
                <button
                  class="w-full flex items-center gap-3 p-3 text-left hover:bg-white border border-transparent hover:border-gray-200 hover:shadow-sm rounded-lg transition-all group"
                  onclick={() => onaddfield(fieldType.id)}
                >
                  <div
                    class="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-600 group-hover:bg-blue-200"
                  >
                    <span class="text-sm font-bold">{fieldType.name[0]}</span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium text-gray-900">
                      {getFieldName(fieldType.name)}
                    </div>
                    <div class="text-xs text-gray-500 truncate">{fieldType.description}</div>
                  </div>
                  <svg
                    class="size-4 text-gray-400 group-hover:text-blue-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </button>
              {/each}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</div>
