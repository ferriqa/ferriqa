<script lang="ts">
  import type { Editor } from "@tiptap/core";
  import {
    Bold,
    Italic,
    Underline,
    Strikethrough,
    Code,
    List,
    ListOrdered,
    Quote,
    Undo,
    Redo,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    Image,
    Link,
    Heading1,
    Heading2,
    Heading3,
    Minus,
    FileText,
  } from "lucide-svelte";

  interface Props {
    editor: Editor | undefined;
    onInsertImage?: () => void;
  }

  let { editor, onInsertImage }: Props = $props();

  function toggleBold() {
    editor?.chain().focus().toggleBold().run();
  }

  function toggleItalic() {
    editor?.chain().focus().toggleItalic().run();
  }

  function toggleUnderline() {
    editor?.chain().focus().toggleUnderline().run();
  }

  function toggleStrike() {
    editor?.chain().focus().toggleStrike().run();
  }

  function toggleCode() {
    editor?.chain().focus().toggleCode().run();
  }

  function toggleBulletList() {
    editor?.chain().focus().toggleBulletList().run();
  }

  function toggleOrderedList() {
    editor?.chain().focus().toggleOrderedList().run();
  }

  function toggleBlockquote() {
    editor?.chain().focus().toggleBlockquote().run();
  }

  function setParagraph() {
    editor?.chain().focus().setParagraph().run();
  }

  function toggleHeading(level: 1 | 2 | 3) {
    editor?.chain().focus().toggleHeading({ level }).run();
  }

  function setTextAlign(align: "left" | "center" | "right" | "justify") {
    editor?.chain().focus().setTextAlign(align).run();
  }

  function setHorizontalRule() {
    editor?.chain().focus().setHorizontalRule().run();
  }

  function undo() {
    editor?.chain().focus().undo().run();
  }

  function redo() {
    editor?.chain().focus().redo().run();
  }

  function insertLink() {
    const url = window.prompt("Enter URL:");
    if (url) {
      editor?.chain().focus().setLink({ href: url }).run();
    }
  }

  function removeLink() {
    editor?.chain().focus().unsetLink().run();
  }

  function isActive(name: string | Record<string, unknown>, attributes?: Record<string, unknown>): boolean {
    if (typeof name === "object") {
      return editor?.isActive(name) ?? false;
    }
    return editor?.isActive(name, attributes) ?? false;
  }

  function copyAsMarkdown() {
    if (!editor) return;
    const html = editor.getHTML();
    const markdown = convertToMarkdown(html);
    navigator.clipboard.writeText(markdown);
  }

  function convertToMarkdown(html: string): string {
    let md = html
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n\n")
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n\n")
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n\n")
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**")
      .replace(/<b[^>]*>(.*?)<\/b>/gi, "**$1**")
      .replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*")
      .replace(/<i[^>]*>(.*?)<\/i>/gi, "*$1*")
      .replace(/<u[^>]*>(.*?)<\/u>/gi, "_$1_")
      .replace(/<s[^>]*>(.*?)<\/s>/gi, "~~$1~~")
      .replace(/<code[^>]*>(.*?)<\/code>/gi, "`$1`")
      .replace(/<pre[^>]*>(.*?)<\/pre>/gi, "```\n$1\n```\n")
      .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, "> $1\n\n")
      .replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n")
      .replace(/<ul[^>]*>|<\/ul>/gi, "")
      .replace(/<ol[^>]*>|<\/ol>/gi, "")
      .replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)")
      .replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, "![$2]($1)")
      .replace(/<img[^>]*src="([^"]*)"[^>]*\/?>/gi, "![]($1)")
      .replace(/<hr\s*\/?>/gi, "\n---\n\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    return md;
  }
</script>

{#if editor}
  <div class="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
    <!-- Undo/Redo -->
    <button
      type="button"
      onclick={undo}
      disabled={!editor.can().undo()}
      class="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
      title="Undo"
    >
      <Undo class="w-4 h-4" />
    </button>
    <button
      type="button"
      onclick={redo}
      disabled={!editor.can().redo()}
      class="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
      title="Redo"
    >
      <Redo class="w-4 h-4" />
    </button>

    <div class="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>

    <!-- Headings -->
    <button
      type="button"
      onclick={() => toggleHeading(1)}
      class="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 {isActive('heading', { level: 1 }) ? 'bg-blue-100 dark:bg-blue-900 text-blue-600' : ''}"
      title="Heading 1"
    >
      <Heading1 class="w-4 h-4" />
    </button>
    <button
      type="button"
      onclick={() => toggleHeading(2)}
      class="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 {isActive('heading', { level: 2 }) ? 'bg-blue-100 dark:bg-blue-900 text-blue-600' : ''}"
      title="Heading 2"
    >
      <Heading2 class="w-4 h-4" />
    </button>
    <button
      type="button"
      onclick={() => toggleHeading(3)}
      class="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 {isActive('heading', { level: 3 }) ? 'bg-blue-100 dark:bg-blue-900 text-blue-600' : ''}"
      title="Heading 3"
    >
      <Heading3 class="w-4 h-4" />
    </button>
    <button
      type="button"
      onclick={setParagraph}
      class="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 {isActive('paragraph') && !isActive('heading') ? 'bg-blue-100 dark:bg-blue-900 text-blue-600' : ''}"
      title="Paragraph"
    >
      <span class="text-xs font-bold">P</span>
    </button>

    <div class="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>

    <!-- Text Formatting -->
    <button
      type="button"
      onclick={toggleBold}
      class="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 {isActive('bold') ? 'bg-blue-100 dark:bg-blue-900 text-blue-600' : ''}"
      title="Bold"
    >
      <Bold class="w-4 h-4" />
    </button>
    <button
      type="button"
      onclick={toggleItalic}
      class="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 {isActive('italic') ? 'bg-blue-100 dark:bg-blue-900 text-blue-600' : ''}"
      title="Italic"
    >
      <Italic class="w-4 h-4" />
    </button>
    <button
      type="button"
      onclick={toggleUnderline}
      class="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 {isActive('underline') ? 'bg-blue-100 dark:bg-blue-900 text-blue-600' : ''}"
      title="Underline"
    >
      <Underline class="w-4 h-4" />
    </button>
    <button
      type="button"
      onclick={toggleStrike}
      class="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 {isActive('strike') ? 'bg-blue-100 dark:bg-blue-900 text-blue-600' : ''}"
      title="Strikethrough"
    >
      <Strikethrough class="w-4 h-4" />
    </button>
    <button
      type="button"
      onclick={toggleCode}
      class="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 {isActive('code') ? 'bg-blue-100 dark:bg-blue-900 text-blue-600' : ''}"
      title="Code"
    >
      <Code class="w-4 h-4" />
    </button>

    <div class="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>

    <!-- Lists -->
    <button
      type="button"
      onclick={toggleBulletList}
      class="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 {isActive('bulletList') ? 'bg-blue-100 dark:bg-blue-900 text-blue-600' : ''}"
      title="Bullet List"
    >
      <List class="w-4 h-4" />
    </button>
    <button
      type="button"
      onclick={toggleOrderedList}
      class="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 {isActive('orderedList') ? 'bg-blue-100 dark:bg-blue-900 text-blue-600' : ''}"
      title="Ordered List"
    >
      <ListOrdered class="w-4 h-4" />
    </button>
    <button
      type="button"
      onclick={toggleBlockquote}
      class="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 {isActive('blockquote') ? 'bg-blue-100 dark:bg-blue-900 text-blue-600' : ''}"
      title="Quote"
    >
      <Quote class="w-4 h-4" />
    </button>

    <div class="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>

    <!-- Alignment -->
    <button
      type="button"
      onclick={() => setTextAlign("left")}
      class="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 {isActive({ textAlign: "left" }) ? 'bg-blue-100 dark:bg-blue-900 text-blue-600' : ''}"
      title="Align Left"
    >
      <AlignLeft class="w-4 h-4" />
    </button>
    <button
      type="button"
      onclick={() => setTextAlign("center")}
      class="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 {isActive({ textAlign: "center" }) ? 'bg-blue-100 dark:bg-blue-900 text-blue-600' : ''}"
      title="Align Center"
    >
      <AlignCenter class="w-4 h-4" />
    </button>
    <button
      type="button"
      onclick={() => setTextAlign("right")}
      class="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 {isActive({ textAlign: "right" }) ? 'bg-blue-100 dark:bg-blue-900 text-blue-600' : ''}"
      title="Align Right"
    >
      <AlignRight class="w-4 h-4" />
    </button>
    <button
      type="button"
      onclick={() => setTextAlign("justify")}
      class="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 {isActive({ textAlign: "justify" }) ? 'bg-blue-100 dark:bg-blue-900 text-blue-600' : ''}"
      title="Align Justify"
    >
      <AlignJustify class="w-4 h-4" />
    </button>

    <div class="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>

    <!-- Insert -->
    <button
      type="button"
      onclick={setHorizontalRule}
      class="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
      title="Horizontal Rule"
    >
      <Minus class="w-4 h-4" />
    </button>
    <button
      type="button"
      onclick={isActive("link") ? removeLink : insertLink}
      class="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 {isActive("link") ? 'bg-blue-100 dark:bg-blue-900 text-blue-600' : ''}"
      title={isActive("link") ? "Remove Link" : "Insert Link"}
    >
      <Link class="w-4 h-4" />
    </button>
    {#if onInsertImage}
      <button
        type="button"
        onclick={onInsertImage}
        class="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
        title="Insert Image"
      >
        <Image class="w-4 h-4" />
      </button>
    {/if}

    <!-- Copy as Markdown -->
    <button
      type="button"
      onclick={copyAsMarkdown}
      class="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
      title="Copy as Markdown"
    >
      <FileText class="w-4 h-4" />
    </button>
  </div>
{/if}
