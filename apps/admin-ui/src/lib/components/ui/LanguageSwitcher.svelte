<script lang="ts">
  import { i18n } from '$lib/i18n';
  import { page } from '$app/state';
  import * as m from '$lib/paraglide/messages.js';

  let currentLang = $derived(page.params.lang ?? 'en');

  function switchLanguage(lang: string) {
    const canonicalPath = i18n.route(page.url.pathname);
    const localisedPath = i18n.resolveRoute(canonicalPath, lang);
    window.location.href = localisedPath;
  }
</script>

<div class="relative">
  <button
    type="button"
    class="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
    aria-haspopup="true"
    aria-expanded="false"
    id="language-menu-button"
  >
    <span class="uppercase">{currentLang}</span>
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
    </svg>
  </button>

  <div
    class="absolute right-0 z-10 mt-2 w-32 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200"
    role="menu"
    aria-orientation="vertical"
    aria-labelledby="language-menu-button"
  >
    <div class="py-1">
      <button
        class="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 {currentLang === 'en' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}"
        onclick={() => switchLanguage('en')}
        role="menuitem"
      >
        🇺🇸 English
      </button>
      <button
        class="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 {currentLang === 'tr' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}"
        onclick={() => switchLanguage('tr')}
        role="menuitem"
      >
        🇹🇷 Türkçe
      </button>
    </div>
  </div>
</div>

<style>
  .relative:hover .absolute {
    opacity: 1;
    visibility: visible;
  }
</style>
