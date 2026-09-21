(function () {
  const NAV = [
    { id: "home", label: "Home", href: "/index.html" },
    { id: "products", label: "Collection", href: "/products.html" },
    { id: "about", label: "About", href: "/about.html" },
    { id: "trade", label: "Trade", href: "/trade-program.html" },
    { id: "estate", label: "Estate Services", href: "/estate-services.html" },
    { id: "contact", label: "Contact", href: "/contact.html" }
  ];

  function navLinks(page) {
    return NAV.filter((n) => n.id !== "home").map((item) => {
      const cur = page === item.id || (page === "product" && item.id === "products");
      return '<a href="' + item.href + '"' + (cur ? ' aria-current="page"' : "") + ">" + item.label + "</a>";
    }).join("\n");
  }

  function renderHeader(page) {
    return [
      '<a class="rah-skip" href="#main">Skip to content</a>',
      '<header id="site-header" aria-label="Primary">',
      '  <div class="rah-header-inner">',
      '    <a class="rah-brand" href="/index.html" aria-label="Reynolds Antique House home">Reynolds Antique House<span>Fine Antiques &amp; Decorative Arts</span></a>',
      '    <nav class="rah-nav" aria-label="Main">' + navLinks(page) + "</nav>",
      '    <button class="rah-menu-btn" type="button" aria-label="Open menu" data-menu-open>☰</button>',
      "  </div>",
      '  <div class="rah-gold-rule" aria-hidden="true"></div>',
      "</header>",
      '<div class="rah-mobile" id="mobile-nav" hidden>',
      '  <div class="rah-mobile-top">',
      '    <a class="rah-brand" href="/index.html">Reynolds Antique House</a>',
      '    <button class="rah-menu-btn" type="button" aria-label="Close menu" data-menu-close>×</button>',
      "  </div>",
      "  <nav aria-label="Mobile">" + navLinks(page) + "</nav>",
      '  <p class="rah-search-note">Browse the Collection page to explore the catalog. Live search will return in a future update.</p>',
      "</div>"
    ].join("\n");
  }

  function renderFooter() {
    const y = new Date().getFullYear();
    return [
      '<footer id="site-footer">',
      '  <div class="rah-footer-inner">',
      "    <div>",
      '      <div class="rah-footer-brand">Reynolds Antique House</div>',
      "      <p>A curated static gallery of antiques, fine art, and decorative objects — preserved for browsing offline and on the new site.</p>",
      "    </div>",
      "    <div>",
      "      <h4>Explore</h4>",
      "      <ul>",
      '        <li><a href="/products.html">Collection</a></li>',
      '        <li><a href="/about.html">About</a></li>',
      '        <li><a href="/trade-program.html">Trade Program</a></li>',
      '        <li><a href="/estate-services.html">Estate Services</a></li>',
      "      </ul>",
      "    </div>",
      "    <div>",
      "      <h4>Contact</h4>",
      "      <ul>",
      '        <li><a href="/contact.html">Contact form</a></li>',
      '        <li><a href="mailto:info@reynoldsantiquehouse.com">info@reynoldsantiquehouse.com</a></li>',
      "      </ul>",
      "    </div>",
      "  </div>",
      '  <div class="rah-footer-base"><p>© ' + y + " Reynolds Antique House. All rights reserved.</p></div>",
      "</footer>"
    ].join("\n");
  }

  function initChrome() {
    const page = document.body.getAttribute("data-page") || "home";
    const headerRoot = document.getElementById("site-header-root");
    const footerRoot = document.getElementById("site-footer-root");
    if (headerRoot) headerRoot.innerHTML = renderHeader(page);
    if (footerRoot) footerRoot.innerHTML = renderFooter();

    const mobile = document.getElementById("mobile-nav");
    function openMenu() {
      if (!mobile) return;
      mobile.hidden = false;
      requestAnimationFrame(function () { mobile.classList.add("is-open"); });
      document.body.style.overflow = "hidden";
    }
    function closeMenu() {
      if (!mobile) return;
      mobile.classList.remove("is-open");
      document.body.style.overflow = "";
      setTimeout(function () {
        if (!mobile.classList.contains("is-open")) mobile.hidden = true;
      }, 350);
    }
    document.querySelectorAll("[data-menu-open]").forEach(function (b) { b.addEventListener("click", openMenu); });
    document.querySelectorAll("[data-menu-close]").forEach(function (b) { b.addEventListener("click", closeMenu); });
    if (mobile) mobile.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", closeMenu); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initChrome);
  else initChrome();
})();
