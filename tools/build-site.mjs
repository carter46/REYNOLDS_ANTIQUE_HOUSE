/**
 * Full site build: flatten assets, extract catalog, shared chrome + PDP,
 * rebrand, cull, strip commerce, verify.
 */
import fs from "fs";
import path from "path";
import {
  ROOT,
  REPORTS,
  ensureDir,
  walkFiles,
  isValidImage,
  writeJson,
  writeCsv,
  slugify,
  stableProductId,
  decodeHtmlEntities,
  toPosix,
  extractAbsoluteHttps,
} from "./lib.mjs";

const KEEP = JSON.parse(fs.readFileSync(path.join(REPORTS, "keep-list.json"), "utf8"));
const S3_SRC = path.join(ROOT, "s3-us-west-2.amazonaws.com", "prod-newel", "images", "inventory");
const INV_DEST = path.join(ROOT, "assets", "images", "inventory");

function safeRename(src, dest) {
  if (!fs.existsSync(src)) return { ok: false, reason: "missing-src" };
  if (fs.existsSync(dest)) return { ok: false, reason: "dest-exists" };
  ensureDir(path.dirname(dest));
  fs.renameSync(src, dest);
  return { ok: true };
}

function copyFileSafe(src, dest) {
  ensureDir(path.dirname(dest));
  if (fs.existsSync(dest)) return false;
  fs.copyFileSync(src, dest);
  return true;
}

function moveDirMerge(src, dest) {
  if (!fs.existsSync(src)) return { moved: 0, skipped: 0 };
  ensureDir(dest);
  let moved = 0,
    skipped = 0;
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, ent.name);
    const d = path.join(dest, ent.name);
    if (ent.isDirectory()) {
      const r = moveDirMerge(s, d);
      moved += r.moved;
      skipped += r.skipped;
    } else {
      if (fs.existsSync(d)) skipped++;
      else {
        ensureDir(path.dirname(d));
        fs.renameSync(s, d);
        moved++;
      }
    }
  }
  // try remove empty src tree later
  return { moved, skipped };
}

function rmEmptyDirs(dir) {
  if (!fs.existsSync(dir)) return;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.isDirectory()) rmEmptyDirs(path.join(dir, ent.name));
  }
  try {
    if (fs.readdirSync(dir).length === 0) fs.rmdirSync(dir);
  } catch {
    /* ignore */
  }
}

function pickGalleryImages(skuDir) {
  if (!fs.existsSync(skuDir)) return [];
  const files = fs
    .readdirSync(skuDir)
    .filter((n) => /\.(jpe?g|png|webp)$/i.test(n))
    .map((n) => path.join(skuDir, n))
    .filter((p) => isValidImage(p));

  // Dedupe by stripping HTTrack 4-hex suffix and size variants — keep largest per stem group
  const groups = new Map();
  for (const f of files) {
    const base = path.basename(f);
    // skip obvious thumbs if we have larger
    let stem = base.replace(/\.(jpe?g|png|webp)$/i, "");
    stem = stem.replace(/[a-f0-9]{4}$/i, "");
    stem = stem.replace(/^midres-/, "");
    const size = fs.statSync(f).size;
    const prev = groups.get(stem);
    if (!prev || size > prev.size) groups.set(stem, { file: f, size, base });
  }

  // Prefer non-midres stems ending with -01, -02 style; limit gallery to unique shots
  let picks = [...groups.values()].map((g) => g.file);
  // Prefer files without 'midres' and without tiny sizes
  picks.sort((a, b) => fs.statSync(b).size - fs.statSync(a).size);
  // Cap at 12 images per product
  picks = picks.slice(0, 12);
  return picks;
}

function extractProductRecord(keepEntry, index) {
  const htmlPath = path.join(ROOT, keepEntry.pagePath.replace(/\//g, path.sep));
  let html = "";
  if (fs.existsSync(htmlPath)) html = fs.readFileSync(htmlPath, "utf8");

  const sku = keepEntry.sku || "";
  const slug = keepEntry.slug || slugify(keepEntry.title);

  let title = keepEntry.title || "";
  const h4 = html.match(/product-title-show-desktop[^>]*>([^<]+)</i);
  if (h4) title = decodeHtmlEntities(h4[1].trim());
  else {
    const t = html.match(/name=["']title["']\s+value=["']([^"']+)["']/i);
    if (t) title = decodeHtmlEntities(t[1]);
  }

  const descMeta = html.match(/name=["']description["']\s+content=["']([^"']*)["']/i);
  let description = descMeta ? decodeHtmlEntities(descMeta[1]) : "";
  const descP = html.match(/product_description[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i);
  if (descP) {
    const d = decodeHtmlEntities(descP[1].replace(/<[^>]+>/g, "").trim());
    if (d.length > description.length) description = d;
  }

  const priceM = html.match(/product_price[\s\S]*?<h5>(\$[\d,]+(?:\.\d{2})?)/i);
  const price = priceM ? priceM[1] : null;

  const dimM =
    html.match(/Dimensions?[:\s]*<\/?(?:strong|span|b)[^>]*>\s*([^<]+)/i) ||
    html.match(/>\s*H[:\s]*([0-9."'\s×xX]+)[^<]*</i);
  const dimensions = dimM ? decodeHtmlEntities(dimM[1].trim()) : null;

  const styleM = html.match(/Style:<[\s\S]*?<span>([^<]+)/i);
  const style = styleM ? decodeHtmlEntities(styleM[1].trim()) : null;

  const periodM = html.match(/Period:<[\s\S]*?<span>([^<]+)/i);
  const period = periodM ? decodeHtmlEntities(periodM[1].trim()) : null;

  const materialM = html.match(/Material:<[\s\S]*?<span>([^<]+)/i);
  const material = materialM ? decodeHtmlEntities(materialM[1].trim()) : null;

  const availM = html.match(/Available Qty:\s*&nbsp;?(\d+)/i);
  const availability = availM ? `Available Qty: ${availM[1]}` : null;

  const category = keepEntry.category || "";

  // Images from SKU folder (after move, check both locations)
  let skuDir = path.join(INV_DEST, sku);
  if (!fs.existsSync(skuDir)) skuDir = path.join(S3_SRC, sku);
  const galleryFiles = pickGalleryImages(skuDir);
  const images = galleryFiles.map((f) => {
    const rel = toPosix(path.relative(ROOT, f));
    // After flatten inventory lives under assets/images/inventory
    const src = rel.includes("assets/images/inventory")
      ? "/" + rel
      : `/assets/images/inventory/${sku}/${path.basename(f)}`;
    return { src, alt: title };
  });

  const id = keepEntry.id || stableProductId(sku, slug, index);

  return {
    id,
    sku,
    slug,
    title: title.replace(/\bNewel\b/gi, "Reynolds Antique House").replace(/\s+/g, " ").trim(),
    category,
    description: description.replace(/\bNewel\b/gi, "Reynolds Antique House"),
    dimensions,
    price,
    material,
    style,
    period,
    availability,
    images,
    meta: {
      originalPath: keepEntry.pagePath,
    },
  };
}

function flattenAssets() {
  const log = [];
  ensureDir(path.join(ROOT, "assets"));
  ensureDir(path.join(ROOT, "assets", "css"));
  ensureDir(path.join(ROOT, "assets", "js"));
  ensureDir(path.join(ROOT, "assets", "img"));
  ensureDir(path.join(ROOT, "assets", "fonts"));
  ensureDir(path.join(ROOT, "assets", "images", "marketing"));
  ensureDir(path.join(ROOT, "assets", "images", "blog"));
  ensureDir(path.join(ROOT, "assets", "vendor"));
  ensureDir(path.join(ROOT, "js"));
  ensureDir(path.join(ROOT, "data"));

  // Inventory move (once)
  if (fs.existsSync(S3_SRC) && !fs.existsSync(INV_DEST)) {
    ensureDir(path.dirname(INV_DEST));
    console.log("Moving inventory images → assets/images/inventory …");
    fs.renameSync(S3_SRC, INV_DEST);
    log.push({ action: "rename", from: S3_SRC, to: INV_DEST });
  } else if (fs.existsSync(S3_SRC) && fs.existsSync(INV_DEST)) {
    console.log("Merging remaining inventory …");
    const r = moveDirMerge(S3_SRC, INV_DEST);
    log.push({ action: "merge-inventory", ...r });
  }

  const moves = [
    ["www.newel.com", "assets/images/marketing"],
    ["blog.newel.com", "assets/images/blog"],
    ["ajax.googleapis.com", "assets/vendor/jquery"],
    ["cdnjs.cloudflare.com", "assets/vendor/cdnjs"],
    ["use.typekit.net", "assets/vendor/typekit"],
    ["p.typekit.net", "assets/vendor/typekit-privacy"],
    ["stg2.newel.com", "assets/vendor/stg2"],
    ["static.wixstatic.com", "assets/vendor/wix/static"],
    ["static.parastorage.com", "assets/vendor/wix/parastorage"],
    ["mdbootstrap.com", "assets/vendor/mdbootstrap"],
  ];

  for (const [from, to] of moves) {
    const src = path.join(ROOT, from);
    const dest = path.join(ROOT, ...to.split("/"));
    if (!fs.existsSync(src)) continue;
    if (!fs.existsSync(dest)) {
      ensureDir(path.dirname(dest));
      fs.renameSync(src, dest);
      log.push({ action: "rename", from, to });
    } else {
      const r = moveDirMerge(src, dest);
      log.push({ action: "merge", from, to, ...r });
    }
  }

  // newel.com site assets
  const newel = path.join(ROOT, "newel.com");
  for (const folder of ["css", "js", "img", "fonts", "images", "bootstrap", "_img"]) {
    const src = path.join(newel, folder);
    if (!fs.existsSync(src)) continue;
    const dest = path.join(ROOT, "assets", folder === "_img" ? "img" : folder === "images" ? "images/site" : folder);
    const r = moveDirMerge(src, dest);
    log.push({ action: "merge-newel", folder, ...r });
  }

  // magiczoom from newel css if present
  writeJson(path.join(REPORTS, "flatten-log.json"), log);
  return log;
}

function deleteHttrackJunk() {
  const junk = [
    "hts-cache",
    "hts-log.txt",
    "cookies.txt",
    "backblue.gif",
    "fade.gif",
    "admin.newel.com",
    "www.google.com",
    "www.gstatic.com",
    "snapui.searchspring.io",
  ];
  // old HTTrack index — replace later
  for (const j of junk) {
    const p = path.join(ROOT, j);
    if (fs.existsSync(p)) {
      fs.rmSync(p, { recursive: true, force: true });
      console.log("Deleted", j);
    }
  }
}

function buildCatalog() {
  console.log("Extracting products.json …");
  const products = [];
  for (let i = 0; i < KEEP.length; i++) {
    const rec = extractProductRecord(KEEP[i], i + 1);
    if (rec.images.length === 0) {
      console.warn("No images for", rec.id, rec.sku);
    }
    products.push(rec);
  }
  writeJson(path.join(ROOT, "data", "products.json"), { products, generatedAt: new Date().toISOString(), count: products.length });
  return products;
}

function writeChromeAssets() {
  const css = `/* Reynolds Antique House — shared chrome */
:root {
  --rah-ink: #1a1410;
  --rah-paper: #f7f3ee;
  --rah-gold: #c4a484;
  --rah-gold-dark: #9f5c49;
  --rah-muted: #6b5e52;
  --rah-rule: #c4a484;
  --rah-white: #fff;
  --rah-max: 1280px;
  --rah-font-display: "Cormorant Garamond", "Palatino Linotype", Palatino, Georgia, serif;
  --rah-font-body: "Segoe UI", system-ui, sans-serif;
  --rah-font-label: "Jost", "Segoe UI", system-ui, sans-serif;
}
*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  font-family: var(--rah-font-body);
  color: var(--rah-ink);
  background: var(--rah-paper);
  line-height: 1.5;
}
img { max-width: 100%; height: auto; display: block; }
a { color: inherit; text-decoration: none; }
a:hover { color: var(--rah-gold-dark); }

.rah-skip {
  position: absolute; left: -9999px; top: 0;
}
.rah-skip:focus { left: 1rem; top: 1rem; z-index: 1000; background: #fff; padding: .5rem 1rem; }

#site-header {
  position: sticky; top: 0; z-index: 50;
  background: rgba(247,243,238,.94);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(196,164,132,.45);
}
.rah-header-inner {
  max-width: var(--rah-max);
  margin: 0 auto;
  padding: .85rem 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.rah-brand {
  font-family: var(--rah-font-display);
  font-size: 1.35rem;
  letter-spacing: .04em;
  font-weight: 600;
  color: var(--rah-ink);
  white-space: nowrap;
}
.rah-brand span { display: block; font-size: .65rem; letter-spacing: .22em; text-transform: uppercase; font-family: var(--rah-font-label); color: var(--rah-muted); font-weight: 500; }
.rah-nav { display: none; gap: 1.25rem; align-items: center; }
.rah-nav a {
  font-family: var(--rah-font-label);
  font-size: .72rem;
  letter-spacing: .14em;
  text-transform: uppercase;
  color: var(--rah-ink);
}
.rah-nav a[aria-current="page"] { color: var(--rah-gold-dark); border-bottom: 1px solid var(--rah-gold-dark); }
.rah-menu-btn {
  display: inline-flex; background: none; border: 0; cursor: pointer;
  font-size: 1.5rem; line-height: 1; color: var(--rah-ink); padding: .25rem;
}
@media (min-width: 900px) {
  .rah-nav { display: flex; }
  .rah-menu-btn { display: none; }
}
.rah-gold-rule { height: 2px; background: linear-gradient(90deg, transparent, var(--rah-rule), transparent); }

.rah-mobile {
  position: fixed; inset: 0; background: var(--rah-paper); z-index: 60;
  padding: 1.25rem; transform: translateX(100%); transition: transform .35s ease;
  overflow: auto;
}
.rah-mobile.is-open { transform: translateX(0); }
.rah-mobile[hidden] { display: none !important; }
.rah-mobile.is-open[hidden] { display: block !important; }
.rah-mobile-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
.rah-mobile nav { display: flex; flex-direction: column; gap: 1rem; }
.rah-mobile nav a {
  font-family: var(--rah-font-display);
  font-size: 1.5rem;
  border-bottom: 1px solid rgba(0,0,0,.08);
  padding-bottom: .5rem;
}
.rah-search-note {
  font-size: .8rem; color: var(--rah-muted); margin-top: 1.5rem;
  font-style: italic;
}

#site-footer {
  background: var(--rah-ink);
  color: #d7cfc4;
  margin-top: 4rem;
  padding: 3rem 1.25rem 2rem;
}
.rah-footer-inner {
  max-width: var(--rah-max); margin: 0 auto;
  display: grid; gap: 2rem;
  grid-template-columns: 1fr;
}
@media (min-width: 768px) {
  .rah-footer-inner { grid-template-columns: 2fr 1fr 1fr; }
}
.rah-footer-brand {
  font-family: var(--rah-font-display);
  font-size: 1.4rem; color: #fff; margin-bottom: .75rem;
}
.rah-footer-inner h4 {
  font-family: var(--rah-font-label);
  font-size: .7rem; letter-spacing: .18em; text-transform: uppercase;
  color: var(--rah-gold); margin: 0 0 1rem;
}
.rah-footer-inner ul { list-style: none; padding: 0; margin: 0; }
.rah-footer-inner li { margin-bottom: .5rem; }
.rah-footer-inner a { color: #d7cfc4; font-size: .9rem; }
.rah-footer-inner a:hover { color: #fff; }
.rah-footer-base {
  max-width: var(--rah-max); margin: 2.5rem auto 0;
  padding-top: 1.25rem; border-top: 1px solid rgba(255,255,255,.12);
  font-size: .75rem; color: #8a8076; text-align: center;
}

/* Page shells */
.rah-page { max-width: var(--rah-max); margin: 0 auto; padding: 2rem 1.25rem 4rem; }
.rah-hero {
  min-height: 58vh; display: flex; align-items: flex-end;
  background: linear-gradient(180deg, #2a221c 0%, #1a1410 100%);
  color: #fff; padding: 3rem 1.25rem;
  position: relative; overflow: hidden;
}
.rah-hero::after {
  content: ""; position: absolute; inset: 0;
  background: radial-gradient(ellipse at 70% 40%, rgba(196,164,132,.25), transparent 55%);
  pointer-events: none;
}
.rah-hero-inner { max-width: var(--rah-max); margin: 0 auto; width: 100%; position: relative; z-index: 1; }
.rah-hero h1 {
  font-family: var(--rah-font-display);
  font-size: clamp(2.2rem, 5vw, 3.8rem);
  font-weight: 500; margin: 0 0 .75rem; letter-spacing: .02em;
}
.rah-hero p { max-width: 36rem; margin: 0; color: #ddd4c8; font-size: 1.05rem; }
.rah-btn {
  display: inline-flex; align-items: center; justify-content: center;
  margin-top: 1.5rem; padding: .85rem 1.5rem;
  background: var(--rah-gold-dark); color: #fff !important;
  font-family: var(--rah-font-label); font-size: .72rem;
  letter-spacing: .16em; text-transform: uppercase;
}
.rah-btn:hover { filter: brightness(1.08); color: #fff !important; }
.rah-btn-outline {
  background: transparent; border: 1px solid rgba(255,255,255,.55); margin-left: .75rem;
}
.rah-section-title {
  font-family: var(--rah-font-display);
  font-size: 2rem; font-weight: 500; margin: 0 0 .5rem;
}
.rah-section-lead { color: var(--rah-muted); margin: 0 0 2rem; max-width: 40rem; }

.rah-grid {
  display: grid; gap: 1.5rem;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
}
.rah-card-link { display: block; color: inherit; }
.rah-card-img {
  aspect-ratio: 4/5; overflow: hidden; background: #e8e0d6; margin-bottom: .75rem;
}
.rah-card-img img { width: 100%; height: 100%; object-fit: cover; transition: transform .5s ease; }
.rah-card-link:hover .rah-card-img img { transform: scale(1.04); }
.rah-card-title {
  font-family: var(--rah-font-display); font-size: 1.1rem; margin: 0 0 .25rem;
}
.rah-card-meta { font-size: .8rem; color: var(--rah-muted); }

/* Product detail */
.rah-pdp { display: grid; gap: 2rem; }
@media (min-width: 900px) {
  .rah-pdp { grid-template-columns: 1.1fr 0.9fr; align-items: start; }
}
.rah-gallery-main {
  background: #efe8df; aspect-ratio: 1; display: flex; align-items: center; justify-content: center;
  overflow: hidden;
}
.rah-gallery-main img { width: 100%; height: 100%; object-fit: contain; }
.rah-thumbs { display: flex; flex-wrap: wrap; gap: .5rem; margin-top: .75rem; }
.rah-thumbs button {
  border: 1px solid transparent; padding: 0; background: #efe8df; cursor: pointer; width: 72px; height: 72px; overflow: hidden;
}
.rah-thumbs button.is-active { border-color: var(--rah-gold-dark); }
.rah-thumbs img { width: 100%; height: 100%; object-fit: cover; }
.rah-pdp-title {
  font-family: var(--rah-font-display); font-size: clamp(1.6rem, 3vw, 2.2rem);
  font-weight: 500; margin: 0 0 .75rem;
}
.rah-pdp-price { font-size: 1.15rem; margin: 0 0 1rem; color: var(--rah-gold-dark); }
.rah-pdp-sku { font-size: .85rem; color: var(--rah-muted); margin-bottom: 1rem; }
.rah-pdp-desc { margin: 0 0 1.5rem; }
.rah-specs { list-style: none; padding: 0; margin: 0 0 1.5rem; }
.rah-specs li { padding: .4rem 0; border-bottom: 1px solid rgba(0,0,0,.08); font-size: .95rem; }
.rah-specs strong { display: inline-block; min-width: 7rem; color: var(--rah-muted); font-weight: 500; }
.rah-related { margin-top: 4rem; }

.rah-prose { max-width: 42rem; }
.rah-prose h1, .rah-prose h2 { font-family: var(--rah-font-display); font-weight: 500; }
.rah-contact-form label { display: block; font-size: .8rem; letter-spacing: .08em; text-transform: uppercase; margin: 1rem 0 .35rem; }
.rah-contact-form input, .rah-contact-form textarea {
  width: 100%; padding: .75rem; border: 1px solid rgba(0,0,0,.15); background: #fff; font: inherit;
}
.rah-filters { display: flex; flex-wrap: wrap; gap: .5rem; margin-bottom: 1.5rem; }
.rah-filters button {
  border: 1px solid rgba(0,0,0,.15); background: transparent; padding: .4rem .8rem;
  font-family: var(--rah-font-label); font-size: .7rem; letter-spacing: .1em; text-transform: uppercase; cursor: pointer;
}
.rah-filters button.is-active { background: var(--rah-ink); color: #fff; border-color: var(--rah-ink); }
`;

  fs.writeFileSync(path.join(ROOT, "assets", "css", "chrome.css"), css, "utf8");

  const chromeJs = `(function () {
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
    }).join("\\n");
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
      "  <nav aria-label=\"Mobile\">" + navLinks(page) + "</nav>",
      '  <p class="rah-search-note">Browse the Collection page to explore the catalog. Live search will return in a future update.</p>',
      "</div>"
    ].join("\\n");
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
    ].join("\\n");
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
`;
  fs.writeFileSync(path.join(ROOT, "js", "site-chrome.js"), chromeJs, "utf8");

  const catalogJs = `window.ReynoldsCatalog = (function () {
  let cache = null;

  async function load() {
    if (cache) return cache;
    const res = await fetch("/data/products.json");
    if (!res.ok) throw new Error("Failed to load catalog");
    cache = await res.json();
    return cache;
  }

  function getProduct(id) {
    if (!cache || !cache.products) return null;
    return cache.products.find((p) => p.id === id) || null;
  }

  function byCategory(cat) {
    if (!cache) return [];
    if (!cat || cat === "all") return cache.products.slice();
    const c = cat.toLowerCase();
    return cache.products.filter((p) => (p.category || "").toLowerCase().includes(c));
  }

  function related(product, limit) {
    if (!cache || !product) return [];
    return cache.products
      .filter((p) => p.id !== product.id && p.category === product.category)
      .slice(0, limit || 4);
  }

  function cardHtml(p) {
    const img = (p.images && p.images[0] && p.images[0].src) || "/assets/img/inventory/no_image_available_300x300.jpg";
    return (
      '<a class="rah-card-link" href="/product-details.html?id=' + encodeURIComponent(p.id) + '">' +
      '<div class="rah-card-img"><img src="' + img + '" alt="' + (p.title || "").replace(/"/g, "&quot;") + '" loading="lazy" /></div>' +
      '<h3 class="rah-card-title">' + (p.title || "") + "</h3>" +
      '<p class="rah-card-meta">' + (p.sku ? "Item # " + p.sku : "") + (p.price ? " · " + p.price : "") + "</p>" +
      "</a>"
    );
  }

  return { load, getProduct, byCategory, related, cardHtml };
})();
`;
  fs.writeFileSync(path.join(ROOT, "js", "product-catalog.js"), catalogJs, "utf8");
}

function pageShell({ title, description, dataPage, body }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} | Reynolds Antique House</title>
  <meta name="description" content="${description.replace(/"/g, "&quot;")}" />
  <meta name="theme-color" content="#1a1410" />
  <link rel="stylesheet" href="/assets/css/chrome.css" />
</head>
<body data-page="${dataPage}">
  <div id="site-header-root"></div>
  <main id="main">
${body}
  </main>
  <div id="site-footer-root"></div>
  <script src="/js/site-chrome.js"></script>
</body>
</html>
`;
}

function writeMarketingPages(products) {
  const featured = products.filter((p) => p.images.length).slice(0, 8);

  const indexBody = `
  <section class="rah-hero">
    <div class="rah-hero-inner">
      <h1>Reynolds Antique House</h1>
      <p>A carefully curated gallery of antiques, fine art, mirrors, lighting, and decorative objects — now a fully local static catalog.</p>
      <div>
        <a class="rah-btn" href="/products.html">Browse the Collection</a>
        <a class="rah-btn rah-btn-outline" href="/about.html">About</a>
      </div>
    </div>
  </section>
  <section class="rah-page">
    <h2 class="rah-section-title">Featured from the Collection</h2>
    <p class="rah-section-lead">${products.length} pieces with complete local imagery, ready to explore.</p>
    <div class="rah-grid" id="home-featured">
      ${featured.map((p) => {
        const img = p.images[0]?.src || "";
        return `<a class="rah-card-link" href="/product-details.html?id=${encodeURIComponent(p.id)}">
          <div class="rah-card-img"><img src="${img}" alt="${p.title.replace(/"/g, "&quot;")}" loading="lazy" /></div>
          <h3 class="rah-card-title">${p.title}</h3>
          <p class="rah-card-meta">${p.sku ? "Item # " + p.sku : ""}${p.price ? " · " + p.price : ""}</p>
        </a>`;
      }).join("\n")}
    </div>
  </section>`;

  fs.writeFileSync(
    path.join(ROOT, "index.html"),
    pageShell({
      title: "Home",
      description: "Reynolds Antique House — curated antiques and decorative arts.",
      dataPage: "home",
      body: indexBody,
    }),
    "utf8"
  );

  fs.writeFileSync(
    path.join(ROOT, "about.html"),
    pageShell({
      title: "About",
      description: "About Reynolds Antique House.",
      dataPage: "about",
      body: `<section class="rah-page rah-prose">
        <h1>About Reynolds Antique House</h1>
        <p>Reynolds Antique House presents a curated selection of antiques and decorative arts. This static site preserves the collection for browsing after a migration from our previous online gallery.</p>
        <p>Every image and page asset is hosted locally — the catalog does not depend on the former store, CDNs, or third-party commerce systems.</p>
        <p><a class="rah-btn" href="/products.html">View the Collection</a></p>
      </section>`,
    }),
    "utf8"
  );

  fs.writeFileSync(
    path.join(ROOT, "contact.html"),
    pageShell({
      title: "Contact",
      description: "Contact Reynolds Antique House.",
      dataPage: "contact",
      body: `<section class="rah-page rah-prose">
        <h1>Contact</h1>
        <p>Reach the gallery by email. This form opens your mail client — there is no remote form backend on this static site.</p>
        <form class="rah-contact-form" action="mailto:info@reynoldsantiquehouse.com" method="post" enctype="text/plain">
          <label for="name">Name</label>
          <input id="name" name="name" required />
          <label for="email">Email</label>
          <input id="email" name="email" type="email" required />
          <label for="message">Message</label>
          <textarea id="message" name="message" rows="6" required></textarea>
          <button class="rah-btn" type="submit">Send Email</button>
        </form>
      </section>`,
    }),
    "utf8"
  );

  fs.writeFileSync(
    path.join(ROOT, "trade-program.html"),
    pageShell({
      title: "Trade Program",
      description: "Trade program at Reynolds Antique House.",
      dataPage: "trade",
      body: `<section class="rah-page rah-prose">
        <h1>Trade Program</h1>
        <p>Designers and trade professionals are welcome to inquire about the collection. Please contact us for trade access and project support.</p>
        <p><a class="rah-btn" href="/contact.html">Contact the Gallery</a></p>
      </section>`,
    }),
    "utf8"
  );

  fs.writeFileSync(
    path.join(ROOT, "estate-services.html"),
    pageShell({
      title: "Estate Services",
      description: "Estate services at Reynolds Antique House.",
      dataPage: "estate",
      body: `<section class="rah-page rah-prose">
        <h1>Estate Services</h1>
        <p>We assist with estate evaluations and selective placement of fine antiques and decorative objects. Contact the gallery to discuss your needs.</p>
        <p><em>Note: The previous Wix-powered estate services experience has been replaced with this clean static page for reliability and full offline independence.</em></p>
        <p><a class="rah-btn" href="/contact.html">Inquire</a></p>
      </section>`,
    }),
    "utf8"
  );

  // products listing
  const cats = [...new Set(products.map((p) => p.category).filter(Boolean))].sort();
  fs.writeFileSync(
    path.join(ROOT, "products.html"),
    pageShell({
      title: "Collection",
      description: "Browse the Reynolds Antique House collection.",
      dataPage: "products",
      body: `<section class="rah-page">
        <h1 class="rah-section-title">Collection</h1>
        <p class="rah-section-lead">${products.length} pieces with complete local imagery.</p>
        <div class="rah-filters" id="category-filters">
          <button type="button" data-cat="all" class="is-active">All</button>
          ${cats.map((c) => `<button type="button" data-cat="${c.replace(/"/g, "")}">${c}</button>`).join("\n")}
        </div>
        <div class="rah-grid" id="product-grid"></div>
      </section>
      <script src="/js/product-catalog.js"></script>
      <script>
        (async function () {
          const data = await ReynoldsCatalog.load();
          const grid = document.getElementById("product-grid");
          function render(list) {
            grid.innerHTML = list.map(ReynoldsCatalog.cardHtml).join("");
          }
          render(data.products);
          document.getElementById("category-filters").addEventListener("click", function (e) {
            const btn = e.target.closest("button[data-cat]");
            if (!btn) return;
            document.querySelectorAll("#category-filters button").forEach(function (b) { b.classList.toggle("is-active", b === btn); });
            render(ReynoldsCatalog.byCategory(btn.getAttribute("data-cat")));
          });
        })();
      </script>`,
    }),
    "utf8"
  );

  // Shared PDP
  fs.writeFileSync(
    path.join(ROOT, "product-details.html"),
    pageShell({
      title: "Product",
      description: "Product details — Reynolds Antique House.",
      dataPage: "product",
      body: `<section class="rah-page">
        <div id="pdp-root"><p>Loading…</p></div>
        <div class="rah-related">
          <h2 class="rah-section-title">More from this category</h2>
          <div class="rah-grid" id="related-grid"></div>
        </div>
      </section>
      <script src="/js/product-catalog.js"></script>
      <script>
        (async function () {
          await ReynoldsCatalog.load();
          const params = new URLSearchParams(window.location.search);
          const id = params.get("id");
          const product = ReynoldsCatalog.getProduct(id);
          const root = document.getElementById("pdp-root");
          if (!product) {
            root.innerHTML = '<p>Product not found. <a href="/products.html">Return to the collection</a>.</p>';
            return;
          }
          document.title = product.title + " | Reynolds Antique House";
          const images = product.images && product.images.length ? product.images : [{ src: "", alt: product.title }];
          let index = 0;
          function paint() {
            const img = images[index] || images[0];
            root.innerHTML =
              '<div class="rah-pdp">' +
              '<div><div class="rah-gallery-main"><img id="pdp-main" src="' + (img.src || "") + '" alt="' + (img.alt || product.title).replace(/"/g, "&quot;") + '" /></div>' +
              '<div class="rah-thumbs" id="pdp-thumbs">' +
              images.map(function (im, i) {
                return '<button type="button" data-i="' + i + '" class="' + (i === index ? "is-active" : "") + '"><img src="' + im.src + '" alt="" /></button>';
              }).join("") +
              "</div></div>" +
              "<div>" +
              '<h1 class="rah-pdp-title">' + product.title + "</h1>" +
              (product.price ? '<p class="rah-pdp-price">' + product.price + "</p>" : "") +
              '<p class="rah-pdp-sku">' + (product.sku ? "Item # " + product.sku : "") + "</p>" +
              '<p class="rah-pdp-desc">' + (product.description || "") + "</p>" +
              '<ul class="rah-specs">' +
              (product.dimensions ? "<li><strong>Dimensions</strong> " + product.dimensions + "</li>" : "") +
              (product.material ? "<li><strong>Material</strong> " + product.material + "</li>" : "") +
              (product.style ? "<li><strong>Style</strong> " + product.style + "</li>" : "") +
              (product.period ? "<li><strong>Period</strong> " + product.period + "</li>" : "") +
              (product.category ? "<li><strong>Category</strong> " + product.category + "</li>" : "") +
              (product.availability ? "<li><strong>Status</strong> " + product.availability + "</li>" : "") +
              "</ul>" +
              '<a class="rah-btn" href="mailto:info@reynoldsantiquehouse.com?subject=' + encodeURIComponent("Inquiry: " + product.title + " (" + (product.sku || product.id) + ")") + '">Inquire</a>' +
              ' <a class="rah-btn" style="background:transparent;color:var(--rah-ink)!important;border:1px solid rgba(0,0,0,.2)" href="/products.html">Back to Collection</a>' +
              "</div></div>";
            document.getElementById("pdp-thumbs").addEventListener("click", function (e) {
              const btn = e.target.closest("button[data-i]");
              if (!btn) return;
              index = parseInt(btn.getAttribute("data-i"), 10) || 0;
              paint();
            });
          }
          paint();
          const related = ReynoldsCatalog.related(product, 4);
          document.getElementById("related-grid").innerHTML = related.map(ReynoldsCatalog.cardHtml).join("");
        })();
      </script>`,
    }),
    "utf8"
  );
}

function cullUnused(products) {
  console.log("Culling unused product HTML and orphan inventory…");
  const keepSkus = new Set(products.map((p) => p.sku).filter(Boolean));
  const keepIds = new Set(products.map((p) => p.id));

  // Build dependency set of image paths referenced by catalog
  const referencedFiles = new Set();
  for (const p of products) {
    for (const im of p.images || []) {
      const rel = im.src.replace(/^\//, "").replace(/\//g, path.sep);
      referencedFiles.add(path.join(ROOT, rel));
    }
  }

  // Also keep marketing images under assets/images/marketing and blog
  for (const extra of [
    path.join(ROOT, "assets", "images", "marketing"),
    path.join(ROOT, "assets", "images", "blog"),
    path.join(ROOT, "assets", "img"),
  ]) {
    if (!fs.existsSync(extra)) continue;
    for (const f of walkFiles(extra, [".jpg", ".jpeg", ".png", ".webp", ".gif"])) {
      referencedFiles.add(f);
    }
  }

  // Delete ALL old per-product HTML (source + any root product/)
  const productDirs = [
    path.join(ROOT, "newel.com", "product"),
    path.join(ROOT, "product"),
  ];
  let deletedHtml = 0;
  for (const dir of productDirs) {
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      if (!/\.html?$/i.test(f)) continue;
      fs.unlinkSync(path.join(dir, f));
      deletedHtml++;
    }
  }

  // Delete inventory SKU folders not in keep list
  let deletedSkuFolders = 0;
  let deletedFiles = 0;
  if (fs.existsSync(INV_DEST)) {
    for (const sku of fs.readdirSync(INV_DEST)) {
      const dir = path.join(INV_DEST, sku);
      if (!fs.statSync(dir).isDirectory()) continue;
      if (keepSkus.has(sku)) {
        // Within kept SKU: delete files not referenced AND not needed as gallery sources
        // Safer: keep entire kept SKU folder (shared variants)
        continue;
      }
      // Dropped SKU — only delete if no file in folder is in referencedFiles
      const files = walkFiles(dir);
      const stillNeeded = files.some((f) => referencedFiles.has(f));
      if (stillNeeded) continue;
      deletedFiles += files.length;
      fs.rmSync(dir, { recursive: true, force: true });
      deletedSkuFolders++;
    }
  }

  // Remove leftover newel.com product listings bulk (optional keep products.html at root only)
  const productsDir = path.join(ROOT, "newel.com", "products");
  if (fs.existsSync(productsDir)) {
    fs.rmSync(productsDir, { recursive: true, force: true });
  }

  // Remove remaining newel.com HTML shells at root of newel.com (we've replaced marketing pages)
  const newel = path.join(ROOT, "newel.com");
  if (fs.existsSync(newel)) {
    for (const f of fs.readdirSync(newel)) {
      const full = path.join(newel, f);
      if (fs.statSync(full).isFile() && /\.html?$/i.test(f)) {
        fs.unlinkSync(full);
      }
    }
  }

  const summary = {
    keptProducts: products.length,
    keepSkus: keepSkus.size,
    deletedProductHtml: deletedHtml,
    deletedSkuFolders,
    deletedInventoryFilesApprox: deletedFiles,
  };
  writeJson(path.join(REPORTS, "cull-summary.json"), summary);
  console.log(summary);
  return summary;
}

function verifyExternal() {
  console.log("Running external dependency scan…");
  const files = [
    ...walkFiles(ROOT, [".html", ".css", ".js"]).filter((f) => {
      const rel = toPosix(path.relative(ROOT, f));
      return !rel.startsWith("tools/") && !rel.startsWith("hts-") && !rel.includes("node_modules");
    }),
  ];

  const blockedHosts = new Set();
  const allowedPrefixes = ["mailto:", "tel:", "data:"];
  const intentional = [];
  const blocked = [];
  const httrack = [];

  for (const f of files) {
    let text;
    try {
      text = fs.readFileSync(f, "utf8");
    } catch {
      continue;
    }
    if (/HTTrack|Mirrored from/i.test(text)) {
      httrack.push(toPosix(path.relative(ROOT, f)));
    }
    for (const u of extractAbsoluteHttps(text)) {
      let host = "";
      try {
        host = new URL(u).hostname;
      } catch {
        continue;
      }
      const rel = toPosix(path.relative(ROOT, f));
      // intentional: none required — flag maps/social if any
      if (/googleapis|gstatic|google\.com|googletagmanager|doubleclick/i.test(host)) {
        blocked.push({ file: rel, url: u, reason: "google/tracker" });
        blockedHosts.add(host);
      } else if (/newel|amazonaws|searchspring|wixstatic|parastorage|typekit|cloudflare|facebook|instagram|pinterest/i.test(host)) {
        blocked.push({ file: rel, url: u, reason: "legacy-or-cdn" });
        blockedHosts.add(host);
      } else if (/signature-solutions|reynolds/i.test(host)) {
        intentional.push({ file: rel, url: u });
      } else {
        blocked.push({ file: rel, url: u, reason: "other-external" });
        blockedHosts.add(host);
      }
    }
  }

  // Check product images exist
  const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "products.json"), "utf8"));
  let missingImages = 0;
  const missingList = [];
  for (const p of catalog.products) {
    for (const im of p.images || []) {
      const fp = path.join(ROOT, im.src.replace(/^\//, "").replace(/\//g, path.sep));
      if (!isValidImage(fp)) {
        missingImages++;
        if (missingList.length < 50) missingList.push({ id: p.id, src: im.src });
      }
    }
  }

  const report = {
    scannedFiles: files.length,
    productCount: catalog.products.length,
    missingProductImages: missingImages,
    missingSample: missingList,
    httrackHits: httrack.length,
    httrackFiles: httrack.slice(0, 20),
    blockedCount: blocked.length,
    blockedHosts: [...blockedHosts].sort(),
    blockedSample: blocked.slice(0, 40),
    intentional,
    verdict:
      blocked.length === 0 && httrack.length === 0 && missingImages === 0
        ? "PASS"
        : "ISSUES_REMAIN",
  };
  writeJson(path.join(REPORTS, "verify-external.json"), report);
  writeCsv(
    path.join(REPORTS, "blocked-urls.csv"),
    ["file", "url", "reason"],
    blocked.slice(0, 500)
  );
  console.log("Verify:", report.verdict, "blocked", report.blockedCount, "missing imgs", missingImages);
  return report;
}

function cleanupEmptyDomainFolders() {
  const candidates = [
    "s3-us-west-2.amazonaws.com",
    "newel.com",
    "www.newel.com",
    "blog.newel.com",
    "ajax.googleapis.com",
    "cdnjs.cloudflare.com",
    "use.typekit.net",
    "p.typekit.net",
    "stg2.newel.com",
    "static.wixstatic.com",
    "static.parastorage.com",
    "mdbootstrap.com",
  ];
  for (const c of candidates) {
    const p = path.join(ROOT, c);
    if (fs.existsSync(p)) {
      rmEmptyDirs(p);
      try {
        if (fs.existsSync(p) && fs.readdirSync(p).length === 0) fs.rmdirSync(p);
        else if (fs.existsSync(p)) {
          // force remove leftover empty-ish trees for site cleanliness if only empty dirs
          const still = walkFiles(p);
          if (still.length === 0) fs.rmSync(p, { recursive: true, force: true });
        }
      } catch {
        /* ignore */
      }
    }
  }
}

async function main() {
  ensureDir(REPORTS);
  console.log("=== Phase 1: flatten + localize structure ===");
  flattenAssets();
  deleteHttrackJunk();

  console.log("=== Phase 3b prep: extract catalog ===");
  const products = buildCatalog();

  console.log("=== Phase 2/3/4: chrome, pages, rebrand, commerce-free ===");
  writeChromeAssets();
  writeMarketingPages(products);

  console.log("=== Phase 1b: cull ===");
  cullUnused(products);
  cleanupEmptyDomainFolders();

  console.log("=== Phase 5: verify ===");
  const report = verifyExternal();

  writeJson(path.join(REPORTS, "build-complete.json"), {
    completedAt: new Date().toISOString(),
    productCount: products.length,
    shortfallFrom1000: 1000 - products.length,
    verify: report.verdict,
  });
  console.log("Done. Products:", products.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
