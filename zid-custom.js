/* ======================================================
   START: HERO SLIDER FIX (Tablet 640–1023)
   ====================================================== */
try {
  window.__HERO_MEDIA_SLIDER_FIX__ = "loaded_" + Date.now();

  (function () {
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
        if (n >= 25) clearInterval(iv);
      }, 150);
    }

    // Re-apply when Zid re-renders sections
    function watch() {
      if (!window.MutationObserver) return;
      try {
        var mo = new MutationObserver(function () {
          // light debounce
          clearTimeout(watch.__t);
          watch.__t = setTimeout(runGuard, 120);
        });
        mo.observe(document.documentElement, { childList: true, subtree: true });
      } catch (e) {}
    }

    var t;
    window.addEventListener("load", runGuard);
    window.addEventListener("pageshow", runGuard); // bfcache/back-forward
    window.addEventListener("resize", function () {
      clearTimeout(t);
      t = setTimeout(runGuard, 180);
    });
    window.addEventListener("orientationchange", function () {
      setTimeout(runGuard, 250);
    });

    // Run + watch
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () {
        runGuard();
        watch();
      });
    } else {
      runGuard();
      watch();
    }
  })();
} catch (e) {}
/* ======================================================
   END: HERO SLIDER FIX
   ====================================================== */




/* ======================================================
   START: COLLECTIONS SLIDER (Speed + Continuous Autoplay)
   ====================================================== */
try {
  (function () {
    var SECTION_ID = "slider-with-background-image-15e9c1d4-155b-4592-90c3-181634cf6d66";

    function apply() {
      var section = document.querySelector('section[section-id="' + SECTION_ID + '"]');
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
        apply();
        n++;
        if (n >= 25) clearInterval(iv);
      }, 200);
    }

    function watch() {
      if (!window.MutationObserver) return;
      try {
        var mo = new MutationObserver(function () {
          clearTimeout(watch.__t);
          watch.__t = setTimeout(runGuard, 150);
        });
        mo.observe(document.documentElement, { childList: true, subtree: true });
      } catch (e) {}
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () {
        runGuard();
        watch();
      });
    } else {
      runGuard();
      watch();
    }

    window.addEventListener("pageshow", runGuard);
  })();
} catch (e) {}
/* ======================================================
   END: COLLECTIONS SLIDER
   ====================================================== */




/* ======================================================
   START: URGENCY / STOCK (SAFE: SDK first, fallback second)
   Position: Under "رمز المنتج" (.div-product-sku)
   ====================================================== */
try {
  (function () {
    if (window.__ZID_URGENCY_STOCK__) return;
    window.__ZID_URGENCY_STOCK__ = true;

    var CFG = {
      boxId: "zid-urgency-stock",
      title: "المتبقي في المخزون",
      unit: "قطعة",
      threshold: 5,
      showOnlyWhenLow: true
    };

    function qs(sel, root) {
      return (root || document).querySelector(sel);
    }

    function isArray(x) {
      return Object.prototype.toString.call(x) === "[object Array]";
    }

    function safeNum(x) {
      var n = Number(x);
      return isFinite(n) ? n : 0;
    }

    function getProductId() {
      var el = qs("#product-id");
      return el && el.value ? el.value : null;
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
      box.innerHTML = '<h4 class="product-title"></h4><div class="product-stock"></div>';
      skuBlock.insertAdjacentElement("afterend", box);
      return box;
    }

    function showBox(box, qty) {
      var q = Math.max(0, Math.floor(qty || 0));

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

    function hasZidSDK() {
      return !!(window.zid && window.zid.store && window.zid.store.product && typeof window.zid.store.product.get === "function");
    }

    function sdkFetchQty(productId) {
      // IMPORTANT: reference zid via window.zid only (prevents ReferenceError)
      return window.zid.store.product.get(productId).then(function (product) {
        if (!product || !isArray(product.stocks)) return null;

        var total = 0;
        for (var i = 0; i < product.stocks.length; i++) {
          var s = product.stocks[i];
          if (!s) continue;
          if (s.is_infinite === true) return null;
          total += safeNum(s.available_quantity);
        }
        return total;
      });
    }

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

    function render() {
      var skuBlock = findSkuBlock();
      var productId = getProductId();
      if (!skuBlock || !productId) return;

      var box = ensureBox(skuBlock);

      if (hasZidSDK()) {
        sdkFetchQty(productId)
          .then(function (qty) {
            if (qty === null || qty === undefined || qty <= 0) return hideBox(box);
            showBox(box, qty);
          })
          .catch(function () {
            var q2 = fallbackQty();
            if (!q2 || q2 <= 0) return hideBox(box);
            showBox(box, q2);
          });
        return;
      }

      var qf = fallbackQty();
      if (!qf || qf <= 0) return hideBox(box);
      showBox(box, qf);
    }

    var rafPending = false;
    function scheduleRender() {
      if (rafPending) return;
      rafPending = true;
      (window.requestAnimationFrame || function (cb) { return setTimeout(cb, 16); })(function () {
        rafPending = false;
        render();
      });
    }

    function hookVariantChanges() {
      var fnNames = ["productOptionsChanged", "productOptionInputChanged"];
      for (var i = 0; i < fnNames.length; i++) {
        var name = fnNames[i];
        if (typeof window[name] === "function" && !window[name].__sedjemWrapped) {
          (function (n) {
            var old = window[n];
            window[n] = function () {
              var res = old.apply(this, arguments);
              setTimeout(scheduleRender, 200);
              return res;
            };
            window[n].__sedjemWrapped = true;
          })(name);
        }
      }

      var pid = document.getElementById("product-id");
      if (pid) {
        pid.addEventListener("change", function () { scheduleRender(); });

        if (window.MutationObserver) {
          try {
            var obs = new MutationObserver(function () { scheduleRender(); });
            obs.observe(pid, { attributes: true, attributeFilter: ["value"] });
          } catch (e) {}
        }
      }
    }

    // Debug helper (correct name + easy call)
    window.__zidDebugStock = function () {
      console.log("[Stock] hasZidSDK:", hasZidSDK());
      console.log("[Stock] productId:", getProductId());
      console.log("[Stock] selectedProduct:", getSelectedProduct());
      console.log("[Stock] productObj:", window.productObj);
      scheduleRender();
    };

    function start() {
      hookVariantChanges();

      // SKU block may render late
      if (window.MutationObserver) {
        var root = document.getElementById("productPageDetails") || document.body;
        if (root) {
          try {
            var obs2 = new MutationObserver(function () {
              if (document.querySelector(".div-product-sku")) scheduleRender();
            });
            obs2.observe(root, { childList: true, subtree: true });
          } catch (e) {}
        }
      }

      scheduleRender();
      setTimeout(scheduleRender, 500);
      setTimeout(scheduleRender, 1500);

      // SDK might load late
      var tries = 0;
      var iv = setInterval(function () {
        tries++;
        scheduleRender();
        if (tries >= 20) clearInterval(iv);
      }, 300);
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", start);
    } else {
      start();
    }
  })();
} catch (e) {}
/* ======================================================
   END: URGENCY / STOCK
   ====================================================== */
