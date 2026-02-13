<script lang="ts">
  import { BlueprintBuilder } from '$lib/components/blueprint/index.js';

  async function handleSave(blueprint: import('$lib/components/blueprint/types.js').Blueprint) {
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
