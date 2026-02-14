<script lang="ts">
  import * as m from '$lib/paraglide/messages.js';
  import LanguageSwitcher from '$lib/components/ui/LanguageSwitcher.svelte';
  import Breadcrumbs from '$lib/components/layout/Breadcrumbs.svelte';
  
  interface Props {
    user?: {
      name: string;
      email: string;
      avatar?: string;
    };
  }
  
  let { user }: Props = $props();
  
  let userMenuOpen = $state(false);
</script>

<header class="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8">
  <!-- Left side - Breadcrumbs -->
  <div class="flex items-center gap-4">
    <Breadcrumbs />
  </div>
  
  <!-- Right side - Actions -->
  <div class="flex items-center gap-4">
    <!-- Language Switcher -->
    <LanguageSwitcher />
    
    <!-- User Menu -->
    {#if user}
      <div class="relative">
        <button
          type="button"
          class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          onclick={() => userMenuOpen = !userMenuOpen}
          aria-expanded={userMenuOpen}
          aria-haspopup="true"
        >
          {#if user.avatar}
            <img
              src={user.avatar}
              alt={user.name}
              class="w-8 h-8 rounded-full object-cover"
            />
          {:else}
            <div class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
              {user.name.charAt(0).toUpperCase()}
            </div>
          {/if}
          <span class="hidden md:block text-sm font-medium text-gray-700">{user.name}</span>
          <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {#if userMenuOpen}
          <div
            class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
            role="menu"
          >
            <div class="px-4 py-2 border-b border-gray-100">
              <p class="text-sm font-medium text-gray-900">{user.name}</p>
              <p class="text-xs text-gray-500">{user.email}</p>
            </div>
            <a
              href="/settings"
              class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              role="menuitem"
            >
              {m.nav_settings()}
            </a>
            <button
              type="button"
              class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              role="menuitem"
            >
              {m.auth_logout()}
            </button>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</header>
