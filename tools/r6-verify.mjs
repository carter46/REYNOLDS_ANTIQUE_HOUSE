/**
 * R6 — Full verification beyond HTTP 200
 */
import fs from "fs";
import path from "path";
import http from "http";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const reports = path.join(root, "tools", "reports");

const products = JSON.parse(fs.readFileSync(path.join(root, "data", "products.json"), "utf8"));
const list = products.products || products;
if (!Array.isArray(list) || list.length !== 342) {
  console.error("STOP: expected 342 products, got", Array.isArray(list) ? list.length : typeof list);
  process.exit(1);
}

function isJpeg(buf) {
  return buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
}

function resolveLocal(src) {
  if (!src) return null;
  let p = src.replace(/^\//, "").replace(/\//g, path.sep);
  return path.join(root, p);
}

const rows = [];
function row(id, status, detail) {
  rows.push({ id, status, detail });
}

// --- Static catalog verification ---
let productsPass = 0;
let productsFail = 0;
const productFailures = [];

for (const p of list) {
  const issues = [];
  if (!p.id) issues.push("missing_id");
  if (!p.title) issues.push("missing_title");
  const images = p.images || [];
  if (!images.length) issues.push("no_images");
  let validImgs = 0;
  for (const im of images) {
    const fp = resolveLocal(im.src);
    if (!fp || !fs.existsSync(fp)) {
      issues.push("missing_file:" + (im.src || ""));
      continue;
    }
    const buf = fs.readFileSync(fp);
    if (!isJpeg(buf) && !/\.png$/i.test(fp)) {
      // allow png if magic matches; else fail
      const isPng = buf[0] === 0x89 && buf[1] === 0x50;
      if (!isPng) issues.push("invalid_magic:" + im.src);
      else validImgs++;
    } else if (isJpeg(buf) || /\.jpe?g$/i.test(fp)) {
      if (!isJpeg(buf)) issues.push("invalid_jpeg:" + im.src);
      else validImgs++;
    } else validImgs++;
  }
  if (images.length && validImgs === 0) issues.push("zero_valid_images");
  if (issues.length) {
    productsFail++;
    productFailures.push({ id: p.id, sku: p.sku, issues: issues.slice(0, 8) });
  } else productsPass++;
}

row("catalog.count", list.length === 342 ? "PASS" : "FAIL", `count=${list.length}`);
row(
  "catalog.data_and_images",
  productsFail === 0 ? "PASS" : "FAIL",
  `pass=${productsPass} fail=${productsFail}`
);

// Invalid ID expectation (static source)
const pdpHtml = fs.readFileSync(path.join(root, "product-details.html"), "utf8");
row(
  "pdp.not_found_ui",
  /Product not found/i.test(pdpHtml) ? "PASS" : "FAIL",
  "product-details.html contains not-found branch"
);

// Filters
const productsHtml = fs.readFileSync(path.join(root, "products.html"), "utf8");
const expectedCats = ["Furniture", "Sculpture", "Mirrors", "Lighting", "Decor", "Art", "Accessories"];
const filterOk = expectedCats.every((c) => productsHtml.includes(`data-cat="${c}"`)) &&
  !/funiture|\.html"/i.test(productsHtml.match(/rah-filters[\s\S]*?<\/div>/)?.[0] || "");
row("filters.labels", filterOk ? "PASS" : "FAIL", expectedCats.join(","));

// Placeholder
const placeholder = path.join(root, "assets", "images", "placeholders", "no-image.jpg");
const catalogJs = fs.readFileSync(path.join(root, "js", "product-catalog.js"), "utf8");
row(
  "fallback.no_image",
  fs.existsSync(placeholder) && catalogJs.includes("/assets/images/placeholders/no-image.jpg")
    ? "PASS"
    : "FAIL",
  placeholder
);

// Estate
const estate = fs.readFileSync(path.join(root, "estate-services.html"), "utf8");
row(
  "estate.present",
  estate.length > 10000 && /Estate/i.test(estate) ? "PASS" : "FAIL",
  `bytes=${estate.length}`
);
row(
  "estate.shared_chrome_roots",
  /site-header-root/.test(estate) && /site-footer-root/.test(estate) ? "PASS" : "FAIL",
  "injection roots"
);

// Chrome architecture
const chromeJs = fs.readFileSync(path.join(root, "js", "site-chrome.js"), "utf8");
const chromeCss = fs.readFileSync(path.join(root, "assets", "css", "chrome.css"), "utf8");
row(
  "chrome.injection",
  /site-header-root/.test(chromeJs) && /Reynolds Antique House/.test(chromeJs) ? "PASS" : "FAIL",
  "site-chrome.js"
);
row(
  "chrome.no_commerce",
  !/searchspring|recaptcha|checkout|Add to (Cart|Bag)|gtag\(/i.test(chromeJs + chromeCss)
    ? "PASS"
    : "FAIL",
  "chrome surface"
);

// Network / dependency scan on live pages (exclude vendor)
const liveFiles = [
  "index.html",
  "about.html",
  "products.html",
  "product-details.html",
  "contact.html",
  "trade-program.html",
  "estate-services.html",
  "assets/css/chrome.css",
  "js/site-chrome.js",
  "js/product-catalog.js",
];
const renderCriticalRemote = [];
const allowedHttps = [
  /^https:\/\/github\.com\/wix\/yoshi/, // CSS comment only
];
for (const rel of liveFiles) {
  const t = fs.readFileSync(path.join(root, rel), "utf8");
  const urls = [...t.matchAll(/https:\/\/[^\s"'<>)]+/gi)].map((m) => m[0]);
  for (const u of urls) {
    if (allowedHttps.some((re) => re.test(u))) continue;
    // blog.newel.com is a content href leftover — flag as non-critical link
    if (/fonts\.googleapis|fonts\.gstatic|cdn\.searchspring|googletagmanager|google-analytics|recaptcha|static\.parastorage\.com\/.*\.(woff2?|ttf|otf|css|js)/i.test(u)) {
      renderCriticalRemote.push({ file: rel, url: u, kind: "render_critical" });
    } else if (/fonts\.googleapis|cdn\.searchspring|gtag|recaptcha/i.test(t) && /fonts\.googleapis|cdn\.searchspring/.test(u)) {
      renderCriticalRemote.push({ file: rel, url: u, kind: "render_critical" });
    }
  }
  if (/fonts\.googleapis\.com|cdn\.searchspring\.net|googletagmanager|g-recaptcha\b/i.test(t)) {
    renderCriticalRemote.push({ file: rel, url: "(inline match)", kind: "render_critical_pattern" });
  }
  if (/Added by HTTrack/i.test(t)) {
    renderCriticalRemote.push({ file: rel, url: "HTTrack", kind: "httrack" });
  }
}
row(
  "network.render_critical_https",
  renderCriticalRemote.length === 0 ? "PASS" : "FAIL",
  renderCriticalRemote.length ? JSON.stringify(renderCriticalRemote.slice(0, 10)) : "none"
);

// HTTP server checks
function startServer() {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [
        "-e",
        `
const http=require('http');const fs=require('fs');const path=require('path');
const root=${JSON.stringify(root)};
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{
  let u=decodeURIComponent((req.url||'/').split('?')[0]);
  if(u==='/') u='/index.html';
  const fp=path.join(root,u.replace(/^\\//,''));
  if(!fp.startsWith(root) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()){
    res.writeHead(404);res.end('not found');return;
  }
  const ext=path.extname(fp).toLowerCase();
  res.writeHead(200,{'Content-Type':mime[ext]||'application/octet-stream'});
  fs.createReadStream(fp).pipe(res);
});
server.listen(8765,'127.0.0.1',()=>console.log('READY'));
`,
      ],
      { stdio: ["ignore", "pipe", "pipe"] }
    );
    let ready = false;
    child.stdout.on("data", (d) => {
      if (String(d).includes("READY") && !ready) {
        ready = true;
        resolve(child);
      }
    });
    child.stderr.on("data", (d) => process.stderr.write(d));
    child.on("error", reject);
    setTimeout(() => {
      if (!ready) reject(new Error("server start timeout"));
    }, 15000);
  });
}

function get(urlPath) {
  return new Promise((resolve, reject) => {
    // Encode path segments but keep leading slash and query intact
    let pathOnly = urlPath;
    let query = "";
    const q = urlPath.indexOf("?");
    if (q >= 0) {
      pathOnly = urlPath.slice(0, q);
      query = urlPath.slice(q);
    }
    const encPath =
      pathOnly
        .split("/")
        .map((seg, i) => (i === 0 && seg === "" ? "" : encodeURIComponent(decodeURIComponent(seg))))
        .join("/") || "/";
    http
      .get({ hostname: "127.0.0.1", port: 8765, path: encPath + query, timeout: 10000 }, (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () =>
          resolve({ status: res.statusCode, body: Buffer.concat(chunks), headers: res.headers })
        );
      })
      .on("error", reject);
  });
}

async function httpChecks(child) {
  const pageChecks = [
    "/",
    "/index.html",
    "/products.html",
    "/product-details.html",
    "/estate-services.html",
    "/about.html",
    "/data/products.json",
    "/assets/css/chrome.css",
    "/js/site-chrome.js",
    "/js/product-catalog.js",
  ];
  for (const p of pageChecks) {
    const r = await get(p);
    row(`http.page${p}`, r.status === 200 ? "PASS" : "FAIL", `status=${r.status}`);
  }

  let httpProductPass = 0;
  let httpProductFail = 0;
  const sampleFails = [];
  // PDP shell HTTP for all 342; image bytes already validated on disk above.
  // Spot-check primary image over HTTP for every product (resolves path).
  for (const p of list) {
    const r = await get(`/product-details.html?id=${encodeURIComponent(p.id)}`);
    const okStatus = r.status === 200;
    let imgsOk = true;
    const primary = p.images && p.images[0] && p.images[0].src;
    if (primary) {
      const ir = await get(primary.startsWith("/") ? primary : "/" + primary);
      const png =
        ir.body[0] === 0x89 && ir.body[1] === 0x50 && ir.body[2] === 0x4e && ir.body[3] === 0x47;
      if (ir.status !== 200 || (!isJpeg(ir.body) && !png)) imgsOk = false;
    } else imgsOk = false;
    if (okStatus && imgsOk && p.title) httpProductPass++;
    else {
      httpProductFail++;
      if (sampleFails.length < 15)
        sampleFails.push({ id: p.id, status: r.status, imgsOk, title: !!p.title });
    }
  }
  row(
    "http.all_342_pdp_shell",
    httpProductFail === 0 ? "PASS" : "FAIL",
    `pass=${httpProductPass} fail=${httpProductFail}`
  );
  if (sampleFails.length) row("http.pdp_failures_sample", "FAIL", JSON.stringify(sampleFails));

  // Invalid ID still returns shell 200 (SPA-style) — expected
  const bad = await get("/product-details.html?id=__no_such_product__");
  row(
    "http.invalid_id_shell",
    bad.status === 200 ? "PASS" : "FAIL",
    `status=${bad.status} (not-found handled client-side)`
  );

  // JSON contains all titles
  const jsonRes = await get("/data/products.json");
  const json = JSON.parse(jsonRes.body.toString("utf8"));
  const jp = json.products || json;
  row(
    "http.products_json",
    jsonRes.status === 200 && jp.length === 342 ? "PASS" : "FAIL",
    `status=${jsonRes.status} count=${jp.length}`
  );

  child.kill();
}

// Browser render
row(
  "render.browser_automation",
  "UNVERIFIED",
  "UNVERIFIED — static/source scan only (browser automation unavailable in this environment)"
);
row("render.pdp_title_gallery", "UNVERIFIED", "requires browser");
row("render.filters_interaction", "UNVERIFIED", "requires browser");
row("render.no_js_blocking_errors", "UNVERIFIED", "requires browser");

async function main() {
  const child = await startServer();
  try {
    await httpChecks(child);
  } catch (e) {
    try {
      child.kill();
    } catch (_) {}
    throw e;
  }

  const summary = {
    phase: "R6",
    generatedAt: new Date().toISOString(),
    keepSet: 342,
    productsPass,
    productsFail,
    productFailures: productFailures.slice(0, 25),
    requirements: rows,
    overall: rows.some((r) => r.status === "FAIL")
      ? rows.some((r) => r.status === "UNVERIFIED")
        ? "PARTIAL"
        : "FAIL"
      : rows.some((r) => r.status === "UNVERIFIED")
        ? "PARTIAL"
        : "PASS",
  };

  // If only UNVERIFIED are non-pass and no FAIL → PARTIAL
  const hasFail = rows.some((r) => r.status === "FAIL");
  const hasUnverified = rows.some((r) => r.status === "UNVERIFIED");
  summary.overall = hasFail ? "FAIL" : hasUnverified ? "PARTIAL" : "PASS";

  fs.writeFileSync(path.join(reports, "remediation-verify.json"), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify({ overall: summary.overall, pass: productsPass, fail: productsFail, rows: rows.length }, null, 2));
  for (const r of rows) {
    if (r.status !== "PASS") console.log(r.status, r.id, r.detail);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
