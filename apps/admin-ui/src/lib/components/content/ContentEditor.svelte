<script lang="ts">
  import type { Blueprint, FieldDefinition } from "../blueprint/types";
  import type { ContentItem, ContentStatus } from "./types";
  import FieldRenderer from "./FieldRenderer.svelte";
  import VersionHistory from "./VersionHistory.svelte";
  import { createContent, updateContent, publishContent, unpublishContent, getContentById } from "../../services/contentApi";
  import { goto } from "$app/navigation";
  import * as m from "$lib/paraglide/messages.js";

  interface Props {
    blueprint: Blueprint;
    content?: ContentItem | null;
    onSave?: (content: ContentItem) => void;
    onCancel?: () => void;
  }

  let { blueprint, content = null, onSave, onCancel }: Props = $props();

  // Form state
  let formData = $state<Record<string, unknown>>({});
  let errors = $state<Record<string, string>>({});
  let isSubmitting = $state(false);
  let activeTab = $state<"edit" | "seo" | "settings" | "versions">("edit");
  let status = $state<ContentStatus>("draft");
  let slug = $state("");

  // Initialize form data from existing content and keep in sync
  $effect(() => {
    if (content?.data) {
      formData = { ...content.data };
    }
    if (content?.status !== undefined) {
      status = content.status;
    }
    if (content?.slug !== undefined) {
      slug = content.slug;
    }
  });

  // Handle field value changes
  function handleFieldChange(key: string, value: unknown) {
    formData[key] = value;
    // Clear error when user starts typing
    if (errors[key]) {
      errors[key] = "";
    }
  }

  // Validate form
  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    for (const field of blueprint.fields) {
      if (field.required) {
        const value = formData[field.key];
        if (value === undefined || value === null || value === "" || 
            (Array.isArray(value) && value.length === 0)) {
          newErrors[field.key] = `${field.name} is required`;
          isValid = false;
        }
      }

      // Additional validation based on field type
      const value = formData[field.key];
      if (value !== undefined && value !== null && value !== "") {
        // String validations
        if (field.type === "text" || field.type === "textarea" || field.type === "email" || field.type === "url") {
          const strValue = String(value);
          if (field.options?.minLength && strValue.length < field.options.minLength) {
            newErrors[field.key] = `${field.name} must be at least ${field.options.minLength} characters`;
            isValid = false;
          }
          if (field.options?.maxLength && strValue.length > field.options.maxLength) {
            newErrors[field.key] = `${field.name} must be at most ${field.options.maxLength} characters`;
            isValid = false;
          }
        }

        // Number validations
        if (field.type === "number") {
          const numValue = Number(value);
          if (field.options?.min !== undefined && numValue < field.options.min) {
            newErrors[field.key] = `${field.name} must be at least ${field.options.min}`;
            isValid = false;
          }
          if (field.options?.max !== undefined && numValue > field.options.max) {
            newErrors[field.key] = `${field.name} must be at most ${field.options.max}`;
            isValid = false;
          }
        }
      }
    }

    errors = newErrors;
    return isValid;
  }

  // Save content
  async function handleSave(newStatus?: ContentStatus) {
    if (!validateForm()) {
      return;
    }

    isSubmitting = true;

    try {
      const saveStatus = newStatus || status;
      
      if (content?.id) {
        // Update existing content
        const result = await updateContent(content.id, {
          slug,
          data: formData,
          status: saveStatus,
        });

        if (result.success && result.data) {
          onSave?.(result.data);
        } else {
          errors["_form"] = result.error || "Failed to update content";
        }
      } else {
        // Create new content
        const result = await createContent({
          blueprintId: blueprint.id || "",
          slug,
          data: formData,
          status: saveStatus,
        });

        if (result.success && result.data) {
          onSave?.(result.data);
        } else {
          errors["_form"] = result.error || "Failed to create content";
        }
      }
    } catch (error) {
      errors["_form"] = error instanceof Error ? error.message : "An error occurred";
    } finally {
      isSubmitting = false;
    }
  }

  // Publish/Unpublish
  async function handlePublish() {
    if (!content?.id) {
      // Save as draft first, then publish
      await handleSave("published");
      return;
    }

    isSubmitting = true;
    try {
      const result = await publishContent(content.id);
      if (result.success && result.data) {
        status = "published";
        onSave?.(result.data);
      } else {
        errors["_form"] = result.error || "Failed to publish content";
      }
    } catch (error) {
      errors["_form"] = error instanceof Error ? error.message : "An error occurred";
    } finally {
      isSubmitting = false;
    }
  }

  async function handleUnpublish() {
    if (!content?.id) return;

    isSubmitting = true;
    try {
      const result = await unpublishContent(content.id);
      if (result.success && result.data) {
        status = "draft";
        onSave?.(result.data);
      } else {
        errors["_form"] = result.error || "Failed to unpublish content";
      }
    } catch (error) {
      errors["_form"] = error instanceof Error ? error.message : "An error occurred";
    } finally {
      isSubmitting = false;
    }
  }

  // Get visible fields based on tab
  function getVisibleFields(): FieldDefinition[] {
    return blueprint.fields.filter(field => {
      // For now, show all fields in edit tab
      // TODO: Add tab grouping in field definition
      return true;
    });
  }
</script>

<div class="space-y-6">
  <!-- Header with actions -->
  <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
        {content ? m.content_edit() : m.content_create()}
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        {blueprint.name}
      </p>
    </div>

    <div class="flex gap-2">
      {#if content}
        {#if status === "published"}
          <button
            type="button"
            onclick={handleUnpublish}
            disabled={isSubmitting}
            class="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 transition-colors"
          >
            {m.content_unpublish()}
          </button>
        {:else}
          <button
            type="button"
            onclick={handlePublish}
            disabled={isSubmitting}
            class="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {m.content_publish()}
          </button>
        {/if}
      {/if}

      <button
        type="button"
        onclick={() => handleSave()}
        disabled={isSubmitting}
        class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {#if isSubmitting}
          <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        {/if}
        {content ? m.common_save() : m.content_create()}
      </button>

      <button
        type="button"
        onclick={onCancel}
        class="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        {m.common_cancel()}
      </button>
    </div>
  </div>

  <!-- Form error -->
  {#if errors["_form"]}
    <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
      <p class="text-sm text-red-700">{errors["_form"]}</p>
    </div>
  {/if}

  <!-- Slug field for existing content -->
  {#if content}
    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <label for="slug" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Slug
      </label>
      <input
        id="slug"
        type="text"
        bind:value={slug}
        class="py-2.5 px-4 block w-full border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
        placeholder="content-slug"
      />
    </div>
  {/if}

  <!-- Tabs -->
  <div class="border-b border-gray-200 dark:border-gray-700">
    <nav class="-mb-px flex space-x-8">
      <button
        type="button"
        class="py-4 px-1 border-b-2 font-medium text-sm {activeTab === 'edit' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'}"
        onclick={() => activeTab = "edit"}
      >
        {m.content_tab_content()}
      </button>
      <button
        type="button"
        class="py-4 px-1 border-b-2 font-medium text-sm {activeTab === 'seo' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'}"
        onclick={() => activeTab = "seo"}
      >
        SEO
      </button>
      <button
        type="button"
        class="py-4 px-1 border-b-2 font-medium text-sm {activeTab === 'settings' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'}"
        onclick={() => activeTab = "settings"}
      >
        {m.content_tab_settings()}
      </button>
      {#if content?.id}
        <button
          type="button"
          class="py-4 px-1 border-b-2 font-medium text-sm {activeTab === 'versions' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'}"
          onclick={() => activeTab = "versions"}
        >
          {m.content_tab_versions()}
        </button>
      {/if}
    </nav>
  </div>

  <!-- Form fields -->
  {#if activeTab === "edit"}
    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        {#each getVisibleFields() as field (field.id)}
          <FieldRenderer
            {field}
            value={formData[field.key]}
            error={errors[field.key]}
            onchange={handleFieldChange}
          />
        {/each}
      </div>
    </div>
  {:else if activeTab === "seo"}
    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      <p class="text-gray-500 dark:text-gray-400">SEO settings will be implemented in a future update.</p>
    </div>
  {:else if activeTab === "settings"}
    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4">
      <div>
        <label for="status" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Status
        </label>
        <select
          id="status"
          bind:value={status}
          class="py-2.5 px-4 block w-full border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </div>
    </div>
  {:else if activeTab === "versions" && content?.id}
    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      <VersionHistory contentId={content.id} onRollback={async () => {
        const result = await getContentById(content.id);
        if (result.success && result.data) {
          formData = { ...result.data.data };
        } else {
          // REVIEW NOTE: Fallback - show error but don't block editing
          // User can manually refresh or continue editing with current data
          errors["_form"] = result.error || "Failed to reload content after rollback";
        }
      }} />
    </div>
  {/if}
</div>
