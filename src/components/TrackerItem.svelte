<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { TrackerNode } from '@types/tracker';
  
  export let node: TrackerNode;
  
  const dispatch = createEventDispatcher();
  
  function handleToggle() {
    dispatch('toggle');
  }
  
  $: threatClass = `threat-${node.threatLevel}`;
  $: hasFingerprintingMethods = node.fingerprintingMethods.length > 0;
  $: hasDataCollection = Object.values(node.dataCollection).some(v => v);
</script>

<div class="tracker-item">
  <div class="tracker-status {node.blocked ? 'blocked' : 'allowed'}"></div>
  
  <div class="flex-1 min-w-0">
    <div class="flex items-center gap-1 mb-1">
      <div class="font-medium text-xs text-white truncate">
        {node.id}
      </div>
      
      {#if hasFingerprintingMethods}
        <span class="text-xs text-white" title="Uses fingerprinting">◉</span>
      {/if}
      
      {#if hasDataCollection}
        <span class="text-xs text-white" title="Collects personal data">◈</span>
      {/if}
    </div>
    
    <div class="flex items-center gap-1 mb-1">
      <span class="category-badge text-xs">{node.category}</span>
      <span class="threat-badge {threatClass} text-xs">{node.threatLevel}</span>
    </div>
    
    <div class="text-xs text-white truncate">
      {node.description}
    </div>
  </div>
  <button 
    class="btn"
    class:btn-primary={!node.blocked}
    class:btn-secondary={node.blocked}
    on:click={handleToggle}
  >
    {node.blocked ? 'Allow' : 'Block'}
  </button>
</div>
