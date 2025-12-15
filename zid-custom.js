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
   START: URGENCY / STOCK (Zid – API Based)
   Position: Under "رمز المنتج"
   ====================================================== */
(function () {
  if (window.__ZID_URGENCY_STOCK_API__) return;
  window.__ZID_URGENCY_STOCK_API__ = true;

  var BOX_ID = "zid-urgency-stock";
  var TITLE_TEXT = "الكمية المتوفرة";

  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function findSkuBlock() {
    return qs(".div-product-sku");
  }

  function getProductId() {
    var el = qs("#product-id");
    return el && el.value ? el.value : null;
  }

  function ensureBox(skuBlock) {
    var box = document.getElementById(BOX_ID);
    if (box) return box;

    var valueClass = "product-sku";

    box = document.createElement("div");
    box.id = BOX_ID;
    box.className = "mt-4";
    box.innerHTML =
      '<h4 class="product-title"></h4>' +
      '<div class="' + valueClass + '"></div>';

    skuBlock.insertAdjacentElement("afterend", box);
    return box;
  }

  function fetchStock(productId) {
    return fetch("/api/v1/products/" + productId, {
      credentials: "same-origin"
    })
      .then(function (r) {
        if (!r.ok) throw new Error("API error");
        return r.json();
      })
      .then(function (data) {
        if (!data || !Array.isArray(data.stocks)) return null;

        var total = 0;
        for (var i = 0; i < data.stocks.length; i++) {
          var s = data.stocks[i];
          if (!s) continue;
          if (s.is_infinite === true) return null;
          if (typeof s.available_quantity === "number") {
            total += s.available_quantity;
          }
        }
        return total > 0 ? total : null;
      })
      .catch(function () {
        return null;
      });
  }

  function render() {
    var skuBlock = findSkuBlock();
    if (!skuBlock) return;

    var productId = getProductId();
    if (!productId) return;

    var box = ensureBox(skuBlock);

    fetchStock(productId).then(function (qty) {
      if (!qty) {
        box.style.display = "none";
        return;
      }

      box.style.display = "";
      box.querySelector(".product-title").textContent = TITLE_TEXT;
      box.querySelector("div").textContent = qty;
    });
  }

  function start() {
    var tries = 0;
    var iv = setInterval(function () {
      tries++;
      render();
      if (tries > 30) clearInterval(iv);
    }, 300);

    // Re-render on variant change
    if (typeof window.productOptionInputChanged === "function") {
      var old = window.productOptionInputChanged;
      window.productOptionInputChanged = function () {
        old.apply(this, arguments);
        setTimeout(render, 300);
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
