/* Sedjem Zid Custom Bundle (robust init) */
(function () {
  if (window.__SEDJEM_ZID_CUSTOM_BUNDLE__) return;
  window.__SEDJEM_ZID_CUSTOM_BUNDLE__ = "loaded_" + Date.now();

  // Runs fn now and also on future DOM changes (for Zid/PJAX/late sections)
  function watch(run) {
    run();
    var mo = new MutationObserver(function () { run(); });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  }

  // Safe: initialize swiper-container element if needed
  function ensureSwiper(el) {
    try {
      if (!el) return null;
      if (!el.swiper && typeof el.initialize === "function") el.initialize();
      return el.swiper || null;
    } catch (e) {
      return null;
    }
  }

  // =========
  // HERO FIX
  // =========
  (function () {
    var MIN = 640, MAX = 1023;
    var SEL =
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
        if (bp <= 1023) {
          bps[k] = bps[k] || {};
          bps[k].slidesPerView = 1;
          bps[k].spaceBetween = 1;
        }
      }
      bps[640] = bps[640] || {};
      bps[640].slidesPerView = 1;
      bps[640].spaceBetween = 1;
    }

    function patchSwiper(s) {
      if (!s || s.destroyed || !inTablet()) return;

      patchBps(s.params && s.params.breakpoints);
      patchBps(s.originalParams && s.originalParams.breakpoints);

      s.params.slidesPerView = 1;
      s.params.spaceBetween = 1;

      if (typeof s.setBreakpoint === "function") s.setBreakpoint();
      if (typeof s.update === "function") s.update();
    }

    function run() {
      if (!inTablet()) return;

      var els = document.querySelectorAll(SEL);
      for (var i = 0; i < els.length; i++) {
        var s = ensureSwiper(els[i]);
        if (s) patchSwiper(s);
      }
    }

    // Run on load + resize + DOM mutations (covers refresh timing + late init)
    window.addEventListener("pageshow", run);
    window.addEventListener("load", run);
    window.addEventListener("resize", function () { setTimeout(run, 150); });
    watch(function () { setTimeout(run, 50); });
  })();

  // ==========================
  // COLLECTIONS SPEED / AUTOPLAY
  // ==========================
  (function () {
    var SECTION_ID = "slider-with-background-image-15e9c1d4-155b-4592-90c3-181634cf6d66";

    function apply() {
      var section = document.querySelector('section[section-id="' + SECTION_ID + '"]');
      if (!section) return;

      var el =
        section.querySelector("swiper-container") ||
        section.querySelector("swiper-container-1");
      if (!el) return;

      var s = ensureSwiper(el);
      if (!s || s.destroyed) return;

      s.params.speed = 5000;
      s.params.autoplay = s.params.autoplay || {};
      s.params.autoplay.delay = 0;
      s.params.autoplay.disableOnInteraction = false;

      if (typeof s.update === "function") s.update();
      if (s.autoplay && typeof s.autoplay.start === "function") s.autoplay.start();
    }

    window.addEventListener("pageshow", apply);
    window.addEventListener("load", apply);
    watch(function () { setTimeout(apply, 50); });
  })();
})();
