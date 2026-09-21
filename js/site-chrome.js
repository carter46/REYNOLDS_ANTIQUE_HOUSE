(function () {
  const NAV = [
    {
      id: "furniture",
      label: "Furniture",
      href: "/products.html?cat=Furniture",
      mega: [
        { label: "All Furniture", href: "/products.html?cat=Furniture" },
        { label: "Collection", href: "/products.html" }
      ]
    },
    {
      id: "art",
      label: "Art",
      href: "/products.html?cat=Art",
      mega: [{ label: "All Art", href: "/products.html?cat=Art" }]
    },
    {
      id: "sculpture",
      label: "Sculpture",
      href: "/products.html?cat=Sculpture",
      mega: [{ label: "All Sculpture", href: "/products.html?cat=Sculpture" }]
    },
    {
      id: "mirrors",
      label: "Mirrors",
      href: "/products.html?cat=Mirrors",
      mega: [{ label: "All Mirrors", href: "/products.html?cat=Mirrors" }]
    },
    {
      id: "decor",
      label: "Decorative Objects",
      href: "/products.html?cat=Decor",
      mega: [
        { label: "Decor", href: "/products.html?cat=Decor" },
        { label: "Accessories", href: "/products.html?cat=Accessories" }
      ]
    },
    {
      id: "lighting",
      label: "Lighting",
      href: "/products.html?cat=Lighting",
      mega: [{ label: "All Lighting", href: "/products.html?cat=Lighting" }]
    },
    {
      id: "creators",
      label: "Creators",
      href: "/index.html#row-creators",
      mega: [{ label: "Trending Creators", href: "/index.html#row-creators" }]
    },
    { id: "about", label: "About", href: "/about.html" },
    { id: "trade", label: "Trade", href: "/trade-program.html" },
    { id: "estate", label: "Estate Services", href: "/estate-services.html" },
    { id: "contact", label: "Contact", href: "/contact.html" }
  ];

  function isCurrent(page, item) {
    if (page === item.id) return true;
    if (page === "product" && (item.id === "furniture" || item.id === "products")) return true;
    if (page === "home" && item.id === "creators") return false;
    return false;
  }

  function megaHtml(item) {
    if (!item.mega || !item.mega.length) return "";
    return (
      '<div class="mega mega--' +
      item.id +
      '"><div class="mega__col"><ul class="mega__links">' +
      item.mega
        .map(function (l) {
          return '<li><a href="' + l.href + '">' + l.label + "</a></li>";
        })
        .join("") +
      "</ul></div></div>"
    );
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
        "</a>" +
        megaHtml(item) +
        "</div>"
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
      '<div class="utility-bar">',
      '  <div class="utility-bar__inner">',
      '    <div class="utility-bar__left">',
      '      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">',
      '        <path d="M12 21C12 21 4 13.5 4 8.5C4 5.46 7.134 3 12 3C16.866 3 20 5.46 20 8.5C20 13.5 12 21 12 21Z"/>',
      '        <circle cx="12" cy="8.5" r="2.5"/>',
      "      </svg>",
      "      New York City &nbsp;·&nbsp; Est. 1939",
      "    </div>",
      '    <div class="utility-bar__right">',
      '      <a href="/estate-services.html">Sell / Consign</a>',
      '      <div class="utility-bar__divider"></div>',
      '      <a href="/estate-services.html">Auctions</a>',
      '      <div class="utility-bar__divider"></div>',
      '      <a href="/trade-program.html">Trade Program</a>',
      '      <div class="utility-bar__divider"></div>',
      '      <a href="/about.html">About Us</a>',
      '      <div class="utility-bar__divider"></div>',
      '      <a href="/contact.html">Contact</a>',
      "    </div>",
      "  </div>",
      "</div>",
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
      '      <form id="product-search" class="search-input-style search-btn" action="/products.html" method="get" role="search">',
      '        <div class="input-group">',
      '          <input id="search-input" name="q" type="search" placeholder="Search..." class="form-control search-overlay__input" autocomplete="off" aria-label="Search the collection" />',
      '          <div class="input-group-addon">',
      '            <button type="submit" class="search-submit" aria-label="Submit search">',
      '              <img src="/assets/img/search-icon.png" alt="" width="16" height="16" />',
      "            </button>",
      "          </div>",
      "        </div>",
      "      </form>",
      "    </div>",
      '    <a href="/index.html" class="logo" aria-label="Reynolds Antique House home">',
      '      <img class="logo__image" src="/assets/images/reynolds_logoe.png" alt="Reynolds Antique House" width="220" height="109" />',
      "    </a>",
      '    <div class="header__icons" aria-hidden="true">',
      '      <span class="icon-btn icon-btn--spacer"></span>',
      '      <span class="icon-btn icon-btn--spacer"></span>',
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
      '    <p class="menu-flyout__note">Search the collection from the header search field.</p>',
      "  </div>",
      "</div>"
    ].join("\n");
  }

  function renderFooter() {
    const y = new Date().getFullYear();
    return [
      '<footer class="rah-site-footer newel-footer-restore" id="site-footer">',
      '  <div class="rah-footer-inner footer_top_container">',
      "    <div>",
      '      <a href="/index.html" class="footer-logo-link">',
      '        <img src="/assets/images/reynolds_logoe.png" alt="Reynolds Antique House" class="footer-logo" width="180" height="89" />',
      "      </a>",
      "      <p>A curated gallery of antiques, fine art, and decorative objects.</p>",
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
      "      <h4>Support</h4>",
      "      <ul>",
      '        <li><a href="/contact.html">Contact</a></li>',
      '        <li><a href="mailto:info@reynoldsantiquehouse.com">info@reynoldsantiquehouse.com</a></li>',
      '        <li><a href="/estate-services.html">Sell / Consign</a></li>',
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

    // Local catalog search (no Searchspring)
    const form = document.getElementById("product-search");
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        const q = (document.getElementById("search-input") || {}).value || "";
        const url = "/products.html" + (q.trim() ? "?q=" + encodeURIComponent(q.trim()) : "");
        window.location.href = url;
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initChrome);
  } else {
    initChrome();
  }
})();
