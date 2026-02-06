<script lang="ts">
	import { page } from '$app/state';
	import { locales, localizeHref } from '$lib/paraglide/runtime';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import Sidebar from '$lib/components/layout/Sidebar.svelte';
	import Header from '$lib/components/layout/Header.svelte';

	let { children } = $props();

	// Mock user for now - replace with actual auth store later
	const user = {
		name: 'Admin User',
		email: 'admin@ferriqa.com'
	};
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="min-h-screen bg-gray-50">
	<Sidebar />
	
	<div class="lg:ml-64">
		<Header {user} />
		
		<main class="p-4 lg:p-8">
			{@render children()}
		</main>
	</div>
</div>

<!-- Hidden locale links for SEO -->
<div style="display:none">
	{#each locales as locale}
		<a href={localizeHref(page.url.pathname, { locale })}>
			{locale}
		</a>
	{/each}
</div>
