<script lang="ts">
  import type { FieldDefinition } from "../blueprint/types";

  interface Props {
    field: FieldDefinition;
    value?: boolean;
    error?: string;
    onchange?: (e: Event) => void;
  }

  let { 
    field, 
    value = $bindable(false), 
    error,
    onchange 
  }: Props = $props();
</script>

<div class="flex items-start">
  <div class="flex items-center h-5">
    <input
      id={field.key}
      name={field.key}
      type="checkbox"
      bind:checked={value}
      required={field.required}
      class="w-4 h-4 border-gray-300 rounded text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 {error ? 'border-red-500 text-red-600 focus:ring-red-500' : ''}"
      onchange={onchange}
    />
  </div>
  <div class="ml-3 text-sm">
    <label for={field.key} class="font-medium text-gray-700 dark:text-gray-300">
      {field.name}
      {#if field.required}
        <span class="text-red-500 ml-0.5">*</span>
      {/if}
    </label>
    {#if field.description}
      <p class="text-gray-500 dark:text-gray-400">{field.description}</p>
    {/if}
    {#if error}
      <span class="text-xs text-red-500">{error}</span>
    {/if}
  </div>
</div>
