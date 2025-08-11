<script lang="ts">
  import { X, Shield, Filter, Users } from 'lucide-svelte';
  import { uiActions } from '@stores/uiStore';
  import { settingsStore, settingsActions } from '@stores/settingsStore';
  
  let whitelistInput = '';
  
  $: protectionSettings = $settingsStore.protectionSettings;
  $: blockingSettings = $settingsStore.blockingSettings;
  $: whitelist = $settingsStore.whitelist;
  
  function handleClose() {
    uiActions.toggleSettings();
  }
  
  function handleProtectionChange(key: string, value: boolean) {
    settingsActions.updateProtectionSettings({ [key]: value });
  }
  
  function handleBlockingChange(key: string, value: boolean) {
    settingsActions.updateBlockingSettings({ [key]: value });
  }
  
  function handleAddWhitelist() {
    if (whitelistInput.trim()) {
      settingsActions.addToWhitelist(whitelistInput.trim());
      whitelistInput = '';
    }
  }
  
  function handleRemoveWhitelist(domain: string) {
    settingsActions.removeFromWhitelist(domain);
  }
  
  function handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      handleAddWhitelist();
    }
  }
</script>

<div class="absolute inset-0 bg-black text-white z-20 flex flex-col">
  <!-- header -->
  <div class="flex items-center justify-between px-4 py-3 bg-black border-b border-stone-800">
    <h3 class="text-sm font-semibold text-white">Privacy Settings</h3>
    <button 
      class="p-1 rounded"
      on:click={handleClose}
    >
      <X size={16} class="text-white" />
    </button>
  </div>
  
  <!-- content -->
  <div class="flex-1 overflow-y-auto p-4 space-y-6">
    <!-- anti-fingerprinting protection -->
    <div class="space-y-3">
      <div class="flex items-center gap-2">
        <Shield size={14} class="text-white" />
        <h4 class="text-xs font-semibold text-white uppercase tracking-wide">
          Anti-Fingerprinting Protection
        </h4>
      </div>
      
      <div class="space-y-2">
        {#each Object.entries(protectionSettings) as [key, value]}
          <label class="flex items-center gap-2 text-xs cursor-pointer">
            <input 
              type="checkbox" 
              checked={value}
              on:change={(e) => handleProtectionChange(key, e.currentTarget.checked)}
              class="w-4 h-4 rounded focus:ring-0 bg-black border-white accent-white"
            />
            <span class="text-white">
              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </span>
          </label>
        {/each}
      </div>
    </div>
    
    <!-- blocking categories -->
    <div class="space-y-3">
      <div class="flex items-center gap-2">
        <Filter size={14} class="text-white" />
        <h4 class="text-xs font-semibold text-white uppercase tracking-wide">
          Blocking Categories
        </h4>
      </div>
      
      <div class="space-y-2">
        {#each Object.entries(blockingSettings) as [key, value]}
          <label class="flex items-center gap-2 text-xs cursor-pointer">
            <input 
              type="checkbox" 
              checked={value}
              on:change={(e) => handleBlockingChange(key, e.currentTarget.checked)}
              class="w-4 h-4 rounded focus:ring-0 bg-black border-white accent-white"
            />
            <span class="text-white">
              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </span>
          </label>
        {/each}
      </div>
    </div>
    
    <!-- whitelist management -->
    <div class="space-y-3">
      <div class="flex items-center gap-2">
        <Users size={14} class="text-white" />
        <h4 class="text-xs font-semibold text-white uppercase tracking-wide">
          Whitelist Management
        </h4>
      </div>
      
      <div class="flex gap-2">
        <input 
          type="text" 
          placeholder="Enter domain to whitelist"
          bind:value={whitelistInput}
          on:keypress={handleKeyPress}
          class="input flex-1"
        />
        <button 
          class="btn btn-primary"
          on:click={handleAddWhitelist}
        >
          Add
        </button>
      </div>
      
      {#if whitelist.length > 0}
        <div class="space-y-1 max-h-24 overflow-y-auto">
          {#each whitelist as domain}
            <div class="flex items-center justify-between p-2 bg-black rounded text-xs border border-stone-800">
              <span class="text-white">{domain}</span>
              <button 
                class="text-white"
                on:click={() => handleRemoveWhitelist(domain)}
              >
                <X size={12} />
              </button>
            </div>
          {/each}
        </div>
      {/if}
    </div>
    
    <!-- data management -->
    <div class="space-y-3">
      <div class="flex items-center gap-2">
        <h4 class="text-xs font-semibold text-white uppercase tracking-wide">
          Data Management
        </h4>
      </div>
      
      <div class="space-y-2">
        <button class="btn btn-secondary w-full justify-center text-white border-stone-700 hover:bg-black">
          Export Data
        </button>
        
        <button class="btn btn-secondary w-full justify-center text-white border-stone-700 hover:bg-black">
          Clear All Data
        </button>
        
        <button class="btn btn-secondary w-full justify-center text-white border-stone-700 hover:bg-black">
          Reset Settings
        </button>
      </div>
    </div>
  </div>
</div>