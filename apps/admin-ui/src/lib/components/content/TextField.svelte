<script lang="ts">
  import type { FieldDefinition } from "../blueprint/types";

  interface Props {
    field: FieldDefinition;
    value?: string;
    error?: string;
    oninput?: (e: Event) => void;
    onchange?: (e: Event) => void;
  }

  let { 
    field, 
    value = $bindable(""), 
    error,
    oninput,
    onchange 
  }: Props = $props();

  const inputType = field.type === "email" ? "email" : field.type === "url" ? "url" : "text";
  const maxLength = field.options?.maxLength;
  const minLength = field.options?.minLength;
  
  let charCount = $derived(String(value).length);
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
    type={inputType}
    bind:value
    maxlength={maxLength}
    minlength={minLength}
    placeholder={field.ui?.placeholder}
    required={field.required}
    class="py-2.5 px-4 block w-full border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none {error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}"
    oninput={oninput}
    onchange={onchange}
  />

  <div class="flex justify-between items-center">
    {#if error}
      <span class="text-xs text-red-500">{error}</span>
    {:else}
      <span></span>
    {/if}
    
    {#if maxLength}
      <span class="text-xs text-gray-500 {charCount > maxLength ? 'text-red-500' : ''}">
        {charCount} / {maxLength}
      </span>
    {/if}
  </div>
  
  {#if field.ui?.helpText}
    <p class="text-xs text-gray-500 dark:text-gray-400">{field.ui.helpText}</p>
  {/if}
</div>
