/* ======================================================
   Sedjem Zid Custom Tweaks (SPA/PJAX Safe)
   - HERO fix (tablet 640–1023)
   - Collections autoplay speed
   - Product urgency/remaining stock under SKU
   ====================================================== */

(function () {
  if (window.__SEDJEM_ZID_TWEAKS_V1__) return;
  window.__SEDJEM_ZID_TWEAKS_V1__ = true;

  /* ----------------------------
     Small utilities
  ---------------------------- */
  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }
  function qsa(sel, root) {
    return (root || document).querySelectorAll(sel);
  }
  function isArray(x) {
    return Object.prototype.toString.call(x) === "[object Array]";
  }
  function safeNum(x) {
    var n = Number(x);
    return isFinite(n) ? n : 0;
  }

  /* ======================================================
     NAVIGATION WATCHER (Fixes “works then stops”)
     - Triggers on full load, refresh, back/forward, PJAX
  ====================================================== */
  (function setupNavWatcher() {
    function fire() {
      window.dispatchEvent(new Event("sedjem:navigation"));
    }

    // Initial
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fire, { once: true });
    } else {
      fire();
    }

    // Refresh/back-forward cache
    window.addEventListener("pageshow", fire);

    // Patch history to catch PJAX navigation
    if (!history.__sedjemPatched) {
      history.__sedjemPatched = true;

      var _push = history.pushState;
      history.pushState = function () {
        var r = _push.apply(this, arguments);
        setTimeout(fire, 0);
        return r;
      };

      var _replace = history.replaceState;
      history.replaceState = function () {
        var r = _replace.apply(this, arguments);
        setTimeout(fire, 0);
        return r;
      };

      window.addEventListener("popstate", function () {
        setTimeout(fire, 0);
      });
    }
  })();

  /* ======================================================
     START: HERO SLIDER FIX (Tablet 640–1023)
  ====================================================== */
  (function heroFix() {
    var MIN = 640;
    var MAX = 1023;

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

      var els = qsa(SEL);
      for (var i = 0; i < els.length; i++) {
        var el = els[i];
        try {
          if (!el.swiper && typeof el.initialize === "function") el.initialize();
          if (el.swiper) patchSwiper(el.swiper);
        } catch (e) {}
      }
    }

    function runGuard() {
      // retry for late init / re-render
      var n = 0;
      var iv = setInterval(function () {
        tick();
        if (++n >= 25) clearInterval(iv);
      }, 150);
    }

    // Run on navigation + resize
    window.addEventListener("sedjem:navigation", runGuard);
    window.addEventListener("resize", function () {
      setTimeout(runGuard, 180);
    });

    // Also watch DOM changes on home (PJAX inject)
    if (window.MutationObserver && !heroFix.__mo) {
      heroFix.__mo = true;
      try {
        var mo = new MutationObserver(function () {
          clearTimeout(heroFix.__t);
          heroFix.__t = setTimeout(runGuard, 120);
        });
        mo.observe(document.documentElement, { childList: true, subtree: true });
      } catch (e) {}
    }
  })();

  /* ======================================================
     START: COLLECTIONS SLIDER (Speed + Continuous Autoplay)
  ====================================================== */
  (function collectionsFix() {
    var SECTION_ID = "slider-with-background-image-15e9c1d4-155b-4592-90c3-181634cf6d66";

    function applyOnce() {
      var section = qs('section[section-id="' + SECTION_ID + '"]');
      if (!section) return false;

      var el = section.querySelector("swiper-container, swiper-container-1");
      if (!el) return false;

      try {
        if (!el.swiper && typeof el.initialize === "function") el.initialize();
        var s = el.swiper;
        if (!s || s.destroyed) return false;

        s.params.speed = 5000;
        s.params.autoplay = s.params.autoplay || {};
        s.params.autoplay.delay = 0;
        s.params.autoplay.disableOnInteraction = false;

        if (typeof s.update === "function") s.update();
        if (s.autoplay && typeof s.autoplay.start === "function") s.autoplay.start();

        return true;
      } catch (e) {
        return false;
      }
    }

    function runGuard() {
      var n = 0;
      var iv = setInterval(function () {
        applyOnce();
        if (++n >= 25) clearInterval(iv);
      }, 200);
    }

    window.addEventListener("sedjem:navigation", runGuard);

    if (window.MutationObserver && !collectionsFix.__mo) {
      collectionsFix.__mo = true;
      try {
        var mo = new MutationObserver(function () {
          clearTimeout(collectionsFix.__t);
          collectionsFix.__t = setTimeout(runGuard, 150);
        });
        mo.observe(document.documentElement, { childList: true, subtree: true });
      } catch (e) {}
    }
  })();

  /* ======================================================
     START: URGENCY / STOCK (Under SKU)
  ====================================================== */
  (function urgencyStock() {
    var CFG = {
      boxId: "zid-urgency-stock",
      title: "المتبقي في المخزون",
      unit: "قطعة",
      threshold: 5,
      showOnlyWhenLow: true
    };

    function isProductPage() {
      // Zid product pages usually contain one of these
      return !!(
        document.getElementById("product-id") ||
        document.getElementById("productPageDetails") ||
        document.getElementById("product-form") ||
        document.querySelector("[data-product-id]")
      );
    }

    function getProductId() {
      var el = document.getElementById("product-id");
      if (el && el.value) return el.value;

      // fallback: data-product-id
      var dp = document.querySelector("[data-product-id]");
      if (dp && dp.getAttribute("data-product-id")) return dp.getAttribute("data-product-id");

      return null;
    }

    function findSkuBlock() {
      return qs(".div-product-sku");
    }

    function ensureBox(skuBlock) {
      var box = document.getElementById(CFG.boxId);
      if (box) return box;

      box = document.createElement("div");
      box.id = CFG.boxId;
      box.className = "mt-4";
      box.style.display = "none";
      box.innerHTML = '<h4 class="product-title"></h4><div class="product-stock"></div>';
      skuBlock.insertAdjacentElement("afterend", box);
      return box;
    }

    function showBox(box, qty) {
      var q = Math.max(0, Math.floor(qty || 0));

      if (q <= 0) {
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

    function hideBox(box) {
      if (box) box.style.display = "none";
    }

    // --- SDK path (if available)
    function hasZidSDK() {
      return !!(
        window.zid &&
        window.zid.store &&
        window.zid.store.product &&
        typeof window.zid.store.product.get === "function"
      );
    }

    function sdkFetchQty(productId) {
      return window.zid.store.product.get(productId).then(function (product) {
        if (!product || !isArray(product.stocks)) return null;

        // infinite => hide
        for (var i = 0; i < product.stocks.length; i++) {
          if (product.stocks[i] && product.stocks[i].is_infinite) return null;
        }

        var total = 0;
        for (var j = 0; j < product.stocks.length; j++) {
          if (product.stocks[j]) total += safeNum(product.stocks[j].available_quantity);
        }
        return total;
      });
    }

    // --- Fallback path (productObj/selectedProduct)
    function getSelectedProduct() {
      if (window.selectedProduct) return window.selectedProduct;
      if (window.selected_product) return window.selected_product;

      if (window.productObj) {
        if (window.productObj.selected_product) return window.productObj.selected_product;
        if (window.productObj.selectedProduct) return window.productObj.selectedProduct;
      }
      return null;
    }

    function computeFromStocks(stocks) {
      if (!isArray(stocks) || !stocks.length) return null;

      for (var i = 0; i < stocks.length; i++) {
        if (stocks[i] && stocks[i].is_infinite) return null;
      }

      var sum = 0;
      for (var j = 0; j < stocks.length; j++) {
        if (stocks[j]) sum += safeNum(stocks[j].available_quantity);
      }
      return sum;
    }

    function fallbackQty() {
      var selected = getSelectedProduct();
      if (selected && isArray(selected.stocks)) return computeFromStocks(selected.stocks);

      if (window.productObj && isArray(window.productObj.stocks)) return computeFromStocks(window.productObj.stocks);

      var pid = getProductId();
      if (pid && window.productObj && isArray(window.productObj.products)) {
        for (var i = 0; i < window.productObj.products.length; i++) {
          var p = window.productObj.products[i];
          if (p && String(p.id) === String(pid) && isArray(p.stocks)) {
            return computeFromStocks(p.stocks);
          }
        }
      }

      return null;
    }

    // --- Core render (safe)
    function render() {
      if (!isProductPage()) return;

      var skuBlock = findSkuBlock();
      var productId = getProductId();
      if (!skuBlock || !productId) return;

      var box = ensureBox(skuBlock);

      // SDK first, fallback second
      if (hasZidSDK()) {
        sdkFetchQty(productId)
          .then(function (qty) {
            if (qty === null || qty === undefined) return hideBox(box);
            showBox(box, qty);
          })
          .catch(function () {
            var q2 = fallbackQty();
            if (q2 === null || q2 === undefined) return hideBox(box);
            showBox(box, q2);
          });

        return;
      }

      var qf = fallbackQty();
      if (qf === null || qf === undefined) return hideBox(box);
      showBox(box, qf);
    }

    // schedule with retries because Zid renders SKU late
    function runGuard() {
      if (!isProductPage()) return;

      var n = 0;
      var iv = setInterval(function () {
        render();
        if (++n >= 25) clearInterval(iv);
      }, 250);
    }

    // Re-run on navigation
    window.addEventListener("sedjem:navigation", runGuard);

    // Watch DOM changes on product page to catch late SKU/variant swaps
    if (window.MutationObserver && !urgencyStock.__mo) {
      urgencyStock.__mo = true;
      try {
        var mo = new MutationObserver(function () {
          clearTimeout(urgencyStock.__t);
          urgencyStock.__t = setTimeout(runGuard, 150);
        });
        mo.observe(document.documentElement, { childList: true, subtree: true });
      } catch (e) {}
    }

    // Hook variant change functions if they exist
    function wrap(fnName) {
      if (typeof window[fnName] !== "function" || window[fnName].__sedjemWrapped) return;
      var old = window[fnName];
      window[fnName] = function () {
        var res = old.apply(this, arguments);
        setTimeout(runGuard, 200);
        return res;
      };
      window[fnName].__sedjemWrapped = true;
    }
    wrap("productOptionsChanged");
    wrap("productOptionInputChanged");

    // Debug helper (this time guaranteed to exist)
    window.__zidDebugStock = function () {
      console.log("[Stock] isProductPage:", isProductPage());
      console.log("[Stock] productId:", getProductId());
      console.log("[Stock] hasZidSDK:", hasZidSDK());
      console.log("[Stock] selectedProduct:", getSelectedProduct());
      console.log("[Stock] productObj:", window.productObj);
      runGuard();
    };
  })();
})();
