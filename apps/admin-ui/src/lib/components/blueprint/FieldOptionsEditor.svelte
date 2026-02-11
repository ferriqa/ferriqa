<script lang="ts">
  import { m } from '$lib/paraglide/messages.js';
  import type { FieldDefinition } from './types.js';
  import { updateField } from '$lib/stores/blueprintStore.svelte.js';

  interface Props {
    field: FieldDefinition;
  }

  let { field }: Props = $props();

  // Local state for choices
  let choices = $state<string[]>(field.options?.choices || []);
  let newChoice = $state('');

  // Media options
  let mediaMultiple = $state(field.options?.media?.multiple || false);
  let mediaAccept = $state<string[]>(field.options?.media?.accept || ['image/*']);

  $effect(() => {
    choices = field.options?.choices || [];
    mediaMultiple = field.options?.media?.multiple || false;
    mediaAccept = field.options?.media?.accept || ['image/*'];
  });

  function handleAddChoice() {
    if (newChoice.trim() && !choices.includes(newChoice.trim())) {
      choices = [...choices, newChoice.trim()];
      newChoice = '';
      updateChoices();
    }
  }

  function handleRemoveChoice(index: number) {
    choices = choices.filter((_, i) => i !== index);
    updateChoices();
  }

  function handleUpdateChoice(index: number, value: string) {
    if (value.trim()) {
      choices = choices.map((c, i) => i === index ? value.trim() : c);
      updateChoices();
    }
  }

  function updateChoices() {
    updateField(field.id, {
      options: {
        ...field.options,
        choices,
      },
    });
  }

  function handleMediaMultipleChange(checked: boolean) {
    mediaMultiple = checked;
    updateField(field.id, {
      options: {
        ...field.options,
        media: {
          ...field.options?.media,
          multiple: checked,
        },
      },
    });
  }

  function handleMediaAcceptChange(acceptTypes: string[]) {
    mediaAccept = acceptTypes;
    updateField(field.id, {
      options: {
        ...field.options,
        media: {
          ...field.options?.media,
          accept: acceptTypes,
        },
      },
    });
  }

  const acceptTypeOptions = [
    { value: 'image/*', label: 'Images' },
    { value: 'video/*', label: 'Videos' },
    { value: 'audio/*', label: 'Audio' },
    { value: 'application/pdf', label: 'PDF' },
    { value: '.jpg,.jpeg,.png,.gif', label: 'Images (jpg, png, gif)' },
    { value: '.mp4,.webm,.mov', label: 'Videos (mp4, webm, mov)' },
  ];
</script>

<div class="space-y-6">
  <!-- Select/MultiSelect Choices Editor -->
  {#if field.type === 'select' || field.type === 'multiselect'}
    <div class="border-t border-gray-200 pt-4">
      <h5 class="text-sm font-semibold text-gray-900 mb-3">
        Options (Choices)
      </h5>
      
      <div class="space-y-2 mb-4">
        {#each choices as choice, index}
          <div class="flex items-center gap-2">
            <input
              type="text"
              class="flex-1 py-2 px-3 text-sm border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-blue-500"
              value={choice}
              onblur={(e) => handleUpdateChoice(index, e.currentTarget.value)}
              placeholder="Option value"
            />
            <button
              onclick={() => handleRemoveChoice(index)}
              class="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
              title="Remove option"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        {/each}
      </div>

      <!-- Add New Choice -->
      <div class="flex items-center gap-2">
        <input
          type="text"
          class="flex-1 py-2 px-3 text-sm border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-blue-500"
          bind:value={newChoice}
          onkeydown={(e) => e.key === 'Enter' && handleAddChoice()}
          placeholder="Add new option..."
        />
        <button
          onclick={handleAddChoice}
          disabled={!newChoice.trim()}
          class="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add
        </button>
      </div>

      {#if choices.length === 0}
        <p class="text-sm text-gray-500 mt-2">
          No options added yet. Add at least one option.
        </p>
      {/if}
    </div>
  {/if}

  <!-- Media Field Options -->
  {#if field.type === 'media'}
    <div class="border-t border-gray-200 pt-4">
      <h5 class="text-sm font-semibold text-gray-900 mb-3">
        Media Options
      </h5>

      <!-- Multiple Files Toggle -->
      <label class="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
        <input
          type="checkbox"
          class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          checked={mediaMultiple}
          onchange={(e) => handleMediaMultipleChange(e.currentTarget.checked)}
        />
        <span class="text-sm font-medium text-gray-900">
          Allow multiple files
        </span>
      </label>

      <!-- Accept Types -->
      <div class="mt-4">
        <label class="block text-xs font-medium text-gray-600 mb-2">
          Accepted File Types
        </label>
        <div class="space-y-2">
          {#each acceptTypeOptions as option}
            <label class="flex items-center gap-2">
              <input
                type="checkbox"
                class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                checked={mediaAccept.includes(option.value)}
                onchange={(e) => {
                  const newAccept = e.currentTarget.checked
                    ? [...mediaAccept, option.value]
                    : mediaAccept.filter(a => a !== option.value);
                  handleMediaAcceptChange(newAccept);
                }}
              />
              <span class="text-sm text-gray-700">{option.label}</span>
            </label>
          {/each}
        </div>
      </div>

      <!-- Custom Accept Type -->
      <div class="mt-4">
        <label class="block text-xs font-medium text-gray-600 mb-1">
          Custom MIME Type or Extension
        </label>
        <input
          type="text"
          class="w-full py-2 px-3 text-sm border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-blue-500"
          placeholder="e.g., .doc,.docx or application/msword"
          onblur={(e) => {
            const value = e.currentTarget.value.trim();
            if (value && !mediaAccept.includes(value)) {
              handleMediaAcceptChange([...mediaAccept, value]);
            }
          }}
        />
        <p class="text-xs text-gray-500 mt-1">
          Add custom file types (comma separated)
        </p>
      </div>
    </div>
  {/if}
</div>
