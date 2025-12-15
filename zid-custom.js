/* HERO slider */
window.__HERO_MEDIA_SLIDER_FIX__ = "loaded_" + Date.now();

(function () {
  var MIN = 640;
  var MAX = 1023;

  // Support both Zid swiper tags
  var SEL =
    'section[section-id^="media-slider"] swiper-container,' +
    'section[section-id^="media-slider"] swiper-container-1';

  function inTablet() {
    var w = window.innerWidth || document.documentElement.clientWidth || 0;
    return (w - MIN) * (MAX - w) >= 0;
  }

  function patchBps(bps) {
    if (!bps) return;

    for (var k in bps) {
      if (!Object.prototype.hasOwnProperty.call(bps, k)) continue;
      var bp = Number(k);
      if (isNaN(bp)) continue;

      // Apply for breakpoints <= 1023
      if (1023 - bp >= 0) {
        if (!bps[k]) bps[k] = {};
        bps[k].slidesPerView = 1;
        bps[k].spaceBetween = 1;
      }
    }

    if (!bps[640]) bps[640] = {};
    bps[640].slidesPerView = 1;
    bps[640].spaceBetween = 1;
  }

  function patchSwiper(s) {
    if (!s || s.destroyed) return;
    if (!inTablet()) return;

    patchBps(s.params && s.params.breakpoints);
    patchBps(s.originalParams && s.originalParams.breakpoints);

    s.params.slidesPerView = 1;
    s.params.spaceBetween = 1;

    if (typeof s.setBreakpoint === "function") s.setBreakpoint();
    if (typeof s.update === "function") s.update();
  }

  function tick() {
    if (!inTablet()) return;

    var els = document.querySelectorAll(SEL);
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      try {
        if (!el.swiper && typeof el.initialize === "function") el.initialize();
        if (el.swiper) patchSwiper(el.swiper);
      } catch (e) {}
    }
  }

  function runGuard() {
    tick();
    var n = 0;
    var iv = setInterval(function () {
      tick();
      n++;
      if (n >= 30) clearInterval(iv);
    }, 120);
  }

  var t;
  window.addEventListener("load", runGuard);
  window.addEventListener("resize", function () {
    clearTimeout(t);
    t = setTimeout(runGuard, 180);
  });
  window.addEventListener("orientationchange", function () {
    setTimeout(runGuard, 250);
  });
})();

// Collections slider speed and delay
document.addEventListener("DOMContentLoaded", function () {
  var section = document.querySelector(
    'section[section-id="slider-with-background-image-15e9c1d4-155b-4592-90c3-181634cf6d66"]'
  );
  if (!section) return;

  // Support both Zid swiper tags
  var el = section.querySelector("swiper-container, swiper-container-1");
  if (!el) return;

  function apply() {
    try {
      if (!el.swiper && typeof el.initialize === "function") el.initialize();
      var s = el.swiper;
      if (!s || s.destroyed) return false;

      s.params.speed = 5000;

      // Ensure autoplay object exists
      if (!s.params.autoplay) s.params.autoplay = {};

      // No pause between slides
      s.params.autoplay.delay = 0;
      s.params.autoplay.disableOnInteraction = false;

      if (typeof s.update === "function") s.update();
      if (s.autoplay && typeof s.autoplay.start === "function") s.autoplay.start();

      return true;
    } catch (e) {
      return false;
    }
  }

  if (!apply()) {
    var i = 0;
    var iv = setInterval(function () {
      if (apply() || i++ > 20) clearInterval(iv);
    }, 250);
  }
});
