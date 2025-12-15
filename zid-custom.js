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
// Urgency / Stock (Zid) — FINAL
// Inserts تحت "رمز المنتج" بنفس ستايل باقي الحقول
// Title: "الكمية المتوفرة"
// Value: number only (no unit)
// ==========================
(function () {
  if (window.__ZID_URGENCY_STOCK_FINAL__) return;
  window.__ZID_URGENCY_STOCK_FINAL__ = Date.now();

  var BOX_ID = "zid-urgency-stock";
  var TITLE_TEXT = "الكمية المتوفرة";

  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }
  function qsa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function isProductPage() {
    return !!(
      document.getElementById("productPageDetails") ||
      document.getElementById("product-form") ||
      document.getElementById("product-id") ||
      document.querySelector('[data-page="product"]')
    );
  }

  function findSkuBlock() {
    // Primary (most themes)
    var el = qs(".div-product-sku");
    if (el) return el;

    // Fallback: find title text "رمز المنتج"
    var titles = qsa("h4.product-title");
    for (var i = 0; i < titles.length; i++) {
      var t = (titles[i].textContent || "").trim();
      if (t.indexOf("رمز المنتج") !== -1) {
        // Usually the container is the parent block that holds title + value
        return titles[i].parentElement || null;
      }
    }
    return null;
  }

  function getValueClassFromSkuBlock(skuBlock) {
    // Keep the same styling as SKU value (or weight value as fallback)
    var v =
      (skuBlock && qs(".product-sku", skuBlock)) ||
      (skuBlock && qs(".product-weight", skuBlock));

    if (v && v.className) return v.className;
    return "product-sku";
  }

  function toNumber(x) {
    if (x === null || typeof x === "undefined") return null;
    var n = Number(x);
    return Number.isFinite(n) ? n : null;
  }

  function sumStocks(stocks) {
    if (!Array.isArray(stocks) || !stocks.length) return null;

    // If any stock is infinite/unknown -> do not display qty
    for (var i = 0; i < stocks.length; i++) {
      var s = stocks[i];
      if (!s) continue;

      if (s.is_infinite === true) return null;
      if (s.available_quantity === null || typeof s.available_quantity === "undefined") return null;
    }

    var total = 0;
    var hasAny = false;
    for (var j = 0; j < stocks.length; j++) {
      var st = stocks[j];
      if (!st) continue;

      var aq = toNumber(st.available_quantity);
      if (aq === null) continue;

      total += aq;
      hasAny = true;
    }

    return hasAny ? total : null;
  }

  function getSelectedProduct() {
    // Common globals in Zid themes
    if (window.current_selected_product) return window.current_selected_product;
    if (window.selectedProduct) return window.selectedProduct;
    if (window.selected_product) return window.selected_product;

    if (window.productObj) {
      if (window.productObj.selected_product) return window.productObj.selected_product;
      if (window.productObj.selectedProduct) return window.productObj.selectedProduct;
    }
    return null;
  }

  function getAvailableQty() {
    var selected = getSelectedProduct();

    // 1) selected.stocks
    if (selected && Array.isArray(selected.stocks)) {
      var q1 = sumStocks(selected.stocks);
      if (q1 !== null) return q1;
    }

    // 2) selected.quantity (if finite)
    if (selected) {
      if (selected.is_infinite === true) return null;
      var q2 = toNumber(selected.quantity);
      if (q2 !== null) return q2;
    }

    // 3) productObj.stocks (your theme often has it here)
    if (window.productObj && Array.isArray(window.productObj.stocks)) {
      var q3 = sumStocks(window.productObj.stocks);
      if (q3 !== null) return q3;
    }

    // 4) productObj.quantity (finite)
    if (window.productObj) {
      if (window.productObj.is_infinite === true) return null;
      var q4 = toNumber(window.productObj.quantity);
      if (q4 !== null) return q4;
    }

    return null;
  }

  function ensureBox(skuBlock) {
    var box = document.getElementById(BOX_ID);
    if (box) return box;

    var valueClass = getValueClassFromSkuBlock(skuBlock);

    box = document.createElement("div");
    box.id = BOX_ID;

    // Copy spacing style (mt-4) like other fields
    var cls = (skuBlock && skuBlock.className) ? skuBlock.className : "mt-4";
    // Avoid duplicating div-product-sku class name (not required, but safe)
    cls = cls.replace(/\bdiv-product-sku\b/g, "").trim();
    if (!cls) cls = "mt-4";

    box.className = cls;
    box.innerHTML =
      '<h4 class="product-title"></h4>' +
      '<div class="' + valueClass + '"></div>';

    skuBlock.insertAdjacentElement("afterend", box);
    return box;
  }

  function render() {
    var skuBlock = findSkuBlock();
    if (!skuBlock) return false;

    var box = ensureBox(skuBlock);

    // Keep it directly under SKU (DOM can re-render)
    if (box.previousElementSibling !== skuBlock) {
      skuBlock.insertAdjacentElement("afterend", box);
    }

    var qty = getAvailableQty();

    // If qty is not available or infinite -> hide
    if (qty === null) {
      box.style.display = "none";
      return true;
    }

    qty = Math.max(0, Math.floor(qty));

    // Out of stock -> hide (store usually shows out-of-stock state)
    if (qty <= 0) {
      box.style.display = "none";
      return true;
    }

    var titleEl = qs(".product-title", box);
    var valueEl = box.querySelector("div");

    if (titleEl) titleEl.textContent = TITLE_TEXT;
    if (valueEl) valueEl.textContent = String(qty);

    box.style.display = "";
    return true;
  }

  function start() {
    if (!isProductPage()) return;

    // Try for a long time (Zid can load productObj + blocks late)
    var tries = 0;
    var iv = setInterval(function () {
      tries++;
      try { render(); } catch (e) {}
      if (tries >= 160) clearInterval(iv); // ~40s
    }, 250);

    // Hook variant changes if theme uses productOptionsChanged
    if (typeof window.productOptionsChanged === "function" && !window.productOptionsChanged.__urgencyStockWrapped) {
      var old = window.productOptionsChanged;
      window.productOptionsChanged = function () {
        var res = old.apply(this, arguments);
        try { render(); } catch (e) {}
        return res;
      };
      window.productOptionsChanged.__urgencyStockWrapped = true;
    }

    // Update on any changes in the product form
    var form = document.getElementById("product-form") || qs('form[id*="product"]');
    if (form) {
      var t;
      form.addEventListener("change", function () {
        clearTimeout(t);
        t = setTimeout(function () { try { render(); } catch (e) {} }, 120);
      }, true);
    }

    // Observe DOM re-renders
    if (window.MutationObserver) {
      var root = document.getElementById("productPageDetails") || document.body;
      try {
        var mo = new MutationObserver(function () {
          try { render(); } catch (e) {}
        });
        mo.observe(root, { childList: true, subtree: true });
      } catch (e) {}
    }

    // Debug helper
    window.__zidUrgencyStockDebug = function () {
      console.log("[UrgencyStock] skuBlock:", findSkuBlock());
      console.log("[UrgencyStock] productObj:", window.productObj);
      console.log("[UrgencyStock] selected:", getSelectedProduct());
      console.log("[UrgencyStock] qty:", getAvailableQty());
      console.log("[UrgencyStock] node:", document.getElementById(BOX_ID));
      try { render(); } catch (e) {}
      return getAvailableQty();
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
