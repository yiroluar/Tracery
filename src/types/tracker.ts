export interface TrackerInfo {
  category: 'advertising' | 'analytics' | 'social' | 'fingerprinting' | 'cdn' | 'unknown';
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  company?: string;
  description: string;
  fingerprintingMethods: string[];
  dataCollection: {
    personalInfo: boolean;
    behavioralData: boolean;
    deviceFingerprinting: boolean;
    locationTracking: boolean;
  };
}

export interface TrackerNode {
  id: string;
  blocked: boolean;
  category: string;
  threatLevel: string;
  fingerprintingMethods: string[];
  dataCollection: Record<string, boolean>;
  description: string;
  fingerprintingAttempts: FingerprintingAttempt[];
}

export interface FingerprintingAttempt {
  method: string;
  details?: string;
  url: string;
  timestamp: number;
}

export interface ThreatAttempt {
  domain: string;
  url: string;
  type: string;
  threat: {
    score: number;
    level: string;
    indicators: string[];
  };
  timestamp: number;
}

export interface PrivacyProfile {
  name: string;
  blockAdvertising: boolean;
  blockAnalytics: boolean;
  blockSocial: boolean;
  blockFingerprinting: boolean;
  allowCDN: boolean;
}

export interface TabStatistics {
  totalTrackers: number;
  fingerprintingAttempts: number;
  threatAttempts: number;
  blockedTrackers: number;
}

export interface TrackerDatabase {
  trackers: Record<string, TrackerInfo>;
  categories: Record<string, {
    description: string;
    defaultThreatLevel: string;
    commonMethods: string[];
  }>;
}