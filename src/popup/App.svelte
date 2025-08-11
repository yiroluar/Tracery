<script lang="ts">
  import { onMount } from 'svelte';
  import Header from '@components/Header.svelte';
  import Toolbar from '@components/Toolbar.svelte';
  import TrackerList from '@components/TrackerList.svelte';
  import TrackerGraph from '@components/TrackerGraph.svelte';
  import BlockedList from '@components/BlockedList.svelte';
  import SettingsPanel from '@components/SettingsPanel.svelte';
  import StatsBar from '@components/StatsBar.svelte';
  import { trackerStore, trackerActions } from '@stores/trackerStore';
  import { uiStore, uiActions } from '@stores/uiStore';
  import { settingsStore, settingsActions } from '@stores/settingsStore';

  onMount(async () => {
    await trackerActions.initialize();
    await settingsActions.initialize();
    await uiActions.initialize();
  });
</script>

<div class="flex flex-col h-full bg-black text-gray-100">
  <Header />
  <Toolbar />
  <StatsBar />
  
  <div class="flex-1 relative overflow-hidden">
    {#if $uiStore.currentView === 'list'}
      <TrackerList />
    {:else if $uiStore.currentView === 'graph'}
      <TrackerGraph />
    {/if}
    
    {#if $uiStore.showBlocked}
      <BlockedList />
    {/if}
    
    {#if $uiStore.showSettings}
      <SettingsPanel />
    {/if}
  </div>
</div>