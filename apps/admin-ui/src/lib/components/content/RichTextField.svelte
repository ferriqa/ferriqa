<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { Editor } from "@tiptap/core";
  import StarterKit from "@tiptap/starter-kit";
  import Placeholder from "@tiptap/extension-placeholder";
  import Underline from "@tiptap/extension-underline";
  import TextAlign from "@tiptap/extension-text-align";
  import Link from "@tiptap/extension-link";
  import Image from "@tiptap/extension-image";
  import EditorToolbar from "./EditorToolbar.svelte";
  import type { FieldDefinition } from "../blueprint/types";
  import { sanitizeHtml, stripHtml } from "$lib/utils/sanitize";

  interface Props {
    field: FieldDefinition;
    value?: string;
    error?: string;
    sanitize?: boolean;
    oninput?: (e: Event) => void;
    onchange?: (e: Event) => void;
  }

  let { 
    field, 
    value = $bindable(""), 
    error, 
    sanitize = true,
    oninput, 
    onchange 
  }: Props = $props();

  let editor: Editor | undefined = $state();
  let element: HTMLDivElement | null = null;
  let mediaPickerOpen = $state(false);

  onMount(() => {
    editor = new Editor({
      element,
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [1, 2, 3],
          },
        }),
        Placeholder.configure({
          placeholder: field.ui?.placeholder || "Start typing...",
        }),
        Underline,
        TextAlign.configure({
          types: ["heading", "paragraph"],
        }),
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: "text-blue-600 underline",
          },
        }),
        Image.configure({
          HTMLAttributes: {
            class: "max-w-full h-auto rounded-lg",
          },
        }),
      ],
      content: value || "",
      onUpdate: ({ editor }) => {
        let html = editor.getHTML();
        
        if (sanitize) {
          html = sanitizeHtml(html);
        }
        
        value = html;
        oninput?.(new Event("input"));
        onchange?.(new Event("change"));
      },
      editorProps: {
        attributes: {
          class: "prose prose-sm sm:prose-base dark:prose-invert max-w-none focus:outline-none p-4 min-h-[200px]",
        },
      },
    });
  });

  onDestroy(() => {
    editor?.destroy();
  });

  function handleInsertImage() {
    mediaPickerOpen = true;
  }

  function handleImageSelect(mediaUrl: string) {
    if (editor && mediaUrl) {
      editor.chain().focus().setImage({ src: mediaUrl }).run();
    }
    mediaPickerOpen = false;
  }

  function convertToMarkdown(): string {
    if (!editor) return "";
    const html = editor.getHTML();
    return stripHtml(html);
  }
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

  <div
    class="border rounded-lg overflow-hidden bg-white dark:bg-gray-800 {error
      ? 'border-red-500'
      : 'border-gray-200 dark:border-gray-700'}"
  >
    <EditorToolbar {editor} onInsertImage={handleInsertImage} />

    <div bind:this={element} class="bg-white dark:bg-gray-800"></div>
  </div>

  {#if error}
    <span class="text-xs text-red-500">{error}</span>
  {/if}

  {#if field.ui?.helpText}
    <p class="text-xs text-gray-500 dark:text-gray-400">{field.ui.helpText}</p>
  {/if}
</div>

{#if mediaPickerOpen}
  <div
    class="fixed inset-0 z-50 overflow-y-auto"
    role="dialog"
    aria-modal="true"
  >
    <div class="flex min-h-full items-center justify-center p-4">
      <div
        class="fixed inset-0 bg-gray-900/50 transition-opacity"
        onclick={() => (mediaPickerOpen = false)}
        role="button"
        tabindex="-1"
        onkeydown={(e) => e.key === "Escape" && (mediaPickerOpen = false)}
      ></div>
      <div
        class="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full p-6"
      >
        <div class="mb-4">
          <h3 class="text-lg font-semibold">Select Image</h3>
          <p class="text-sm text-gray-500">
            Enter image URL or use media library
          </p>
        </div>

        <div class="space-y-4">
          <div>
            <label for="image-url" class="block text-sm font-medium mb-1">
              Image URL
            </label>
            <input
              id="image-url"
              type="url"
              placeholder="https://example.com/image.jpg"
              class="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              onkeydown={(e) => {
                if (e.key === "Enter") {
                  const target = e.target as HTMLInputElement;
                  handleImageSelect(target.value);
                }
              }}
            />
          </div>

          <div class="flex justify-end gap-2">
            <button
              type="button"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              onclick={() => (mediaPickerOpen = false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  :global(.ProseMirror) {
    min-height: 200px;
  }

  :global(.ProseMirror p.is-editor-empty:first-child::before) {
    color: #9ca3af;
    content: attr(data-placeholder);
    float: left;
    height: 0;
    pointer-events: none;
  }

  :global(.ProseMirror h1) {
    font-size: 2rem;
    font-weight: 700;
    margin-top: 1rem;
    margin-bottom: 0.5rem;
  }

  :global(.ProseMirror h2) {
    font-size: 1.5rem;
    font-weight: 600;
    margin-top: 0.75rem;
    margin-bottom: 0.5rem;
  }

  :global(.ProseMirror h3) {
    font-size: 1.25rem;
    font-weight: 600;
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
  }

  :global(.ProseMirror ul),
  :global(.ProseMirror ol) {
    padding-left: 1.5rem;
    margin: 0.5rem 0;
  }

  :global(.ProseMirror blockquote) {
    border-left: 3px solid #e5e7eb;
    padding-left: 1rem;
    margin: 0.5rem 0;
    font-style: italic;
    color: #6b7280;
  }

  :global(.ProseMirror pre) {
    background: #f3f4f6;
    padding: 0.75rem;
    border-radius: 0.375rem;
    overflow-x: auto;
    font-family: monospace;
  }

  :global(.ProseMirror code) {
    background: #f3f4f6;
    padding: 0.125rem 0.25rem;
    border-radius: 0.125rem;
    font-family: monospace;
    font-size: 0.875em;
  }

  :global(.ProseMirror hr) {
    border: none;
    border-top: 1px solid #e5e7eb;
    margin: 1rem 0;
  }

  :global(.ProseMirror a) {
    color: #3b82f6;
    text-decoration: underline;
  }

  :global(.ProseMirror img) {
    max-width: 100%;
    height: auto;
    border-radius: 0.5rem;
    margin: 0.5rem 0;
  }

  :global(.dark .ProseMirror) {
    color: #d1d5db;
  }

  :global(.dark .ProseMirror blockquote) {
    border-color: #4b5563;
    color: #9ca3af;
  }

  :global(.dark .ProseMirror pre),
  :global(.dark .ProseMirror code) {
    background: #374151;
  }

  :global(.dark .ProseMirror hr) {
    border-color: #4b5563;
  }
</style>
