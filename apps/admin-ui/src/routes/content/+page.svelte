<script lang="ts">
  import * as m from '$lib/paraglide/messages.js';
</script>

<div class="space-y-6">
  <div class="flex justify-between items-center">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">{m.content_title()}</h1>
      <p class="text-gray-600">{m.content_no_items()}</p>
    </div>
    <a
      href="/content/new"
      class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      {m.content_create()}
    </a>
  </div>

  <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
    <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
    <h3 class="text-lg font-medium text-gray-900 mb-2">{m.content_no_items()}</h3>
    <p class="text-gray-600 mb-4">{m.dashboard_quick_actions()}</p>
    <a
      href="/content/new"
      class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
    >
      {m.content_create()}
    </a>
  </div>
</div>
