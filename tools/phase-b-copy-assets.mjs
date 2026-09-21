/**
 * Phase B/C asset + CSS extraction from read-only archive into working tree.
 * Does not modify the archive.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const archive = path.join(
  "C:\\My Web Sites\\REYNOLDS_ANTIQUE_HOUSE",
  "antics website",
  "newel.com"
);
const typekit = path.join(
  "C:\\My Web Sites\\REYNOLDS_ANTIQUE_HOUSE",
  "antics website",
  "use.typekit.net"
);

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}
function copyFile(src, dest) {
  if (!fs.existsSync(src)) return false;
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
  return true;
}
function copyDir(src, dest) {
  if (!fs.existsSync(src)) return 0;
  let n = 0;
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, ent.name);
    const d = path.join(dest, ent.name);
    if (ent.isDirectory()) n += copyDir(s, d);
    else if (copyFile(s, d)) n++;
  }
  return n;
}

const log = { copied: [], missing: [] };

function tryCopy(relSrc, relDest) {
  const src = path.isAbsolute(relSrc) ? relSrc : path.join(archive, relSrc);
  const dest = path.join(root, relDest);
  if (copyFile(src, dest)) log.copied.push(relDest);
  else log.missing.push(relSrc);
}

// Images
tryCopy("img/search-icon.png", "assets/img/search-icon.png");
tryCopy("img/keneddy_img.webp", "assets/img/keneddy_img.webp");
tryCopy("img/newel-trade-services.jpg", "assets/img/newel-trade-services.jpg");
for (const f of [
  "art-deco.jpg",
  "english-georgian.jpg",
  "mid-century.jpg",
  "biedermeier.jpg",
  "abstract.jpg",
]) {
  tryCopy(`img/home_slider/style/${f}`, `assets/img/home_slider/style/${f}`);
}
for (const f of [
  "maison-jansen.jpg",
  "dunbar.jpg",
  "tj-robbsohn-gibbings.jpg",
  "old-hickory.jpg",
  "jens-risom.jpg",
  "karl-springer.jpg",
]) {
  tryCopy(`img/home_slider/creator/${f}`, `assets/img/home_slider/creator/${f}`);
}
for (const f of [
  "murano-glass-lighting.jpg",
  "portraits.jpg",
  "brass-coffee-tables.jpg",
  "still-life.jpg",
  "wall-mirrors.jpg",
  "busts.jpg",
  "victorian-table-lamps.jpg",
]) {
  tryCopy(`img/home_slider/category/${f}`, `assets/img/home_slider/category/${f}`);
}

// CSS / JS / bootstrap / fonts
const cssFiles = [
  "styles.css",
  "bootstrap-mega-menu.min.css",
  "bs-theme-overrides.css",
  "Newel-Footer-1.css",
  "flexslider.css",
  "BrowseALL.css",
  "NEWEL-PRODUCT-INFO.css",
  "productinfo.css",
];
for (const f of cssFiles) tryCopy(`css/${f}`, `assets/css/newel/${f}`);
tryCopy("bootstrap/css/bootstrap.min.css", "assets/vendor/bootstrap/bootstrap.min.css");
tryCopy("bootstrap/js/bootstrap.min.js", "assets/vendor/bootstrap/bootstrap.min.js");
tryCopy("js/jquery-3.7.1.min.js", "assets/js/jquery-3.7.1.min.js");
tryCopy("js/jquery.flexslider.js", "assets/js/jquery.flexslider.js");
tryCopy("js/bs-init.js", "assets/js/bs-init.js");

const fontCss = [
  "font-awesome.min.css",
  "line-awesome.min.css",
  "material-icons.min.css",
  "ionicons.min.css",
];
for (const f of fontCss) tryCopy(`fonts/${f}`, `assets/fonts/${f}`);
// copy font binaries
const fontBinCount = copyDir(path.join(archive, "fonts"), path.join(root, "assets", "fonts"));
log.copied.push(`assets/fonts/* (${fontBinCount} files from fonts dir)`);

if (fs.existsSync(typekit)) {
  const n = copyDir(typekit, path.join(root, "assets", "fonts", "typekit"));
  log.copied.push(`assets/fonts/typekit (${n} files)`);
}

// Extract homepage inline CSS blocks that matter (from first large style through hero styles)
const indexPath = path.join(archive, "index.html");
const html = fs.readFileSync(indexPath, "utf8");
const styleChunks = [];
const re = /<style[^>]*>([\s\S]*?)<\/style>/gi;
let m;
while ((m = re.exec(html))) {
  const body = m[1];
  if (
    body.includes("utility-bar") ||
    body.includes("newel-hero") ||
    body.includes(".trending") ||
    body.includes("estate-hero") ||
    body.includes("newel-featured-story") ||
    body.includes("--serif2") ||
    body.includes("header__inner")
  ) {
    styleChunks.push(body);
  }
}
const homeCss =
  "/* Extracted from archive newel.com/index.html — Phase B restore */\n" +
  styleChunks.join("\n\n");
ensureDir(path.join(root, "assets", "css"));
fs.writeFileSync(path.join(root, "assets", "css", "home-newel.css"), homeCss);
log.copied.push("assets/css/home-newel.css");

fs.writeFileSync(
  path.join(root, "tools", "reports", "phase-b-asset-copy.json"),
  JSON.stringify(log, null, 2)
);
console.log(JSON.stringify({ copied: log.copied.length, missing: log.missing, homeCssBytes: homeCss.length }, null, 2));
