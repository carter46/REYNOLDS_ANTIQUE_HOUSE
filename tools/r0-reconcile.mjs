/**
 * R0 — Safety baseline + 343→342 source reconciliation.
 * READ-ONLY on archive. Writes only under working tools/reports.
 */
import fs from "fs";
import path from "path";
import {
  ROOT,
  REPORTS,
  ensureDir,
  walkFiles,
  isValidImage,
  writeCsv,
  writeJson,
  toPosix,
  stripQuery,
  resolveLocalRef,
  extractAttrUrls,
  extractSrcsetUrls,
  decodeHtmlEntities,
} from "./lib.mjs";

export const ARCHIVE = "C:\\My Web Sites\\REYNOLDS_ANTIQUE_HOUSE\\antics website";
const ARCHIVE_PRODUCT = path.join(ARCHIVE, "newel.com", "product");
const ARCHIVE_INV = path.join(
  ARCHIVE,
  "s3-us-west-2.amazonaws.com",
  "prod-newel",
  "images",
  "inventory"
);

function parseSkuTitle(html, basename) {
  const skuMatch =
    html.match(/name=["']sku["']\s+value=["']([^"']+)/i) ||
    html.match(/Item\s*#:\s*([A-Z0-9_-]+)/i) ||
    html.match(/inventory\/([A-Z0-9_-]+)\//i);
  const sku = skuMatch ? skuMatch[1] : "";
  let title = "";
  const h4 = html.match(/product-title-show-desktop[^>]*>([^<]+)</i);
  if (h4) title = decodeHtmlEntities(h4[1].trim());
  if (!title) {
    const t = html.match(/name=["']title["']\s+value=["']([^"']+)["']/i);
    if (t) title = decodeHtmlEntities(t[1]);
  }
  if (!title) {
    const titleTag = html.match(/<title>([^<]*)<\/title>/i);
    if (titleTag)
      title = decodeHtmlEntities(titleTag[1].replace(/\s*\|\s*NEWEL\s*/gi, "").trim());
  }
  if (!title) title = basename.replace(/\.html$/i, "").replace(/-/g, " ");
  return { sku, title };
}

function countImages(htmlFile, html) {
  const attrs = extractAttrUrls(html, [
    "src",
    "href",
    "data-image",
    "data-image-2x",
    "data-zoom-image-2x",
  ]);
  const srcset = extractSrcsetUrls(html);
  const urls = [...attrs, ...srcset].filter(
    (u) => /inventory\//i.test(u) || /s3-us-west-2/i.test(u)
  );
  const unique = new Map();
  for (const ref of urls) {
    const cleaned = stripQuery(ref);
    // Prefer archive resolution
    let local = null;
    if (/^https?:\/\//i.test(cleaned) || cleaned.includes("s3-us-west-2")) {
      const m = cleaned.match(/inventory\/([^/]+)\/([^/?#]+)/i);
      if (m) local = path.join(ARCHIVE_INV, m[1], m[2]);
    } else {
      local = resolveLocalRef(htmlFile, cleaned);
      // If resolved under working tree incorrectly, remap to archive
      if (local && !local.startsWith(ARCHIVE)) {
        const rel = toPosix(path.relative(path.dirname(htmlFile), local));
        const m = cleaned.match(/inventory\/([^/]+)\/([^/?#]+)/i);
        if (m) local = path.join(ARCHIVE_INV, m[1], m[2]);
      }
    }
    if (!local) continue;
    const key = toPosix(local).toLowerCase();
    if (unique.has(key)) continue;
    const valid = isValidImage(local);
    // sibling recovery: strip HTTrack 4-hex suffix
    let recovered = false;
    if (!valid && fs.existsSync(path.dirname(local))) {
      const base = path.basename(local, path.extname(local)).replace(/[a-f0-9]{4}$/i, "");
      const sib = fs.readdirSync(path.dirname(local)).find((n) => {
        const nb = n.replace(/\.[^.]+$/, "").replace(/[a-f0-9]{4}$/i, "");
        return nb === base && isValidImage(path.join(path.dirname(local), n));
      });
      if (sib) recovered = true;
    }
    // SKU folder fallback
    let skuFolderOk = false;
    const skuDirMatch = local.match(/inventory[\\/]([^\\/]+)[\\/]/i);
    if (skuDirMatch) {
      const dir = path.join(ARCHIVE_INV, skuDirMatch[1]);
      if (fs.existsSync(dir)) {
        skuFolderOk = fs
          .readdirSync(dir)
          .some((n) => /\.(jpe?g|png)$/i.test(n) && isValidImage(path.join(dir, n)));
      }
    }
    unique.set(key, { valid: valid || recovered, skuFolderOk });
  }
  const refs = [...unique.values()];
  const validCount = refs.filter((r) => r.valid).length;
  // image_complete for reconciliation: all refs valid OR (no refs but sku folder has images) OR sku folder ok with some refs
  const skuOnly =
    refs.length === 0
      ? false
      : refs.every((r) => r.valid || r.skuFolderOk) && refs.some((r) => r.valid || r.skuFolderOk);
  let imageComplete = refs.length > 0 ? refs.every((r) => r.valid) || skuOnly : false;
  // Also: if HTML has inventory SKU and folder has >=1 valid image
  const skuFromPath = html.match(/inventory\/([A-Z0-9_-]+)\//i);
  if (!imageComplete && skuFromPath) {
    const dir = path.join(ARCHIVE_INV, skuFromPath[1]);
    if (fs.existsSync(dir)) {
      const n = fs
        .readdirSync(dir)
        .filter((f) => /\.(jpe?g|png)$/i.test(f) && isValidImage(path.join(dir, f))).length;
      if (n >= 1) imageComplete = true;
    }
  }
  return { image_reference_count: refs.length, valid_image_count: validCount, image_complete: imageComplete };
}

function main() {
  ensureDir(REPORTS);
  if (!fs.existsSync(ARCHIVE)) {
    console.error("STOP: archive missing", ARCHIVE);
    process.exit(2);
  }
  const archiveProducts = walkFiles(ARCHIVE_PRODUCT, [".html"]);
  if (archiveProducts.length !== 343) {
    console.error("STOP: archive product count is", archiveProducts.length, "expected 343");
    writeJson(path.join(REPORTS, "r0-stop.json"), {
      stop: true,
      reason: "archive_product_count_mismatch",
      actual: archiveProducts.length,
      expected: 343,
    });
    process.exit(2);
  }

  const catalog = JSON.parse(
    fs.readFileSync(path.join(ROOT, "data", "products.json"), "utf8")
  );
  const products = catalog.products || [];
  if (products.length !== 342) {
    console.error("STOP: working keep-set count is", products.length, "expected 342");
    process.exit(2);
  }

  // Map by originalPath basename and by sku
  const byBasename = new Map();
  const bySku = new Map();
  for (const p of products) {
    const op = (p.meta && p.meta.originalPath) || "";
    const base = path.basename(op).toLowerCase();
    if (base) byBasename.set(base, p);
    if (p.sku) bySku.set(String(p.sku).toUpperCase(), p);
  }

  const rows = [];
  let inKeep = 0;
  let excluded = 0;
  const unmappedKeep = new Set(products.map((p) => p.id));

  for (const file of archiveProducts) {
    const html = fs.readFileSync(file, "utf8");
    const basename = path.basename(file);
    const { sku, title } = parseSkuTitle(html, basename);
    const img = countImages(file, html);
    let current = byBasename.get(basename.toLowerCase());
    if (!current && sku) current = bySku.get(sku.toUpperCase());
    const inSet = !!current;
    if (inSet) {
      inKeep++;
      unmappedKeep.delete(current.id);
    } else {
      excluded++;
    }
    let exclusion_reason = "";
    if (!inSet) {
      if (/520:|Web server is returning|Cloudflare/i.test(html) || /520/.test(title)) {
        exclusion_reason = "Cloudflare/HTTP error shell; incomplete images; excluded from keep-set";
      } else if (!img.image_complete) {
        exclusion_reason = "Not in keep-set; image_incomplete or unmatched";
      } else {
        exclusion_reason = "Not in current keep-set (unmatched to products.json)";
      }
    }
    rows.push({
      source_path: toPosix(path.relative(ARCHIVE, file)),
      source_product_identifier: title,
      sku: sku || "",
      current_product_id: current ? current.id : "",
      in_current_keep_set: inSet ? "yes" : "no",
      image_reference_count: img.image_reference_count,
      valid_image_count: img.valid_image_count,
      image_complete: img.image_complete ? "yes" : "no",
      exclusion_reason,
    });
  }

  writeCsv(
    path.join(REPORTS, "source-product-reconciliation.csv"),
    [
      "source_path",
      "source_product_identifier",
      "sku",
      "current_product_id",
      "in_current_keep_set",
      "image_reference_count",
      "valid_image_count",
      "image_complete",
      "exclusion_reason",
    ],
    rows
  );

  const productsHtml = fs.readFileSync(path.join(ROOT, "products.html"), "utf8");
  const filterLabels = [...productsHtml.matchAll(/data-cat="([^"]+)"/g)].map((m) => m[1]);
  const estatePath = path.join(ROOT, "estate-services.html");
  const estateStat = fs.statSync(estatePath);
  const deadFallback = "/assets/img/inventory/no_image_available_300x300.jpg";
  const deadExists = fs.existsSync(
    path.join(ROOT, deadFallback.replace(/^\//, "").replace(/\//g, path.sep))
  );

  const summary = {
    archivePath: ARCHIVE,
    archiveProductPages: archiveProducts.length,
    currentKeptProducts: products.length,
    reconciledInKeepSet: inKeep,
    excludedProducts: excluded,
    unmappedKeptProductIds: [...unmappedKeep],
    reconcileOk:
      archiveProducts.length === 343 &&
      products.length === 342 &&
      inKeep === 342 &&
      excluded === 1 &&
      unmappedKeep.size === 0,
    excludedRows: rows.filter((r) => r.in_current_keep_set === "no"),
  };

  writeJson(path.join(REPORTS, "remediation-baseline.json"), {
    generatedAt: new Date().toISOString(),
    workingRoot: ROOT,
    archivePath: ARCHIVE,
    productCount: products.length,
    filterLabels,
    estateServicesBytes: estateStat.size,
    estateLooksLikeStub: estateStat.size < 5000,
    deadFallbackPath: deadFallback,
    deadFallbackExists: deadExists,
    chromeCssExists: fs.existsSync(path.join(ROOT, "assets", "css", "chrome.css")),
    siteChromeExists: fs.existsSync(path.join(ROOT, "js", "site-chrome.js")),
    reconciliation: summary,
  });

  writeJson(path.join(REPORTS, "r0-summary.json"), summary);
  console.log(JSON.stringify(summary, null, 2));
  if (!summary.reconcileOk) {
    console.error("STOP: reconciliation failed");
    process.exit(2);
  }
  console.log("R0 PASS: 343 archive, 342 kept, 1 excluded, 0 unmapped");
}

main();
