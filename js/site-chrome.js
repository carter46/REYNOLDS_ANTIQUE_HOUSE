(function () {
  const NAV = [
    { id: "products", label: "Collection", href: "/products.html" },
    { id: "furniture", label: "Furniture", href: "/products.html?cat=Furniture" },
    { id: "sculpture", label: "Sculpture", href: "/products.html?cat=Sculpture" },
    { id: "mirrors", label: "Mirrors", href: "/products.html?cat=Mirrors" },
    { id: "lighting", label: "Lighting", href: "/products.html?cat=Lighting" },
    { id: "about", label: "About", href: "/about.html" },
    { id: "trade", label: "Trade", href: "/trade-program.html" },
    { id: "estate", label: "Estate Services", href: "/estate-services.html" },
    { id: "contact", label: "Contact", href: "/contact.html" }
  ];

  function isCurrent(page, item) {
    if (page === item.id) return true;
    if (page === "product" && item.id === "products") return true;
    if (page === "home" && item.id === "products") return false;
    return false;
  }

  function navTriggers(page) {
    return NAV.map(function (item) {
      const cur = isCurrent(page, item);
      return (
        '<div class="nav-item">' +
        '<a href="' +
        item.href +
        '" class="nav-item__trigger"' +
        (cur ? ' aria-current="page"' : "") +
        ">" +
        item.label +
        "</a></div>"
      );
    }).join("\n");
  }

  function mobileLinks(page) {
    return NAV.map(function (item) {
      const cur = isCurrent(page, item);
      return (
        '<a href="' +
        item.href +
        '"' +
        (cur ? ' aria-current="page"' : "") +
        ">" +
        item.label +
        "</a>"
      );
    }).join("\n");
  }

  function renderHeader(page) {
    return [
      '<a class="rah-skip" href="#main">Skip to content</a>',
      '<header class="header" id="site-header" aria-label="Primary">',
      '  <div class="header__inner">',
      '    <div class="header__search">',
      '      <button class="menu-toggle" type="button" aria-label="Open navigation menu" data-menu-open>',
      '        <span class="menu-toggle__icon" aria-hidden="true">',
      '          <span class="menu-toggle__line"></span>',
      '          <span class="menu-toggle__line"></span>',
      '          <span class="menu-toggle__line"></span>',
      "        </span>",
      '        <span class="menu-toggle__label">Menu</span>',
      "      </button>",
      "    </div>",
      '    <a href="/index.html" class="logo" aria-label="Reynolds Antique House home">',
      '      <span class="logo__wordmark">Reynolds Antique House</span>',
      '      <span class="logo__tag">Fine Antiques &amp; Decorative Arts</span>',
      "    </a>",
      '    <div class="header__icons">',
      '      <span class="search-disabled-note">Browse the Collection to explore the catalog. Live search returns in a future update.</span>',
      "    </div>",
      "  </div>",
      '  <div class="header__gold-rule" aria-hidden="true"></div>',
      "</header>",
      '<nav class="mainnav" aria-label="Main">',
      '  <div class="mainnav__inner">',
      navTriggers(page),
      "  </div>",
      "</nav>",
      '<div class="menu-flyout" id="menuFlyout" hidden>',
      '  <div class="menu-flyout__backdrop" data-menu-close></div>',
      '  <div class="menu-flyout__panel" role="dialog" aria-label="Mobile navigation">',
      '    <div class="menu-flyout__header">',
      '      <div class="menu-flyout__title">Reynolds Antique House</div>',
      '      <button class="menu-flyout__close" type="button" aria-label="Close menu" data-menu-close>×</button>',
      "    </div>",
      '    <nav class="menu-flyout__nav">' + mobileLinks(page) + "</nav>",
      '    <p class="menu-flyout__note">Browse the Collection page to explore the catalog. Live search returns in a future update.</p>',
      "  </div>",
      "</div>"
    ].join("\n");
  }

  function renderFooter() {
    const y = new Date().getFullYear();
    return [
      '<footer class="rah-site-footer" id="site-footer">',
      '  <div class="rah-footer-inner">',
      "    <div>",
      '      <div class="rah-footer-brand">Reynolds Antique House</div>',
      "      <p>A curated static gallery of antiques, fine art, and decorative objects.</p>",
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
      '  <div class="rah-footer-base"><p>© ' +
        y +
        " Reynolds Antique House. All rights reserved.</p></div>",
      "</footer>"
    ].join("\n");
  }

  function initChrome() {
    const page = document.body.getAttribute("data-page") || "home";
    const headerRoot = document.getElementById("site-header-root");
    const footerRoot = document.getElementById("site-footer-root");
    if (headerRoot) headerRoot.innerHTML = renderHeader(page);
    if (footerRoot) footerRoot.innerHTML = renderFooter();

    const flyout = document.getElementById("menuFlyout");
    function openMenu() {
      if (!flyout) return;
      flyout.hidden = false;
      requestAnimationFrame(function () {
        flyout.classList.add("is-open");
      });
      document.body.style.overflow = "hidden";
    }
    function closeMenu() {
      if (!flyout) return;
      flyout.classList.remove("is-open");
      document.body.style.overflow = "";
      setTimeout(function () {
        if (!flyout.classList.contains("is-open")) flyout.hidden = true;
      }, 200);
    }
    document.querySelectorAll("[data-menu-open]").forEach(function (b) {
      b.addEventListener("click", openMenu);
    });
    document.querySelectorAll("[data-menu-close]").forEach(function (b) {
      b.addEventListener("click", closeMenu);
    });
    if (flyout) {
      flyout.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", closeMenu);
      });
    }
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initChrome);
  } else {
    initChrome();
  }
})();
