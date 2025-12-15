/* ======================================================
   zid-custom.js (Sedjem) — SPA Safe
   1) HERO slider fix (Tablet 640–1023)  ✅ (already works)
   2) COLLECTIONS slider continuous autoplay ✅ (fixed after navigation)
   3) URGENCY / STOCK under "رمز المنتج" ✅ (product.low_stock_quantity)
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

  /* ======================================================
     3) URGENCY / STOCK under "رمز المنتج" (.div-product-sku)
     Uses product.low_stock_quantity (Zid “Remaining Product Stock” field)
     Fallback: sum stocks.quantity / stocks.available_quantity
     ====================================================== */
  (function () {
    if (window.__SEDJEM_URGENCY_STOCK__) return;
    window.__SEDJEM_URGENCY_STOCK__ = true;

    var CFG = {
      boxId: "zid-urgency-stock",
      title: "المتبقي في المخزون",
      unit: "قطعة",
      threshold: 5,          // used only if we must fallback to stocks
      showOnlyWhenLow: true  // fallback only (low_stock_quantity is already “low”)
    };

    function getProductId() {
      var el = qs("#product-id");
      return el && el.value ? el.value : null;
    }

    function ensureBox() {
      var sku = qs(".div-product-sku");
      if (!sku) return null;

      var box = document.getElementById(CFG.boxId);
      if (!box) {
        box = document.createElement("div");
        box.id = CFG.boxId;
        box.className = "mt-4";
        box.style.display = "none";
        box.innerHTML = '<h4 class="product-title"></h4><div class="product-stock"></div>';
        sku.insertAdjacentElement("afterend", box);
      }
      return box;
    }

    function showBox(box, qty) {
      if (!box) return;

      var q = Math.max(0, Math.floor(qty || 0));
      if (!q) { box.style.display = "none"; return; }

      box.style.display = "";
      qs(".product-title", box).textContent = CFG.title;
      qs(".product-stock", box).textContent = q + (CFG.unit ? " " + CFG.unit : "");
    }

    function hideBox(box) {
      if (box) box.style.display = "none";
    }

    function hasZidSDK() {
      return !!(window.zid && zid.store && zid.store.product && typeof zid.store.product.get === "function");
    }

    function sumStocks(stocks) {
      if (!stocks || !stocks.length) return null;

      for (var i = 0; i < stocks.length; i++) {
        if (stocks[i] && stocks[i].is_infinite === true) return null;
      }

      var sum = 0;
      for (var j = 0; j < stocks.length; j++) {
        var s = stocks[j];
        if (!s) continue;

        // Zid stock objects differ: sometimes quantity, sometimes available_quantity
        var q = safeNum(s.available_quantity);
        if (q === null) q = safeNum(s.quantity);

        if (q !== null) sum += q;
      }

      return sum;
    }

    var lastPid = null;
    var lastFetchAt = 0;
    var cachedQty = null;

    function fetchAndRender(pid, box) {
      // prevent spamming
      var now = Date.now();
      if (pid === lastPid && (now - lastFetchAt) < 2500 && cachedQty !== null) {
        showBox(box, cachedQty);
        return;
      }
      if ((now - lastFetchAt) < 1500 && pid === lastPid) return;

      lastPid = pid;
      lastFetchAt = now;

      zid.store.product.get(pid).then(function (product) {
        // 1) Preferred: Remaining stock field
        var low = safeNum(product && product.low_stock_quantity);
        if (low !== null && low > 0) {
          cachedQty = low;
          showBox(box, low);
          return;
        }

        // 2) Fallback: sum stocks if exposed
        var sum = sumStocks(product && product.stocks);
        if (sum !== null && sum > 0) {
          // apply your threshold rule only for fallback
          if (CFG.showOnlyWhenLow && sum > CFG.threshold) {
            cachedQty = null;
            hideBox(box);
          } else {
            cachedQty = sum;
            showBox(box, sum);
          }
          return;
        }

        cachedQty = null;
        hideBox(box);
      }).catch(function () {
        cachedQty = null;
        hideBox(box);
      });
    }

    function render() {
      var box = ensureBox();
      if (!box) return;

      var pid = getProductId();
      if (!pid) { hideBox(box); return; }

      if (!hasZidSDK()) { hideBox(box); return; }

      fetchAndRender(pid, box);
    }

    function start() {
      // Product page content may render late after navigation
      runGuard(render, 30, 250);
    }

    // Debug helper
    window.__zidDebugStock = function () {
      console.log("[Stock] pid:", getProductId());
      console.log("[Stock] hasZidSDK:", hasZidSDK());
      start();
    };

    hookSPA(start);
  })();
})();
