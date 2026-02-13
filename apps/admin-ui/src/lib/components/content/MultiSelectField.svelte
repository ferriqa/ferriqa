<script lang="ts">
  import type { FieldDefinition } from "../blueprint/types";

  interface Props {
    field: FieldDefinition;
    value?: string[];
    error?: string;
    onchange?: (e: Event) => void;
  }

  let { 
    field, 
    value = $bindable([]), 
    error,
    onchange 
  }: Props = $props();

  const choices = field.options?.choices || [];
  const minItems = field.validation?.minItems;
  const maxItems = field.validation?.maxItems;

  function toggleChoice(choice: string) {
    const index = value.indexOf(choice);
    if (index > -1) {
      value = value.filter(v => v !== choice);
    } else {
      if (!maxItems || value.length < maxItems) {
        value = [...value, choice];
      }
    }
    onchange?.(new Event("change"));
  }
</script>

<div class="space-y-2">
  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
    {field.name}
    {#if field.required}
      <span class="text-red-500 ml-0.5">*</span>
    {/if}
  </label>
  
  {#if field.description}
    <p class="text-xs text-gray-500 dark:text-gray-400">{field.description}</p>
  {/if}

  <div class="space-y-2">
    {#each choices as choice}
      <div class="flex items-center">
        <input
          id="{field.key}-{choice}"
          type="checkbox"
          checked={value.includes(choice)}
          onclick={() => toggleChoice(choice)}
          class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
        />
        <label for="{field.key}-{choice}" class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">
          {choice}
        </label>
      </div>
    {/each}
  </div>

  {#if maxItems}
    <p class="text-xs text-gray-500">
      Selected: {value.length} / {maxItems}
    </p>
  {/if}

  {#if error}
    <span class="text-xs text-red-500">{error}</span>
  {/if}
  
  {#if field.ui?.helpText}
    <p class="text-xs text-gray-500 dark:text-gray-400">{field.ui.helpText}</p>
  {/if}
</div>
