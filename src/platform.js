(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TidePlatform = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function browser(canvas) {
    let onResize = function () {}, audio = null;
    const p = {
      canvas, kind: 'browser',
      size() { const r = canvas.getBoundingClientRect(); return { width: r.width, height: r.height, ratio: Math.min(window.devicePixelRatio || 1, 2), top: 0, bottom: 0 }; },
      read(key) { return localStorage.getItem(key); },
      write(key, value) { localStorage.setItem(key, value); },
      remove(key) { localStorage.removeItem(key); },
      loadImage(src) { return new Promise((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = () => reject(new Error('Image unavailable: ' + src)); img.src = src; }); },
      frame(fn) { return requestAnimationFrame(fn); },
      onResize(fn) { onResize = fn; window.addEventListener('resize', fn); if (window.ResizeObserver) new ResizeObserver(() => onResize()).observe(canvas); },
      onPointer(fn) {
        canvas.addEventListener('pointerup', e => { const r = canvas.getBoundingClientRect(); fn(e.clientX - r.left, e.clientY - r.top); });
      },
      onGesture(fn) {
        let pointer=null;
        for(const kind of ['pointerdown','pointermove','pointerup','pointercancel'])canvas.addEventListener(kind,e=>{
          if(kind==='pointerdown'){if(pointer!==null)return;pointer=e.pointerId;canvas.setPointerCapture(e.pointerId);}
          if(e.pointerId!==pointer)return;
          const r=canvas.getBoundingClientRect();fn({phase:{pointerdown:'start',pointermove:'move',pointerup:'end',pointercancel:'cancel'}[kind],x:e.clientX-r.left,y:e.clientY-r.top});
          if(kind==='pointerup'||kind==='pointercancel')pointer=null;
        });
      },
      sound(kind) {
        try {const A=window.AudioContext||window.webkitAudioContext;if(!A)return;audio=audio||new A();audio.resume().catch(()=>{});const o=audio.createOscillator(),g=audio.createGain();o.connect(g);g.connect(audio.destination);o.type='sine';o.frequency.setValueAtTime(kind==='feed'?210:kind==='story'?640:kind==='salvage'?340:480,audio.currentTime);o.frequency.exponentialRampToValueAtTime(780,audio.currentTime+.12);g.gain.setValueAtTime(.035,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.2);o.start();o.stop(audio.currentTime+.21);}catch(_){}
      },
      exportPhoto() { return new Promise((resolve,reject)=>{canvas.toBlob(blob=>{if(!blob)return reject(new Error('图片生成失败'));const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='这片海我包了-家园合影.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);resolve();},'image/png');}); },
      onHide(fn) { document.addEventListener('visibilitychange', () => { if (document.hidden) fn(); }); window.addEventListener('pagehide', fn); },
      onShow(fn) { document.addEventListener('visibilitychange', () => { if (!document.hidden) fn(); }); },
      reducedMotion: !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches),
      vibrate() {},
      now() { return Date.now(); }
    };
    return p;
  }
  function wechat() {
    const canvas = wx.createCanvas();
    function info() { return typeof wx.getWindowInfo === 'function' ? wx.getWindowInfo() : wx.getSystemInfoSync(); }
    return {
      canvas, kind: 'wechat',
      size() {
        const i = info();
        let top = (i.safeArea ? i.safeArea.top : 0) + 48;
        // Keep the entire game below WeChat's native menu capsule.
        if (typeof wx.getMenuButtonBoundingClientRect === 'function') {
          try { const menu = wx.getMenuButtonBoundingClientRect(); if (menu && Number.isFinite(menu.bottom) && menu.bottom > 0 && menu.bottom < i.windowHeight / 2) top = Math.max(top, menu.bottom + 8); } catch (_) {}
        }
        return { width: i.windowWidth, height: i.windowHeight, ratio: Math.min(i.pixelRatio || 1, 2), top, bottom: i.safeArea ? Math.max(0, i.windowHeight - i.safeArea.bottom) : 0 };
      },
      read(key) { return wx.getStorageSync(key) || null; },
      write(key, value) { wx.setStorageSync(key, value); },
      remove(key) { wx.removeStorageSync(key); },
      loadImage(src) { return new Promise((resolve, reject) => { const img = wx.createImage(); img.onload = () => resolve(img); img.onerror = () => reject(new Error('Image unavailable: ' + src)); img.src = src; }); },
      frame(fn) { return requestAnimationFrame(fn); },
      onResize(fn) { if (wx.onWindowResize) wx.onWindowResize(fn); },
      onPointer(fn) { wx.onTouchEnd(e => { const t = e.changedTouches[0]; if (t) fn(t.clientX, t.clientY); }); },
      onGesture: wx.onTouchStart && wx.onTouchMove ? function(fn) {
        let id=null;
        wx.onTouchStart(e=>{if(id!==null)return;const t=e.changedTouches[0];if(t){id=t.identifier;fn({phase:'start',x:t.clientX,y:t.clientY});}});
        const send=(phase,e)=>{const t=e.changedTouches.find(t=>t.identifier===id);if(t){fn({phase,x:t.clientX,y:t.clientY});if(phase==='end'||phase==='cancel')id=null;}};
        wx.onTouchMove(e=>send('move',e));wx.onTouchEnd(e=>send('end',e));if(wx.onTouchCancel)wx.onTouchCancel(e=>send('cancel',e));
      } : null,
      exportPhoto() { return new Promise((resolve,reject)=>{if(!canvas.toTempFilePath)return reject(new Error('当前微信版本不支持照片导出'));canvas.toTempFilePath({success:r=>wx.saveImageToPhotosAlbum({filePath:r.tempFilePath,success:resolve,fail:()=>reject(new Error('未保存：请检查相册权限'))}),fail:()=>reject(new Error('图片生成失败'))});}); },
      onHide(fn) { wx.onHide(fn); }, onShow(fn) { wx.onShow(fn); },
      reducedMotion: false,
      vibrate() { if (wx.vibrateShort) wx.vibrateShort({ type: 'light', fail() {} }); },
      now() { return Date.now(); }
    };
  }
  return { browser, wechat };
});
