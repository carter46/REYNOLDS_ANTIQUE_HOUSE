/**
 * Rebuild homepage hero/featured/trending-tail + CSS patches for chrome visibility.
 */
import fs from "fs";
import path from "path";

const root = process.cwd();
const products = JSON.parse(
  fs.readFileSync(path.join(root, "data", "products.json"), "utf8")
).products;

function esc(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}

function pickFeatured(n) {
  // Prefer SKUs that matched original homepage feel when present
  const prefer = [
    "028069",
    "NWL8736",
    "NWL6949",
    "055582",
    "DUF0266B",
    "DUF0064",
    "DUF0729",
    "063540",
    "NWL7895",
  ];
  const bySku = new Map(products.map((p) => [String(p.sku || "").toUpperCase(), p]));
  const out = [];
  for (const sku of prefer) {
    const p = bySku.get(sku.toUpperCase());
    if (p) out.push(p);
  }
  for (const p of products) {
    if (out.length >= n) break;
    if (!out.includes(p)) out.push(p);
  }
  return out.slice(0, n);
}

const featured = pickFeatured(12);
const heroA = featured[0];
const heroB = featured[1] || featured[0];

function dims(p) {
  return p.dimensions || "";
}

function featuredCard(p, i) {
  const img = (p.images && p.images[0] && p.images[0].src) || "/assets/images/placeholders/no-image.jpg";
  const href = "/product-details.html?id=" + encodeURIComponent(p.id);
  return `
    <div class="carousel-item${i === 0 ? " active" : ""}">
      <div class="col-xs-12 col-sm-12 col-md-6 col-lg-4 col-xl-4 col-xxl-3 justify-content-xxl-center align-items-xxl-center imgboxsplit">
        <div class="card card-body">
          <div class="featured_container_col">
            <div class="shadow1 hvrcls img_box_shadow">
              <div class="d-xxl-flex justify-content-xxl-center product-container" style="text-align:center;">
                <a href="${href}"><img src="${esc(img)}" class="product-image" alt="${esc(p.title)}"></a>
              </div>
              <div class="price-part d-xxl-flex flex-column justify-content-xxl-center align-items-xxl-center" style="border-top: 1px none var(--bs-primary-bg-subtle);">
                <h2 class="fw-light text-dark prod_title">${esc(p.title)}</h2>
                <div class="d-flex d-xxl-flex flex-row justify-content-xxl-start align-items-xxl-end" style="width: 100%;position: relative;top:15px;">
                  <div class="d-flex flex-column justify-content-xxl-start align-items-xxl-start prince_colm">
                    <div class="d-flex d-xxl-flex flex-row justify-content-xxl-start align-items-xxl-end" style="width: 100%;">
                      <p class="fw-normal text-dark" style="color:#000;font-size:14px;font-family:ASTORIA,Georgia,serif;margin-bottom:-4px;">${esc(p.price || "")}</p>
                      ${p.price ? '<p class="fw-light text-dark" style="color:#000;font-size:12px;font-family:ASTORIA,Georgia,serif;margin:0 0 0 4px;">(USD)</p>' : ""}
                    </div>
                    <div class="d-flex d-xxl-flex flex-row align-items-xxl-center" style="line-height:16px;padding-top:10px;">
                      <p class="fw-light text-start text-dark" style="font-size:14px;font-family:ASTORIA,Georgia,serif;margin:5px 0 0 0;">Available</p>
                    </div>
                    <div class="fw-light text-dark d-flex flex-row" style="width:50%;">
                      <p class="fw-light text-muted" style="color:#000;font-size:12px;font-family:ASTORIA,Georgia,serif;margin:0;padding-top:4px;">#${esc(p.sku || "")}</p>
                    </div>
                  </div>
                  <div class="d-flex flex-row justify-content-end align-items-end dimension_col">
                    <p class="fw-light" style="text-align:right;color:#000;font-size:12px;font-family:ASTORIA,Georgia,serif;font-style:italic;margin:0;">${esc(dims(p))}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>`;
}

const featuredSection = `
<div class="container-fluid featured_container" style="position: relative;top: 0px;">
  <div class="row">
    <div class="col d-flex flex-column justify-content-center align-items-center">
      <h5 class="text-uppercase fw-bold text-center text-secondary d-flex justify-content-center">discover rare objects</h5>
      <h2 class="text-uppercase fw-light text-center text-dark d-flex justify-content-center" style="font-size: 24px;">featured inventory</h2>
    </div>
  </div>
  <div class="row row-cols-1 d-md-flex" style="background:#fff;margin:0;padding-top:20px;">
    <div id="myCarousel" class="carousel slide container-fluid" data-bs-ride="carousel" style="width:100%">
      <div class="carousel-inner w-100">
        ${featured.map(featuredCard).join("\n")}
      </div>
      <button class="carousel-control-prev" type="button" data-bs-target="#myCarousel" data-bs-slide="prev">
        <span class="carousel-control-prev-icon" aria-hidden="true"></span>
        <span class="visually-hidden">Previous</span>
      </button>
      <button class="carousel-control-next" type="button" data-bs-target="#myCarousel" data-bs-slide="next">
        <span class="carousel-control-next-icon" aria-hidden="true"></span>
        <span class="visually-hidden">Next</span>
      </button>
    </div>
  </div>
</div>`;

const trendingTail = `
<div class="container-fluid featured_container newel_new_arrival related_item_container" style="position:relative;margin-top:48px;">
  <div class="row">
    <div class="col d-flex flex-column justify-content-center align-items-center">
      <h5 class="text-uppercase fw-bold text-center text-secondary">trending</h5>
      <h2 class="text-uppercase fw-light text-center text-dark" style="font-size:24px;">more from the collection</h2>
    </div>
  </div>
  <div class="row" style="background:#fff;margin:0;padding-top:20px;">
    <div id="myCarousel3" class="carousel slide container-fluid" data-bs-ride="carousel" style="width:100%">
      <div class="carousel-inner w-100">
        ${featured
          .slice()
          .reverse()
          .map((p, i) => featuredCard(p, i))
          .join("\n")}
      </div>
      <button class="carousel-control-prev" type="button" data-bs-target="#myCarousel3" data-bs-slide="prev">
        <span class="carousel-control-prev-icon" aria-hidden="true"></span>
        <span class="visually-hidden">Previous</span>
      </button>
      <button class="carousel-control-next" type="button" data-bs-target="#myCarousel3" data-bs-slide="next">
        <span class="carousel-control-next-icon" aria-hidden="true"></span>
        <span class="visually-hidden">Next</span>
      </button>
    </div>
  </div>
</div>`;

const heroImg1 = (heroA.images && heroA.images[0] && heroA.images[0].src) || "/assets/images/reynolds_logoe.png";
const heroImg2 = (heroB.images && heroB.images[0] && heroB.images[0].src) || heroImg1;

const hero = `
<section class="newel-hero" data-index="0" aria-label="Featured banners" aria-roledescription="carousel">
  <div class="newel-track">
    <article class="newel-slide newel-slide--estate" aria-roledescription="slide" aria-label="1 of 2">
      <div class="newel-slide__inner">
        <div class="newel-copy">
          <p class="newel-eyebrow">Reynolds Antique House Estate Services · New York · Since 1939</p>
          <h2 class="newel-title">Eighty-five years of knowing exactly what it’s worth.</h2>
          <p class="newel-description">From a single exceptional object to an entire estate, Reynolds Antique House brings expertise, discretion, and trusted buyer relationships to every collection.</p>
          <div class="newel-actions">
            <a class="newel-button" href="/estate-services.html" style="color: var(--maroon2);">EXPLORE ESTATE SERVICES</a>
            <a class="newel-button newel-button--outline" href="/estate-services.html">REQUEST A FREE VALUATION</a>
          </div>
        </div>
        <div class="newel-media">
          <img src="${esc(heroImg1)}" alt="${esc(heroA.title)}" />
        </div>
      </div>
    </article>
    <article class="newel-slide newel-slide--auction" aria-roledescription="slide" aria-label="2 of 2">
      <div class="newel-slide__inner">
        <div class="newel-copy">
          <p class="newel-eyebrow">Reynolds Antique House · Collection</p>
          <h2 class="newel-title">${esc(heroB.title)}</h2>
          <p class="newel-description">${esc((heroB.description || "").slice(0, 220))}${(heroB.description || "").length > 220 ? "…" : ""}</p>
          <div class="newel-actions">
            <a class="newel-button" href="/product-details.html?id=${encodeURIComponent(heroB.id)}" style="color: var(--gold2);">VIEW PIECE</a>
            <a class="newel-button newel-button--filled" href="/products.html" style="color:#000;">BROWSE COLLECTION</a>
          </div>
        </div>
        <div class="newel-media">
          <img src="${esc(heroImg2)}" alt="${esc(heroB.title)}" />
        </div>
      </div>
    </article>
  </div>
  <button class="newel-arrow newel-arrow--prev" type="button" aria-label="Previous banner"></button>
  <button class="newel-arrow newel-arrow--next" type="button" aria-label="Next banner"></button>
  <p class="newel-sr-only" data-hero-status aria-live="polite" aria-atomic="true">Showing banner 1 of 2</p>
</section>`;

// Read current index and splice sections
let html = fs.readFileSync(path.join(root, "index.html"), "utf8");

// Replace hero section
html = html.replace(/<section class="newel-hero"[\s\S]*?<\/section>/, hero.trim());

// Replace featured block (old rah-grid or featured_container)
html = html.replace(
  /<section class="featured_container[\s\S]*?<\/section>|<div class="container-fluid featured_container"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/,
  ""
);
html = html.replace(
  /<section class="featured_container[\s\S]*?<\/section>/,
  ""
);
html = html.replace(
  /<section class="featured_container rah-featured-restore[\s\S]*?<\/section>/,
  featuredSection
);

if (!html.includes('id="myCarousel"')) {
  // insert featured after hero
  html = html.replace(/(<\/section>\s*)(<a class="estate-hero")/, `$1${featuredSection}\n$2`);
}

// Fix remaining Newel UI branding (not historical story body — leave Jackie paragraph)
html = html.replace(/Newel Estate Services/g, "Reynolds Antique House Estate Services");
html = html.replace(/Where you(?:'|’)ve <em>seen Newel<\/em>/gi, "Where you&rsquo;ve <em>seen this gallery</em>");
html = html.replace(/featured Newel/g, "featured this gallery");
html = html.replace(/What the world is <em>hunting for<\/em> at Newel/g, "What the world is <em>hunting for</em> at Reynolds Antique House");
html = html.replace(/at Newel</g, "at Reynolds Antique House<");

// Ensure trending tail before get-to-know end / before closing main
if (!html.includes('id="myCarousel3"')) {
  html = html.replace(
    /(<section class="newel-featured-story"[\s\S]*?<\/section>)/,
    `$1\n${trendingTail}`
  );
}

// Head CSS for featured cards + bootstrap
if (!html.includes("/assets/css/newel/styles.css")) {
  html = html.replace(
    '<link rel="stylesheet" href="/assets/css/home-newel.css" />',
    `<link rel="stylesheet" href="/assets/css/home-newel.css" />
  <link rel="stylesheet" href="/assets/css/newel/styles.css" />
  <link rel="stylesheet" href="/assets/fonts/line-awesome.min.css" />
  <link rel="stylesheet" href="/assets/fonts/material-icons.min.css" />`
  );
}
if (!html.includes("bootstrap.min.js")) {
  html = html.replace(
    '<script src="/js/site-chrome.js"></script>',
    `<script src="/assets/js/jquery-3.7.1.min.js"></script>
  <script src="/assets/vendor/bootstrap/bootstrap.min.js"></script>
  <script src="/js/site-chrome.js"></script>`
  );
}

// Fix homepage scripts: hero + multi-item carousel helper
const script = `
  <script>
    (function () {
      const root = document.querySelector(".newel-hero");
      if (root) {
        const slides = [...root.querySelectorAll(".newel-slide")];
        const status = root.querySelector("[data-hero-status]");
        let index = 0;
        function show(next) {
          if (slides.length < 2) return;
          index = (next + slides.length) % slides.length;
          root.setAttribute("data-index", String(index));
          slides.forEach((s, i) => s.setAttribute("aria-hidden", i === index ? "false" : "true"));
          if (status) status.textContent = "Showing banner " + (index + 1) + " of " + slides.length;
        }
        root.querySelectorAll(".newel-arrow--prev").forEach((b) =>
          b.addEventListener("click", function (e) { e.preventDefault(); show(index - 1); })
        );
        root.querySelectorAll(".newel-arrow--next").forEach((b) =>
          b.addEventListener("click", function (e) { e.preventDefault(); show(index + 1); })
        );
        show(0);
        setInterval(function () { show(index + 1); }, 7000);
      }

      // Multi-card bootstrap carousel (archive pattern: move items)
      function multiCarousel(id) {
        const el = document.querySelector(id);
        if (!el || !window.bootstrap) return;
        const items = el.querySelectorAll(".carousel-item");
        items.forEach((el) => {
          const minPerSlide = 4;
          let next = el.nextElementSibling;
          for (let i = 1; i < minPerSlide; i++) {
            if (!next) next = items[0];
            const clone = next.querySelector(".col-md-6, .col-lg-4, .imgboxsplit, [class*='col-']");
            if (clone) {
              const c = clone.cloneNode(true);
              el.appendChild(c);
            }
            next = next.nextElementSibling;
          }
        });
      }
      document.addEventListener("DOMContentLoaded", function () {
        multiCarousel("#myCarousel");
        multiCarousel("#myCarousel3");
      });

      document.querySelectorAll(".row2").forEach((row) => {
        const track = row.querySelector(".track");
        if (!track) return;
        row.querySelectorAll(".arrow-btn").forEach((btn) => {
          btn.addEventListener("click", () => {
            const dir = parseInt(btn.getAttribute("data-dir"), 10) || 1;
            track.scrollBy({ left: dir * Math.min(400, track.clientWidth * 0.8), behavior: "smooth" });
          });
        });
      });
    })();
  </script>
`;

html = html.replace(/<script>\s*\(function \(\) \{[\s\S]*?<\/script>\s*<\/body>/, script + "\n</body>");

fs.writeFileSync(path.join(root, "index.html"), html);

// CSS patch: never hide header search; force logo image
const patch = `

/* === Reynolds chrome visibility patches === */
#product-search.search-input-style,
#product-search.search-btn,
form#product-search {
  display: flex !important;
}
@media (max-width: 1100px) {
  #product-search.search-input-style,
  #product-search.search-btn,
  form#product-search {
    display: flex !important;
  }
}
.logo__image {
  display: block !important;
  width: 220px !important;
  height: auto !important;
  max-height: 100px;
  object-fit: contain;
}
.utility-bar {
  display: block !important;
}
.newel-arrow {
  z-index: 20 !important;
  pointer-events: auto !important;
}
.featured_container .card {
  height: 100%;
  min-height: 520px;
}
.featured_container .product-image {
  width: 100%;
  height: 280px;
  object-fit: contain;
  margin: 0 auto;
}
.featured_container .prod_title {
  min-height: 3.2em;
  font-size: 15px !important;
  text-align: center;
}
.featured_container .carousel-inner {
  display: flex;
}
.featured_container .carousel-item {
  margin-right: 0;
  flex: 0 0 100%;
  display: none;
}
.featured_container .carousel-item.active {
  display: flex;
  flex-wrap: wrap;
}
`;

fs.appendFileSync(path.join(root, "assets", "css", "chrome.css"), patch);
fs.appendFileSync(path.join(root, "assets", "css", "home-newel.css"), patch);

console.log("Homepage rebuilt; featured", featured.length, "hero skus", heroA.sku, heroB.sku);
