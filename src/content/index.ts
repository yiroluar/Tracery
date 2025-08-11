// content script for anti-fingerprinting protection
(() => {
'use strict';

  // protection configuration defaults (content-side reference)
  const protectionConfig = {
    canvas: true,
    webgl: true,
    fonts: true,
    screen: true,
    webrtc: true,
    timing: true,
    userAgent: true,
    timezone: true
  };

// IMPORTANT: protections run in page context via injected script to avoid isolated world
  function injectPageProtections(initialConfig: any) {
    try {
      // set initial config on window for the injected script
      const configScript = document.createElement('script');
      configScript.textContent = `window.__TRACERY_CONFIG = ${JSON.stringify(initialConfig)};`;
      (document.documentElement || document.head || document.body).appendChild(configScript);
      configScript.remove();

      // inject the page-level protections script
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL('page-protections.js');
      script.async = false;
      (document.documentElement || document.head || document.body).appendChild(script);
    } catch (e) {
      // no-op
    }
  }

  function domainMatchesWhitelist(hostname: string, whitelist: string[]): boolean {
    return whitelist.some((d) => hostname === d || hostname.endsWith('.' + d));
  }
  function protectCanvas() {
    if (!protectionConfig.canvas) return;

    try {
      const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
      const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;

      // add noise to canvas data
      function addCanvasNoise(imageData: ImageData): ImageData {
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          // Add subtle random noise to RGB values
          data[i] = Math.min(255, data[i] + Math.floor(Math.random() * 3) - 1);
          data[i + 1] = Math.min(255, data[i + 1] + Math.floor(Math.random() * 3) - 1);
          data[i + 2] = Math.min(255, data[i + 2] + Math.floor(Math.random() * 3) - 1);
        }
        return imageData;
      }

      HTMLCanvasElement.prototype.toDataURL = function(...args: any[]) {
        const context = this.getContext('2d');
        if (context) {
          const imageData = context.getImageData(0, 0, this.width, this.height);
          addCanvasNoise(imageData);
          context.putImageData(imageData, 0, 0);
        }
        return originalToDataURL.apply(this, args);
      };

      CanvasRenderingContext2D.prototype.getImageData = function(...args: any[]) {
        const imageData = originalGetImageData.apply(this, args);
        return addCanvasNoise(imageData);
      };
    } catch (error) {
      console.warn('[Tracery] Canvas protection failed:', error);
    }
  }

  // webgl fingerprinting protection
  function protectWebGL() {
    if (!protectionConfig.webgl) return;

    try {
      const getParameter = WebGLRenderingContext.prototype.getParameter;

      WebGLRenderingContext.prototype.getParameter = function(parameter: GLenum) {
        // spoof common webgl parameters used for fingerprinting
        switch (parameter) {
          case this.VENDOR:
            return 'Intel Inc.';
          case this.RENDERER:
            return 'Intel Iris OpenGL Engine';
          case this.VERSION:
            return 'WebGL 1.0 (OpenGL ES 2.0 Chromium)';
          case this.SHADING_LANGUAGE_VERSION:
            return 'WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)';
          default:
            return getParameter.apply(this, [parameter]);
        }
      };
    } catch (error) {
      console.warn('[Tracery] WebGL protection failed:', error);
    }
  }

  // screen resolution spoofing
  function protectScreen() {
    if (!protectionConfig.screen) return;

    try {
      // common screen resolutions to blend in
      const commonResolutions = [
        { width: 1920, height: 1080 },
        { width: 1366, height: 768 },
        { width: 1440, height: 900 },
        { width: 1536, height: 864 },
        { width: 1280, height: 720 }
      ];

      const fakeResolution = commonResolutions[Math.floor(Math.random() * commonResolutions.length)];

      // check if properties are configurable before redefining
      const screenProps = ['width', 'height', 'availWidth', 'availHeight'];
      
      screenProps.forEach(prop => {
        const descriptor = Object.getOwnPropertyDescriptor(screen, prop);
        if (!descriptor || descriptor.configurable) {
          Object.defineProperty(screen, prop, {
            get: () => prop.includes('avail') && prop.includes('Height') 
              ? fakeResolution.height - 40 
              : fakeResolution[prop as keyof typeof fakeResolution] || fakeResolution.width,
            configurable: true
          });
        }
      });
    } catch (error) {
      console.warn('[Tracery] Screen protection already applied or failed:', error);
    }
  }

  // user agent normalization
  function protectUserAgent() {
    if (!protectionConfig.userAgent) return;

    try {
      const commonUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

      const navigatorProps = [
        { prop: 'userAgent', value: commonUA },
        { prop: 'platform', value: 'Win32' },
        { prop: 'languages', value: ['en-US', 'en'] },
        { prop: 'language', value: 'en-US' }
      ];

      navigatorProps.forEach(({ prop, value }) => {
        const descriptor = Object.getOwnPropertyDescriptor(navigator, prop);
        if (!descriptor || descriptor.configurable) {
          Object.defineProperty(navigator, prop, {
            get: () => value,
            configurable: true
          });
        }
      });
    } catch (error) {
      console.warn('[Tracery] User agent protection already applied or failed:', error);
    }
  }

  // webrtc ip leak protection
  function protectWebRTC() {
    if (!protectionConfig.webrtc) return;

    try {
      // block webrtc ip enumeration
      if (window.RTCPeerConnection) {
        const originalRTCPeerConnection = window.RTCPeerConnection;
        
        (window as any).RTCPeerConnection = function(...args: any[]) {
          const pc = new originalRTCPeerConnection(...args);
          
          // override createDataChannel to prevent IP leaks
          const originalCreateDataChannel = pc.createDataChannel;
          pc.createDataChannel = function() {
            throw new Error('WebRTC data channels blocked for privacy');
          };

          return pc;
        };
      }

      // block getUserMedia for privacy
      if (navigator.mediaDevices?.getUserMedia) {
        navigator.mediaDevices.getUserMedia = function() {
          return Promise.reject(new Error('Media access blocked for privacy'));
        };
      }
    } catch (error) {
      console.warn('[Tracery] WebRTC protection failed:', error);
    }
  }

  // timing attack prevention
  function protectTiming() {
    if (!protectionConfig.timing) return;

    try {
      const originalNow = performance.now;
      const originalGetTime = Date.prototype.getTime;
      let timeOffset = Math.random() * 10;

      // add random delays to timing functions
      performance.now = function() {
        return Math.floor(originalNow.call(this) + timeOffset);
      };

      Date.prototype.getTime = function() {
        return Math.floor(originalGetTime.call(this) + timeOffset);
      };

      // periodically change the offset
      setInterval(() => {
        timeOffset = Math.random() * 10;
      }, 30000);
    } catch (error) {
      console.warn('[Tracery] Timing protection failed:', error);
    }
  }

  // battery api blocking
  function protectBattery() {
    try {
      if ((navigator as any).getBattery) {
        (navigator as any).getBattery = function() {
          return Promise.reject(new Error('Battery API blocked for privacy'));
        };
      }
    } catch (error) {
      console.warn('[Tracery] Battery protection failed:', error);
    }
  }

  // initialize protections by injecting into the page context if not whitelisted
  async function initializeProtections() {
    try {
      const { whitelist = [], canvasProtection = true, webglProtection = true, fontProtection = true, screenProtection = true, webrtcProtection = true, timingProtection = true } = await chrome.storage.local.get([
        'whitelist',
        'canvasProtection',
        'webglProtection',
        'fontProtection',
        'screenProtection',
        'webrtcProtection',
        'timingProtection'
      ] as any);

      const host = location.hostname;
      if (domainMatchesWhitelist(host, whitelist || [])) {
        console.log('[Tracery] Protections disabled on whitelisted site:', host);
        return;
      }

      const initialConfig = {
        canvas: canvasProtection,
        webgl: webglProtection,
        fonts: fontProtection,
        screen: screenProtection,
        webrtc: webrtcProtection,
        timing: timingProtection,
        userAgent: true,
        timezone: true
      };
      injectPageProtections(initialConfig);
      console.log('[Tracery] Anti-fingerprinting protections injected');
    } catch (error) {
      console.warn('[Tracery] Some protections failed to initialize:', error);
    }
  }

  // listen for configuration updates from popup -> forward to page script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'UPDATE_PROTECTION_CONFIG') {
      try {
        window.postMessage({ type: 'TRACERY_UPDATE_CONFIG', config: message.config }, '*');
      } catch (_) {}
      sendResponse({ success: true });
    }
  });

  // initialize protections
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeProtections);
  } else {
    initializeProtections();
  }
})();