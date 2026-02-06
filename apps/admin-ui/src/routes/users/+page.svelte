<script lang="ts">
  import * as m from '$lib/paraglide/messages.js';
</script>

<div class="space-y-6">
  <div class="flex justify-between items-center">
    <h1 class="text-2xl font-bold text-gray-900">{m.common_loading()}</h1>
  </div>
  <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
    <p class="text-gray-600">{m.common_loading()}</p>
  </div>
</div>
