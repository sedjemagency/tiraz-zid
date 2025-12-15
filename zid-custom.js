/* ======================================================
   START: HERO SLIDER FIX (Tablet 640–1023)
   ====================================================== */
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
/* ======================================================
   END: HERO SLIDER FIX
   ====================================================== */



/* ======================================================
   START: COLLECTIONS SLIDER (Speed + Continuous Autoplay)
   ====================================================== */
document.addEventListener("DOMContentLoaded", function () {
  var section = document.querySelector(
    'section[section-id="slider-with-background-image-15e9c1d4-155b-4592-90c3-181634cf6d66"]'
  );
  if (!section) return;

  var el = section.querySelector("swiper-container, swiper-container-1");
  if (!el) return;

  function apply() {
    try {
      if (!el.swiper && typeof el.initialize === "function") el.initialize();
      var s = el.swiper;
      if (!s || s.destroyed) return false;

      s.params.speed = 5000;
      if (!s.params.autoplay) s.params.autoplay = {};
      s.params.autoplay.delay = 0;
      s.params.autoplay.disableOnInteraction = false;

      if (typeof s.update === "function") s.update();
      if (s.autoplay && typeof s.autoplay.start === "function") {
        s.autoplay.start();
      }

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
/* ======================================================
   END: COLLECTIONS SLIDER
   ====================================================== */



/* ======================================================
   START: URGENCY / STOCK (Zid Product Page)
   - Position: Under "رمز المنتج"
   - Title: "الكمية المتوفرة"
   - Value: number only
   ====================================================== */
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
    var el = qs(".div-product-sku");
    if (el) return el;

    var titles = qsa("h4.product-title");
    for (var i = 0; i < titles.length; i++) {
      if ((titles[i].textContent || "").includes("رمز المنتج")) {
        return titles[i].parentElement;
      }
    }
    return null;
  }

  function getValueClassFromSkuBlock(skuBlock) {
    var v =
      (skuBlock && qs(".product-sku", skuBlock)) ||
      (skuBlock && qs(".product-weight", skuBlock));
    return v && v.className ? v.className : "product-sku";
  }

  function toNumber(x) {
    var n = Number(x);
    return Number.isFinite(n) ? n : null;
  }

  function sumStocks(stocks) {
    if (!Array.isArray(stocks) || !stocks.length) return null;

    for (var i = 0; i < stocks.length; i++) {
      if (stocks[i] && stocks[i].is_infinite === true) return null;
    }

    var total = 0;
    var hasAny = false;
    for (var j = 0; j < stocks.length; j++) {
      var aq = toNumber(stocks[j] && stocks[j].available_quantity);
      if (aq !== null) {
        total += aq;
        hasAny = true;
      }
    }
    return hasAny ? total : null;
  }

  function getSelectedProduct() {
    return (
      window.current_selected_product ||
      window.selectedProduct ||
      window.selected_product ||
      (window.productObj &&
        (window.productObj.selected_product ||
          window.productObj.selectedProduct)) ||
      null
    );
  }

  function getAvailableQty() {
    var p = getSelectedProduct();

    if (p && Array.isArray(p.stocks)) {
      var q1 = sumStocks(p.stocks);
      if (q1 !== null) return q1;
    }

    if (p && p.is_infinite !== true) {
      var q2 = toNumber(p.quantity);
      if (q2 !== null) return q2;
    }

    if (window.productObj && Array.isArray(window.productObj.stocks)) {
      var q3 = sumStocks(window.productObj.stocks);
      if (q3 !== null) return q3;
    }

    if (window.productObj && window.productObj.is_infinite !== true) {
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
    box.className = "mt-4";
    box.innerHTML =
      '<h4 class="product-title"></h4>' +
      '<div class="' + valueClass + '"></div>';

    skuBlock.insertAdjacentElement("afterend", box);
    return box;
  }

  function render() {
    var skuBlock = findSkuBlock();
    if (!skuBlock) return;

    var qty = getAvailableQty();
    if (qty === null || qty <= 0) return;

    var box = ensureBox(skuBlock);

    box.querySelector(".product-title").textContent = TITLE_TEXT;
    box.querySelector("div").textContent = String(Math.floor(qty));
    box.style.display = "";
  }

  function start() {
    if (!isProductPage()) return;

    var tries = 0;
    var iv = setInterval(function () {
      tries++;
      try { render(); } catch (e) {}
      if (tries > 160) clearInterval(iv);
    }, 250);

    if (typeof window.productOptionsChanged === "function") {
      var old = window.productOptionsChanged;
      window.productOptionsChanged = function () {
        var r = old.apply(this, arguments);
        setTimeout(render, 200);
        return r;
      };
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
/* ======================================================
   END: URGENCY / STOCK
   ====================================================== */
