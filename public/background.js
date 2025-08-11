// state management
const logs = {};
const fingerprintingAttempts = {};
const threatAttempts = {};
let globalBlock = new Set();
let whitelist = new Set();
let trackerDatabase = null;
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

async function initializeExtension() {
  try {
    await loadTrackerDatabase();
    const data = await chrome.storage.local.get({
      globalBlock: [],
      whitelist: [],
      currentProfile: 'balanced'
    });
    globalBlock = new Set(data.globalBlock);
    whitelist = new Set(data.whitelist);
    currentProfile = data.currentProfile;
    await resetAndPushRules([...globalBlock], [...whitelist]);
    console.log('[Tracery] Extension initialized successfully');
  } catch (error) {
    console.error('[Tracery] Failed to initialize extension:', error);
  }
}

async function loadTrackerDatabase() {
  if (trackerDatabase) return trackerDatabase;
  try {
    const response = await fetch(chrome.runtime.getURL('trackers.json'));
    trackerDatabase = await response.json();
    return trackerDatabase;
  } catch (error) {
    trackerDatabase = { trackers: {}, categories: {} };
    return trackerDatabase;
  }
}

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (details.tabId < 0) return;
    try {
      const url = new URL(details.url);
      const host = url.hostname;
      const initiatorHost = details.initiator ? new URL(details.initiator).hostname : '';
      if (host === initiatorHost) return;
      logs[details.tabId] = logs[details.tabId] || new Set();
      const addedBefore = logs[details.tabId].has(host);
      logs[details.tabId].add(host);
      if (!addedBefore && trackerDatabase && trackerDatabase.trackers) {
        const info = trackerDatabase.trackers[host] || null;
        let threatLevel = info ? info.threatLevel : null;
        if (threatLevel === 'high' || threatLevel === 'critical') {
          threatAttempts[details.tabId] = threatAttempts[details.tabId] || [];
          threatAttempts[details.tabId].push({ domain: host, url: details.url, level: threatLevel, timestamp: Date.now() });
        }
      }
      updateBadge(details.tabId);
    } catch (e) {
      // ignore
    }
  },
  { urls: ['<all_urls>'] }
);

function updateBadge(tabId) {
  const domains = logs[tabId] || new Set();
  const attempts = fingerprintingAttempts[tabId] || [];
  const threats = threatAttempts[tabId] || [];
  if (attempts.length > 0 || threats.length > 0) {
    chrome.action.setBadgeText({ text: String(attempts.length), tabId });
    chrome.action.setBadgeBackgroundColor({ color: '#dc2626', tabId });
  } else if (domains.size > 0) {
    chrome.action.setBadgeText({ text: String(domains.size), tabId });
    chrome.action.setBadgeBackgroundColor({ color: '#D3D3D3', tabId });
  } else {
    chrome.action.setBadgeText({ text: '', tabId });
  }
}

async function resetAndPushRules(domains, whitelistArr) {
  try {
    const existing = await chrome.declarativeNetRequest.getDynamicRules();
    const removeIds = existing.map((r) => r.id);
    if (removeIds.length) {
      await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: removeIds, addRules: [] });
    }
    const rules = domains.map((domain, index) => ({
      id: index + 1,
      priority: 1,
      action: { type: 'block' },
      condition: {
        urlFilter: `*://*.${domain}/*`,
        resourceTypes: ['script', 'image', 'xmlhttprequest', 'sub_frame', 'font', 'media'],
        excludedInitiatorDomains: whitelistArr
      }
    }));
    if (rules.length) {
      await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: [], addRules: rules });
    }
  } catch (e) {
    console.warn('[Tracery] Failed to update rules:', e);
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'GET_DOMAINS':
      if (message.tabId) sendResponse([...(logs[message.tabId] || [])]);
      return true;
    case 'GET_TAB_STATISTICS':
      if (message.tabId) {
        const domains = logs[message.tabId] || new Set();
        const attempts = fingerprintingAttempts[message.tabId] || [];
        const threats = threatAttempts[message.tabId] || [];
        sendResponse({
          totalTrackers: domains.size,
          fingerprintingAttempts: attempts.length,
          threatAttempts: threats.length,
          blockedTrackers: [...domains].filter((d) => globalBlock.has(d)).length
        });
      }
      return true;
    case 'TOGGLE_GLOBAL':
      if (message.domain) {
        const willAdd = message.add !== null ? message.add : !globalBlock.has(message.domain);
        if (willAdd) globalBlock.add(message.domain); else globalBlock.delete(message.domain);
        chrome.storage.local.set({ globalBlock: [...globalBlock] });
        resetAndPushRules([...globalBlock], [...whitelist]);
        sendResponse([...globalBlock]);
      }
      return true;
    case 'SWITCH_PRIVACY_PROFILE':
      if (message.profile && privacyProfiles[message.profile]) {
        currentProfile = message.profile;
        chrome.storage.local.set({ currentProfile });
        sendResponse({ success: true, currentProfile });
      } else sendResponse({ success: false });
      return true;
    case 'GET_PRIVACY_PROFILES':
      sendResponse({ profiles: Object.keys(privacyProfiles), current: currentProfile, settings: privacyProfiles[currentProfile] });
      return true;
    case 'UPDATE_PROTECTION_CONFIG':
      if (message.config) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]?.id) chrome.tabs.sendMessage(tabs[0].id, message);
        });
      }
      sendResponse({ success: true });
      return true;
    case 'GET_THREAT_ATTEMPTS':
      sendResponse(message.tabId ? (threatAttempts[message.tabId] || []) : []);
      return true;
    case 'GET_FINGERPRINTING_ATTEMPTS':
      sendResponse(message.tabId ? (fingerprintingAttempts[message.tabId] || []) : []);
      return true;
    case 'GET_WHITELIST':
      sendResponse({ whitelist: [...whitelist] });
      return true;
    case 'ADD_TO_WHITELIST':
      if (message.domain) {
        whitelist.add(message.domain);
        chrome.storage.local.set({ whitelist: [...whitelist] });
        resetAndPushRules([...globalBlock], [...whitelist]);
        sendResponse({ success: true, whitelist: [...whitelist] });
      } else sendResponse({ success: false });
      return true;
    case 'REMOVE_FROM_WHITELIST':
      if (message.domain) {
        whitelist.delete(message.domain);
        chrome.storage.local.set({ whitelist: [...whitelist] });
        resetAndPushRules([...globalBlock], [...whitelist]);
        sendResponse({ success: true, whitelist: [...whitelist] });
      } else sendResponse({ success: false });
      return true;
    case 'SET_GLOBAL_BLOCKLIST':
      if (Array.isArray(message.domains)) {
        globalBlock = new Set(message.domains);
        chrome.storage.local.set({ globalBlock: [...globalBlock] });
        resetAndPushRules([...globalBlock], [...whitelist]);
        sendResponse({ success: true, blocklist: [...globalBlock] });
      } else sendResponse({ success: false });
      return true;
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  delete logs[tabId];
  delete fingerprintingAttempts[tabId];
  delete threatAttempts[tabId];
});

chrome.webNavigation.onCommitted.addListener((details) => {
  if (details.frameId === 0) {
    chrome.scripting.executeScript({ target: { tabId: details.tabId }, files: ['content-script.js'] }).catch(() => {});
  }
});

chrome.runtime.onStartup.addListener(initializeExtension);
chrome.runtime.onInstalled.addListener(initializeExtension);
initializeExtension();

