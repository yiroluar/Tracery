# Tracery

Tracery is a privacy-oriented browser extension that spots third‑party trackers in real time, lets you block them with one click, and scrambles common fingerprinting tricks without breaking every site you visit.


What it does:
- Detects third‑party requests on the current tab and shows who's calling home
- Blocks domains globally using dynamic rules (Manifest V3 declarativeNetRequest)
- Visualizes trackers as a simple graph so you can see the noisy ones fast
- Mitigates fingerprinting techniques in the page (canvas, WebGL, WebRTC, timing, screen size, battery)
- Offers privacy profiles and toggles for protection categories
- Stores everything locally, so nothing leaves your machine

How it works
1) Background service worker (background-simple.js)
- Listens to webRequest.onBeforeRequest and logs third‑party domains per tab
- Updates the toolbar badge with a live count (or fingerprinting alerts)
- Manages a global blocklist and pushes MV3 dynamic rules so matching resources are blocked across all sites
- Persists settings to chrome.storage.local and exposes a small message API to the UI

2) Content script (src/content/index.ts)
- Injected at document_start and applies anti‑fingerprinting shims:
  - Canvas: adds subtle noise on readouts
  - WebGL: normalizes vendor/renderer parameters
  - Screen: spoofs common resolutions (configurable)
  - User agent/platform/language: normalizes to common values
  - WebRTC: blocks data channels and denies getUserMedia
  - Timing: adds jitter to performance.now and Date
  - Battery API: disabled
- Reacts to config updates from the popup so you can turn protections on and off without reloading the page

3) Popup UI (Svelte + Tailwind)
- Lists detected third‑party domains with category and threat hints
- One‑click toggle to block/unblock a domain globally
- Graph view (d3) for a quick visual map of who's present and how risky they are
- Settings: pick a privacy profile, tweak protection toggles, manage a whitelist

4) Tracker database
- Ships as trackers.json and is loaded at runtime (also referenced in classifier fallbacks)
- Classification mixes direct matches with simple heuristics for common patterns (analytics/ads/social/fingerprinting/CDN, etc.)


(There are a lot of anti-trackers out there! Why creating a new one? what features does this have to make it stand out?)
- Real‑time, tab‑aware view: you see exactly what a page is doing rn, with a badge that reflects both tracker count and fingerprinting attempts.
- Practical defaults: balanced profile aims not to break the web while still blocking the loudest stuff.
- Visual context: a small graph that highlights high‑risk nodes quickly instead of long lists you'll never read.
- Transparent controls: every block is just a domain rule you can flip; no mystery scoring or cloud decisions.


Status: in progress
- Threat detection is stubbed (todo in background): threatAttempts is always 0 for now
- Presets in the toolbar are placeholders; only privacy profiles are wired
- “Block All” and Auto‑clean actions are not implemented yet
- Tracker DB is a starting point; classification still falls back to heuristics
- Background has both a TypeScript version (src/background/index.ts) and the runtime file used by MV3 (background-simple.js). The manifest currently uses the simple JS worker.
- Firefox: this repo targets MV3 Chromium for now

If you hit breakage on sites you care about, use the whitelist and/or switch to the minimal profile. File issues with the domain and we’ll tune the defaults.

Install from source
Requirements
- Node 18+
- npm

Steps
1) Install dependencies
   npm install

2) Build the extension
   npm run build
   This outputs the MV3 bundle into dist/ with the manifest, popup, background worker, content script, and assets.

3) Load in Chrome or Edge
- Visit chrome://extensions (or edge://extensions)
- Enable Developer mode
- Click “Load unpacked” and select the dist/ folder

4) Development loop
- Run a watch build
   npm run dev
- Keep the extension loaded from dist/ and hit the “Reload” button in chrome://extensions after changes. The UI reloads with hot builds (the service worker may need a manual restart)


Repo structure
- src/
  - background/
    - index.ts               TypeScript background (not used by MV3 build right now)
  - content/
    - index.ts               Anti‑fingerprinting protections
  - popup/
    - index.html, App.svelte UI entry + components
  - components/              Svelte components (TrackerList, TrackerGraph, Settings, etc.)
  - stores/                  Svelte stores for trackers, settings, UI
  - utils/                   chrome API wrapper, tracker classifier
  - types/                   shared TypeScript types
  - manifest.json            MV3 manifest used by the build
- background-simple.js       Service worker actually referenced by manifest
- trackers.json              Tracker data loaded at runtime
- vite.config.ts             Uses vite-plugin-web-extension to package MV3
- tailwind.config.js         Styling


About permisions:
- webRequest: observe outgoing requests to list third parties
- declarativeNetRequest: install dynamic blocking rules
- tabs, scripting, webNavigation: inject and manage the content script per tab
- storage: save preferences, profiles, and blocklist locally
- downloads: reserved for future export features
- Host permissions: <all_urls> so detection and protections can run everywhere


Privacy
- No telemetry. No remote calls. All data stays in chrome.storage.local
- The content script alters certain APIs to reduce entropy,it does not send data anywhere


Build notes and gotchas
- The manifest currently points to background-simple.js and content-script.js. The build produces these names and places them in dist/ for MV3.
- If you switch to the TypeScript background (src/background/index.ts), update src/manifest.json to use the generated background file name and ensure it's included in the build inputs.
- Icons are placeholders for now, feel free to swap icons/with your own sizes. Planning on using Iconify later on.


Contributing
Short, focused PRs are welcome.

(License?)
No license specified yet. 
