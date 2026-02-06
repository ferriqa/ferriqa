<script lang="ts">
  import { page } from '$app/state';
  import * as m from '$lib/paraglide/messages.js';
  import { i18n } from '$lib/i18n';

  interface NavItem {
    href: string;
    label: string;
    icon: string;
  }

  const currentLang = $derived(page.params.lang ?? 'en');

  function localizePath(path: string): string {
    return i18n.resolveRoute(path, currentLang);
  }

  const navigation: NavItem[] = [
    { href: '/', label: m.nav_dashboard(), icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { href: '/content', label: m.nav_content(), icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { href: '/blueprints', label: m.nav_blueprints(), icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
    { href: '/media', label: m.nav_media(), icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { href: '/users', label: m.nav_users(), icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { href: '/webhooks', label: m.nav_webhooks(), icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { href: '/plugins', label: m.nav_plugins(), icon: 'M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z' },
    { href: '/settings', label: m.nav_settings(), icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  ];

  let mobileMenuOpen = $state(false);

  function isActive(href: string): boolean {
    const currentPath = page.url.pathname;
    const localizedHref = localizePath(href);
    return currentPath === localizedHref || currentPath.startsWith(localizedHref + '/');
  }
</script>

<!-- Mobile menu button -->
<div class="lg:hidden fixed top-4 left-4 z-50">
  <button
    type="button"
    class="p-2 bg-white rounded-lg shadow-md border border-gray-200"
    onclick={() => mobileMenuOpen = !mobileMenuOpen}
    aria-label="Toggle menu"
  >
    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {#if mobileMenuOpen}
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      {:else}
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
      {/if}
    </svg>
  </button>
</div>

<!-- Mobile menu overlay -->
{#if mobileMenuOpen}
  <div
    class="fixed inset-0 bg-black/50 z-40 lg:hidden"
    onclick={() => mobileMenuOpen = false}
  ></div>
{/if}

<!-- Sidebar -->
<aside
  class="fixed top-0 left-0 z-40 h-screen w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out lg:translate-x-0 {mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}"
>
  <div class="flex flex-col h-full">
    <!-- Logo -->
    <div class="flex items-center h-16 px-6 border-b border-gray-200">
      <a href={localizePath('/')} class="flex items-center gap-2">
        <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <span class="text-white font-bold text-lg">F</span>
        </div>
        <span class="text-xl font-bold text-gray-900">{m.app_name()}</span>
      </a>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 px-4 py-6 overflow-y-auto">
      <ul class="space-y-1">
        {#each navigation as item}
          <li>
            <a
              href={localizePath(item.href)}
              class="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors {isActive(item.href) ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}"
            >
              <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={item.icon} />
              </svg>
              {item.label}
            </a>
          </li>
        {/each}
      </ul>
    </nav>

    <!-- Footer -->
    <div class="p-4 border-t border-gray-200">
      <p class="text-xs text-gray-500 text-center">
        {m.app_name()} v1.0.0
      </p>
    </div>
  </div>
</aside>
