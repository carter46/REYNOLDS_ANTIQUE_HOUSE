/**
 * Stamp cache-bust ?v= query on shared CSS/JS references in root HTML pages.
 * Forces browsers/CDN to fetch new chrome after deploy.
 */
import fs from "fs";
import path from "path";

const ROOT = "C:\\Users\\user pc\\OneDrive\\Documents\\carter\\REYNOLDS_ANTIQUE_HOUSE";
const v = String(Date.now());
const pages = [
  "index.html",
  "about.html",
  "contact.html",
  "products.html",
  "product-details.html",
  "trade-program.html",
  "estate-services.html",
];

const patterns = [
  [/(\/assets\/css\/chrome\.css)(?:\?v=\d+)?/g, `$1?v=${v}`],
  [/(\/assets\/css\/home-newel\.css)(?:\?v=\d+)?/g, `$1?v=${v}`],
  [/(\/assets\/css\/newel\/styles\.css)(?:\?v=\d+)?/g, `$1?v=${v}`],
  [/(\/assets\/css\/newel\/NEWEL-PRODUCT-INFO\.css)(?:\?v=\d+)?/g, `$1?v=${v}`],
  [/(\/assets\/vendor\/bootstrap\/bootstrap\.min\.css)(?:\?v=\d+)?/g, `$1?v=${v}`],
  [/(\/js\/site-chrome\.js)(?:\?v=\d+)?/g, `$1?v=${v}`],
  [/(\/js\/product-catalog\.js)(?:\?v=\d+)?/g, `$1?v=${v}`],
];

for (const page of pages) {
  const fp = path.join(ROOT, page);
  if (!fs.existsSync(fp)) continue;
  let html = fs.readFileSync(fp, "utf8");
  for (const [re, rep] of patterns) html = html.replace(re, rep);
  fs.writeFileSync(fp, html);
  console.log("stamped", page);
}
console.log("version", v);
fs.writeFileSync(
  path.join(ROOT, "tools", "reports", "cache-bust-version.txt"),
  v + "\n"
);
