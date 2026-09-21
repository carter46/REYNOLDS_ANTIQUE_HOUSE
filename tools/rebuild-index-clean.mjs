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
    if (!out.find((x) => x.id === p.id)) out.push(p);
  }
  return out.slice(0, n);
}

const featured = pickFeatured(12);
const heroA = featured[0];
const heroB = featured[1] || featured[0];

function featuredCard(p, i) {
  const img =
    (p.images && p.images[0] && p.images[0].src) ||
    "/assets/images/placeholders/no-image.jpg";
  const href = "/product-details.html?id=" + encodeURIComponent(p.id);
  return `
    <div class="carousel-item${i === 0 ? " active" : ""}">
      <div class="col-xs-12 col-sm-12 col-md-6 col-lg-4 col-xl-3 imgboxsplit">
        <div class="card card-body h-100">
          <div class="featured_container_col">
            <div class="shadow1 img_box_shadow">
              <div class="product-container" style="text-align:center;">
                <a href="${href}"><img src="${esc(img)}" class="product-image" alt="${esc(p.title)}" loading="lazy"></a>
              </div>
              <div class="price-part" style="padding:12px 8px 20px;">
                <h2 class="fw-light text-dark prod_title">${esc(p.title)}</h2>
                <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-end;">
                  <div>
                    <p style="margin:0;font-size:14px;font-family:Georgia,serif;">${esc(p.price || "")}${p.price ? ' <span style="font-size:12px;">(USD)</span>' : ""}</p>
                    <p style="margin:6px 0 0;font-size:12px;color:#666;">#${esc(p.sku || "")}</p>
                  </div>
                  <p style="margin:0;font-size:12px;font-style:italic;text-align:right;max-width:45%;">${esc(p.dimensions || "")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>`;
}

function carousel(id, items) {
  return `
<div id="${id}" class="carousel slide container-fluid" data-bs-ride="carousel" style="width:100%">
  <div class="carousel-inner w-100">
    ${items.map((p, i) => featuredCard(p, i)).join("\n")}
  </div>
  <button class="carousel-control-prev" type="button" data-bs-target="#${id}" data-bs-slide="prev">
    <span class="carousel-control-prev-icon" aria-hidden="true"></span>
    <span class="visually-hidden">Previous</span>
  </button>
  <button class="carousel-control-next" type="button" data-bs-target="#${id}" data-bs-slide="next">
    <span class="carousel-control-next-icon" aria-hidden="true"></span>
    <span class="visually-hidden">Next</span>
  </button>
</div>`;
}

const trending = fs.readFileSync(
  path.join(root, "tools", "reports", "extracted", "trending.html"),
  "utf8"
);
let trendingLocal = trending
  .replace(/at Newel/g, "at Reynolds Antique House")
  .replace(/src="img\//g, 'src="/assets/img/')
  .replace(/href="https:\/\/www\.newel\.com\/[^"]*"/g, 'href="/products.html"')
  .replace(/href="products[^"]*"/g, 'href="/products.html"')
  .replace(/href="product[^"]*"/g, 'href="/products.html"')
  .replace(/\s+target="_blank"/g, "")
  .replace(/\s+rel="noopener"/g, "")
  .replace(/Where you've <em>seen Newel<\/em>/gi, "Where you&rsquo;ve <em>seen this gallery</em>")
  .replace(/featured Newel/gi, "featured this gallery");

// category link improvements
trendingLocal = trendingLocal
  .replace(
    /href="\/products\.html">(\s*)<img src="\/assets\/img\/home_slider\/category\/wall-mirrors/,
    'href="/products.html?cat=Mirrors">$1<img src="/assets/img/home_slider/category/wall-mirrors'
  )
  .replace(
    /href="\/products\.html">(\s*)<img src="\/assets\/img\/home_slider\/category\/murano-glass-lighting/,
    'href="/products.html?cat=Lighting">$1<img src="/assets/img/home_slider/category/murano-glass-lighting'
  )
  .replace(
    /href="\/products\.html">(\s*)<img src="\/assets\/img\/home_slider\/category\/busts/,
    'href="/products.html?cat=Sculpture">$1<img src="/assets/img/home_slider/category/busts'
  )
  .replace(
    /href="\/products\.html">(\s*)<img src="\/assets\/img\/home_slider\/category\/portraits/,
    'href="/products.html?cat=Art">$1<img src="/assets/img/home_slider/category/portraits'
  )
  .replace(
    /href="\/products\.html">(\s*)<img src="\/assets\/img\/home_slider\/category\/still-life/,
    'href="/products.html?cat=Art">$1<img src="/assets/img/home_slider/category/still-life'
  )
  .replace(
    /href="\/products\.html">(\s*)<img src="\/assets\/img\/home_slider\/category\/victorian-table-lamps/,
    'href="/products.html?cat=Lighting">$1<img src="/assets/img/home_slider/category/victorian-table-lamps'
  )
  .replace(
    /href="\/products\.html">(\s*)<img src="\/assets\/img\/home_slider\/category\/brass-coffee-tables/,
    'href="/products.html?cat=Furniture">$1<img src="/assets/img/home_slider/category/brass-coffee-tables'
  );

const press = `
<div class="press" aria-label="Press mentions">
  <span class="eyebrow2" style="justify-content:center;display:flex;gap:8px;"><span class="dot"></span>In the press</span>
  <h2>Where you&rsquo;ve <em>seen</em> this gallery tradition</h2>
  <p style="max-width:36rem;margin:12px auto 0;color:#6b5e52;font-size:.95rem;text-align:center;">
    Historical press associations from the original gallery lineage are preserved for continuity.
  </p>
  <div class="press-carousel">
    <div class="press-track" id="pressTrack">
      <span class="press-item">ARCHITECTURAL DIGEST</span>
      <span class="press-item">ELLE DECOR</span>
      <span class="press-item">The New York Times</span>
      <span class="press-item">GALERIE</span>
      <span class="press-item">BUSINESS OF HOME</span>
      <span class="press-item">ARCHITECTURAL DIGEST</span>
      <span class="press-item">ELLE DECOR</span>
      <span class="press-item">The New York Times</span>
      <span class="press-item">GALERIE</span>
      <span class="press-item">BUSINESS OF HOME</span>
    </div>
  </div>
</div>`;

if (!trendingLocal.includes('class="press"')) {
  trendingLocal = trendingLocal.replace("</section>", press + "\n</section>");
}

const heroImg1 =
  (heroA.images && heroA.images[0] && heroA.images[0].src) ||
  "/assets/images/reynolds_logoe.png";
const heroImg2 =
  (heroB.images && heroB.images[0] && heroB.images[0].src) || heroImg1;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Reynolds Antique House | Antiques &amp; Decorative Arts</title>
  <meta name="description" content="Reynolds Antique House — curated antiques, fine art, and decorative objects." />
  <meta name="theme-color" content="#1a1410" />
  <link rel="stylesheet" href="/assets/css/chrome.css" />
  <link rel="stylesheet" href="/assets/css/home-newel.css" />
  <link rel="stylesheet" href="/assets/css/newel/styles.css" />
  <link rel="stylesheet" href="/assets/vendor/bootstrap/bootstrap.min.css" />
</head>
<body data-page="home">
  <div id="site-header-root"></div>
  <main id="main">

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
          <p class="newel-description">${esc((heroB.description || "Explore the collection.").slice(0, 220))}</p>
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
  <p class="newel-sr-only" data-hero-status aria-live="polite">Showing banner 1 of 2</p>
</section>

<div class="container-fluid featured_container" style="position:relative;top:0;">
  <div class="row">
    <div class="col d-flex flex-column justify-content-center align-items-center">
      <h5 class="text-uppercase fw-bold text-center text-secondary">discover rare objects</h5>
      <h2 class="text-uppercase fw-light text-center text-dark" style="font-size:24px;">featured inventory</h2>
    </div>
  </div>
  <div class="row" style="background:#fff;margin:0;padding-top:20px;">
    ${carousel("myCarousel", featured)}
  </div>
</div>

<a class="estate-hero" href="/estate-services.html">
  <div class="eh-frame">
    <span class="eh-kicker">Reynolds Antique House Estate Services &middot; Est. 1939</span>
    <h1>Sell, Consign, Auction <em>with Reynolds</em></h1>
    <p class="eh-sub">A trusted home for consigning, selling, and auctioning fine antiques and decorative arts.</p>
    <span class="eh-cta">Learn More / Get Free Valuation<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14m-6-7l7 7-7 7"/></svg></span>
  </div>
</a>

${trendingLocal}

<section class="newel-featured-story" aria-labelledby="newel-featured-story-title">
  <div class="newel-featured-story__inner">
    <figure class="newel-featured-story__media">
      <img class="newel-featured-story__image" src="/assets/img/keneddy_img.webp" alt="Jacqueline Kennedy seated in an elegant interior" width="1080" height="1080" />
    </figure>
    <article class="newel-featured-story__content">
      <p class="newel-featured-story__eyebrow">Get to Know Reynolds Antique House</p>
      <h2 class="newel-featured-story__title" id="newel-featured-story-title">
        From the Gallery Archives:
        <em>Jacqueline Kennedy</em>
      </h2>
      <p class="newel-featured-story__copy">
        On a sunny March morning in 1963 the First Lady of the United States of America,
        Jacqueline Bouvier Kennedy, walked into the Newel Gallery on second avenue. Jackie
        explained that she and her husband were building a vacation home near Middleburg,
        Virginia and she was on the hunt for English Regency lacquered furniture. This historical
        archive story is preserved as part of the gallery lineage now continued by Reynolds Antique House.
      </p>
      <a class="newel-featured-story__cta" href="/about.html">
        Read More
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 5l7 7-7 7"></path></svg>
      </a>
    </article>
  </div>
</section>

<div class="container-fluid featured_container" style="position:relative;margin-top:48px;">
  <div class="row">
    <div class="col d-flex flex-column justify-content-center align-items-center">
      <h5 class="text-uppercase fw-bold text-center text-secondary">trending</h5>
      <h2 class="text-uppercase fw-light text-center text-dark" style="font-size:24px;">more from the collection</h2>
    </div>
  </div>
  <div class="row" style="background:#fff;margin:0;padding-top:20px;">
    ${carousel("myCarousel3", featured.slice().reverse())}
  </div>
</div>

  </main>
  <div id="site-footer-root"></div>
  <script src="/assets/js/jquery-3.7.1.min.js"></script>
  <script src="/assets/vendor/bootstrap/bootstrap.min.js"></script>
  <script src="/js/site-chrome.js"></script>
  <script>
    (function () {
      const root = document.querySelector(".newel-hero");
      if (root) {
        const slides = Array.prototype.slice.call(root.querySelectorAll(".newel-slide"));
        const status = root.querySelector("[data-hero-status]");
        let index = 0;
        function show(next) {
          if (slides.length < 2) return;
          index = (next + slides.length) % slides.length;
          root.setAttribute("data-index", String(index));
          if (status) status.textContent = "Showing banner " + (index + 1) + " of " + slides.length;
        }
        root.querySelectorAll(".newel-arrow--prev").forEach(function (b) {
          b.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); show(index - 1); });
        });
        root.querySelectorAll(".newel-arrow--next").forEach(function (b) {
          b.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); show(index + 1); });
        });
        show(0);
        setInterval(function () { show(index + 1); }, 7000);
      }

      function multiCarousel(selector) {
        var el = document.querySelector(selector);
        if (!el) return;
        var items = el.querySelectorAll(".carousel-item");
        var minPerSlide = 4;
        items.forEach(function (item) {
          var next = item.nextElementSibling;
          for (var i = 1; i < minPerSlide; i++) {
            if (!next) next = items[0];
            var col = next.children[0];
            if (col) item.appendChild(col.cloneNode(true));
            next = next.nextElementSibling;
          }
        });
      }
      multiCarousel("#myCarousel");
      multiCarousel("#myCarousel3");

      document.querySelectorAll(".row2").forEach(function (row) {
        var track = row.querySelector(".track");
        if (!track) return;
        row.querySelectorAll(".arrow-btn").forEach(function (btn) {
          btn.addEventListener("click", function () {
            var dir = parseInt(btn.getAttribute("data-dir"), 10) || 1;
            track.scrollBy({ left: dir * Math.min(400, track.clientWidth * 0.8), behavior: "smooth" });
          });
        });
      });
    })();
  </script>
</body>
</html>
`;

fs.writeFileSync(path.join(root, "index.html"), html);

const patch = `
/* Reynolds visibility / card parity patches */
#product-search, form#product-search.search-input-style { display: flex !important; }
.logo__image { display: block !important; width: 220px !important; height: auto !important; object-fit: contain; }
.utility-bar { display: block !important; }
.newel-arrow { z-index: 30 !important; pointer-events: auto !important; }
.featured_container .card { min-height: 520px; height: 100%; }
.featured_container .product-image { width: 100%; height: 280px; object-fit: contain; margin: 0 auto; display: block; }
.featured_container .prod_title { min-height: 3.2em; font-size: 15px !important; text-align: center; }
.featured_container .carousel-item.active { display: flex; flex-wrap: wrap; }
@media (max-width: 900px) {
  .newel-footer-restore .row { grid-template-columns: 1fr !important; }
}
`;
fs.appendFileSync(path.join(root, "assets/css/chrome.css"), patch);
console.log("Clean index written", html.length);
