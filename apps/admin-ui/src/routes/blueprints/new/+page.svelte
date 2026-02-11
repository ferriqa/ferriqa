<script lang="ts">
  import { BlueprintBuilder } from '$lib/components/blueprint/index.js';

  import type { Blueprint } from '$lib/types.js';

  async function handleSave(blueprint: Blueprint) {
    // TODO: Save blueprint to API
    console.log('Saving blueprint:', blueprint);
    alert('Blueprint saved! (Check console)');
  }

  function handleCancel() {
    // Navigate back or show confirmation
    if (confirm('Discard changes?')) {
      window.history.back();
    }
  }
</script>

<BlueprintBuilder onSave={handleSave} onCancel={handleCancel} />
