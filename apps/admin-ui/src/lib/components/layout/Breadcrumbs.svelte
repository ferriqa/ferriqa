<script lang="ts">
  import * as m from '$lib/paraglide/messages.js';
  import { page } from '$app/state';

  interface BreadcrumbItem {
    label: string;
    href?: string;
  }

  const routeLabels: Record<string, string> = {
    '': m.nav_dashboard(),
    'content': m.nav_content(),
    'blueprints': m.nav_blueprints(),
    'media': m.nav_media(),
    'users': m.nav_users(),
    'webhooks': m.nav_webhooks(),
    'plugins': m.nav_plugins(),
    'settings': m.nav_settings(),
    'new': m.common_create(),
    'edit': m.common_edit(),
  };

  function getBreadcrumbs(pathname: string): BreadcrumbItem[] {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: m.common_breadcrumb_home(), href: '/' }
    ];

    let currentPath = '';
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      currentPath += `/${segment}`;

      const label = routeLabels[segment] || segment;
      const isLast = i === segments.length - 1;

      breadcrumbs.push({
        label: isLast ? formatSegmentLabel(segment, label) : label,
        href: isLast ? undefined : currentPath
      });
    }

    return breadcrumbs;
  }

  function formatSegmentLabel(segment: string, defaultLabel: string): string {
    if (segment.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return 'ID';
    }
    if (segment === 'new') return defaultLabel;
    if (segment === 'edit') return defaultLabel;
    return defaultLabel.charAt(0).toUpperCase() + defaultLabel.slice(1);
  }

  let breadcrumbs = $derived(getBreadcrumbs(page.url.pathname));
</script>

<nav aria-label="Breadcrumb" class="flex items-center">
  <ol class="flex items-center gap-1.5 text-sm">
    {#each breadcrumbs as item, index}
      <li class="flex items-center gap-1.5">
        {#if index > 0}
          <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        {/if}
        {#if item.href}
          <a
            href={item.href}
            class="text-gray-500 hover:text-gray-700 transition-colors"
          >
            {item.label}
          </a>
        {:else}
          <span class="text-gray-900 font-medium">{item.label}</span>
        {/if}
      </li>
    {/each}
  </ol>
</nav>
