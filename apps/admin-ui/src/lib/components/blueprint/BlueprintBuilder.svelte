<script lang="ts">
  import { m } from '$lib/paraglide/messages.js';
  import {
    setBlueprintName,
    setBlueprintSlug,
    setBlueprintDescription,
    addField,
    reorderFields,
    getState,
    getControls,
    selectField,
    forceArchive,
    loadBlueprint,
    reset,
  } from '$lib/stores/blueprintStore.svelte.js';
  import FieldPalette from './FieldPalette.svelte';
  import FieldCanvas from './FieldCanvas.svelte';
  import FieldEditor from './FieldEditor.svelte';
  import UndoRedoToolbar from './UndoRedoToolbar.svelte';
  import type { Blueprint, BlueprintApiResponse, FieldType } from './types.js';
  import {
    createBlueprint,
    updateBlueprint,
    validateBlueprint,
    getBlueprints,
    exportBlueprintAsJSON,
    downloadBlueprintAsJSON,
  } from '$lib/services/blueprintApi.js';

  interface Props {
    onCancel: () => void;
    onSave?: (blueprint: Blueprint) => Promise<void>;
    onSuccess?: (blueprint: Blueprint) => void;
    initialBlueprint?: Blueprint | null;
    blueprintId?: string | null;
  }

  let { 
    onCancel, 
    onSave, 
    onSuccess,
    initialBlueprint = null,
    blueprintId = null 
  }: Props = $props();

  let initialBlueprintState = getState();
  let hasUnsavedChanges = $state(false);
  let saving = $state(false);
  let loading = $state(false);
  let validationErrors = $state<string[]>([]);
  let apiError = $state<string | null>(null);
  let availableBlueprints = $state<Blueprint[]>([]);
  let isEditing = $state(!!blueprintId);

  // Make blueprintState reactive to store changes
  let blueprintState = $derived.by(() => getState());

  // Load initial blueprint if provided or fetch by ID
  $effect(() => {
    if (initialBlueprint) {
      loadBlueprint(initialBlueprint);
      initialBlueprintState = getState();
    } else if (blueprintId) {
      loadBlueprintById(blueprintId);
    }
  });

  // Load available blueprints for relation configurator
  $effect(() => {
    loadAvailableBlueprints();
  });

  async function loadBlueprintById(id: string) {
    loading = true;
    apiError = null;
    try {
      const { getBlueprint } = await import('$lib/services/blueprintApi.js');
      const response = await getBlueprint(id);
      if (response.success && response.data) {
        loadBlueprint(response.data);
        initialBlueprintState = getState();
      } else {
        apiError = response.error || 'Failed to load blueprint';
      }
    } catch (error) {
      apiError = error instanceof Error ? error.message : 'Failed to load blueprint';
    } finally {
      loading = false;
    }
  }

  async function loadAvailableBlueprints() {
    try {
      const response = await getBlueprints(1, 100);
      if (response.success && response.data) {
        // Filter out current blueprint to prevent self-referencing
        availableBlueprints = response.data.filter(bp => bp.id !== blueprintId);
      }
    } catch (error) {
      console.error('Failed to load available blueprints:', error);
    }
  }

  // Validate blueprint before save
  function validateBlueprintLocal(): boolean {
    const errors: string[] = [];

    if (!blueprintState.name || blueprintState.name.trim() === '') {
      errors.push('Name is required');
    }

    if (!blueprintState.slug || blueprintState.slug.trim() === '') {
      errors.push('Slug is required');
    }

    if (blueprintState.fields.length === 0) {
      errors.push('At least one field is required');
    }

    // Validate field keys are unique
    const keys = blueprintState.fields.map(f => f.key);
    const duplicateKeys = keys.filter((key, index) => keys.indexOf(key) !== index);
    if (duplicateKeys.length > 0) {
      errors.push(`Duplicate field keys: ${duplicateKeys.join(', ')}`);
    }

    validationErrors = errors;
    return errors.length === 0;
  }

  // Track unsaved changes by comparing with initial state
  $effect(() => {
    const current = getState();
    hasUnsavedChanges = JSON.stringify(current) !== JSON.stringify(initialBlueprintState);
  });

  async function handleSave() {
    // Validate before saving
    if (!validateBlueprintLocal()) {
      return;
    }

    saving = true;
    apiError = null;

    try {
      const currentState = getState();
      const { selectedFieldId, ...blueprint } = currentState;

      // Validate on server first
      const validationResponse = await validateBlueprint(blueprint);
      if (!validationResponse.success) {
        validationErrors = validationResponse.errors 
          ? Object.values(validationResponse.errors).flat()
          : [validationResponse.error || 'Validation failed'];
        saving = false;
        return;
      }

      let response: BlueprintApiResponse;

      if (isEditing && blueprintId) {
        // Update existing
        response = await updateBlueprint(blueprintId, blueprint);
      } else {
        // Create new
        response = await createBlueprint(blueprint);
      }

      if (response.success) {
        hasUnsavedChanges = false;
        validationErrors = [];
        
        // Call custom onSave handler if provided
        if (onSave && response.data) {
          await onSave(response.data);
        }

        // Call onSuccess callback
        if (onSuccess && response.data) {
          onSuccess(response.data);
        }

        // Update state if we have a new ID
        if (response.data?.id) {
          isEditing = true;
          // Reload available blueprints to include this one
          await loadAvailableBlueprints();
        }
      } else {
        apiError = response.error || 'Failed to save blueprint';
        if (response.errors) {
          validationErrors = Object.values(response.errors).flat();
        }
      }
    } catch (error) {
      apiError = error instanceof Error ? error.message : 'Failed to save blueprint';
    } finally {
      saving = false;
    }
  }

  async function handleExport() {
    const blueprint = getState();
    const { selectedFieldId, ...exportData } = blueprint;
    downloadBlueprintAsJSON(exportData as Blueprint, `${blueprint.slug || blueprint.name}.json`);
  }

  function handleCancel() {
    if (hasUnsavedChanges && !confirm(m.blueprint_builder_unsaved_changes())) {
      return;
    }
    reset();
    onCancel();
  }

  function handleReorderFields(fields: import('./types.js').FieldDefinition[]) {
    reorderFields(fields);
    hasUnsavedChanges = true;
  }

  // REVIEW NOTE (2026-02-13): The type assertion `as FieldType` is safe here because:
  // - handleAddField is only called from FieldPalette component
  // - FieldPalette gets field types from FIELD_TYPES array (fieldTypes.ts)
  // - FIELD_TYPES IDs are predefined literal strings matching FieldType union
  // - This is not user input, so there's no risk of invalid values at runtime
  function handleAddField(type: string) {
    addField(type as FieldType);
    hasUnsavedChanges = true;
  }

  // Keyboard shortcuts
  $effect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ctrl/Cmd + S = Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      // Ctrl/Cmd + Z = Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        getControls().back();
      }
      // Ctrl/Cmd + Shift + Z = Redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        getControls().forward();
      }
      // Ctrl/Cmd + E = Export
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        handleExport();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });
</script>

<div class="min-h-screen bg-gray-50 p-6">
  <div class="max-w-[1800px] mx-auto">
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 mb-2">
          {isEditing ? 'Edit Blueprint' : m.blueprint_builder_title()}
        </h1>
        <p class="text-gray-500">
          {isEditing ? `Editing: ${blueprintState.name}` : 'Design your content model by adding and configuring fields'}
        </p>
      </div>
      <div class="flex items-center gap-3">
        <button
          onclick={handleExport}
          class="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          title="Export as JSON (Ctrl+E)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export
        </button>
      </div>
    </div>

    <!-- Loading State -->
    {#if loading}
      <div class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div class="flex items-center">
          <svg class="animate-spin w-5 h-5 text-blue-500 mr-3" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span class="text-sm text-blue-700">Loading blueprint...</span>
        </div>
      </div>
    {/if}

    <!-- API Error -->
    {#if apiError}
      <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div class="flex">
          <svg class="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
          <div class="flex-1">
            <h3 class="text-sm font-medium text-red-800">Error</h3>
            <p class="text-sm text-red-700 mt-1">{apiError}</p>
          </div>
          <button
            onclick={() => apiError = null}
            class="text-red-400 hover:text-red-600"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    {/if}

    <!-- Validation Errors -->
    {#if validationErrors.length > 0}
      <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div class="flex">
          <svg class="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
          <div class="flex-1">
            <h3 class="text-sm font-medium text-red-800">Please fix the following errors:</h3>
            <ul class="mt-2 text-sm text-red-700 list-disc list-inside">
              {#each validationErrors as error}
                <li>{error}</li>
              {/each}
            </ul>
          </div>
        </div>
      </div>
    {/if}

    <!-- Blueprint Settings -->
    <div class="card mb-6">
      <div class="card-header">
        <h3 class="card-title text-lg font-semibold text-gray-900">
          {m.common_settings()}
        </h3>
      </div>
      <div class="card-body">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label for="blueprint-name" class="block text-sm font-medium text-gray-700 mb-1">
              {m.common_name()}
              <span class="text-red-500">*</span>
            </label>
            <input
              id="blueprint-name"
              type="text"
              class="py-2.5 px-4 block w-full border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
              value={blueprintState.name}
              oninput={(e) => {
                setBlueprintName(e.currentTarget.value);
                hasUnsavedChanges = true;
              }}
              onblur={() => {
                forceArchive();
              }}
              placeholder="e.g., Blog Post"
            />
          </div>

          <div>
            <label for="blueprint-slug" class="block text-sm font-medium text-gray-700 mb-1">
              Slug
              <span class="text-red-500">*</span>
            </label>
            <input
              id="blueprint-slug"
              type="text"
              class="py-2.5 px-4 block w-full border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 font-mono"
              value={blueprintState.slug}
              oninput={(e) => {
                // Real-time sanitize
                const sanitized = e.currentTarget.value
                  .toLowerCase()
                  .replace(/\s+/g, '-')
                  .replace(/[^a-z0-9-]/g, '')
                  .replace(/-+/g, '-');
                setBlueprintSlug(sanitized);
                hasUnsavedChanges = true;
                // Clear validation error when user starts typing
                validationErrors = validationErrors.filter(err => err !== 'Slug is required');
              }}
              onblur={(e) => {
                // Final cleanup on blur
                const sanitized = e.currentTarget.value
                  .trim()
                  .replace(/^-+|-+$/g, '');
                if (sanitized !== e.currentTarget.value) {
                  setBlueprintSlug(sanitized);
                }
                // Archive to history
                forceArchive();
              }}
              placeholder="blog-post"
            />
            <p class="text-xs text-gray-500 mt-1">Auto-sanitized: lowercase, hyphens only</p>
          </div>

          <div>
            <label for="blueprint-description" class="block text-sm font-medium text-gray-700 mb-1">
              {m.common_description()}
            </label>
            <input
              id="blueprint-description"
              type="text"
              class="py-2.5 px-4 block w-full border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
              value={blueprintState.description || ''}
              oninput={(e) => {
                setBlueprintDescription(e.currentTarget.value);
                hasUnsavedChanges = true;
              }}
              onblur={() => {
                forceArchive();
              }}
              placeholder="Optional description"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Main Builder Grid -->
    <div class="grid grid-cols-12 gap-6">
      <!-- Field Palette (Left) -->
      <div class="col-span-3">
        <FieldPalette onaddfield={(type) => handleAddField(type)} />
      </div>

      <!-- Field Canvas (Center) -->
      <div class="col-span-5">
        <FieldCanvas
          fields={blueprintState.fields}
          selectedFieldId={blueprintState.selectedFieldId}
          onreorder={handleReorderFields}
        />
      </div>

      <!-- Field Editor (Right) -->
      <div class="col-span-4">
        <div class="card sticky top-6">
          <div class="card-header">
            <h3 class="card-title text-lg font-semibold text-gray-900">
              {m.blueprint_builder_editor()}
            </h3>
          </div>
          <div class="card-body overflow-y-auto max-h-[calc(100vh-300px)]">
            {#if blueprintState.selectedFieldId}
              {@const selectedField = blueprintState.fields.find((f) => f.id === blueprintState.selectedFieldId)}
              {#if selectedField}
                <FieldEditor field={selectedField} {availableBlueprints} allFields={blueprintState.fields} />
              {:else}
                <div class="text-center text-gray-500 py-8">
                  Field not found
                </div>
              {/if}
            {:else}
              <div class="flex flex-col items-center justify-center py-12 text-center">
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
                      d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                    />
                  </svg>
                </div>
                <h4 class="text-gray-900 font-medium mb-1">
                  No field selected
                </h4>
                <p class="text-gray-500 text-sm">
                  Select a field from the canvas to edit its properties
                </p>
              </div>
            {/if}
          </div>
        </div>
      </div>
    </div>

    <!-- Undo/Redo Toolbar -->
    <div class="mt-6">
      <div class="card">
        <UndoRedoToolbar
          onCancel={handleCancel}
          onSave={handleSave}
          hasUnsavedChanges={hasUnsavedChanges}
          {saving}
          isEditing={isEditing}
        />
      </div>
    </div>
  </div>
</div>
