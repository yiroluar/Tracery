import { writable, derived } from 'svelte/store';
import type { TrackerNode, TrackerDatabase, TabStatistics } from '@types/tracker';
import { chromeApi } from '@utils/chromeApi';
import { trackerClassifier } from '@utils/trackerClassifier';

interface TrackerState {
  nodes: TrackerNode[];
  blocklist: string[];
  database: TrackerDatabase | null;
  statistics: TabStatistics;
  loading: boolean;
  error: string | null;
}

const initialState: TrackerState = {
  nodes: [],
  blocklist: [],
  database: null,
  statistics: {
    totalTrackers: 0,
    fingerprintingAttempts: 0,
    threatAttempts: 0,
    blockedTrackers: 0
  },
  loading: false,
  error: null
};

export const trackerStore = writable<TrackerState>(initialState);

// derived stores
export const blockedTrackers = derived(
  trackerStore,
  ($store) => $store.nodes.filter(node => node.blocked)
);

export const allowedTrackers = derived(
  trackerStore,
  ($store) => $store.nodes.filter(node => !node.blocked)
);

export const trackersByCategory = derived(
  trackerStore,
  ($store) => {
    const categories: Record<string, TrackerNode[]> = {};
    $store.nodes.forEach(node => {
      if (!categories[node.category]) {
        categories[node.category] = [];
      }
      categories[node.category].push(node);
    });
    return categories;
  }
);

// actions
export const trackerActions = {
  async initialize() {
    trackerStore.update(state => ({ ...state, loading: true, error: null }));
    
    try {
      // load tracker database
      const database = await trackerClassifier.loadDatabase();
      
      // get current tab data
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) throw new Error('No active tab found');
      
      // fetch domains and statistics
      const [domains, blocklist, statistics, threatAttempts] = await Promise.all([
        chromeApi.getDomains(tab.id),
        chromeApi.getBlocklist(),
        chromeApi.getStatistics(tab.id),
        chromeApi.getThreatAttempts(tab.id)
      ]);
      
      // create tracker nodes
      const nodes = domains.map(domain => ({
        id: domain,
        blocked: blocklist.includes(domain),
        category: trackerClassifier.classifyTracker(domain, database),
        threatLevel: trackerClassifier.assessThreatLevel(domain, database),
        fingerprintingMethods: database?.trackers[domain]?.fingerprintingMethods || [],
        dataCollection: database?.trackers[domain]?.dataCollection || {},
        description: database?.trackers[domain]?.description || 'Third-party service',
        fingerprintingAttempts: []
      }));
      
      trackerStore.update(state => ({
        ...state,
        nodes,
        blocklist,
        database,
        statistics: { ...statistics, threatAttempts: threatAttempts.length || statistics.threatAttempts },
        loading: false
      }));
      
    } catch (error) {
      console.error('[Tracery] Failed to initialize tracker store:', error);
      trackerStore.update(state => ({
        ...state,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  },

  async toggleTracker(domain: string) {
    try {
      const result = await chromeApi.toggleGlobal(domain);
      
      trackerStore.update(state => ({
        ...state,
        nodes: state.nodes.map(node => 
          node.id === domain 
            ? { ...node, blocked: !node.blocked }
            : node
        ),
        blocklist: result,
        statistics: {
          ...state.statistics,
          blockedTrackers: result.length
        }
      }));
      
    } catch (error) {
      console.error('[Tracery] Failed to toggle tracker:', error);
    }
  },

  async blockAll() {
    try {
      let domains: string[] = [];
      trackerStore.update(s => { domains = s.nodes.map(n => n.id); return s; });
      const unique = Array.from(new Set(domains));
      const result = await chromeApi.setGlobalBlocklist(unique);
      trackerStore.update(state => ({
        ...state,
        blocklist: result,
        nodes: state.nodes.map(n => ({ ...n, blocked: result.includes(n.id) })),
        statistics: { ...state.statistics, blockedTrackers: result.length }
      }));
    } catch (error) {
      console.error('[Tracery] Failed to block all trackers:', error);
    }
  },

  async refresh() {
    await this.initialize();
  }
};

// export the store with actions
export const trackerStoreWithActions = {
  ...trackerStore,
  ...trackerActions
};