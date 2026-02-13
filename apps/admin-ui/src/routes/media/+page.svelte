<script lang="ts">
  import * as m from '$lib/paraglide/messages.js';
  import MediaLibrary from '$lib/components/media/MediaLibrary.svelte';
</script>

<div class="space-y-6">
  <!-- Page Header -->
  <div class="flex justify-between items-center">
    <div>
      <h1 class="text-2xl font-bold text-foreground">{m.media_title()}</h1>
      <p class="text-muted-foreground-1">Manage your media files</p>
    </div>
  </div>
  
  <!-- Media Library -->
  <MediaLibrary />
</div>
