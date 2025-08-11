<script lang="ts">
  import { Eye, EyeOff } from 'lucide-svelte';
  import { trackerStore, trackerActions } from '@stores/trackerStore';
  import { uiActions } from '@stores/uiStore';
  import TrackerItem from './TrackerItem.svelte';
  
  $: nodes = $trackerStore.nodes;
  $: loading = $trackerStore.loading;
  $: error = $trackerStore.error;
  
  $: sortedNodes = [...nodes].sort((a, b) => {
    const threatOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    if (a.blocked !== b.blocked) return a.blocked ? 1 : -1;
    return (threatOrder[a.threatLevel as keyof typeof threatOrder] || 0) - 
           (threatOrder[b.threatLevel as keyof typeof threatOrder] || 0);
  });
  
  function handleTrackerClick(trackerId: string) {
    trackerActions.toggleTracker(trackerId);
  }
</script>

<div class="flex-1 overflow-y-auto bg-black">
  {#if loading}
    <div class="flex items-center justify-center h-32">
      <div class="text-sm text-white">Loading trackers...</div>
    </div>
  {:else if error}
    <div class="flex items-center justify-center h-32">
      <div class="text-sm text-red-500">Error: {error}</div>
    </div>
  {:else if sortedNodes.length === 0}
    <div class="flex flex-col items-center justify-center h-32 text-center">
      <Eye size={24} class="text-white mb-2" />
      <div class="text-sm text-white">No trackers detected on this page</div>
    </div>
  {:else}
    <div class="divide-y divide-stone-800">
      {#each sortedNodes as node (node.id)}
        <TrackerItem 
          {node} 
          on:toggle={() => handleTrackerClick(node.id)}
        />
      {/each}
    </div>
  {/if}
</div>
