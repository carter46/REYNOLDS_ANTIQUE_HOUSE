import fs from "fs";
import path from "path";

const ARCHIVE =
  "C:\\My Web Sites\\REYNOLDS_ANTIQUE_HOUSE\\antics website\\newel.com";
const ROOT = "C:\\Users\\user pc\\OneDrive\\Documents\\carter\\REYNOLDS_ANTIQUE_HOUSE";
const catalogPath = path.join(ROOT, "data", "products.json");
const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));

function decode(s) {
  return String(s || "")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function extractDims(html) {
  const block = html.match(
    /DIMENSIONS\s*\(INCHES\)[\s\S]{0,800}?<\/p>/i
  );
  if (!block) return null;
  const text = block[0];
  const w = text.match(/Width\s*:[\s\S]*?<span>\s*([\d.]+)\s*(?:&quot;|")\s*<\/span>/i);
  const h = text.match(/Height\s*:[\s\S]*?<span>\s*([\d.]+)\s*(?:&quot;|")\s*<\/span>/i);
  const d = text.match(/Depth\s*:[\s\S]*?<span>\s*([\d.]+)\s*(?:&quot;|")\s*<\/span>/i);
  if (!w && !h && !d) return null;
  const parts = [];
  if (w) parts.push(`Width: ${decode(w[1])}"`);
  if (d) parts.push(`Depth: ${decode(d[1])}"`);
  if (h) parts.push(`Height: ${decode(h[1])}"`);
  return {
    width: w ? decode(w[1]) + '"' : null,
    depth: d ? decode(d[1]) + '"' : null,
    height: h ? decode(h[1]) + '"' : null,
    dimensions: parts.join("\n"),
    dimensionsHtml: parts.join("<br>"),
  };
}

let filled = 0;
let missing = 0;
let noFile = 0;

for (const p of catalog.products) {
  const rel = (p.meta && p.meta.originalPath) || "";
  // originalPath like newel.com/product/foo.html
  const archiveFile = path.join(
    "C:\\My Web Sites\\REYNOLDS_ANTIQUE_HOUSE\\antics website",
    rel.replace(/\//g, path.sep)
  );
  if (!fs.existsSync(archiveFile)) {
    noFile++;
    continue;
  }
  const html = fs.readFileSync(archiveFile, "utf8");
  const dims = extractDims(html);
  if (!dims) {
    missing++;
    continue;
  }
  p.width = dims.width;
  p.depth = dims.depth;
  p.height = dims.height;
  p.dimensions = dims.dimensions;
  p.dimensionsHtml = dims.dimensionsHtml;
  filled++;
}

fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2));
console.log(
  JSON.stringify({ total: catalog.products.length, filled, missing, noFile }, null, 2)
);
// sample
const s = catalog.products.find((p) => p.dimensions);
console.log("sample", s && { id: s.id, dimensions: s.dimensions, dimensionsHtml: s.dimensionsHtml });
