<script lang="ts">
  import { m } from '$lib/paraglide/messages.js';
  import type { FieldDefinition, Blueprint, RelationConfig } from './types.js';
  import { updateField } from '$lib/stores/blueprintStore.svelte.js';
  import { createUniqueId } from '$lib/utils/uniqueId';

  interface Props {
    field: FieldDefinition;
    availableBlueprints?: Blueprint[];
  }

  let { field, availableBlueprints = [] }: Props = $props();

  // Generate unique IDs for this component instance
  const instanceId = createUniqueId('relation-config');

  // Local state for relation configuration
  let relationConfig = $state<RelationConfig>({
    blueprintId: '',
    type: 'one-to-many',
    displayField: '',
    filter: {},
    sort: { field: '', direction: 'asc' },
  });

  // Watch for field changes and update local state
  $effect(() => {
    relationConfig = {
      blueprintId: field.options?.relation?.blueprintId || '',
      type: field.options?.relation?.type || 'one-to-many',
      displayField: field.options?.relation?.displayField || '',
      filter: field.options?.relation?.filter || {},
      sort: field.options?.relation?.sort || { field: '', direction: 'asc' },
    };
  });

  function handleUpdate() {
    const updates: Partial<FieldDefinition> = {
      options: {
        ...field.options,
        relation: relationConfig,
      },
    };
    updateField(field.id, updates);
  }

  function handleBlueprintChange(blueprintId: string) {
    const selectedBlueprint = availableBlueprints.find(b => b.id === blueprintId);
    relationConfig.blueprintId = blueprintId;
    relationConfig.blueprintName = selectedBlueprint?.name;
    handleUpdate();
  }

  function handleTypeChange(type: RelationConfig['type']) {
    relationConfig.type = type;
    handleUpdate();
  }

  function handleDisplayFieldChange(displayField: string) {
    relationConfig.displayField = displayField;
    handleUpdate();
  }

  function handleSortFieldChange(field: string) {
    if (!relationConfig.sort) {
      relationConfig.sort = { field: '', direction: 'asc' };
    }
    relationConfig.sort.field = field;
    handleUpdate();
  }

  function handleSortDirectionChange(direction: 'asc' | 'desc') {
    if (!relationConfig.sort) {
      relationConfig.sort = { field: '', direction: 'asc' };
    }
    relationConfig.sort.direction = direction;
    handleUpdate();
  }

  // Get fields from selected blueprint for display field selection
  const selectedBlueprintFields = $derived(() => {
    const blueprint = availableBlueprints.find(b => b.id === relationConfig.blueprintId);
    return blueprint?.fields || [];
  });
</script>

<div class="space-y-4">
  <div class="border-b border-gray-200 pb-3 mb-4">
    <h5 class="text-sm font-semibold text-gray-900 mb-1">
      Relation Configuration
    </h5>
    <p class="text-xs text-gray-500">
      Configure how this field relates to other content
    </p>
  </div>

  <!-- Target Blueprint Selection -->
  <div>
    <label for={`${instanceId}-target-blueprint`} class="block text-sm font-medium text-gray-700 mb-1">
      Target Blueprint
      <span class="text-red-500">*</span>
    </label>
    <select
      id={`${instanceId}-target-blueprint`}
      class="py-2.5 px-4 block w-full border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
      value={relationConfig.blueprintId}
      onchange={(e) => handleBlueprintChange(e.currentTarget.value)}
    >
      <option value="">Select a blueprint...</option>
      {#each availableBlueprints as blueprint}
        <option value={blueprint.id}>{blueprint.name}</option>
      {/each}
    </select>
    {#if availableBlueprints.length === 0}
      <p class="text-xs text-amber-600 mt-1">
        No blueprints available. Create some blueprints first.
      </p>
    {/if}
  </div>

  <!-- Relation Type -->
  <div>
    <span class="block text-sm font-medium text-gray-700 mb-2">
      Relation Type
    </span>
    <div class="space-y-2">
      <label class="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
        <input
          type="radio"
          name="relation-type"
          value="one-to-one"
          class="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
          checked={relationConfig.type === 'one-to-one'}
          onchange={() => handleTypeChange('one-to-one')}
        />
        <div class="flex-1">
          <span class="text-sm font-medium text-gray-900 block">One-to-One</span>
          <span class="text-xs text-gray-500">Each item relates to exactly one item</span>
        </div>
      </label>

      <label class="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
        <input
          type="radio"
          name="relation-type"
          value="one-to-many"
          class="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
          checked={relationConfig.type === 'one-to-many'}
          onchange={() => handleTypeChange('one-to-many')}
        />
        <div class="flex-1">
          <span class="text-sm font-medium text-gray-900 block">One-to-Many</span>
          <span class="text-xs text-gray-500">Each item can relate to multiple items</span>
        </div>
      </label>

      <label class="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
        <input
          type="radio"
          name="relation-type"
          value="many-to-many"
          class="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
          checked={relationConfig.type === 'many-to-many'}
          onchange={() => handleTypeChange('many-to-many')}
        />
        <div class="flex-1">
          <span class="text-sm font-medium text-gray-900 block">Many-to-Many</span>
          <span class="text-xs text-gray-500">Items can have multiple relations in both directions</span>
        </div>
      </label>
    </div>
  </div>

  <!-- Display Field -->
  {#if relationConfig.blueprintId}
    <div>
      <label for={`${instanceId}-display-field`} class="block text-sm font-medium text-gray-700 mb-1">
        Display Field
      </label>
      <select
        id={`${instanceId}-display-field`}
        class="py-2.5 px-4 block w-full border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
        value={relationConfig.displayField}
        onchange={(e) => handleDisplayFieldChange(e.currentTarget.value)}
      >
        <option value="">Auto-detect (first text field)</option>
        {#each selectedBlueprintFields() as field}
          <option value={field.key}>{field.name} ({field.key})</option>
        {/each}
      </select>
      <p class="text-xs text-gray-500 mt-1">
        Field to display when showing related items
      </p>
    </div>

    <!-- Sort Configuration -->
    <div class="border-t border-gray-200 pt-4">
      <h6 class="text-xs font-semibold text-gray-700 mb-3">Sort Configuration</h6>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label for={`${instanceId}-sort-field`} class="block text-xs font-medium text-gray-600 mb-1">
            Sort By
          </label>
          <select
            id={`${instanceId}-sort-field`}
            class="py-2 px-3 block w-full border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
            value={relationConfig.sort?.field || ''}
            onchange={(e) => handleSortFieldChange(e.currentTarget.value)}
          >
            <option value="">Default</option>
            {#each selectedBlueprintFields() as field}
              <option value={field.key}>{field.name}</option>
            {/each}
          </select>
        </div>
        <div>
          <label for={`${instanceId}-sort-direction`} class="block text-xs font-medium text-gray-600 mb-1">
            Direction
          </label>
          <select
            id={`${instanceId}-sort-direction`}
            class="py-2 px-3 block w-full border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
            value={relationConfig.sort?.direction || 'asc'}
            onchange={(e) => handleSortDirectionChange(e.currentTarget.value as 'asc' | 'desc')}
          >
            <option value="asc">Ascending (A-Z)</option>
            <option value="desc">Descending (Z-A)</option>
          </select>
        </div>
      </div>
    </div>
  {/if}

  <!-- Relation Info -->
  <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
    <div class="flex items-start gap-2">
      <svg class="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div class="text-xs text-blue-700">
        {#if relationConfig.blueprintId}
          <p class="font-medium mb-1">
            Relation: {field.name} → {availableBlueprints.find(b => b.id === relationConfig.blueprintId)?.name || 'Unknown'}
          </p>
          <p>
            Type: {relationConfig.type.replace('-', ' to ')}
          </p>
        {:else}
          <p>Select a target blueprint to configure the relation.</p>
        {/if}
      </div>
    </div>
  </div>
</div>
