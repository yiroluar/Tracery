import type { TrackerDatabase } from '@types/tracker';

export const trackerClassifier = {
  database: null as TrackerDatabase | null,

  async loadDatabase(): Promise<TrackerDatabase> {
    if (this.database) return this.database;

    try {
      const response = await fetch(chrome.runtime.getURL('trackers.json'));
      this.database = await response.json();
      return this.database;
    } catch (error) {
      console.error('[Tracery] Failed to load tracker database:', error);
      // return fallback db
      this.database = { trackers: {}, categories: {} };
      return this.database;
    }
  },

  classifyTracker(domain: string, database?: TrackerDatabase | null): string {
    const db = database || this.database;
    if (!db) return 'other';

    // direct match
    if (db.trackers[domain]) {
      return db.trackers[domain].category;
    }

    // pattern matching for subdomains
    for (const [trackerDomain, info] of Object.entries(db.trackers)) {
      if (domain.includes(trackerDomain) || trackerDomain.includes(domain)) {
        return info.category;
      }
    }

    // Fallback pattern matching
    const patterns = {
      analytics: ['analytics', 'tracking', 'stats', 'metrics', 'insights'],
      advertising: ['ads', 'doubleclick', 'adsystem', 'adnxs', 'adsense'],
      social: ['facebook', 'twitter', 'linkedin', 'pinterest', 'instagram'],
      fingerprinting: ['fingerprint', 'captcha', 'recaptcha', 'maxmind'],
      cdn: ['cdn', 'cloudflare', 'amazonaws', 'gstatic']
    };

    for (const [category, keywords] of Object.entries(patterns)) {
      if (keywords.some(keyword => domain.toLowerCase().includes(keyword))) {
        return category;
      }
    }

    return 'other';
  },

  assessThreatLevel(domain: string, database?: TrackerDatabase | null): string {
    const db = database || this.database;
    if (!db) return 'low';

    // direct match
    if (db.trackers[domain]) {
      return db.trackers[domain].threatLevel;
    }

    // pattern matching for subdomains
    for (const [trackerDomain, info] of Object.entries(db.trackers)) {
      if (domain.includes(trackerDomain) || trackerDomain.includes(domain)) {
        return info.threatLevel;
      }
    }

    // category-based default threat level
    const category = this.classifyTracker(domain, db);
    if (db.categories[category]) {
      return db.categories[category].defaultThreatLevel;
    }

    return 'low';
  },

  getTrackerInfo(domain: string, database?: TrackerDatabase | null) {
    const db = database || this.database;
    if (!db) return null;

    // direct match
    if (db.trackers[domain]) {
      return db.trackers[domain];
    }

    // pattern matching for subdomains
    for (const [trackerDomain, info] of Object.entries(db.trackers)) {
      if (domain.includes(trackerDomain) || trackerDomain.includes(domain)) {
        return info;
      }
    }

    return null;
  }
};