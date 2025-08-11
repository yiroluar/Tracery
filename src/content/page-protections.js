(function(){
  try {
    const defaultConfig = {
      canvas: true,
      webgl: true,
      fonts: true,
      screen: true,
      webrtc: true,
      timing: true,
      userAgent: true,
      timezone: true
    };
    const cfg = Object.assign({}, defaultConfig, (window.__TRACERY_CONFIG || {}));

    function protectCanvas() {
      if (!cfg.canvas) return;
      try {
        const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
        const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;
        function addCanvasNoise(imageData) {
          const data = imageData.data;
          for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, data[i] + Math.floor(Math.random() * 3) - 1);
            data[i+1] = Math.min(255, data[i+1] + Math.floor(Math.random() * 3) - 1);
            data[i+2] = Math.min(255, data[i+2] + Math.floor(Math.random() * 3) - 1);
          }
          return imageData;
        }
        HTMLCanvasElement.prototype.toDataURL = function(){
          const ctx = this.getContext('2d');
          if (ctx) {
            const imageData = ctx.getImageData(0, 0, this.width, this.height);
            addCanvasNoise(imageData);
            ctx.putImageData(imageData, 0, 0);
          }
          return originalToDataURL.apply(this, arguments);
        };
        CanvasRenderingContext2D.prototype.getImageData = function(){
          const imageData = originalGetImageData.apply(this, arguments);
          return addCanvasNoise(imageData);
        };
      } catch (_) {}
    }

    function protectWebGL() {
      if (!cfg.webgl) return;
      try {
        const getParameter = WebGLRenderingContext.prototype.getParameter;
        WebGLRenderingContext.prototype.getParameter = function(parameter){
          switch(parameter){
            case this.VENDOR: return 'Intel Inc.';
            case this.RENDERER: return 'Intel Iris OpenGL Engine';
            case this.VERSION: return 'WebGL 1.0 (OpenGL ES 2.0 Chromium)';
            case this.SHADING_LANGUAGE_VERSION: return 'WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)';
            default: return getParameter.apply(this, [parameter]);
          }
        };
      } catch (_) {}
    }

    function protectScreen() {
      if (!cfg.screen) return;
      try {
        const common = [
          {width:1920,height:1080},
          {width:1366,height:768},
          {width:1440,height:900},
          {width:1536,height:864},
          {width:1280,height:720}
        ];
        const fake = common[Math.floor(Math.random()*common.length)];
        ['width','height','availWidth','availHeight'].forEach(function(prop){
          const desc = Object.getOwnPropertyDescriptor(screen, prop);
          if (!desc || desc.configurable) {
            Object.defineProperty(screen, prop, {
              get: function(){
                if (prop.includes('avail') && prop.includes('Height')) return fake.height - 40;
                if (prop.includes('avail') && prop.includes('Width')) return fake.width - 0;
                return fake[prop] || fake.width;
              },
              configurable: true
            });
          }
        });
      } catch(_) {}
    }

    function protectUserAgent(){
      if (!cfg.userAgent) return;
      try {
        const commonUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
        const navProps = [
          {prop:'userAgent', value: commonUA},
          {prop:'platform', value: 'Win32'},
          {prop:'languages', value: ['en-US','en']},
          {prop:'language', value: 'en-US'}
        ];
        navProps.forEach(function(p){
          const desc = Object.getOwnPropertyDescriptor(navigator, p.prop);
          if (!desc || desc.configurable) {
            Object.defineProperty(navigator, p.prop, { get: function(){ return p.value; }, configurable: true });
          }
        });
      } catch(_){}
    }

    function protectWebRTC(){
      if (!cfg.webrtc) return;
      try {
        if (window.RTCPeerConnection) {
          const Orig = window.RTCPeerConnection;
          window.RTCPeerConnection = function(){
            const pc = new Orig(...arguments);
            pc.createDataChannel = function(){ throw new Error('WebRTC data channels blocked for privacy'); };
            return pc;
          };
        }
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          navigator.mediaDevices.getUserMedia = function(){ return Promise.reject(new Error('Media access blocked for privacy')); };
        }
      } catch(_){}
    }

    function protectTiming(){
      if (!cfg.timing) return;
      try {
        const originalNow = performance.now;
        const originalGetTime = Date.prototype.getTime;
        let offset = Math.random()*10;
        performance.now = function(){ return Math.floor(originalNow.call(this) + offset); };
        Date.prototype.getTime = function(){ return Math.floor(originalGetTime.call(this) + offset); };
        setInterval(function(){ offset = Math.random()*10; }, 30000);
      } catch(_){}
    }

    function protectBattery(){
      try {
        if (navigator.getBattery) {
          navigator.getBattery = function(){ return Promise.reject(new Error('Battery API blocked for privacy')); };
        }
      } catch(_){}
    }

    function applyAll(){
      protectCanvas();
      protectWebGL();
      protectScreen();
      protectUserAgent();
      protectWebRTC();
      protectTiming();
      protectBattery();
    }

    applyAll();

    window.addEventListener('message', function(ev){
      if (ev && ev.data && ev.data.type === 'TRACERY_UPDATE_CONFIG') {
        Object.assign(cfg, ev.data.config || {});
        applyAll();
      }
    });
  } catch(_){}
})();
