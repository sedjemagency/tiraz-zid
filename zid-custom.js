/* Sedjem Zid Custom Bundle */
(function () {
  if (window.__SEDJEM_ZID_CUSTOM_BUNDLE__) return;
  window.__SEDJEM_ZID_CUSTOM_BUNDLE__ = "loaded_" + Date.now();

  // ---------- helpers ----------
  function qsa(sel, root) { return (root || document).querySelectorAll(sel); }
  function inRange(min, max) {
    var w = window.innerWidth || document.documentElement.clientWidth || 0;
    return w >= min && w <= max;
  }

  function ensureSwiper(el) {
    try {
      if (!el) return null;
      if (!el.swiper && typeof el.initialize === "function") el.initialize();
      return el.swiper || null;
    } catch (_) { return null; }
  }

  function watch(run) {
    run();
    // rerun when Zid injects/changes sections
    var mo = new MutationObserver(function () { run(); });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  }

  function retry(run, ms, times) {
    var i = 0;
    var iv = setInterval(function () {
      run();
      if (++i >= times) clearInterval(iv);
    }, ms);
  }

  // ---------- HERO (640–1023) ----------
  (function () {
    var MIN = 640, MAX = 1023;
    var SEL =
      'section[section-id^="media-slider"] swiper-container,' +
      'section[section-id^="media-slider"] swiper-container-1';

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
      if (!s || s.destroyed) return;
      if (!inRange(MIN, MAX)) return;

      patchBps(s.params && s.params.breakpoints);
      patchBps(s.originalParams && s.originalParams.breakpoints);

      s.params.slidesPerView = 1;
      s.params.spaceBetween = 1;

      if (typeof s.setBreakpoint === "function") s.setBreakpoint();
      if (typeof s.update === "function") s.update();
    }

    function run() {
      if (!inRange(MIN, MAX)) return;

      var els = qsa(SEL);
      for (var i = 0; i < els.length; i++) {
        var s = ensureSwiper(els[i]);
        if (s) patchSwiper(s);
      }
    }

    // run immediately + keep reapplying (covers refresh + late init)
    window.addEventListener("pageshow", function () { retry(run, 150, 25); });
    window.addEventListener("load", function () { retry(run, 150, 25); });
    window.addEventListener("resize", function () { retry(run, 150, 10); });
    watch(function () { retry(run, 150, 10); });
  })();

})();
