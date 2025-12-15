/* ======================================================
   zid-custom.js (Sedjem)
   SPA-safe (works after navigating then coming back)
   - HERO slider fix (Tablet 640–1023)
   - Collections slider: continuous autoplay + speed (always re-applies)
   - URGENCY / STOCK under "رمز المنتج" using product.low_stock_quantity
   ====================================================== */

(function () {
  if (window.__SEDJEM_ZID_CUSTOM_BUNDLE__) return;
  window.__SEDJEM_ZID_CUSTOM_BUNDLE__ = "loaded_" + Date.now();

  /* -----------------------------
     Helpers
  ----------------------------- */
  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }
  function qsa(sel, root) {
    return (root || document).querySelectorAll(sel);
  }
  function safeNum(x) {
    var n = Number(x);
    return isFinite(n) ? n : null;
  }
  function debounce(fn, wait) {
    var t;
    return function () {
      clearTimeout(t);
      var args = arguments;
      t = setTimeout(function () { fn.apply(null, args); }, wait);
    };
  }

  // SPA navigation hooks (Zid-like)
  function hookNavigation(onChange) {
    var fire = debounce(onChange, 120);

    // history changes
    try {
      var _push = history.pushState;
      history.pushState = function () {
        var r = _push.apply(this, arguments);
        fire();
        return r;
      };
      var _replace = history.replaceState;
      history.replaceState = function () {
        var r = _replace.apply(this, arguments);
        fire();
        return r;
      };
      window.addEventListener("popstate", fire);
    } catch (e) {}

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

  /* ======================================================
     START: HERO SLIDER FIX (Tablet 640–1023)
     ====================================================== */
  (function () {
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

    // IMPORTANT: keep re-applying (Zid SPA resets sliders)
    function start() {
      ensureHero();
      clearInterval(start.__iv);
      start.__iv = setInterval(ensureHero, 350);
    }

    window.addEventListener("resize", debounce(start, 150));
    window.addEventListener("orientationchange", function () { setTimeout(start, 250); });

    hookNavigation(start);
  })();
  /* ======================================================
     END: HERO SLIDER FIX
     ====================================================== */

  /* ======================================================
     START: COLLECTIONS SLIDER (Speed + Continuous Autoplay)
     ====================================================== */
  (function () {
    var SECTION_ID = "slider-with-background-image-15e9c1d4-155b-4592-90c3-181634cf6d66";

    function getEl() {
      var section = qs('section[section-id="' + SECTION_ID + '"]');
      if (!section) return null;
      return section.querySelector("swiper-container, swiper-container-1");
    }

    function forceContinuous(sw) {
      if (!sw || sw.destroyed) return;

      try {
        // Always force (because theme may overwrite after navigation)
        sw.params.speed = 5000;

        sw.params.autoplay = sw.params.autoplay || {};
        sw.params.autoplay.delay = 0;
        sw.params.autoplay.disableOnInteraction = false;

        if (typeof sw.update === "function") sw.update();
        if (sw.autoplay && typeof sw.autoplay.start === "function") sw.autoplay.start();
      } catch (e) {}
    }

    function ensureCollections() {
      var el = getEl();
      if (!el) return;

      try {
        if (!el.swiper && typeof el.initialize === "function") el.initialize();
        if (el.swiper) forceContinuous(el.swiper);
      } catch (e) {}
    }

    function start() {
      ensureCollections();
      clearInterval(start.__iv);
      start.__iv = setInterval(ensureCollections, 350);
    }

    hookNavigation(start);
  })();
  /* ======================================================
     END: COLLECTIONS SLIDER
     ====================================================== */

  /* ======================================================
     START: URGENCY / STOCK (UNDER "رمز المنتج")
     Uses product.low_stock_quantity (Zid official pattern)
     ====================================================== */
  (function () {
    if (window.__SEDJEM_URGENCY_STOCK__) return;
    window.__SEDJEM_URGENCY_STOCK__ = true;

    var CFG = {
      boxId: "zid-urgency-stock",
      title: "المتبقي في المخزون",
      unit: "قطعة",
      threshold: 5,
      showOnlyWhenLow: true
    };

    function findSkuBlock() {
      return qs(".div-product-sku");
    }

    function getProductId() {
      var el = qs("#product-id");
      return el && el.value ? el.value : null;
    }

    function ensureBox() {
      var sku = findSkuBlock();
      if (!sku) return null;

      var box = document.getElementById(CFG.boxId);
      if (!box) {
        box = document.createElement("div");
        box.id = CFG.boxId;
        box.className = "mt-4";
        box.style.display = "none";
        box.innerHTML =
          '<h4 class="product-title"></h4>' +
          '<div class="product-stock"></div>';
        sku.insertAdjacentElement("afterend", box);
      }
      return box;
    }

    function setBox(box, qty) {
      if (!box) return;

      var q = Math.max(0, Math.floor(qty || 0));

      if (!q) {
        box.style.display = "none";
        return;
      }

      if (CFG.showOnlyWhenLow && q > CFG.threshold) {
        box.style.display = "none";
        return;
      }

      box.style.display = "";
      var t = qs(".product-title", box);
      var v = qs(".product-stock", box);
      if (t) t.textContent = CFG.title;
      if (v) v.textContent = q + (CFG.unit ? " " + CFG.unit : "");
    }

    function readLowStockFromAny(productLike) {
      if (!productLike) return null;
      var v = safeNum(productLike.low_stock_quantity);
      return v;
    }

    function hasZidSDK() {
      return !!(window.zid && zid.store && zid.store.product && typeof zid.store.product.get === "function");
    }

    function fetchViaSDK(pid) {
      return zid.store.product.get(pid).then(function (product) {
        // Zid “Remaining Product Stock” is reflected as product.low_stock_quantity
        // (not stocks[]) when the merchant enables it.
        return readLowStockFromAny(product);
      });
    }

    function render() {
      var pid = getProductId();
      var sku = findSkuBlock();
      if (!pid || !sku) return;

      var box = ensureBox();
      if (!box) return;

      // 1) SDK (preferred)
      if (hasZidSDK()) {
        fetchViaSDK(pid)
          .then(function (qty) {
            if (qty === null || qty === undefined) {
              // 2) fallback: sometimes theme already has product object somewhere
              var q2 =
                readLowStockFromAny(window.productObj) ||
                readLowStockFromAny(window.selectedProduct) ||
                readLowStockFromAny(window.selected_product);
              setBox(box, q2);
              return;
            }
            setBox(box, qty);
          })
          .catch(function () {
            var qf =
              readLowStockFromAny(window.productObj) ||
              readLowStockFromAny(window.selectedProduct) ||
              readLowStockFromAny(window.selected_product);
            setBox(box, qf);
          });

        return;
      }

      // fallback only
      var q =
        readLowStockFromAny(window.productObj) ||
        readLowStockFromAny(window.selectedProduct) ||
        readLowStockFromAny(window.selected_product);
      setBox(box, q);
    }

    function start() {
      // keep re-running (product page content may be injected after navigation)
      render();
      clearInterval(start.__iv);
      start.__iv = setInterval(function () {
        // only try when on product page
        if (document.getElementById("productPageDetails") && document.getElementById("product-id")) render();
      }, 500);
    }

    // Wrap variant change functions if present
    function wrap(fnName) {
      if (typeof window[fnName] !== "function" || window[fnName].__sedjemWrapped) return;
      var old = window[fnName];
      window[fnName] = function () {
        var res = old.apply(this, arguments);
        setTimeout(start, 200);
        return res;
      };
      window[fnName].__sedjemWrapped = true;
    }
    wrap("productOptionsChanged");
    wrap("productOptionInputChanged");

    // Debug helper (use: __zidDebugStock())
    window.__zidDebugStock = function () {
      console.log("[Stock] productId:", getProductId());
      console.log("[Stock] hasZidSDK:", hasZidSDK());
      console.log("[Stock] productObj.low_stock_quantity:", window.productObj && window.productObj.low_stock_quantity);
      console.log("[Stock] selectedProduct.low_stock_quantity:", window.selectedProduct && window.selectedProduct.low_stock_quantity);
      start();
    };

    hookNavigation(start);
  })();
  /* ======================================================
     END: URGENCY / STOCK
     ====================================================== */
})();
