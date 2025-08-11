<script lang="ts">
  import { List, Network, Shield, Settings } from 'lucide-svelte';
  import { uiStore, uiActions } from '@stores/uiStore';
  import { blockedTrackers, trackerActions } from '@stores/trackerStore';
  import { settingsActions } from '@stores/settingsStore';
  import { chromeApi } from '@utils/chromeApi';
  
  $: blockedCount = $blockedTrackers.length;
  
  const profiles = [
    { value: '', label: 'Profile…' },
    { value: 'minimal', label: 'Minimal' },
    { value: 'balanced', label: 'Balanced' },
    { value: 'strict', label: 'Strict' }
  ];
  
  let selectedProfile = '';
  
  function handleViewToggle() {
    const newView = $uiStore.currentView === 'list' ? 'graph' : 'list';
    uiActions.setView(newView);
  }
  
  function handleProfileChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    if (target.value) {
      settingsActions.switchProfile(target.value);
      selectedProfile = '';
    }
  }
  
  async function handleAutoClean() {
    await trackerActions.blockAll();
  }

  async function handleDisableOnThisSite() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url) return;
    try {
      const url = new URL(tab.url);
      await chromeApi.addToWhitelist(url.hostname.replace(/^www\./, ''));
      uiActions.showNotification(`Disabled on ${url.hostname}`, 'success');
    } catch (_) {}
  }
</script>

<div class="px-4 py-3 bg-black text-white border-b border-stone-800 flex flex-col gap-3">
  <div class="flex items-center justify-between gap-3">
    <div class="flex items-center gap-3">
      <div class="flex items-center rounded-md overflow-hidden border border-stone-700">
        <button
          class="px-3 py-1.5 text-xs font-medium select-none focus:outline-none"
          class:bg-white={ $uiStore.currentView === 'list' }
          class:text-black={ $uiStore.currentView === 'list' }
          class:text-white={ $uiStore.currentView !== 'list' }
          on:click={ () => uiActions.setView('list') }
        >
          <span class="inline-flex items-center gap-1"><List size={12} /> List</span>
        </button>
        <button
          class="px-3 py-1.5 text-xs font-medium select-none focus:outline-none"
          class:bg-white={ $uiStore.currentView === 'graph' }
          class:text-black={ $uiStore.currentView === 'graph' }
          class:text-white={ $uiStore.currentView !== 'graph' }
          on:click={ () => uiActions.setView('graph') }
        >
          <span class="inline-flex items-center gap-1"><Network size={12} /> Graph</span>
        </button>
      </div>

      <button
        class="px-3 py-1.5 text-xs border border-stone-700 rounded-md text-white hover:bg-black inline-flex items-center gap-1"
        on:click={uiActions.toggleBlocked}
      >
        <Shield size={12} /> Blocked ({blockedCount})
      </button>
    </div>

    <button
      class="p-1.5 border border-stone-700 rounded-md text-white hover:bg-black"
      on:click={uiActions.toggleSettings}
      aria-label="Settings"
      title="Settings"
    >
      <Settings size={14} />
    </button>
  </div>

  <div class="flex items-center justify-between gap-3 flex-wrap">
    <div class="flex items-center gap-2 flex-wrap">
      <select
        class="px-3 py-1.5 text-xs bg-black text-white border border-stone-700 rounded-md focus:outline-none"
        bind:value={selectedProfile}
        on:change={handleProfileChange}
      >
        {#each profiles as profile}
            <option class="bg-black text-white" value={profile.value}>{profile.label}</option>
   {/each}
      </select>

      <button
        class="px-3 py-1.5 text-xs border border-stone-700 rounded-md text-white hover:bg-black"
        on:click={handleDisableOnThisSite}
      >
        Disable on this site
      </button>
    </div>

    <button
      class="px-3 py-1.5 text-xs border border-stone-700 rounded-md text-white hover:bg-black"
      on:click={handleAutoClean}
    >
      Block all
    </button>
  </div>
</div>
