/**
 * Cleanup unused legacy assets and re-verify only the live site surface.
 */
import fs from "fs";
import path from "path";
import {
  ROOT,
  REPORTS,
  isValidImage,
  writeJson,
  extractAbsoluteHttps,
  toPosix,
} from "./lib.mjs";

function rm(p) {
  const full = path.join(ROOT, p);
  if (fs.existsSync(full)) {
    fs.rmSync(full, { recursive: true, force: true });
    console.log("Removed", p);
  }
}

const REMOVE = [
  "newel.com",
  "assets/bootstrap",
  "assets/vendor",
  "assets/js",
  "assets/fonts",
  "assets/images/site",
  "assets/images/blog",
  "assets/images/marketing",
  "assets/img",
  "s3-us-west-2.amazonaws.com",
];

for (const r of REMOVE) rm(r);

// Remove old CSS except chrome.css
const cssDir = path.join(ROOT, "assets", "css");
if (fs.existsSync(cssDir)) {
  for (const f of fs.readdirSync(cssDir)) {
    if (f !== "chrome.css") {
      fs.rmSync(path.join(cssDir, f), { recursive: true, force: true });
      console.log("Removed assets/css/" + f);
    }
  }
}

// Ensure chrome.css exists (restore from bak or rebuild minimal)
const chromePath = path.join(cssDir, "chrome.css");
const bak = path.join(ROOT, "tools", "chrome.css.bak");
fs.mkdirSync(cssDir, { recursive: true });
if (!fs.existsSync(chromePath) && fs.existsSync(bak)) {
  fs.copyFileSync(bak, chromePath);
  console.log("Restored chrome.css from bak");
}
if (!fs.existsSync(chromePath)) {
  console.error("FATAL: no chrome.css — run build-site writeChromeAssets");
  process.exit(1);
}
fs.copyFileSync(chromePath, bak);

const LIVE_ROOTS = [
  "index.html",
  "about.html",
  "contact.html",
  "products.html",
  "product-details.html",
  "trade-program.html",
  "estate-services.html",
  "js/site-chrome.js",
  "js/product-catalog.js",
  "data/products.json",
  "assets/css/chrome.css",
];

function verifyLive() {
  const files = LIVE_ROOTS.map((r) => path.join(ROOT, r)).filter((p) => fs.existsSync(p));
  const blocked = [];
  const httrack = [];

  for (const f of files) {
    const text = fs.readFileSync(f, "utf8");
    const rel = toPosix(path.relative(ROOT, f));
    if (/HTTrack|Mirrored from/i.test(text)) httrack.push(rel);
    for (const u of extractAbsoluteHttps(text)) {
      if (/^https?:\/\/www\.w3\.org\//i.test(u)) continue;
      try {
        const host = new URL(u).hostname;
        blocked.push({ file: rel, url: u, host });
      } catch {
        /* ignore */
      }
    }
  }

  const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "products.json"), "utf8"));
  let missingImages = 0;
  let validImages = 0;
  for (const p of catalog.products) {
    for (const im of p.images || []) {
      const fp = path.join(ROOT, im.src.replace(/^\//, "").replace(/\//g, path.sep));
      if (isValidImage(fp)) validImages++;
      else missingImages++;
    }
  }

  const inv = path.join(ROOT, "assets", "images", "inventory");
  const skuCount = fs.existsSync(inv)
    ? fs.readdirSync(inv).filter((n) => fs.statSync(path.join(inv, n)).isDirectory()).length
    : 0;

  const report = {
    liveFilesScanned: files.map((f) => toPosix(path.relative(ROOT, f))),
    productCount: catalog.products.length,
    skuFoldersRetained: skuCount,
    validProductImageRefs: validImages,
    missingProductImages: missingImages,
    httrackHits: httrack.length,
    httrackFiles: httrack,
    absoluteHttpUrlsInLiveSurface: blocked,
    blockedCount: blocked.length,
    verdict:
      blocked.length === 0 && httrack.length === 0 && missingImages === 0 ? "PASS" : "ISSUES_REMAIN",
    note: "Scan limited to live Reynolds pages and their direct JS/CSS/data.",
  };
  writeJson(path.join(REPORTS, "verify-live.json"), report);
  console.log(JSON.stringify(report, null, 2));
}

verifyLive();
