<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import ContentEditor from "$lib/components/content/ContentEditor.svelte";
  import { getBlueprint } from "$lib/services/blueprintApi";
  import type { Blueprint } from "$lib/components/blueprint/types";
  import type { ContentItem } from "$lib/components/content/types";
  import * as m from "$lib/paraglide/messages.js";

  // Get blueprint ID from URL
  const blueprintId = page.url.searchParams.get("blueprint");

  // State
  let blueprint = $state<Blueprint | null>(null);
  let isLoading = $state(true);
  let error = $state<string | null>(null);

  // Load blueprint
  async function loadBlueprint() {
    if (!blueprintId) {
      error = "No blueprint selected";
      isLoading = false;
      return;
    }

    try {
      const result = await getBlueprint(blueprintId);
      if (result.success && result.data) {
        blueprint = result.data;
      } else {
        error = result.error || "Failed to load blueprint";
      }
    } catch (err) {
      error = err instanceof Error ? err.message : "An error occurred";
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    loadBlueprint();
  });

  // Handle save
  function handleSave(content: ContentItem) {
    goto(`/content/${content.id}/edit`);
  }

  // Handle cancel
  function handleCancel() {
    goto("/content");
  }
</script>

{#if isLoading}
  <div class="flex justify-center py-12">
    <svg class="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  </div>
{:else if error}
  <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
    <p class="text-sm text-red-700">{error}</p>
    <button
      type="button"
      onclick={() => goto("/content")}
      class="mt-2 text-sm text-blue-600 hover:text-blue-800"
    >
      {m.common_back()}
    </button>
  </div>
{:else if blueprint}
  <ContentEditor
    {blueprint}
    onSave={handleSave}
    onCancel={handleCancel}
  />
{/if}
