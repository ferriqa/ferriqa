<script lang="ts">
  import { m } from '$lib/paraglide/messages.js';
  import {
    BLUEPRINT_TEMPLATES,
    getTemplatesByCategory,
    createBlueprintFromTemplate,
    type BlueprintTemplate,
  } from './templates.js';
  import type { Blueprint } from './types.js';
  import { loadBlueprint, reset } from '$lib/stores/blueprintStore.svelte.js';

  interface Props {
    onSelect: (blueprint: Omit<Blueprint, 'id'>) => void;
    onCancel: () => void;
  }

  let { onSelect, onCancel }: Props = $props();

  let selectedCategory = $state<'all' | BlueprintTemplate['category']>('all');
  let searchQuery = $state('');
  let selectedTemplate = $state<string | null>(null);
  let customName = $state('');

  const categories = [
    { id: 'all', name: m.blueprint_builder_template_all(), icon: 'LayoutGrid' },
    { id: 'content', name: m.blueprint_builder_template_content(), icon: 'FileText' },
    { id: 'ecommerce', name: m.blueprint_builder_template_ecommerce(), icon: 'ShoppingCart' },
    { id: 'media', name: m.blueprint_builder_template_media(), icon: 'Image' },
    { id: 'system', name: m.blueprint_builder_template_system(), icon: 'Settings' },
  ];

  const filteredTemplates = $derived(() => {
    let templates = selectedCategory === 'all' 
      ? BLUEPRINT_TEMPLATES 
      : getTemplatesByCategory(selectedCategory);

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      templates = templates.filter(
        t =>
          t.name.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query)
      );
    }

    return templates;
  });

  function handleSelectTemplate(templateId: string) {
    selectedTemplate = templateId;
    const template = BLUEPRINT_TEMPLATES.find(t => t.id === templateId);
    if (template && !customName) {
      customName = template.blueprint.name;
    }
  }

  function handleUseTemplate() {
    if (!selectedTemplate) return;
    
    const blueprint = createBlueprintFromTemplate(selectedTemplate, customName);
    if (blueprint) {
      reset();
      loadBlueprint(blueprint);
      onSelect(blueprint);
    }
  }

  function handleStartBlank() {
    reset();
    onSelect({
      name: '',
      slug: '',
      description: '',
      fields: [],
      settings: {
        draftMode: true,
        versioning: true,
        defaultStatus: 'draft',
      },
    });
  }

  function getCategoryName(categoryId: string) {
    const categoryMap: Record<string, string> = {
      all: m.blueprint_builder_template_all(),
      content: m.blueprint_builder_template_content(),
      ecommerce: m.blueprint_builder_template_ecommerce(),
      media: m.blueprint_builder_template_media(),
      system: m.blueprint_builder_template_system(),
    };
    return categoryMap[categoryId] || categoryId;
  }
</script>

<div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
  <div class="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
    <!-- Header -->
    <div class="p-6 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">
            Choose a Template
          </h2>
          <p class="text-gray-500 mt-1">
            Start with a pre-configured template or create from scratch
          </p>
        </div>
        <button
          onclick={onCancel}
          class="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Search & Filter -->
    <div class="p-6 border-b border-gray-200 bg-gray-50">
      <div class="flex flex-col sm:flex-row gap-4">
        <!-- Search -->
        <div class="relative flex-1">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search templates..."
            class="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            bind:value={searchQuery}
          />
        </div>

        <!-- Category Filter -->
        <div class="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
          {#each categories as category}
            <button
              class="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors"
              class:bg-blue-600={selectedCategory === category.id}
              class:text-white={selectedCategory === category.id}
              class:bg-white={selectedCategory !== category.id}
              class:text-gray-700={selectedCategory !== category.id}
              class:border={selectedCategory !== category.id}
              class:border-gray-300={selectedCategory !== category.id}
              onclick={() => selectedCategory = category.id as any}
            >
              {category.name}
            </button>
          {/each}
        </div>
      </div>
    </div>

    <!-- Templates Grid -->
    <div class="flex-1 overflow-y-auto p-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {#each filteredTemplates() as template}
          <button
            class="relative p-6 border-2 rounded-xl text-left transition-all hover:shadow-md"
            class:border-blue-500={selectedTemplate === template.id}
            class:bg-blue-50={selectedTemplate === template.id}
            class:border-gray-200={selectedTemplate !== template.id}
            class:hover:border-gray-300={selectedTemplate !== template.id}
            onclick={() => handleSelectTemplate(template.id)}
          >
            <!-- Selection Indicator -->
            {#if selectedTemplate === template.id}
              <div class="absolute top-4 right-4 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            {/if}

            <!-- Icon -->
            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {#if template.icon === 'FileText'}
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                {:else if template.icon === 'Package'}
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                {:else if template.icon === 'Layout'}
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                {:else if template.icon === 'User'}
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                {:else if template.icon === 'Image'}
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                {:else if template.icon === 'Calendar'}
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                {:else}
                  <circle cx="12" cy="12" r="10" />
                {/if}
              </svg>
            </div>

            <!-- Content -->
            <h3 class="font-semibold text-gray-900 mb-1">{template.name}</h3>
            <p class="text-sm text-gray-500 line-clamp-2">{template.description}</p>

            <!-- Category Badge -->
            <div class="mt-3">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                {template.category}
              </span>
            </div>

            <!-- Field Count -->
            <div class="mt-3 flex items-center text-xs text-gray-500">
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              {template.blueprint.fields.length} fields
            </div>
          </button>
        {/each}
      </div>

      {#if filteredTemplates().length === 0}
        <div class="text-center py-12">
          <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-gray-500">No templates found matching your search.</p>
        </div>
      {/if}
    </div>

    <!-- Custom Name Input -->
    {#if selectedTemplate}
      <div class="p-6 border-t border-gray-200 bg-gray-50">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Blueprint Name (Optional)
        </label>
        <input
          type="text"
          placeholder="Enter custom name..."
          class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          bind:value={customName}
        />
        <p class="text-xs text-gray-500 mt-1">
          Leave blank to use the template name
        </p>
      </div>
    {/if}

    <!-- Footer -->
    <div class="p-6 border-t border-gray-200 flex items-center justify-between">
      <button
        onclick={handleStartBlank}
        class="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Start from Blank
      </button>

      <div class="flex items-center gap-3">
        <button
          onclick={onCancel}
          class="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onclick={handleUseTemplate}
          disabled={!selectedTemplate}
          class="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Use Template
        </button>
      </div>
    </div>
  </div>
</div>
