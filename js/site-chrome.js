(function () {
  const NAV = [
    {
      id: "furniture",
      label: "Furniture",
      href: "/products.html?cat=Furniture",
      groups: [
        {
          title: "Seating",
          links: [
            { label: "All Furniture", href: "/products.html?cat=Furniture" },
            { label: "Chairs", href: "/products.html?q=chair" },
            { label: "Sofas & Settees", href: "/products.html?q=sofa" },
            { label: "Benches", href: "/products.html?q=bench" }
          ]
        },
        {
          title: "Tables",
          links: [
            { label: "Dining Tables", href: "/products.html?q=dining" },
            { label: "Coffee Tables", href: "/products.html?q=coffee" },
            { label: "Consoles", href: "/products.html?q=console" },
            { label: "Desks", href: "/products.html?q=desk" }
          ]
        },
        {
          title: "Storage",
          links: [
            { label: "Cabinets", href: "/products.html?q=cabinet" },
            { label: "Chests", href: "/products.html?q=chest" },
            { label: "Commodes", href: "/products.html?q=commode" },
            { label: "Bookcases", href: "/products.html?q=bookcase" }
          ]
        },
        {
          title: "Browse",
          links: [
            { label: "Shop All Furniture", href: "/products.html?cat=Furniture" },
            { label: "Full Collection", href: "/products.html" }
          ]
        }
      ]
    },
    {
      id: "art",
      label: "Art",
      href: "/products.html?cat=Art",
      groups: [
        {
          title: "Paintings",
          links: [
            { label: "All Art", href: "/products.html?cat=Art" },
            { label: "Paintings", href: "/products.html?q=painting" },
            { label: "Portraits", href: "/products.html?q=portrait" },
            { label: "Landscapes", href: "/products.html?q=landscape" }
          ]
        },
        {
          title: "Works on Paper",
          links: [
            { label: "Still Life", href: "/products.html?q=still" },
            { label: "Prints", href: "/products.html?q=print" },
            { label: "Drawings", href: "/products.html?q=drawing" }
          ]
        }
      ]
    },
    {
      id: "sculpture",
      label: "Sculpture",
      href: "/products.html?cat=Sculpture",
      groups: [
        {
          title: "Sculpture",
          links: [
            { label: "All Sculpture", href: "/products.html?cat=Sculpture" },
            { label: "Busts", href: "/products.html?q=bust" },
            { label: "Figures", href: "/products.html?q=figure" },
            { label: "Animals", href: "/products.html?q=animal" }
          ]
        },
        {
          title: "Materials",
          links: [
            { label: "Bronze", href: "/products.html?q=bronze" },
            { label: "Marble", href: "/products.html?q=marble" },
            { label: "Stone", href: "/products.html?q=stone" }
          ]
        }
      ]
    },
    {
      id: "mirrors",
      label: "Mirrors",
      href: "/products.html?cat=Mirrors",
      groups: [
        {
          title: "Mirrors",
          links: [
            { label: "All Mirrors", href: "/products.html?cat=Mirrors" },
            { label: "Wall Mirrors", href: "/products.html?cat=Mirrors" },
            { label: "Gilt Mirrors", href: "/products.html?q=gilt" },
            { label: "Venetian", href: "/products.html?q=venetian" }
          ]
        }
      ]
    },
    {
      id: "decor",
      label: "Decorative Objects",
      href: "/products.html?cat=Decor",
      groups: [
        {
          title: "Objects",
          links: [
            { label: "All Decor", href: "/products.html?cat=Decor" },
            { label: "Accessories", href: "/products.html?cat=Accessories" },
            { label: "Vases & Urns", href: "/products.html?q=vase" },
            { label: "Boxes", href: "/products.html?q=box" }
          ]
        },
        {
          title: "More",
          links: [
            { label: "Clocks", href: "/products.html?q=clock" },
            { label: "Candlesticks", href: "/products.html?q=candle" },
            { label: "Decorative Arts", href: "/products.html?cat=Decor" }
          ]
        }
      ]
    },
    {
      id: "lighting",
      label: "Lighting",
      href: "/products.html?cat=Lighting",
      groups: [
        {
          title: "Lighting",
          links: [
            { label: "All Lighting", href: "/products.html?cat=Lighting" },
            { label: "Chandeliers", href: "/products.html?q=chandelier" },
            { label: "Sconces", href: "/products.html?q=sconce" },
            { label: "Lamps", href: "/products.html?q=lamp" }
          ]
        },
        {
          title: "More",
          links: [
            { label: "Floor Lamps", href: "/products.html?q=floor" },
            { label: "Table Lamps", href: "/products.html?q=table%20lamp" },
            { label: "Lanterns", href: "/products.html?q=lantern" }
          ]
        }
      ]
    },
    {
      id: "creators",
      label: "Creators",
      href: "/index.html#row-creators",
      groups: [
        {
          title: "Featured Creators",
          links: [
            { label: "Trending Creators", href: "/index.html#row-creators" },
            { label: "Wormley / Dunbar", href: "/products.html?q=wormley" },
            { label: "Maison Jansen", href: "/products.html?q=jansen" },
            { label: "Karl Springer", href: "/products.html?q=springer" },
            { label: "Philip Jividen", href: "/products.html?q=jividen" }
          ]
        }
      ]
    },
    { id: "about", label: "About", href: "/about.html" },
    { id: "trade", label: "Trade", href: "/trade-program.html" },
    { id: "estate", label: "Estate Services", href: "/estate-services.html" },
    { id: "contact", label: "Contact", href: "/contact.html" }
  ];

  function isCurrent(page, item) {
    if (page === item.id) return true;
    if (page === "product" && item.id === "furniture") return true;
    return false;
  }

  function megaHtml(item) {
    if (!item.groups || !item.groups.length) return "";
    const cols = item.groups
      .map(function (g) {
        return (
          '<div class="mega__col"><div class="mega__group">' +
          '<div class="mega__col-title"><a href="' +
          (g.links[0] ? g.links[0].href : item.href) +
          '">' +
          g.title +
          "</a></div>" +
          '<ul class="mega__links">' +
          g.links
            .map(function (l) {
              return '<li><a href="' + l.href + '">' + l.label + "</a></li>";
            })
            .join("") +
          "</ul></div></div>"
        );
      })
      .join("");
    return '<div class="mega mega--' + item.id + '">' + cols + "</div>";
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

  function mobileAccordion() {
    return (
      '<nav class="mobile-menu" aria-label="Mobile">' +
      '<ul class="mobile-menu__list">' +
      NAV.map(function (item) {
        if (!item.groups || !item.groups.length) {
          return (
            '<li class="mobile-menu__category">' +
            '<a class="mobile-menu__direct" href="' +
            item.href +
            '">' +
            item.label +
            "</a></li>"
          );
        }
        const panel =
          '<div class="mobile-menu__panel"><div class="mobile-menu__panel-inner">' +
          '<a class="mobile-menu__landing" href="' +
          item.href +
          '">Shop all ' +
          item.label +
          "</a>" +
          item.groups
            .map(function (g) {
              return (
                '<ul class="mobile-menu__links">' +
                g.links
                  .map(function (l) {
                    return (
                      '<li><a class="mobile-menu__link" href="' +
                      l.href +
                      '">' +
                      l.label +
                      "</a></li>"
                    );
                  })
                  .join("") +
                "</ul>"
              );
            })
            .join("") +
          "</div></div>";
        return (
          '<li class="mobile-menu__category">' +
          '<button type="button" class="mobile-menu__toggle" aria-expanded="false">' +
          "<span>" +
          item.label +
          '</span><span class="mobile-menu__chevron" aria-hidden="true"></span>' +
          "</button>" +
          panel +
          "</li>"
        );
      }).join("") +
      "</ul></nav>"
    );
  }

  function renderHeader(page) {
    return [
      '<a class="rah-skip" href="#main">Skip to content</a>',
      '<div class="utility-bar">',
      '  <div class="utility-bar__inner">',
      '    <div class="utility-bar__left">',
      '      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M12 21C12 21 4 13.5 4 8.5C4 5.46 7.134 3 12 3C16.866 3 20 5.46 20 8.5C20 13.5 12 21 12 21Z"/><circle cx="12" cy="8.5" r="2.5"/></svg>',
      "      New York City &nbsp;·&nbsp; Est. 1939",
      "    </div>",
      '    <div class="utility-bar__right">',
      '      <a href="/estate-services.html">Sell / Consign</a><div class="utility-bar__divider"></div>',
      '      <a href="/estate-services.html">Auctions</a><div class="utility-bar__divider"></div>',
      '      <a href="/trade-program.html">Trade Program</a><div class="utility-bar__divider"></div>',
      '      <a href="/about.html">About Us</a><div class="utility-bar__divider"></div>',
      '      <a href="/contact.html">Contact</a>',
      "    </div>",
      "  </div>",
      "</div>",
      '<header class="header" id="site-header" aria-label="Primary">',
      '  <div class="header__inner">',
      '    <div class="header__search">',
      '      <button class="menu-toggle" type="button" aria-label="Open navigation menu" aria-controls="menuFlyout" aria-expanded="false" data-menu-open>',
      '        <span class="menu-toggle__icon" aria-hidden="true"><span class="menu-toggle__line"></span><span class="menu-toggle__line"></span><span class="menu-toggle__line"></span></span>',
      '        <span class="menu-toggle__label">Menu</span>',
      "      </button>",
      '      <form id="product-search" class="search-input-style" action="/products.html" method="get" role="search">',
      '        <div class="input-group">',
      '          <input id="search-input" name="q" type="search" placeholder="Search..." class="form-control search-overlay__input" autocomplete="off" aria-label="Search the collection" />',
      '          <div class="input-group-addon"><button type="submit" class="search-submit" aria-label="Submit search"><img src="/assets/img/search-icon.png" alt="" width="16" height="16" /></button></div>',
      "        </div>",
      "      </form>",
      "    </div>",
      '    <a href="/index.html" class="logo" aria-label="Reynolds Antique House home">',
      '      <img class="logo__image" src="/assets/images/reynolds_logoe.png" alt="Reynolds Antique House" width="220" height="109" />',
      "    </a>",
      '    <div class="header__icons" aria-hidden="true"><span class="icon-btn icon-btn--spacer"></span><span class="icon-btn icon-btn--spacer"></span></div>',
      "  </div>",
      '  <div class="header__gold-rule" aria-hidden="true"></div>',
      "</header>",
      '<nav class="mainnav" aria-label="Main"><div class="mainnav__inner">' + navTriggers(page) + "</div></nav>",
      '<div class="menu-flyout" id="menuFlyout" hidden>',
      '  <button type="button" class="menu-flyout__backdrop" data-menu-close aria-label="Close menu"></button>',
      '  <div class="menu-flyout__panel" role="dialog" aria-modal="true" aria-label="Mobile navigation">',
      '    <div class="menu-flyout__header">',
      '      <a href="/index.html" class="menu-flyout__brand">',
      '        <img src="/assets/images/reynolds_logoe.png" alt="Reynolds Antique House" class="menu-flyout__logo" width="160" height="79" />',
      "      </a>",
      '      <button class="menu-flyout__close" type="button" aria-label="Close menu" data-menu-close>',
      '        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
      "      </button>",
      "    </div>",
      '    <form class="menu-flyout__search" action="/products.html" method="get" role="search">',
      '      <input type="search" name="q" placeholder="Search..." aria-label="Search the collection" />',
      '      <button type="submit" aria-label="Search"><img src="/assets/img/search-icon.png" alt="" width="14" height="14" /></button>',
      "    </form>",
      mobileAccordion(),
      '    <div class="menu-flyout__utility">',
      '      <div class="menu-flyout__utility-title">Quick links</div>',
      '      <ul class="menu-flyout__utility-list">',
      '        <li><a href="/estate-services.html">Sell / Consign</a></li>',
      '        <li><a href="/trade-program.html">Trade Program</a></li>',
      '        <li><a href="/about.html">About</a></li>',
      '        <li><a href="/contact.html">Contact</a></li>',
      "      </ul>",
      "    </div>",
      "  </div>",
      "</div>"
    ].join("\n");
  }

  function renderFooter() {
    const y = new Date().getFullYear();
    return [
      '<footer class="rah-site-footer newel-footer-restore" id="site-footer">',
      '  <div class="footer_top_container" style="width:100%;max-width:1200px;margin:0 auto;padding:2rem 24px;">',
      '    <div class="footer-grid">',
      "      <div>",
      '        <a href="/index.html"><img src="/assets/images/reynolds_logoe.png" alt="Reynolds Antique House" width="180" style="width:180px;height:auto;margin-bottom:1rem;" /></a>',
      '        <h3 style="color:#fff;font-style:italic;font-weight:300;margin:1rem 0 .35rem;">Follow us</h3>',
      '        <p style="color:#d7cfc4;font-size:12px;">Subscribe for inspiration. We respect your privacy.</p>',
      '        <form onsubmit="return false;" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;">',
      '          <input type="email" placeholder="Your email" disabled style="flex:1;min-width:140px;padding:10px 14px;border:0;border-radius:3px;" />',
      '          <button type="button" disabled style="padding:10px 18px;border:0;border-radius:3px;background:#c4a484;">Join</button>',
      "        </form>",
      "      </div>",
      '      <div><h4>Support</h4><ul><li><a href="/contact.html">Contact</a></li><li><a href="/estate-services.html">Estates</a></li><li><span style="opacity:.55">FAQ</span></li></ul></div>',
      '      <div><h4>About</h4><ul><li><a href="/about.html">About Reynolds</a></li><li><a href="/trade-program.html">Trade</a></li><li><a href="/estate-services.html">Sell / Consign</a></li></ul></div>',
      '      <div><h4>Shop</h4><ul><li><a href="/products.html">Collection</a></li><li><a href="/products.html?cat=Furniture">Furniture</a></li><li><a href="/products.html?cat=Lighting">Lighting</a></li><li><a href="/products.html?cat=Art">Art</a></li></ul></div>',
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

    const flyout = document.getElementById("menuFlyout");
    const toggleBtn = document.querySelector("[data-menu-open]");

    function openMenu() {
      if (!flyout) return;
      flyout.hidden = false;
      requestAnimationFrame(function () {
        flyout.classList.add("is-open");
      });
      if (toggleBtn) toggleBtn.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
    }
    function closeMenu() {
      if (!flyout) return;
      flyout.classList.remove("is-open");
      if (toggleBtn) toggleBtn.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
      setTimeout(function () {
        if (!flyout.classList.contains("is-open")) flyout.hidden = true;
      }, 420);
    }

    document.querySelectorAll("[data-menu-open]").forEach(function (b) {
      b.addEventListener("click", openMenu);
    });
    document.querySelectorAll("[data-menu-close]").forEach(function (b) {
      b.addEventListener("click", closeMenu);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });

    // Accordion categories
    document.querySelectorAll(".mobile-menu__toggle").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const li = btn.closest(".mobile-menu__category");
        const open = li.classList.contains("is-expanded");
        document.querySelectorAll(".mobile-menu__category.is-expanded").forEach(function (el) {
          el.classList.remove("is-expanded");
          const t = el.querySelector(".mobile-menu__toggle");
          if (t) t.setAttribute("aria-expanded", "false");
        });
        if (!open) {
          li.classList.add("is-expanded");
          btn.setAttribute("aria-expanded", "true");
        }
      });
    });

    // Close on nav link
    if (flyout) {
      flyout.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", closeMenu);
      });
    }

    function wireSearch(form) {
      if (!form) return;
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        const input = form.querySelector('input[name="q"]');
        const q = (input && input.value) || "";
        window.location.href =
          "/products.html" + (q.trim() ? "?q=" + encodeURIComponent(q.trim()) : "");
      });
    }
    wireSearch(document.getElementById("product-search"));
    wireSearch(document.querySelector(".menu-flyout__search"));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initChrome);
  } else {
    initChrome();
  }
})();
