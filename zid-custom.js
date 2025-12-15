/* ======================================================
   1) HERO slider fix (Tablet 640–1023)
   2) COLLECTIONS slider continuous autoplay
   ====================================================== */

(function () {
  if (window.__SEDJEM_ZID_CUSTOM_BUNDLE__) return;
  window.__SEDJEM_ZID_CUSTOM_BUNDLE__ = "loaded_" + Date.now();

  /* -----------------------------
     Helpers
  ----------------------------- */
  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return (root || document).querySelectorAll(sel); }
  function safeNum(x) { var n = Number(x); return isFinite(n) ? n : null; }

  function debounce(fn, wait) {
    var t;
    return function () {
      clearTimeout(t);
      var args = arguments;
      t = setTimeout(function () { fn.apply(null, args); }, wait);
    };
  }

  // SPA navigation hooks (covers Zid “navigate then back”)
  function hookSPA(onChange) {
    var fire = debounce(onChange, 120);

    // history hooks
    try {
      var _push = history.pushState;
      history.pushState = function () { var r = _push.apply(this, arguments); fire(); return r; };

      var _replace = history.replaceState;
      history.replaceState = function () { var r = _replace.apply(this, arguments); fire(); return r; };

      window.addEventListener("popstate", fire);
    } catch (e) {}

    // URL polling (some routers don’t use history methods consistently)
    var lastHref = location.href;
    setInterval(function () {
      if (location.href !== lastHref) {
        lastHref = location.href;
        fire();
      }
    }, 300);

    // DOM swaps
    if (window.MutationObserver) {
      try {
        var mo = new MutationObserver(fire);
        mo.observe(document.documentElement, { childList: true, subtree: true });
      } catch (e) {}
    }

    // first run
    fire();
  }

  function runGuard(fn, times, step) {
    fn();
    var n = 0;
    var iv = setInterval(function () {
      fn();
      n++;
      if (n >= times) clearInterval(iv);
    }, step);
  }

  /* ======================================================
     1) HERO SLIDER FIX (Tablet 640–1023)
     ====================================================== */
  (function () {
    if (window.__HERO_MEDIA_SLIDER_FIX__) return;
    window.__HERO_MEDIA_SLIDER_FIX__ = "loaded_" + Date.now();

    var MIN = 640;
    var MAX = 1023;

    var HERO_SEL =
      'section[section-id^="media-slider"] swiper-container,' +
      'section[section-id^="media-slider"] swiper-container-1';

    function inTablet() {
      var w = window.innerWidth || document.documentElement.clientWidth || 0;
      return w >= MIN && w <= MAX;
    }

    function patchBps(bps) {
      if (!bps) return;
      for (var k in bps) {
        if (!Object.prototype.hasOwnProperty.call(bps, k)) continue;
        var bp = Number(k);
        if (isNaN(bp)) continue;
        if (bp <= MAX) {
          bps[k] = bps[k] || {};
          bps[k].slidesPerView = 1;
          bps[k].spaceBetween = 1;
        }
      }
      bps[MIN] = bps[MIN] || {};
      bps[MIN].slidesPerView = 1;
      bps[MIN].spaceBetween = 1;
    }

    function patchSwiper(sw) {
      if (!sw || sw.destroyed) return;
      if (!inTablet()) return;

      try {
        patchBps(sw.params && sw.params.breakpoints);
        patchBps(sw.originalParams && sw.originalParams.breakpoints);

        sw.params.slidesPerView = 1;
        sw.params.spaceBetween = 1;

        if (typeof sw.setBreakpoint === "function") sw.setBreakpoint();
        if (typeof sw.update === "function") sw.update();
      } catch (e) {}
    }

    function ensureHero() {
      if (!inTablet()) return;

      var els = qsa(HERO_SEL);
      for (var i = 0; i < els.length; i++) {
        var el = els[i];
        try {
          if (!el.swiper && typeof el.initialize === "function") el.initialize();
          if (el.swiper) patchSwiper(el.swiper);
        } catch (e) {}
      }
    }

    function start() { runGuard(ensureHero, 30, 200); }

    window.addEventListener("resize", debounce(start, 150));
    window.addEventListener("orientationchange", function () { setTimeout(start, 250); });
    hookSPA(start);
  })();

  /* ======================================================
     2) COLLECTIONS SLIDER (Speed + Continuous Autoplay)
     FIX: don’t depend on the GUID section-id
     Target: any section-id starting with "slider-with-background-image"
     ====================================================== */
  (function () {
    if (window.__SEDJEM_COLLECTIONS_FIX__) return;
    window.__SEDJEM_COLLECTIONS_FIX__ = true;

    // Targets ALL “slider-with-background-image-*” sections (home sliders)
    var COL_SEL =
      'section[section-id^="slider-with-background-image"] swiper-container,' +
      'section[section-id^="slider-with-background-image"] swiper-container-1';

    function patchCollections(sw) {
      if (!sw || sw.destroyed) return;

      try {
        // Force continuous autoplay
        sw.params.speed = 5000;

        sw.params.autoplay = sw.params.autoplay || {};
        sw.params.autoplay.delay = 0;
        sw.params.autoplay.disableOnInteraction = false;

        if (typeof sw.update === "function") sw.update();
        if (sw.autoplay && typeof sw.autoplay.start === "function") sw.autoplay.start();
      } catch (e) {}
    }

    function ensureCollections() {
      var els = qsa(COL_SEL);
      if (!els || !els.length) return;

      for (var i = 0; i < els.length; i++) {
        var el = els[i];
        try {
          if (!el.swiper && typeof el.initialize === "function") el.initialize();
          if (el.swiper) patchCollections(el.swiper);
        } catch (e) {}
      }
    }

    function start() {
      // IMPORTANT: after navigating back to home, Zid recreates swipers later,
      // so we must retry for a few seconds.
      runGuard(ensureCollections, 40, 250);
    }

    hookSPA(start);
  })();
})();

