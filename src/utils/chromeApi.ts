import type { ChromeMessage, ChromeResponse, TabStatistics } from '@types/chrome';

export const chromeApi = {
  async getDomains(tabId: number): Promise<string[]> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { type: 'GET_DOMAINS', tabId } as ChromeMessage,
        (response) => resolve(response || [])
      );
    });
  },

  async getBlocklist(): Promise<string[]> {
    const { globalBlock } = await chrome.storage.local.get({ globalBlock: [] });
    return globalBlock;
  },

  async getStatistics(tabId: number): Promise<TabStatistics> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { type: 'GET_TAB_STATISTICS', tabId } as ChromeMessage,
        (response) => resolve(response || {
          totalTrackers: 0,
          fingerprintingAttempts: 0,
          threatAttempts: 0,
          blockedTrackers: 0
        })
      );
    });
  },

  async toggleGlobal(domain: string): Promise<string[]> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { type: 'TOGGLE_GLOBAL', domain, add: null } as ChromeMessage,
        (response) => resolve(response || [])
      );
    });
  },

  async switchPrivacyProfile(profile: string): Promise<ChromeResponse> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { type: 'SWITCH_PRIVACY_PROFILE', profile } as ChromeMessage,
        (response) => resolve(response || { success: false })
      );
    });
  },

  async getPrivacyProfiles(): Promise<ChromeResponse> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { type: 'GET_PRIVACY_PROFILES' } as ChromeMessage,
        (response) => resolve(response || {})
      );
    });
  },

  async updateProtectionConfig(config: Record<string, boolean>): Promise<void> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { type: 'UPDATE_PROTECTION_CONFIG', config } as ChromeMessage,
        () => resolve()
      );
    });
  },

  async getFingerprintingAttempts(tabId: number): Promise<any[]> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { type: 'GET_FINGERPRINTING_ATTEMPTS', tabId } as ChromeMessage,
        (response) => resolve(response || [])
      );
    });
  },

  async getThreatAttempts(tabId: number): Promise<any[]> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { type: 'GET_THREAT_ATTEMPTS', tabId } as ChromeMessage,
        (response) => resolve(response || [])
      );
    });
  },

  async getWhitelist(): Promise<string[]> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { type: 'GET_WHITELIST' } as ChromeMessage,
        (response) => resolve(response?.whitelist || [])
      );
    });
  },

  async addToWhitelist(domain: string): Promise<string[]> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { type: 'ADD_TO_WHITELIST', domain } as ChromeMessage,
        (response) => resolve(response?.whitelist || [])
      );
    });
  },

  async removeFromWhitelist(domain: string): Promise<string[]> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { type: 'REMOVE_FROM_WHITELIST', domain } as ChromeMessage,
        (response) => resolve(response?.whitelist || [])
      );
    });
  },

  async setGlobalBlocklist(domains: string[]): Promise<string[]> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { type: 'SET_GLOBAL_BLOCKLIST', domains } as ChromeMessage,
        (response) => resolve(response?.blocklist || [])
      );
    });
  }
};