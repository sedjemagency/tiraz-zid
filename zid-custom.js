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

// ==========================
// Zid Product Remaining Stock (No HTML access)
// Injects a block under ".div-product-sku"
// ==========================
(function () {
  var CFG = {
    threshold: 5,          // Show only if remaining <= threshold
    showOnlyWhenLow: true, // Set false to always show finite stock
    title: "المتبقي في المخزون",
    unit: "قطعة"
  };

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function isArray(x) {
    return Object.prototype.toString.call(x) === "[object Array]";
  }

  function isProductPage() {
    return !!(
      document.getElementById("product-form") ||
      document.getElementById("productPageDetails") ||
      document.getElementById("product-id")
    );
  }

  function safeNum(x) {
    if (typeof x === "number" && isFinite(x)) return x;
    if (typeof x === "string") {
      var n = Number(x);
      if (isFinite(n)) return n;
    }
    return 0;
  }

  function computeFromStocks(stocks) {
    if (!isArray(stocks) || !stocks.length) return null;

    for (var i = 0; i < stocks.length; i++) {
      if (stocks[i] && stocks[i].is_infinite) {
        return { infinite: true, qty: null };
      }
    }

    var sum = 0;
    for (var j = 0; j < stocks.length; j++) {
      if (stocks[j]) sum += safeNum(stocks[j].available_quantity);
    }

    return { infinite: false, qty: sum };
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

  function getStocksInfo(selected) {
    var info = null;

    // 1) selectedProduct.stocks
    if (selected && isArray(selected.stocks)) {
      info = computeFromStocks(selected.stocks);
      if (info) return info;
    }

    // 2) productObj.stocks
    if (window.productObj && isArray(window.productObj.stocks)) {
      info = computeFromStocks(window.productObj.stocks);
      if (info) return info;
    }

    // 3) Match product-id with productObj.products[*].stocks
    var pidEl = document.getElementById("product-id");
    var pid = pidEl ? pidEl.value : null;

    if (pid && window.productObj && isArray(window.productObj.products)) {
      for (var i = 0; i < window.productObj.products.length; i++) {
        var p = window.productObj.products[i];
        if (p && String(p.id) === String(pid) && isArray(p.stocks)) {
          info = computeFromStocks(p.stocks);
          if (info) return info;
        }
      }
    }

    return null;
  }

  function ensureNode() {
    var skuContainer = $(".div-product-sku");
    if (!skuContainer) return null;

    var node = document.getElementById("zid-stock-remaining");
    if (!node) {
      node = document.createElement("div");
      node.id = "zid-stock-remaining";
      node.className = "div-product-stock mt-4 hidden";
      node.innerHTML = '<h4 class="product-title"></h4><div class="product-stock"></div>';
      skuContainer.insertAdjacentElement("afterend", node);
    }
    return node;
  }

  function update(selected) {
    var node = ensureNode();
    if (!node) return false;

    selected = selected || getSelectedProduct();

    // Hide if unavailable/out of stock
    var unavailable = false;
    if (selected && (selected.unavailable || selected.out_of_stock)) unavailable = true;
    if (window.productObj && (window.productObj.unavailable || window.productObj.out_of_stock)) unavailable = true;
    if (unavailable) {
      node.classList.add("hidden");
      return true;
    }

    var info = getStocksInfo(selected);
    if (!info || info.infinite || info.qty === null) {
      node.classList.add("hidden");
      return true;
    }

    var qty = Math.max(0, Math.floor(info.qty));

    if (CFG.showOnlyWhenLow && qty > CFG.threshold) {
      node.classList.add("hidden");
      return true;
    }

    node.classList.remove("hidden");
    node.setAttribute("data-level", qty <= 2 ? "critical" : "low");

    var titleEl = $(".product-title", node);
    var valEl = $(".product-stock", node);

    if (titleEl) titleEl.textContent = CFG.title;
    if (valEl) valEl.textContent = qty + (CFG.unit ? (" " + CFG.unit) : "");

    return true;
  }

  var rafPending = false;
  function scheduleUpdate(selected) {
    if (rafPending) return;
    rafPending = true;

    (window.requestAnimationFrame || function (cb) { return setTimeout(cb, 16); })(function () {
      rafPending = false;
      update(selected);
    });
  }

  // Debug helper
  window.__zidDebugStock = function () {
    var selected = getSelectedProduct();
    var info = getStocksInfo(selected);

    console.log("[Zid Stock] selectedProduct:", selected);
    console.log("[Zid Stock] productObj.stocks:", window.productObj ? window.productObj.stocks : undefined);
    console.log("[Zid Stock] computed:", info);
    console.log("[Zid Stock] skuEl:", document.querySelector(".div-product-sku"));
    console.log("[Zid Stock] node:", document.getElementById("zid-stock-remaining"));

    scheduleUpdate(selected);
    return info;
  };

  function hookVariantChanges() {
    if (typeof window.productOptionsChanged === "function" && !window.productOptionsChanged.__zidWrapped) {
      var oldFn = window.productOptionsChanged;
      window.productOptionsChanged = function (selectedProduct) {
        var res = oldFn.apply(this, arguments);
        scheduleUpdate(selectedProduct);
        return res;
      };
      window.productOptionsChanged.__zidWrapped = true;
    }

    var pid = document.getElementById("product-id");
    if (pid && window.MutationObserver) {
      try {
        var obs = new MutationObserver(function () { scheduleUpdate(); });
        obs.observe(pid, { attributes: true, attributeFilter: ["value"] });
      } catch (e) {}
      pid.addEventListener("change", function () { scheduleUpdate(); });
    }
  }

  function start() {
    if (!isProductPage()) return;

    hookVariantChanges();

    // SKU block may render late
    if (window.MutationObserver) {
      var root = document.getElementById("productPageDetails") || document.body;
      if (root) {
        var obs2 = new MutationObserver(function () {
          if (document.querySelector(".div-product-sku")) scheduleUpdate();
        });
        obs2.observe(root, { childList: true, subtree: true });
      }
    }

    scheduleUpdate();
    setTimeout(function () { scheduleUpdate(); }, 500);
    setTimeout(function () { scheduleUpdate(); }, 1500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
