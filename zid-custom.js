(function () {
  function inject() {
    // prevent duplicates
    var old = document.getElementById("sedjem-zid-custom-js");
    if (old) old.remove();

    // cache-bust every load
    var u =
      "https://cdn.jsdelivr.net/gh/" +
      "sedjemagency/tiraz-zid@main/" +
      "zid-custom.js" +
      "?v=" + Date.now();

    var s = document.createElement("script");
    s.id = "sedjem-zid-custom-js";
    s.src = u;
    s.defer = true;

    document.head.appendChild(s);
  }

  // normal load + refresh + back/forward cache
  window.addEventListener("pageshow", inject);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inject);
  } else {
    inject();
  }
})();
