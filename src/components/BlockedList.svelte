<script lang="ts">
  import { X } from 'lucide-svelte';
  import { blockedTrackers, trackerActions } from '@stores/trackerStore';
  import { uiActions } from '@stores/uiStore';
  import TrackerItem from './TrackerItem.svelte';
  
  function handleClose() {
    uiActions.toggleBlocked();
  }
  
  function handleTrackerToggle(trackerId: string) {
    trackerActions.toggleTracker(trackerId);
  }
</script>

<div class="absolute inset-0 bg-black z-10 flex flex-col text-white">
  <!-- header -->
  <div class="flex items-center justify-between px-4 py-3 bg-black border-b border-stone-800">
    <h3 class="text-sm font-semibold text-white uppercase tracking-wide">
      Blocked Trackers
    </h3>
    <button 
      class="p-1 rounded"
      on:click={handleClose}
    >
      <X size={16} class="text-white" />
    </button>
  </div>
  
  <!-- Content -->
  <div class="flex-1 overflow-y-auto">
    {#if $blockedTrackers.length === 0}
      <div class="flex items-center justify-center h-32">
      <div class="text-sm text-white italic">No trackers currently blocked</div>
      </div>
    {:else}
      <div class="divide-y divide-stone-800">
        {#each $blockedTrackers as node (node.id)}
          <TrackerItem 
            {node} 
            on:toggle={() => handleTrackerToggle(node.id)}
          />
        {/each}
      </div>
    {/if}
  </div>
</div>