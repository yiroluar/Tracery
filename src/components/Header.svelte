<script lang="ts">
  import { Activity, AlertCircle } from 'lucide-svelte';
  import { trackerStore } from '@stores/trackerStore';
  
  $: statistics = $trackerStore.statistics;
  $: hasAlerts = statistics.threatAttempts > 0 || statistics.fingerprintingAttempts > 0;
</script>

<header class="flex items-center justify-between px-4 py-3 bg-black text-white border-b border-stone-800">
  <div class="flex items-center gap-2">
    <img src="/icons/32.png" alt="Tracery" class="w-6 h-6" />
    <span class="font-medium text-white">Tracery</span>
  </div>
  
  <div class="flex items-center gap-2">
    <!-- Live indicator -->
    <div class="flex items-center gap-1">
      <Activity 
        size={12} 
        class="text-white {$trackerStore.loading ? 'animate-pulse' : ''}"
      />
    </div>
    
    <!-- alert badge -->
    {#if hasAlerts}
      <div class="flex items-center justify-center min-w-5 h-5 px-1 text-2xs font-bold text-black bg-white rounded-full">
        {statistics.threatAttempts + statistics.fingerprintingAttempts}
      </div>
    {/if}
  </div>
</header>