<script lang="ts">
  import { getLocale, setLocale } from '$lib/paraglide/runtime';
  import { browser } from '$app/environment';

  let currentLang = $state('en');
  let dropdownOpen = $state(false);

  $effect(() => {
    if (browser) {
      try {
        currentLang = getLocale();
      } catch (e) {
        console.error('getLocale error:', e);
      }
    }
  });

  function switchLanguage(lang: 'en' | 'tr') {
    setLocale(lang);
    currentLang = lang;
    dropdownOpen = false;
  }

  function toggleDropdown(e: Event) {
    e.preventDefault();
    dropdownOpen = !dropdownOpen;
  }

  function handleClickOutside(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target.closest('.language-dropdown')) {
      dropdownOpen = false;
    }
  }
</script>

<svelte:window onclick={handleClickOutside} />

<div class="relative language-dropdown">
  <button
    type="button"
    class="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
    aria-haspopup="true"
    aria-expanded={dropdownOpen}
    id="language-menu-button"
    onclick={toggleDropdown}
  >
    <span class="uppercase">{currentLang}</span>
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
    </svg>
  </button>

  {#if dropdownOpen}
    <div
      class="absolute right-0 z-10 mt-2 w-32 bg-white rounded-lg shadow-lg border border-gray-200"
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
  {/if}
</div>
