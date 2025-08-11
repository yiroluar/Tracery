<script lang="ts">
  import { trackerStore } from '@stores/trackerStore';
  
  $: statistics = $trackerStore.statistics;
  $: hasThreats = statistics.threatAttempts > 0;
  $: hasFingerprinting = statistics.fingerprintingAttempts > 0;
  
  $: statsClass = hasThreats ? 'danger' : hasFingerprinting ? 'warning' : 'normal';
</script>

{#if statistics.totalTrackers > 0 || hasFingerprinting || hasThreats}
<div class="px-4 py-2 text-xs border-b border-stone-800 bg-black text-white">
    <div class="flex justify-between items-center mb-1">
      <div class="flex items-center gap-4">
        <div class="flex justify-between">
        <span class="text-white">Trackers:</span>
          <span class="font-semibold text-white ml-2">{statistics.totalTrackers}</span>
        </div>
        <div class="flex justify-between">
        <span class="text-white">Blocked:</span>
          <span class="font-semibold text-white ml-2">{statistics.blockedTrackers}</span>
        </div>
      </div>
    </div>
    
    {#if hasFingerprinting}
      <div class="flex justify-between items-center mb-1">
        <div class="flex items-center gap-4">
          <div class="flex justify-between">
            <span class="text-white">Fingerprinting:</span>
            <span class="font-semibold text-white ml-2">{statistics.fingerprintingAttempts}</span>
          </div>
        </div>
      </div>
    {/if}
    
    {#if hasThreats}
      <div class="flex justify-between items-center">
        <div class="flex items-center gap-4">
          <div class="flex justify-between">
            <span class="text-white">High Threats:</span>
            <span class="font-semibold text-white ml-2">{statistics.threatAttempts}</span>
          </div>
        </div>
      </div>
    {/if}
  </div>
{/if}

<style>
</style>
