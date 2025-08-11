import { writable } from 'svelte/store';

interface UIState {
  currentView: 'list' | 'graph';
  showBlocked: boolean;
  showSettings: boolean;
  selectedTracker: string | null;
  notifications: Array<{
    id: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    timestamp: number;
  }>;
}

const initialState: UIState = {
  currentView: 'list',
  showBlocked: false,
  showSettings: false,
  selectedTracker: null,
  notifications: []
};

export const uiStore = writable<UIState>(initialState);

export const uiActions = {
  setView(view: 'list' | 'graph') {
    uiStore.update(state => ({ ...state, currentView: view }));
    // save preference
    chrome.storage.local.set({ preferredView: view });
  },

  toggleBlocked() {
    uiStore.update(state => ({ ...state, showBlocked: !state.showBlocked }));
  },

  toggleSettings() {
    uiStore.update(state => ({ ...state, showSettings: !state.showSettings }));
  },

  selectTracker(trackerId: string | null) {
    uiStore.update(state => ({ ...state, selectedTracker: trackerId }));
  },

  showNotification(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
    const notification = {
      id: Date.now().toString(),
      message,
      type,
      timestamp: Date.now()
    };

    uiStore.update(state => ({
      ...state,
      notifications: [...state.notifications, notification]
    }));

    // auto-remove after 3 sec
    setTimeout(() => {
      uiStore.update(state => ({
        ...state,
        notifications: state.notifications.filter(n => n.id !== notification.id)
      }));
    }, 3000);
  },

  dismissNotification(id: string) {
    uiStore.update(state => ({
      ...state,
      notifications: state.notifications.filter(n => n.id !== id)
    }));
  },

  async initialize() {
    // load saved preferences
    const { preferredView } = await chrome.storage.local.get({ preferredView: 'list' });
    uiStore.update(state => ({ ...state, currentView: preferredView }));
  }
};