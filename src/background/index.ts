interface ChromeMessage {
  type: string;
  tabId?: number;
  domain?: string;
  add?: boolean;
  profile?: string;
  config?: any;
}

// state management
const logs: Record<number, Set<string>> = {};
const fingerprintingAttempts: Record<number, any[]> = {};
let globalBlock = new Set<string>();
let trackerDatabase: any = null;
let currentProfile = 'balanced';

// privacy profiles
const privacyProfiles = {
  minimal: {
    blockAdvertising: true,
    blockAnalytics: false,
    blockSocial: false,
    blockFingerprinting: true,
    allowCDN: true
  },
  balanced: {
    blockAdvertising: true,
    blockAnalytics: true,
    blockSocial: false,
    blockFingerprinting: true,
    allowCDN: true
  },
  strict: {
    blockAdvertising: true,
    blockAnalytics: true,
    blockSocial: true,
    blockFingerprinting: true,
    allowCDN: false
  }
};

// init extension
async function initializeExtension() {
  try {
    // Load tracker database
    await loadTrackerDatabase();
    
    // load settings
    const data = await chrome.storage.local.get({
      globalBlock: [],
      currentProfile: 'balanced'
    });
    
    globalBlock = new Set(data.globalBlock);
    currentProfile = data.currentProfile;
    
    // apply blocking rules
    await pushRules([...globalBlock]);
    
    console.log('[Tracery] Extension initialized successfully');
  } catch (error) {
    console.error('[Tracery] Failed to initialize extension:', error);
  }
}

// load tracker db
async function loadTrackerDatabase() {
  if (trackerDatabase) return trackerDatabase;
  
  try {
    const response = await fetch(chrome.runtime.getURL('trackers.json'));
    trackerDatabase = await response.json();
    console.log('[Tracery] Tracker database loaded successfully');
    return trackerDatabase;
  } catch (error) {
    console.error('[Tracery] Failed to load tracker database:', error);
    trackerDatabase = { trackers: {}, categories: {} };
    return trackerDatabase;
  }
}

// request monitoring
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (details.tabId < 0) return;
    
    try {
      const url = new URL(details.url);
      const host = url.hostname;
      const initiatorHost = details.initiator ? new URL(details.initiator).hostname : '';
      
      // skip first-party requests
      if (host === initiatorHost) return;
      
      // log third-party requests
      logs[details.tabId] = logs[details.tabId] || new Set();
      logs[details.tabId].add(host);
      
      // update badge
      updateBadge(details.tabId);
      
    } catch (error) {
      // silently handle url parsing errors
    }
  },
  { urls: ['<all_urls>'] }
);

// update extension badge
function updateBadge(tabId: number) {
  const domains = logs[tabId] || new Set();
  const attempts = fingerprintingAttempts[tabId] || [];
  
  if (attempts.length > 0) {
    chrome.action.setBadgeText({
      text: attempts.length.toString(),
      tabId: tabId
    });
    chrome.action.setBadgeBackgroundColor({
      color: '#dc2626',
      tabId: tabId
    });
  } else if (domains.size > 0) {
    chrome.action.setBadgeText({
      text: domains.size.toString(),
      tabId: tabId
    });
    chrome.action.setBadgeBackgroundColor({
      color: '#D3D3D3',
      tabId: tabId
    });
  } else {
    chrome.action.setBadgeText({
      text: '',
      tabId: tabId
    });
  }
}

// block rules management
async function pushRules(domains: string[]) {
  try {
    const rules = domains.map((domain, index) => ({
      id: index + 1,
      priority: 1,
      action: { type: 'block' as const },
      condition: {
        urlFilter: `*://*.${domain}/*`,
        resourceTypes: ['script', 'image', 'xmlhttprequest', 'sub_frame', 'font', 'media'] as chrome.declarativeNetRequest.ResourceType[]
      }
    }));
    
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: rules.map(r => r.id),
      addRules: rules
    });
  } catch (error) {
    console.warn('[Tracery] Failed to update blocking rules:', error);
  }
}

// message handling
chrome.runtime.onMessage.addListener((message: ChromeMessage, sender, sendResponse) => {
  switch (message.type) {
    case 'GET_DOMAINS':
      if (message.tabId) {
        sendResponse([...(logs[message.tabId] || [])]);
      }
      return true;
      
    case 'GET_TAB_STATISTICS':
      if (message.tabId) {
        const domains = logs[message.tabId] || new Set();
        const attempts = fingerprintingAttempts[message.tabId] || [];
        
        sendResponse({
          totalTrackers: domains.size,
          fingerprintingAttempts: attempts.length,
          threatAttempts: 0, // TODO: Implement threat detection
          blockedTrackers: [...domains].filter(d => globalBlock.has(d)).length
        });
      }
      return true;
      
    case 'TOGGLE_GLOBAL':
      if (message.domain) {
        const willAdd = message.add !== null ? message.add : !globalBlock.has(message.domain);
        
        if (willAdd) {
          globalBlock.add(message.domain);
        } else {
          globalBlock.delete(message.domain);
        }
        
        chrome.storage.local.set({ globalBlock: [...globalBlock] });
        pushRules([...globalBlock]);
        sendResponse([...globalBlock]);
      }
      return true;
      
    case 'SWITCH_PRIVACY_PROFILE':
      if (message.profile && privacyProfiles[message.profile as keyof typeof privacyProfiles]) {
        currentProfile = message.profile;
        chrome.storage.local.set({ currentProfile });
        sendResponse({ success: true, currentProfile });
      } else {
        sendResponse({ success: false });
      }
      return true;
      
    case 'GET_PRIVACY_PROFILES':
      sendResponse({
        profiles: Object.keys(privacyProfiles),
        current: currentProfile,
        settings: privacyProfiles[currentProfile as keyof typeof privacyProfiles]
      });
      return true;
      
    case 'UPDATE_PROTECTION_CONFIG':
      // forward to content script
      if (message.config) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]?.id) {
            chrome.tabs.sendMessage(tabs[0].id, message);
          }
        });
      }
      sendResponse({ success: true });
      return true;
  }
});

// cleanup on tab close
chrome.tabs.onRemoved.addListener((tabId) => {
  delete logs[tabId];
  delete fingerprintingAttempts[tabId];
});

// content script injection
chrome.webNavigation.onCommitted.addListener((details) => {
  if (details.frameId === 0) {
    chrome.scripting.executeScript({
      target: { tabId: details.tabId },
      files: ['content-script.js']
    }).catch(() => {
      // silently fail for pages where content scripts cannot be injected
    });
  }
});

// initialize on startup
chrome.runtime.onStartup.addListener(initializeExtension);
chrome.runtime.onInstalled.addListener(initializeExtension);

// initialize immediately
initializeExtension();