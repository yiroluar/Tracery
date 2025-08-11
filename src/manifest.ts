import type { Manifest } from 'webextension-polyfill';

const manifest: Manifest.WebExtensionManifest = {
  name: 'Tracery',
  description: 'Advanced privacy protection with anti-fingerprinting, real-time monitoring, and comprehensive tracker blocking.',
  version: '2.1.0',
  manifest_version: 3,
  icons: {
    16: 'icons/16.png',
    32: 'icons/32.png',
    48: 'icons/48.png',
    128: 'icons/128.png'
  },
  action: {
    default_popup: 'popup.html'
  },
  permissions: [
    'webRequest',
    'storage',
    'declarativeNetRequest',
    'tabs',
    'scripting',
    'webNavigation',
    'downloads'
  ],
  host_permissions: ['<all_urls>'],
  background: {
    service_worker: 'background.js'
  },
  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['content-script.js'],
      run_at: 'document_start',
      all_frames: false
    }
  ],
  web_accessible_resources: [
    {
      resources: ['trackers.json'],
      matches: ['<all_urls>']
    }
  ]
};

export default manifest;