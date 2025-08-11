export interface ChromeMessage {
  type: string;
  tabId?: number;
  domain?: string;
  add?: boolean;
  profile?: string;
  config?: Record<string, boolean>;
  method?: string;
  details?: string;
  url?: string;
  timestamp?: number;
}

export interface ChromeResponse {
  success?: boolean;
  currentProfile?: string;
  profiles?: string[];
  current?: string;
  settings?: Record<string, boolean>;
}

export interface StorageData {
  globalBlock?: string[];
  whitelist?: string[];
  currentProfile?: string;
  canvasProtection?: boolean;
  webglProtection?: boolean;
  fontProtection?: boolean;
  screenProtection?: boolean;
  webrtcProtection?: boolean;
  timingProtection?: boolean;
  blockAdvertising?: boolean;
  blockAnalytics?: boolean;
  blockSocial?: boolean;
  blockFingerprinting?: boolean;
  allowCDN?: boolean;
  preferredView?: string;
  splitterRatio?: number;
}