<script lang="ts">
  import { m } from '$lib/paraglide/messages.js';
  import type { Blueprint } from './types.js';
  import { importBlueprintFromJSON } from '$lib/services/blueprintApi.js';
  import { loadBlueprint, reset } from '$lib/stores/blueprintStore.svelte.js';

  interface Props {
    onImport: (blueprint: Blueprint) => void;
    onCancel: () => void;
  }

  let { onImport, onCancel }: Props = $props();

  let jsonInput = $state('');
  let dragOver = $state(false);
  let error = $state<string | null>(null);
  let fileInput: HTMLInputElement | null = $state(null);

  function validateAndImport() {
    error = null;
    
    if (!jsonInput.trim()) {
      error = 'Please enter JSON data or upload a file';
      return;
    }

    const blueprint = importBlueprintFromJSON(jsonInput);
    
    if (!blueprint) {
      error = 'Invalid JSON format. Please check your data.';
      return;
    }

    reset();
    loadBlueprint(blueprint);
    onImport(blueprint);
  }

  function handleFileUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      jsonInput = e.target?.result as string;
      validateAndImport();
    };
    reader.onerror = () => {
      error = 'Failed to read file';
    };
    reader.readAsText(file);
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    dragOver = true;
  }

  function handleDragLeave(event: DragEvent) {
    event.preventDefault();
    dragOver = false;
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    dragOver = false;

    const file = event.dataTransfer?.files[0];
    if (!file) return;

    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      error = 'Please upload a JSON file';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      jsonInput = e.target?.result as string;
    };
    reader.onerror = () => {
      error = 'Failed to read file';
    };
    reader.readAsText(file);
  }

  function handlePaste(event: ClipboardEvent) {
    const pastedText = event.clipboardData?.getData('text');
    if (pastedText) {
      jsonInput = pastedText;
    }
  }

  function loadExample() {
    const example = {
      name: "Example Blueprint",
      slug: "example-blueprint",
      description: "An example blueprint to get you started",
      fields: [
        {
          id: "title",
          name: "Title",
          key: "title",
          type: "text",
          required: true,
          ui: { width: "full" },
        },
        {
          id: "content",
          name: "Content",
          key: "content",
          type: "richtext",
          required: true,
          ui: { width: "full" },
        },
      ],
      settings: {
        draftMode: true,
        versioning: true,
        defaultStatus: "draft",
      },
    };
    jsonInput = JSON.stringify(example, null, 2);
  }
</script>

<div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
  <div class="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
    <!-- Header -->
    <div class="p-6 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">
            Import Blueprint
          </h2>
          <p class="text-gray-500 mt-1">
            Import a blueprint from JSON file or paste JSON data
          </p>
        </div>
        <button
          onclick={onCancel}
          class="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
          aria-label="Close import dialog"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-6 space-y-6">
      <!-- Drag & Drop Zone -->
      <div
        class="border-2 border-dashed rounded-xl p-8 text-center transition-colors"
        class:border-blue-400={dragOver}
        class:bg-blue-50={dragOver}
        class:border-gray-300={!dragOver}
        class:hover:border-gray-400={!dragOver}
        ondragover={handleDragOver}
        ondragleave={handleDragLeave}
        ondrop={handleDrop}
        role="button"
        tabindex="0"
      >
        <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p class="text-lg font-medium text-gray-900 mb-1">
          Drop JSON file here
        </p>
        <p class="text-sm text-gray-500 mb-4">
          or click to browse
        </p>
        <input
          type="file"
          accept=".json,application/json"
          class="hidden"
          bind:this={fileInput}
          onchange={handleFileUpload}
        />
        <button
          onclick={() => fileInput?.click()}
          class="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Choose File
        </button>
      </div>

      <!-- OR Divider -->
      <div class="relative">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-300"></div>
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-2 bg-white text-gray-500">Or paste JSON directly</span>
        </div>
      </div>

      <!-- JSON Input -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <span class="block text-sm font-medium text-gray-700">
            JSON Data
          </span>
          <button
            onclick={loadExample}
            class="text-sm text-blue-600 hover:text-blue-800"
            type="button"
          >
            Load Example
          </button>
        </div>
        <label class="block">
          <span class="sr-only">JSON Data Input</span>
          <textarea
            bind:value={jsonInput}
            onpaste={handlePaste}
            rows="12"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            placeholder="Paste your JSON blueprint here or upload a file..."
          ></textarea>
        </label>
        <p class="text-xs text-gray-500 mt-1">
          Press Ctrl+V to paste from clipboard
        </p>
      </div>

      <!-- Error Message -->
      {#if error}
        <div class="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <svg class="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
          <p class="text-sm text-red-700">{error}</p>
        </div>
      {/if}

      <!-- Help Text -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div class="flex items-start gap-3">
          <svg class="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="text-sm text-blue-700">
            <p class="font-medium mb-1">Expected JSON Format:</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
              <li><code>name</code> (required): Blueprint name</li>
              <li><code>slug</code> (required): URL-friendly identifier</li>
              <li><code>description</code>: Optional description</li>
              <li><code>fields</code> (required): Array of field definitions</li>
              <li><code>settings</code>: Configuration options</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
      <button
        onclick={onCancel}
        class="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Cancel
      </button>
      <button
        onclick={validateAndImport}
        disabled={!jsonInput.trim()}
        class="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Import Blueprint
      </button>
    </div>
  </div>
</div>
