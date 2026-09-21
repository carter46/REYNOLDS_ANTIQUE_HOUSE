/**
 * Phase 0 — Preflight audit (no bulk downloads).
 */
import fs from "fs";
import path from "path";
import {
  ROOT,
  REPORTS,
  ensureDir,
  walkFiles,
  isValidImage,
  resolveLocalRef,
  extractAttrUrls,
  extractSrcsetUrls,
  extractCssUrls,
  extractAbsoluteHttps,
  writeCsv,
  writeJson,
  slugify,
  stableProductId,
  decodeHtmlEntities,
  stripQuery,
  toPosix,
} from "./lib.mjs";

ensureDir(REPORTS);

const PRODUCT_DIR = path.join(ROOT, "newel.com", "product");
const S3_ROOT = path.join(ROOT, "s3-us-west-2.amazonaws.com", "prod-newel", "images", "inventory");

const MOVE_MAP = [
  { from: "newel.com", to: ".", note: "site HTML/CSS/JS to root / assets" },
  { from: "s3-us-west-2.amazonaws.com/prod-newel/images/inventory", to: "assets/images/inventory" },
  { from: "www.newel.com", to: "assets/images/marketing" },
  { from: "blog.newel.com", to: "assets/images/blog" },
  { from: "ajax.googleapis.com", to: "assets/vendor/jquery" },
  { from: "cdnjs.cloudflare.com", to: "assets/vendor/cdnjs" },
  { from: "use.typekit.net", to: "assets/vendor/typekit" },
  { from: "p.typekit.net", to: "assets/vendor/typekit-privacy" },
  { from: "stg2.newel.com", to: "assets/vendor/magiczoomplus" },
  { from: "static.wixstatic.com", to: "assets/vendor/wix/static" },
  { from: "static.parastorage.com", to: "assets/vendor/wix/parastorage" },
  { from: "mdbootstrap.com", to: "assets/vendor/mdbootstrap" },
];

function listTopLevel() {
  return fs.readdirSync(ROOT, { withFileTypes: true }).map((d) => ({
    name: d.name,
    type: d.isDirectory() ? "dir" : "file",
  }));
}

function collisionReport() {
  const proposed = new Map(); // proposed -> [originals]
  const rows = [];

  // Marketing site HTML from newel.com root
  const newelRoot = path.join(ROOT, "newel.com");
  for (const f of fs.readdirSync(newelRoot)) {
    const full = path.join(newelRoot, f);
    if (!fs.statSync(full).isFile()) continue;
    if (!/\.html?$/i.test(f)) continue;
    const prop = path.join(ROOT, f);
    const key = toPosix(prop);
    if (!proposed.has(key)) proposed.set(key, []);
    proposed.get(key).push(toPosix(full));
  }

  // product/*.html -> product/*.html
  if (fs.existsSync(PRODUCT_DIR)) {
    for (const f of fs.readdirSync(PRODUCT_DIR)) {
      if (!/\.html?$/i.test(f)) continue;
      const full = path.join(PRODUCT_DIR, f);
      const prop = path.join(ROOT, "product", f);
      const key = toPosix(prop);
      if (!proposed.has(key)) proposed.set(key, []);
      proposed.get(key).push(toPosix(full));
    }
  }

  // Domain folders → assets (leaf files)
  for (const m of MOVE_MAP) {
    if (m.from === "newel.com") continue;
    const src = path.join(ROOT, ...m.from.split("/"));
    if (!fs.existsSync(src)) continue;
    const files = walkFiles(src);
    for (const full of files) {
      const rel = path.relative(src, full);
      const prop = path.join(ROOT, ...m.to.split("/"), rel);
      const key = toPosix(prop);
      if (!proposed.has(key)) proposed.set(key, []);
      proposed.get(key).push(toPosix(full));
    }
  }

  for (const [prop, originals] of proposed) {
    const collision = originals.length > 1;
    rows.push({
      original_path: originals.join(" | "),
      proposed_path: path.relative(ROOT, prop.split("/").join(path.sep)),
      collision: collision ? "Yes" : "No",
      action: collision ? "Do not overwrite — review" : "Move",
    });
  }
  return rows;
}

function domainInventory() {
  const domains = new Map();
  const files = [
    ...walkFiles(path.join(ROOT, "newel.com"), [".html", ".css", ".js"]),
  ];
  for (const f of files) {
    let text;
    try {
      text = fs.readFileSync(f, "utf8");
    } catch {
      continue;
    }
    for (const u of extractAbsoluteHttps(text)) {
      try {
        const host = new URL(u).hostname;
        domains.set(host, (domains.get(host) || 0) + 1);
      } catch {
        /* ignore */
      }
    }
  }
  return [...domains.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([domain, count]) => ({ domain, count }));
}

function parseProduct(htmlFile) {
  const html = fs.readFileSync(htmlFile, "utf8");
  const slug = path.basename(htmlFile, ".html");

  const skuMatch =
    html.match(/name=["']sku["']\s+value=["']([^"']+)["']/i) ||
    html.match(/value=["']([^"']+)["']\s+name=["']sku["']/i) ||
    html.match(/Item\s*#:\s*([A-Z0-9_-]+)/i) ||
    html.match(/inventory\/([A-Z0-9_-]+)\//i);

  const sku = skuMatch ? skuMatch[1] : "";

  let title = "";
  const titleTag = html.match(/<title>([^<]*)<\/title>/i);
  if (titleTag) {
    title = decodeHtmlEntities(titleTag[1].replace(/\s*\|\s*NEWEL\s*/gi, "").trim());
  }
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if ((!title || title.length < 3) && h1) {
    title = decodeHtmlEntities(h1[1].replace(/<[^>]+>/g, "").trim());
  }
  if (!title) title = slug.replace(/-/g, " ");

  const descMeta = html.match(/name=["']description["']\s+content=["']([^"']*)["']/i);
  const description = descMeta ? decodeHtmlEntities(descMeta[1]) : "";

  const dimMatch = html.match(/Dimensions?[:\s]*<\/[^>]+>\s*([^<]+)/i) || html.match(/>\s*([0-9."'\sx×X]+\s*(?:in|cm|ft)[^<]*)</i);
  const dimensions = dimMatch ? decodeHtmlEntities(dimMatch[1].trim()) : "";

  const priceMatch = html.match(/\$\s*[\d,]+(?:\.\d{2})?/);
  const price = priceMatch ? priceMatch[0] : "";

  const catMatch =
    html.match(/crumbs[\s\S]*?products\/([^/"']+)/i) ||
    html.match(/href=["'][^"']*products\/([^/"']+)/i);
  const category = catMatch ? catMatch[1].replace(/-/g, " ") : "";

  // Gallery image refs: MagicZoom + inventory paths
  const attrUrls = extractAttrUrls(html, [
    "src",
    "href",
    "data-image",
    "data-image-2x",
    "data-zoom-image-2x",
  ]);
  const srcsetUrls = extractSrcsetUrls(html);
  const allUrls = [...attrUrls, ...srcsetUrls].filter(
    (u) => /inventory\//i.test(u) || /s3-us-west-2/i.test(u)
  );

  const uniqueRefs = new Map(); // localPath -> { ref, valid, exists }
  for (const ref of allUrls) {
    const local = resolveLocalRef(htmlFile, ref);
    if (!local) continue;
    const key = toPosix(local).toLowerCase();
    if (uniqueRefs.has(key)) continue;
    const exists = fs.existsSync(local);
    const valid = exists && isValidImage(local);
    uniqueRefs.set(key, { ref: stripQuery(ref), local, exists, valid });
  }

  const images = [...uniqueRefs.values()];
  const validCount = images.filter((i) => i.valid).length;
  const missingCount = images.filter((i) => !i.valid).length;

  // SKU folder completeness (authoritative): HTTrack often rewrote filenames with
  // query hashes so HTML refs may not match; the inventory/{SKU}/ folder is the source of truth.
  let skuFolderImages = [];
  if (sku) {
    const skuDir = path.join(S3_ROOT, sku);
    if (fs.existsSync(skuDir)) {
      skuFolderImages = fs
        .readdirSync(skuDir)
        .filter((n) => /\.(jpe?g|png|webp)$/i.test(n))
        .map((n) => path.join(skuDir, n))
        .filter((p) => isValidImage(p));
    }
  }

  // Prefer primary gallery files (lg / non-midres / non-tiny) when available
  const primarySkuImages = skuFolderImages.filter(
    (p) => !/midres-| -th|thumb/i.test(path.basename(p)) || /-lg|-01\./i.test(path.basename(p))
  );
  const complete = skuFolderImages.length >= 1;

  // Homepage / featured signal
  const linkedFromHome = false; // filled later

  const contentFlags = {
    hasTitle: title.length > 2,
    hasDescription: description.length > 10,
    hasDimensions: dimensions.length > 0,
    hasPrice: price.length > 0,
    hasCategory: category.length > 0,
    hasThumbnail: skuFolderImages.length > 0,
  };

  const id = stableProductId(sku || slug, slug, 0);

  return {
    title,
    originalUrl: `https://newel.com/product/${slug}`,
    sku,
    id,
    slug,
    category,
    pagePath: toPosix(path.relative(ROOT, htmlFile)),
    imageCount: Math.max(images.length, skuFolderImages.length),
    validImageCount: skuFolderImages.length,
    missingImageCount: missingCount,
    htmlRefValid: validCount,
    skuFolderImageCount: skuFolderImages.length,
    imageCompleteness: complete ? "complete" : "incomplete",
    needsDownload: complete ? 0 : Math.max(1, missingCount),
    contentFlags,
    description,
    dimensions,
    price,
    images,
    skuFolderImages: skuFolderImages.map((p) => toPosix(path.relative(ROOT, p))),
  };
}

function scoreAllProducts() {
  const files = walkFiles(PRODUCT_DIR, [".html"]).filter(
    (f) => !/error|404|520/i.test(path.basename(f))
  );
  const products = [];
  for (const f of files) {
    try {
      products.push(parseProduct(f));
    } catch (e) {
      products.push({
        title: path.basename(f),
        pagePath: toPosix(path.relative(ROOT, f)),
        imageCompleteness: "error",
        error: String(e.message || e),
        needsDownload: 999,
        contentFlags: {},
        sku: "",
        id: stableProductId("", path.basename(f, ".html"), products.length),
        slug: path.basename(f, ".html"),
        category: "",
        imageCount: 0,
        validImageCount: 0,
        missingImageCount: 0,
      });
    }
  }
  return products;
}

function markHomeLinked(products) {
  const home = path.join(ROOT, "newel.com", "index.html");
  if (!fs.existsSync(home)) return;
  const html = fs.readFileSync(home, "utf8");
  for (const p of products) {
    if (html.includes(p.slug) || (p.sku && html.includes(p.sku))) {
      p.linkedFromHome = true;
    } else {
      p.linkedFromHome = false;
    }
  }
}

function buildKeepDrop(products) {
  const TARGET = 1000;
  // Sort: complete first, then linked from home, then more valid images, then fuller content
  const scored = [...products].sort((a, b) => {
    const ac = a.imageCompleteness === "complete" ? 1 : 0;
    const bc = b.imageCompleteness === "complete" ? 1 : 0;
    if (bc !== ac) return bc - ac;
    const ah = a.linkedFromHome ? 1 : 0;
    const bh = b.linkedFromHome ? 1 : 0;
    if (bh !== ah) return bh - ah;
    if ((b.validImageCount || 0) !== (a.validImageCount || 0))
      return (b.validImageCount || 0) - (a.validImageCount || 0);
    const af = Object.values(a.contentFlags || {}).filter(Boolean).length;
    const bf = Object.values(b.contentFlags || {}).filter(Boolean).length;
    return bf - af;
  });

  const complete = scored.filter((p) => p.imageCompleteness === "complete");
  const keep = complete.slice(0, TARGET);
  const drop = scored.filter((p) => !keep.includes(p));

  const shortfall = TARGET - keep.length;
  return { keep, drop, shortfall, target: TARGET };
}

function main() {
  console.log("Phase 0 preflight…");
  const structure = {
    homepage: "newel.com/index.html",
    topLevel: listTopLevel(),
    productHtmlCount: walkFiles(PRODUCT_DIR, [".html"]).length,
    inventorySkuFolders: fs.existsSync(S3_ROOT)
      ? fs.readdirSync(S3_ROOT).filter((n) => fs.statSync(path.join(S3_ROOT, n)).isDirectory()).length
      : 0,
    jpgCount: walkFiles(S3_ROOT, [".jpg", ".jpeg"]).length,
  };
  writeJson(path.join(REPORTS, "structure.json"), structure);

  console.log("Collision report…");
  const collisions = collisionReport();
  writeCsv(
    path.join(REPORTS, "collision-report.csv"),
    ["original_path", "proposed_path", "collision", "action"],
    collisions
  );
  const collisionYes = collisions.filter((c) => c.collision === "Yes");
  writeJson(path.join(REPORTS, "collision-summary.json"), {
    totalProposedMoves: collisions.length,
    collisions: collisionYes.length,
    note: collisionYes.length
      ? "Review collision rows before flatten"
      : "No filename collisions detected for proposed map",
  });

  console.log("External domain inventory…");
  const domains = domainInventory();
  writeCsv(path.join(REPORTS, "external-domains.csv"), ["domain", "count"], domains);

  console.log("Scoring products…");
  const products = scoreAllProducts();
  markHomeLinked(products);
  const { keep, drop, shortfall, target } = buildKeepDrop(products);

  const keepRows = keep.map((p, i) => ({
    product_title: p.title,
    original_url: p.originalUrl || "",
    raw_sku: p.sku || "",
    proposed_id: p.id || stableProductId(p.sku, p.slug, i),
    category: p.category || "",
    page_path: p.pagePath,
    image_count: p.imageCount,
    valid_images: p.validImageCount,
    missing_images: p.missingImageCount,
    image_completeness: p.imageCompleteness,
    has_title: p.contentFlags?.hasTitle,
    has_description: p.contentFlags?.hasDescription,
    has_dimensions: p.contentFlags?.hasDimensions,
    has_price: p.contentFlags?.hasPrice,
    has_category: p.contentFlags?.hasCategory,
    has_thumbnail: p.contentFlags?.hasThumbnail,
    linked_from_home: !!p.linkedFromHome,
    selection_reason:
      p.imageCompleteness === "complete"
        ? p.linkedFromHome
          ? "complete+homepage"
          : "complete-local-images"
        : "incomplete",
    keep_drop: "keep",
  }));

  const dropRows = drop.map((p) => ({
    product_title: p.title,
    original_url: p.originalUrl || "",
    raw_sku: p.sku || "",
    proposed_id: p.id || "",
    category: p.category || "",
    page_path: p.pagePath,
    image_count: p.imageCount,
    valid_images: p.validImageCount,
    missing_images: p.missingImageCount,
    image_completeness: p.imageCompleteness,
    has_title: p.contentFlags?.hasTitle,
    has_description: p.contentFlags?.hasDescription,
    has_dimensions: p.contentFlags?.hasDimensions,
    has_price: p.contentFlags?.hasPrice,
    has_category: p.contentFlags?.hasCategory,
    has_thumbnail: p.contentFlags?.hasThumbnail,
    linked_from_home: !!p.linkedFromHome,
    selection_reason:
      p.imageCompleteness !== "complete"
        ? "incomplete-images"
        : "over-target-cap",
    keep_drop: "drop",
  }));

  writeCsv(
    path.join(REPORTS, "keep-list.csv"),
    Object.keys(keepRows[0] || { product_title: "" }),
    keepRows
  );
  writeCsv(
    path.join(REPORTS, "drop-list.csv"),
    Object.keys(dropRows[0] || { product_title: "" }),
    dropRows
  );

  const downloadNeed = keep.reduce((n, p) => n + (p.needsDownload || 0), 0);
  const summary = {
    productPagesScored: products.length,
    target,
    keepCount: keep.length,
    dropCount: drop.length,
    shortfall,
    shortfallMessage:
      shortfall > 0
        ? `SHORTFALL: only ${keep.length} image-complete product pages in mirror (target ${target}). Will not pad with incomplete products.`
        : "Target met.",
    downloadNeedEstimateForKeepList: downloadNeed,
    downloadNote:
      downloadNeed === 0
        ? "Keep-list images appear fully local/valid; Phase 1 only fills incidental gaps + site fonts/CSS."
        : `${downloadNeed} image refs on keep-list need download or sibling recovery.`,
    autoApproveNote:
      "Proceeding with keep-list as approved for implementation (all image-complete products; shortfall documented). Management may revise later.",
  };
  writeJson(path.join(REPORTS, "phase0-summary.json"), summary);
  writeJson(path.join(REPORTS, "keep-list.json"), keep.map((p) => ({
    id: p.id,
    sku: p.sku,
    slug: p.slug,
    title: p.title,
    pagePath: p.pagePath,
    category: p.category,
  })));

  console.log(JSON.stringify(summary, null, 2));
  console.log(`Reports written to ${REPORTS}`);
}

main();
