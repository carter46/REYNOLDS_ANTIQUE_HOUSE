/**
 * Assemble restored homepage + rewrite archive fragments for Reynolds.
 */
import fs from "fs";
import path from "path";

const root = process.cwd();
const ext = path.join(root, "tools", "reports", "extracted");

function read(name) {
  return fs.readFileSync(path.join(ext, name), "utf8");
}

let utility = read("utility.html");
utility = utility
  .replace(/href="estate-services\.html"/g, 'href="/estate-services.html"')
  .replace(/href="https:\/\/www\.newelauctions\.com\/"/g, 'href="/estate-services.html"')
  .replace(/href="trade-program\.html"/g, 'href="/trade-program.html"')
  .replace(/href="about\.html"/g, 'href="/about.html"')
  .replace(/href="contact\.html"/g, 'href="/contact.html"');

let estate = read("estate.html");
estate = estate
  .replace(/href="[^"]*"/, 'href="/estate-services.html"')
  .replace(/target="_blank" rel="noopener"/, "")
  .replace(/Newel Estate Services/g, "Reynolds Antique House Estate Services")
  .replace(/with Newel/g, "with Reynolds")
  .replace(/Eighty&#8209;five years of knowing exactly what it&rsquo;s worth\./g, "A trusted home for consigning, selling, and auctioning fine antiques and decorative arts.");

let trending = read("trending.html");
trending = trending
  .replace(/at Newel/g, "at Reynolds Antique House")
  .replace(/src="img\//g, 'src="/assets/img/')
  .replace(/href="https:\/\/www\.newel\.com\/[^"]*"/g, 'href="/products.html"')
  .replace(/href="products[^"]*"/g, 'href="/products.html"')
  .replace(/href="product[^"]*"/g, 'href="/products.html"')
  .replace(/\s+target="_blank"/g, "")
  .replace(/\s+rel="noopener"/g, "");

// Map category cards to local cats where obvious
trending = trending
  .replace(
    /<a class="card2" href="\/products\.html">\s*<img src="\/assets\/img\/home_slider\/category\/wall-mirrors\.jpg"/,
    '<a class="card2" href="/products.html?cat=Mirrors"><img src="/assets/img/home_slider/category/wall-mirrors.jpg"'
  )
  .replace(
    /<a class="card2" href="\/products\.html">\s*<img src="\/assets\/img\/home_slider\/category\/murano-glass-lighting\.jpg"/,
    '<a class="card2" href="/products.html?cat=Lighting"><img src="/assets/img/home_slider/category/murano-glass-lighting.jpg"'
  )
  .replace(
    /<a class="card2" href="\/products\.html">\s*<img src="\/assets\/img\/home_slider\/category\/portraits\.jpg"/,
    '<a class="card2" href="/products.html?cat=Art"><img src="/assets/img/home_slider/category/portraits.jpg"'
  )
  .replace(
    /<a class="card2" href="\/products\.html">\s*<img src="\/assets\/img\/home_slider\/category\/still-life\.jpg"/,
    '<a class="card2" href="/products.html?cat=Art"><img src="/assets/img/home_slider/category/still-life.jpg"'
  )
  .replace(
    /<a class="card2" href="\/products\.html">\s*<img src="\/assets\/img\/home_slider\/category\/busts\.jpg"/,
    '<a class="card2" href="/products.html?cat=Sculpture"><img src="/assets/img/home_slider/category/busts.jpg"'
  )
  .replace(
    /<a class="card2" href="\/products\.html">\s*<img src="\/assets\/img\/home_slider\/category\/victorian-table-lamps\.jpg"/,
    '<a class="card2" href="/products.html?cat=Lighting"><img src="/assets/img/home_slider/category/victorian-table-lamps.jpg"'
  )
  .replace(
    /<a class="card2" href="\/products\.html">\s*<img src="\/assets\/img\/home_slider\/category\/brass-coffee-tables\.jpg"/,
    '<a class="card2" href="/products.html?cat=Furniture"><img src="/assets/img/home_slider/category/brass-coffee-tables.jpg"'
  );

let story = read("story.html");
story = story
  .replace(/src="img\/keneddy_img\.webp"/, 'src="/assets/img/keneddy_img.webp"')
  .replace(/Get to Know Newel/g, "Get to Know Reynolds Antique House")
  .replace(
    /href="https:\/\/blog\.newel\.com\/[^"]*"/,
    'href="/about.html"'
  )
  .replace(/\s+target="_blank"/g, "")
  .replace(/\s+rel="noopener"/g, "");
// Keep historical Newel/Jackie narrative (historical content — flagged in audit)

let hero = read("hero.html");
// Keep structure; point CTAs that are external newel to local where simple
hero = hero
  .replace(/https:\/\/www\.newelauctions\.com\/[^"'\s]*/g, "/estate-services.html")
  .replace(/https:\/\/newel\.com\/[^"'\s]*/g, "/products.html")
  .replace(/https:\/\/www\.newel\.com\/[^"'\s]*/g, "/products.html");

const featuredBlock = `
<section class="featured_container rah-featured-restore" aria-label="Featured inventory">
  <div class="text-center" style="padding: 48px 24px 12px;">
    <p class="eyebrow2" style="justify-content:center;display:flex;gap:8px;align-items:center;text-transform:uppercase;letter-spacing:.14em;font-size:12px;">
      <span class="dot" style="width:6px;height:6px;border-radius:50%;background:#9f5c49;display:inline-block;"></span>
      discover rare objects
    </p>
    <h2 style="font-family:'Cormorant Garamond',Georgia,serif;font-weight:500;font-size:clamp(28px,3.4vw,40px);margin:12px 0 8px;">featured inventory</h2>
  </div>
  <div class="rah-grid" id="home-featured" style="max-width:1280px;margin:0 auto;padding:12px 24px 64px;"></div>
</section>
`;

const pressBlock = `
<div class="press" aria-label="Press mentions">
  <span class="eyebrow2" style="justify-content:center;display:flex;"><span class="dot"></span>In the press</span>
  <h2>Where you&rsquo;ve <em>seen</em> this gallery tradition</h2>
  <p style="max-width:36rem;margin:12px auto 0;color:#6b5e52;font-size:.95rem;">
    Historical press associations from the original gallery lineage are preserved here for continuity.
    <span style="display:block;margin-top:6px;font-size:.8rem;font-style:italic;">Flagged for management review — names retained as historical reference.</span>
  </p>
  <div class="press-carousel">
    <div class="press-track" id="pressTrack">
      <span class="press-item wm wm-ad">ARCHITECTURAL DIGEST</span>
      <span class="press-item wm wm-elle">ELLE DECOR</span>
      <span class="press-item wm wm-nyt">The New York Times</span>
      <span class="press-item wm wm-galerie">GALERIE</span>
      <span class="press-item wm wm-boh">BUSINESS OF HOME</span>
      <span class="press-item wm wm-ad">ARCHITECTURAL DIGEST</span>
      <span class="press-item wm wm-elle">ELLE DECOR</span>
      <span class="press-item wm wm-nyt">The New York Times</span>
      <span class="press-item wm wm-galerie">GALERIE</span>
      <span class="press-item wm wm-boh">BUSINESS OF HOME</span>
    </div>
  </div>
</div>
`;

// Insert press into trending before closing if not already there
if (!trending.includes('class="press"')) {
  trending = trending.replace("</section>", pressBlock + "\n</section>");
}

const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Reynolds Antique House | Antiques &amp; Decorative Arts</title>
  <meta name="description" content="Reynolds Antique House — curated antiques, fine art, and decorative objects." />
  <meta name="theme-color" content="#1a1410" />
  <link rel="stylesheet" href="/assets/css/chrome.css" />
  <link rel="stylesheet" href="/assets/css/home-newel.css" />
  <link rel="stylesheet" href="/assets/vendor/bootstrap/bootstrap.min.css" />
</head>
<body data-page="home">
  <div id="site-header-root"></div>
  <main id="main">
${hero}
${featuredBlock}
${estate}
${trending}
${story}
  </main>
  <div id="site-footer-root"></div>
  <script src="/js/site-chrome.js"></script>
  <script src="/js/product-catalog.js"></script>
  <script>
    (function () {
      // Hero carousel (archive pattern)
      const root = document.querySelector(".newel-hero");
      if (root) {
        const slides = [...root.querySelectorAll(".newel-slide")];
        const status = root.querySelector("[data-hero-status]") || { textContent: "" };
        let index = 0;
        function show(nextIndex) {
          if (!slides.length) return;
          index = (nextIndex + slides.length) % slides.length;
          root.setAttribute("data-index", String(index));
          slides.forEach((slide, i) => slide.setAttribute("aria-hidden", String(i !== index)));
          status.textContent = "Showing banner " + (index + 1) + " of " + slides.length;
        }
        root.querySelectorAll(".newel-arrow--prev").forEach((b) => b.addEventListener("click", () => show(index - 1)));
        root.querySelectorAll(".newel-arrow--next").forEach((b) => b.addEventListener("click", () => show(index + 1)));
        show(0);
        if (slides.length > 1) setInterval(() => show(index + 1), 7000);
      }
      // Trending row arrows
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
      // Featured from local catalog
      (async function () {
        try {
          const data = await ReynoldsCatalog.load();
          const grid = document.getElementById("home-featured");
          if (!grid) return;
          const picks = data.products.slice(0, 12);
          grid.innerHTML = picks.map(ReynoldsCatalog.cardHtml).join("");
        } catch (e) {
          console.error(e);
        }
      })();
    })();
  </script>
</body>
</html>
`;

fs.writeFileSync(path.join(root, "index.html"), indexHtml);
console.log("Wrote index.html bytes", indexHtml.length);
