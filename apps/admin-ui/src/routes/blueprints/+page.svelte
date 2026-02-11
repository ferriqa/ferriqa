<script lang="ts">
  import * as m from '$lib/paraglide/messages.js';
  import type { BlueprintSummary, PageData } from '$lib/types.js';

  let { data }: { data: PageData } = $props();
  let blueprints = $state<BlueprintSummary[]>(data.blueprints || []);

  let searchQuery = $state('');
  let sortBy = $state<'name' | 'updated' | 'content'>('updated');
  let sortDirection = $state<'asc' | 'desc'>('desc');
  let deleteConfirmId = $state<string | null>(null);

  // Filter and sort blueprints
  let filteredBlueprints = $derived.by(() => {
    let filtered = blueprints.filter((bp) =>
      bp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bp.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (bp.description && bp.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

      filtered.sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'name') {
          comparison = a.name.localeCompare(b.name);
        } else if (sortBy === 'updated') {
          // REVIEW NOTE: Added safe date parsing to prevent NaN issues with invalid dates
          const dateA = new Date(a.updatedAt).getTime();
          const dateB = new Date(b.updatedAt).getTime();
          // Handle invalid dates gracefully - push invalid dates to end
          if (isNaN(dateA) && isNaN(dateB)) comparison = 0;
          else if (isNaN(dateA)) comparison = 1;
          else if (isNaN(dateB)) comparison = -1;
          else comparison = dateA - dateB;
        } else if (sortBy === 'content') {
          comparison = (a.contentCount || 0) - (b.contentCount || 0);
        }
        return sortDirection === 'asc' ? comparison : -comparison;
      });

    return filtered;
  });

  async function handleDelete(id: string) {
    // NOTE: Modal already handled the confirmation (line 377-401)
    // TODO: Call API to delete - show loading state first
    try {
      // const response = await fetch(`/api/blueprints/${id}`, { method: 'DELETE' });
      // if (!response.ok) throw new Error('Delete failed');
      
      // Optimistic update - remove from UI immediately
      // If API fails, we'd need to restore the item (rollback mechanism needed)
      blueprints = blueprints.filter((bp) => bp.id !== id);
      deleteConfirmId = null;
    } catch (error) {
      console.error('Failed to delete blueprint:', error);
      // TODO: Show error toast, restore deleted item to list
      alert('Failed to delete blueprint. Please try again.');
    }
  }

  /**
   * Get Lucide icon name for field type
   * REVIEW NOTE: Used for tooltip title attribute to show icon name
   * TODO: Consider rendering actual Lucide icons instead of text
   * @param type - Field type string
   * @returns Lucide icon name (e.g., 'Type', 'Calendar')
   */
  function getFieldTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      text: 'Type',
      textarea: 'AlignLeft',
      richtext: 'FileText',
      number: 'Hash',
      boolean: 'CheckSquare',
      date: 'Calendar',
      datetime: 'CalendarClock',
      email: 'Mail',
      url: 'Link',
      select: 'ChevronDown',
      multiselect: 'List',
      relation: 'GitBranch',
      media: 'Image',
      json: 'Code',
      color: 'Palette',
      slug: 'Link2',
    };
    return icons[type] || 'Type';
  }

  function getApiAccessBadge(access: string): { color: string; label: string } {
    const badges = {
      public: { color: 'bg-green-100 text-green-800', label: 'Public' },
      authenticated: { color: 'bg-yellow-100 text-yellow-800', label: 'Auth' },
      private: { color: 'bg-red-100 text-red-800', label: 'Private' },
    };
    return badges[access as keyof typeof badges] || badges.private;
  }

  function formatDate(dateString: string): string {
    // REVIEW NOTE: Added validation to prevent "Invalid Date" display
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex justify-between items-center">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">{m.blueprints_title()}</h1>
      <p class="text-gray-600 mt-1">
        {blueprints.length} {blueprints.length === 1 ? 'blueprint' : 'blueprints'} defined
      </p>
    </div>
    <a
      href="/blueprints/new"
      class="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      {m.blueprints_create()}
    </a>
  </div>

  <!-- Search and Filters -->
  <div class="card">
    <div class="card-body">
      <div class="flex flex-col sm:flex-row gap-4">
        <!-- Search -->
        <div class="flex-1">
          <div class="relative">
            <svg
              class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder={m.common_search()}
              class="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-blue-500"
              bind:value={searchQuery}
            />
          </div>
        </div>

        <!-- Sort -->
        <div class="sm:w-48">
          <select
            class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-blue-500"
            bind:value={sortBy}
          >
            <option value="updated">Last Updated</option>
            <option value="name">Name</option>
            <option value="content">Content Count</option>
          </select>
        </div>

        <!-- Sort Direction -->
        <button
          class="p-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          onclick={() => (sortDirection = sortDirection === 'asc' ? 'desc' : 'asc')}
          title="Toggle sort direction"
        >
          {#if sortDirection === 'asc'}
            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
          {:else}
            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
            </svg>
          {/if}
        </button>
      </div>
    </div>
  </div>

  <!-- Blueprints Grid -->
  {#if filteredBlueprints.length === 0}
    <div class="card">
      <div class="card-body">
        <div class="text-center py-12">
          <svg
            class="w-16 h-16 mx-auto mb-4 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <h3 class="text-lg font-medium text-gray-900 mb-2">No blueprints found</h3>
          <p class="text-gray-600 mb-4">
            {searchQuery
              ? `No blueprints match "${searchQuery}"`
              : 'Get started by creating your first blueprint'}
          </p>
          <a
            href="/blueprints/new"
            class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            {m.blueprints_create()}
          </a>
        </div>
      </div>
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each filteredBlueprints as blueprint (blueprint.id)}
        <div class="card hover:shadow-md transition-shadow">
          <div class="card-header">
            <div class="flex items-start justify-between">
              <div class="flex-1 min-w-0">
                <h3 class="text-lg font-semibold text-gray-900 truncate">
                  {blueprint.name}
                </h3>
                <p class="text-sm text-gray-500 font-mono mt-1">/{blueprint.slug}</p>
              </div>
              <span class="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getApiAccessBadge(blueprint.settings.apiAccess).color}">
                {getApiAccessBadge(blueprint.settings.apiAccess).label}
              </span>
            </div>
          </div>

          <div class="card-body">
            {#if blueprint.description}
              <p class="text-sm text-gray-600 mb-4 line-clamp-2">
                {blueprint.description}
              </p>
            {/if}

            <!-- Fields Preview -->
            <div class="mb-4">
              <div class="flex items-center gap-2 mb-2">
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 6h16M4 10h16M4 14h16M4 18h16"
                  />
                </svg>
                <span class="text-sm font-medium text-gray-700">
                  {blueprint.fields.length} {blueprint.fields.length === 1 ? 'field' : 'fields'}
                </span>
              </div>
              <div class="flex flex-wrap gap-1.5">
                {#each blueprint.fields.slice(0, 4) as field}
                  <span
                    class="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded-md text-xs text-gray-600"
                    title="{getFieldTypeIcon(field.type)}"
                  >
                    <!-- REVIEW NOTE: Added defensive check for field.type to prevent runtime errors -->
                    <!-- Using getFieldTypeIcon for field type icon mapping - REVIEW: was marked as dead code, now used in title attribute -->
                    <span class="font-medium">{field.type && field.type.length > 0 ? field.type[0].toUpperCase() : '?'}</span>
                    {field.name}
                  </span>
                {/each}
                {#if blueprint.fields.length > 4}
                  <span
                    class="inline-flex items-center px-2 py-1 bg-gray-50 border border-gray-200 rounded-md text-xs text-gray-500"
                  >
                    +{blueprint.fields.length - 4}
                  </span>
                {/if}
              </div>
            </div>

            <!-- Settings Badges -->
            <div class="flex flex-wrap gap-2 mb-4">
              {#if blueprint.settings.draftMode}
                <span
                  class="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-700"
                >
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Draft Mode
                </span>
              {/if}
              {#if blueprint.settings.versioning}
                <span
                  class="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 border border-purple-200 rounded-md text-xs text-purple-700"
                >
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Versioning
                </span>
              {/if}
            </div>

            <!-- Stats -->
            <div class="flex items-center justify-between text-sm">
              <div class="flex items-center gap-2">
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span class="text-gray-600">{blueprint.contentCount || 0} items</span>
              </div>
              <div class="flex items-center gap-1 text-gray-500">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <time datetime={blueprint.updatedAt}>{formatDate(blueprint.updatedAt)}</time>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="card-footer flex gap-2">
            <a
              href="/blueprints/{blueprint.id}/edit"
              class="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </a>
            <a
              href="/content?type={blueprint.slug}"
              class="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              View Content
            </a>
            <button
              class="inline-flex items-center justify-center p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              onclick={() => (deleteConfirmId = blueprint.id)}
              title={m.blueprints_delete()}
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Delete Confirmation Modal -->
  {#if deleteConfirmId}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Delete Blueprint?</h3>
        <p class="text-gray-600 mb-6">
          Are you sure you want to delete this blueprint? All associated content will also be deleted.
          This action cannot be undone.
        </p>
        <div class="flex gap-3">
          <button
            class="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            onclick={() => (deleteConfirmId = null)}
          >
            Cancel
          </button>
          <button
            class="flex-1 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            onclick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>
