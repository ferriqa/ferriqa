<script lang="ts">
  import type { FieldDefinition } from "../blueprint/types";

  interface Props {
    field: FieldDefinition;
    value?: number;
    error?: string;
    oninput?: (e: Event) => void;
    onchange?: (e: Event) => void;
  }

  let { 
    field, 
    value = $bindable(0), 
    error,
    oninput,
    onchange 
  }: Props = $props();

  const min = field.options?.min;
  const max = field.options?.max;
  const step = field.options?.step || 1;
</script>

<div class="space-y-2">
  <label for={field.key} class="block text-sm font-medium text-gray-700 dark:text-gray-300">
    {field.name}
    {#if field.required}
      <span class="text-red-500 ml-0.5">*</span>
    {/if}
  </label>
  
  {#if field.description}
    <p class="text-xs text-gray-500 dark:text-gray-400">{field.description}</p>
  {/if}

  <input
    id={field.key}
    name={field.key}
    type="number"
    bind:value
    {min}
    {max}
    {step}
    placeholder={field.ui?.placeholder}
    required={field.required}
    class="py-2.5 px-4 block w-full border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none {error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}"
    oninput={oninput}
    onchange={onchange}
  />

  {#if error}
    <span class="text-xs text-red-500">{error}</span>
  {/if}
  
  {#if field.ui?.helpText}
    <p class="text-xs text-gray-500 dark:text-gray-400">{field.ui.helpText}</p>
  {/if}
</div>
