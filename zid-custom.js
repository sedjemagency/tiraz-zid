/* ======================================================
   Sedjem Zid Custom Tweaks (Navigation-proof)
   - HERO Swiper fix (tablet 640–1023)
   - Collections Swiper continuous autoplay (speed + no delay)
   - URGENCY / STOCK under SKU (robust, multi-source)
   ====================================================== */

(function () {
  if (window.__SEDJEM_ZID_CUSTOM_ALL__) return;
  window.__SEDJEM_ZID_CUSTOM_ALL__ = "loaded_" + Date.now();

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
    return isFinite(n) ? n : 0;
  }
  function isArray(x) {
    return Object.prototype.toString.call(x) === "[object Array]";
  }

  /* ======================================================
     1) GLOBAL SWIPER PATCH (survives Zid navigation)
     - Applies to ALL newly created swipers too
     ====================================================== */
  (function () {
    if (window.__SEDJEM_SWIPER_PATCHED__) return;
    window.__SEDJEM_SWIPER_PATCHED__ = true;

    var HERO_MIN = 640;
    var HERO_MAX = 1023;

    // Your Collections section-id
    var COLLECTIONS_SECTION_ID = "slider-with-background-image-15e9c1d4-155b-4592-90c3-181634cf6d66";

    function inTablet() {
      var w = window.innerWidth || document.documentElement.clientWidth || 0;
      return w >= HERO_MIN && w <= HERO_MAX;
    }

    function isHeroEl(el) {
      if (!el) return false;
      var sec = el.closest && el.closest('section[section-id^="media-slider"]');
      return !!sec;
    }

    function isCollectionsEl(el) {
      if (!el) return false;
      var sec = el.closest && el.closest('section[section-id="' + COLLECTIONS_SECTION_ID + '"]');
      return !!sec;
    }

    function patchBreakpoints(bps) {
      if (!bps) return;
      for (var k in bps) {
        if (!Object.prototype.hasOwnProperty.call(bps, k)) continue;
        var bp = Number(k);
        if (isNaN(bp)) continue;
        if (bp <= HERO_MAX) {
          bps[k] = bps[k] || {};
          bps[k].slidesPerView = 1;
          bps[k].spaceBetween = 1;
        }
      }
      bps[HERO_MIN] = bps[HERO_MIN] || {};
      bps[HERO_MIN].slidesPerView = 1;
      bps[HERO_MIN].spaceBetween = 1;
    }

    function patchHero(swiper) {
      if (!swiper) return;
      if (!inTablet()) return;

      try {
        patchBreakpoints(swiper.params && swiper.params.breakpoints);
        patchBreakpoints(swiper.originalParams && swiper.originalParams.breakpoints);

        swiper.params.slidesPerView = 1;
        swiper.params.spaceBetween = 1;

        if (typeof swiper.setBreakpoint === "function") swiper.setBreakpoint();
        if (typeof swiper.update === "function") swiper.update();
      } catch (e) {}
    }

    function patchCollections(swiper) {
      if (!swiper) return;

      try {
        swiper.params.speed = 5000;
        swiper.params.autoplay = swiper.params.autoplay || {};
        swiper.params.autoplay.delay = 0;
        swiper.params.autoplay.disableOnInteraction = false;

        if (typeof swiper.update === "function") swiper.update();
        if (swiper.autoplay && typeof swiper.autoplay.start === "function") swiper.autoplay.start();
      } catch (e) {}
    }

    function patchOne(el) {
      try {
        if (!el) return;
        if (!el.swiper && typeof el.initialize === "function") el.initialize();
        var s = el.swiper;
        if (!s || s.destroyed) return;

        // Avoid patching the same instance over and over
        if (!s.__sedjemPatched) s.__sedjemPatched = {};
        if (s.__sedjemPatched.hero && s.__sedjemPatched.collections) return;

        if (isHeroEl(el)) {
          patchHero(s);
          s.__sedjemPatched.hero = true;
        }

        if (isCollectionsEl(el)) {
          patchCollections(s);
          s.__sedjemPatched.collections = true;
        }
      } catch (e) {}
    }

    function scan() {
      var els = qsa("swiper-container, swiper-container-1");
      for (var i = 0; i < els.length; i++) patchOne(els[i]);
    }

    // Constant light scan handles Zid destroying/recreating swipers on navigation
    var iv = setInterval(scan, 200);
    setTimeout(function () { clearInterval(iv); }, 60000); // keep 1 minute

    // Also re-scan on resize
    window.addEventListener("resize", function () {
      setTimeout(scan, 150);
    });

    // MutationObserver to catch new DOM injected
    if (window.MutationObserver) {
      try {
        var mo = new MutationObserver(function () {
          clearTimeout(scan.__t);
          scan.__t = setTimeout(scan, 120);
        });
        mo.observe(document.documentElement, { childList: true, subtree: true });
      } catch (e) {}
    }

    // Kick immediately
    scan();
  })();

  /* ======================================================
     2) URGENCY / STOCK under SKU (robust)
     - Works even if zid SDK is missing
     - Re-runs on navigation / DOM swaps
     ====================================================== */
  (function () {
    if (window.__SEDJEM_STOCK_WIDGET__) return;
    window.__SEDJEM_STOCK_WIDGET__ = true;

    var CFG = {
      boxId: "zid-urgency-stock",
      title: "المتبقي في المخزون",
      unit: "قطعة",
      threshold: 5,
      showOnlyWhenLow: true
    };

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

    function getProductId() {
      var el = document.getElementById("product-id");
      if (el && el.value) return el.value;

      var dp = document.querySelector("[data-product-id]");
      if (dp && dp.getAttribute("data-product-id")) return dp.getAttribute("data-product-id");

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
      // 1) selected product
      var sp = window.selectedProduct || window.selected_product;
      if (sp && isArray(sp.stocks)) return computeFromStocks(sp.stocks);

      // 2) productObj root
      if (window.productObj && isArray(window.productObj.stocks)) return computeFromStocks(window.productObj.stocks);

      // 3) match variant/group by #product-id
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
        return computeFromStocks(product.stocks);
      });
    }

    function renderWithQty(box, qty) {
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
      qs(".product-title", box).textContent = CFG.title;
      qs(".product-stock", box).textContent = q + (CFG.unit ? " " + CFG.unit : "");
    }

    function render() {
      var box = ensureBox();
      if (!box) return;

      var pid = getProductId();
      if (!pid) {
        box.style.display = "none";
        return;
      }

      // SDK first
      if (hasZidSDK()) {
        sdkFetchQty(pid)
          .then(function (qty) {
            if (qty === null || qty === undefined) {
              var q2 = fallbackQty();
              if (q2 === null || q2 === undefined) return (box.style.display = "none");
              return renderWithQty(box, q2);
            }
            renderWithQty(box, qty);
          })
          .catch(function () {
            var qf = fallbackQty();
            if (qf === null || qf === undefined) return (box.style.display = "none");
            renderWithQty(box, qf);
          });

        return;
      }

      // fallback only
      var q = fallbackQty();
      if (q === null || q === undefined) return (box.style.display = "none");
      renderWithQty(box, q);
    }

    function runGuard() {
      var tries = 0;
      var iv = setInterval(function () {
        tries++;
        render();
        if (tries >= 25) clearInterval(iv);
      }, 250);
    }

    // Hook common variant functions
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

    // Re-run frequently because Zid can swap product DOM on variant changes
    setInterval(function () {
      // Only if SKU exists (i.e., product page)
      if (document.querySelector(".div-product-sku")) runGuard();
    }, 1200);

    // Observe DOM
    if (window.MutationObserver) {
      try {
        var mo = new MutationObserver(function () {
          clearTimeout(runGuard.__t);
          runGuard.__t = setTimeout(runGuard, 150);
        });
        mo.observe(document.documentElement, { childList: true, subtree: true });
      } catch (e) {}
    }

    // Debug helper
    window.__zidDebugStock = function () {
      console.log("[Stock] productId:", getProductId());
      console.log("[Stock] hasZidSDK:", hasZidSDK());
      console.log("[Stock] selectedProduct:", window.selectedProduct || window.selected_product);
      console.log("[Stock] productObj:", window.productObj);
      runGuard();
    };

    // Kick
    runGuard();
  })();
})();
