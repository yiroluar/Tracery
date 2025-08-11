import { writable } from 'svelte/store';
import type { PrivacyProfile } from '@types/tracker';
import { chromeApi } from '@utils/chromeApi';

interface SettingsState {
  currentProfile: string;
  profiles: Record<string, PrivacyProfile>;
  protectionSettings: {
    canvasProtection: boolean;
    webglProtection: boolean;
    fontProtection: boolean;
    screenProtection: boolean;
    webrtcProtection: boolean;
    timingProtection: boolean;
  };
  blockingSettings: {
    blockAdvertising: boolean;
    blockAnalytics: boolean;
    blockSocial: boolean;
    blockFingerprinting: boolean;
    allowCDN: boolean;
  };
  whitelist: string[];
}

const initialState: SettingsState = {
  currentProfile: 'balanced',
  profiles: {
    minimal: {
      name: 'Minimal',
      blockAdvertising: true,
      blockAnalytics: false,
      blockSocial: false,
      blockFingerprinting: true,
      allowCDN: true
    },
    balanced: {
      name: 'Balanced',
      blockAdvertising: true,
      blockAnalytics: true,
      blockSocial: false,
      blockFingerprinting: true,
      allowCDN: true
    },
    strict: {
      name: 'Strict',
      blockAdvertising: true,
      blockAnalytics: true,
      blockSocial: true,
      blockFingerprinting: true,
      allowCDN: false
    }
  },
  protectionSettings: {
    canvasProtection: true,
    webglProtection: true,
    fontProtection: true,
    screenProtection: true,
    webrtcProtection: true,
    timingProtection: true
  },
  blockingSettings: {
    blockAdvertising: true,
    blockAnalytics: false,
    blockSocial: false,
    blockFingerprinting: true,
    allowCDN: true
  },
  whitelist: []
};

export const settingsStore = writable<SettingsState>(initialState);

export const settingsActions = {
  async initialize() {
    try {
      const data = await chrome.storage.local.get([
        'currentProfile',
        'canvasProtection',
        'webglProtection',
        'fontProtection',
        'screenProtection',
        'webrtcProtection',
        'timingProtection',
        'blockAdvertising',
        'blockAnalytics',
        'blockSocial',
        'blockFingerprinting',
        'allowCDN',
        'whitelist'
      ]);

      settingsStore.update(state => ({
        ...state,
        currentProfile: data.currentProfile || 'balanced',
        protectionSettings: {
          canvasProtection: data.canvasProtection ?? true,
          webglProtection: data.webglProtection ?? true,
          fontProtection: data.fontProtection ?? true,
          screenProtection: data.screenProtection ?? true,
          webrtcProtection: data.webrtcProtection ?? true,
          timingProtection: data.timingProtection ?? true
        },
        blockingSettings: {
          blockAdvertising: data.blockAdvertising ?? true,
          blockAnalytics: data.blockAnalytics ?? false,
          blockSocial: data.blockSocial ?? false,
          blockFingerprinting: data.blockFingerprinting ?? true,
          allowCDN: data.allowCDN ?? true
        },
        whitelist: data.whitelist || []
      }));

    } catch (error) {
      console.error('[Tracery] Failed to load settings:', error);
    }
  },

  async switchProfile(profileName: string) {
    try {
      const result = await chromeApi.switchPrivacyProfile(profileName);
      if (result.success) {
        settingsStore.update(state => ({
          ...state,
          currentProfile: profileName
        }));
      }
    } catch (error) {
      console.error('[Tracery] Failed to switch profile:', error);
    }
  },

  async updateProtectionSettings(settings: Partial<SettingsState['protectionSettings']>) {
    try {
      await chrome.storage.local.set(settings);
      
      settingsStore.update(state => ({
        ...state,
        protectionSettings: { ...state.protectionSettings, ...settings }
      }));

      // update content script
      await chromeApi.updateProtectionConfig(settings);
      
    } catch (error) {
      console.error('[Tracery] Failed to update protection settings:', error);
    }
  },

  async updateBlockingSettings(settings: Partial<SettingsState['blockingSettings']>) {
    try {
      await chrome.storage.local.set(settings);
      
      settingsStore.update(state => ({
        ...state,
        blockingSettings: { ...state.blockingSettings, ...settings }
      }));
      
    } catch (error) {
      console.error('[Tracery] Failed to update blocking settings:', error);
    }
  },

  async addToWhitelist(domain: string) {
    try {
      settingsStore.update(state => {
        const newWhitelist = [...state.whitelist, domain];
        chrome.storage.local.set({ whitelist: newWhitelist });
        return { ...state, whitelist: newWhitelist };
      });
    } catch (error) {
      console.error('[Tracery] Failed to add to whitelist:', error);
    }
  },

  async removeFromWhitelist(domain: string) {
    try {
      settingsStore.update(state => {
        const newWhitelist = state.whitelist.filter(d => d !== domain);
        chrome.storage.local.set({ whitelist: newWhitelist });
        return { ...state, whitelist: newWhitelist };
      });
    } catch (error) {
      console.error('[Tracery] Failed to remove from whitelist:', error);
    }
  }
};