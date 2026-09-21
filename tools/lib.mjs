import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const REPORTS = path.join(ROOT, "tools", "reports");

export function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

export function walkFiles(dir, exts = null, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === "node_modules" || ent.name === ".git" || ent.name === "hts-cache") continue;
      walkFiles(full, exts, acc);
    } else if (!exts || exts.includes(path.extname(ent.name).toLowerCase())) {
      acc.push(full);
    }
  }
  return acc;
}

export function isValidImage(filePath) {
  try {
    if (!fs.existsSync(filePath)) return false;
    const st = fs.statSync(filePath);
    if (st.size < 100) return false;
    const fd = fs.openSync(filePath, "r");
    const buf = Buffer.alloc(16);
    fs.readSync(fd, buf, 0, 16, 0);
    fs.closeSync(fd);
    // JPEG
    if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true;
    // PNG
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return true;
    // GIF
    if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return true;
    // WebP (RIFF....WEBP)
    if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46) return true;
    // SVG / text — reject if looks like HTML
    const head = buf.toString("utf8");
    if (/^\s*</.test(head) || /<!DOCTYPE/i.test(head) || /<html/i.test(head)) return false;
    const ext = path.extname(filePath).toLowerCase();
    if (ext === ".svg") return true;
    return false;
  } catch {
    return false;
  }
}

/** Strip ?query and #hash; keep HTTrack hash suffixes in filename. */
export function stripQuery(url) {
  return String(url).split("#")[0].split("?")[0];
}

export function toPosix(p) {
  return p.split(path.sep).join("/");
}

/** Resolve a relative or absolute-ish asset ref from an HTML file to a disk path. */
export function resolveLocalRef(htmlFile, ref) {
  let r = stripQuery(ref).trim();
  if (!r || r.startsWith("data:") || r.startsWith("mailto:") || r.startsWith("tel:") || r.startsWith("javascript:")) {
    return null;
  }
  if (/^https?:\/\//i.test(r)) {
    // Map known remotes to local mirror folders
    r = r.replace(/^https?:\/\/(www\.)?/i, "");
    // e.g. s3-us-west-2.amazonaws.com/...
    return path.join(ROOT, r.replace(/\//g, path.sep));
  }
  if (r.startsWith("//")) {
    r = r.slice(2);
    return path.join(ROOT, r.replace(/\//g, path.sep));
  }
  // relative to html file
  return path.normalize(path.join(path.dirname(htmlFile), r.replace(/\//g, path.sep)));
}

export function extractAttrUrls(html, attrNames) {
  const urls = [];
  for (const attr of attrNames) {
    const re = new RegExp(`${attr}\\s*=\\s*["']([^"']+)["']`, "gi");
    let m;
    while ((m = re.exec(html))) urls.push(m[1]);
  }
  return urls;
}

export function extractSrcsetUrls(html) {
  const urls = [];
  const re = /srcset\s*=\s*["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html))) {
    for (const part of m[1].split(",")) {
      const u = part.trim().split(/\s+/)[0];
      if (u) urls.push(u);
    }
  }
  return urls;
}

export function extractCssUrls(text) {
  const urls = [];
  const re = /url\(\s*['"]?([^'")]+)['"]?\s*\)/gi;
  let m;
  while ((m = re.exec(text))) urls.push(m[1]);
  return urls;
}

export function extractAbsoluteHttps(text) {
  const set = new Set();
  const re = /https?:\/\/[^\s"'<>\\]+/gi;
  let m;
  while ((m = re.exec(text))) {
    let u = m[0].replace(/[),.;]+$/, "");
    set.add(u);
  }
  return [...set];
}

export function csvEscape(v) {
  const s = v == null ? "" : String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function writeCsv(filePath, headers, rows) {
  ensureDir(path.dirname(filePath));
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(row[h])).join(","));
  }
  fs.writeFileSync(filePath, lines.join("\n"), "utf8");
}

export function writeJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

export function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "product";
}

export function stableProductId(sku, slug, index) {
  const base = (sku || slug || `item-${index}`)
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-|-$/g, "");
  return `product-${base || index}`;
}

export function decodeHtmlEntities(str) {
  return String(str || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}
