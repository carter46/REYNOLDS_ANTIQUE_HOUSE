/**
 * Flatten overly-long Wix static media paths so Git can index them on Windows.
 * Updates estate-services.html (and any other html/css/js refs).
 */
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mediaRoot = path.join(root, "assets", "vendor", "wix", "static", "media");
const flatDir = path.join(mediaRoot, "_flat");

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

function rimraf(dir) {
  if (!fs.existsSync(dir)) return;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) rimraf(p);
    else fs.unlinkSync(p);
  }
  fs.rmdirSync(dir);
}

fs.mkdirSync(flatDir, { recursive: true });
const files = walk(mediaRoot).filter((f) => !f.startsWith(flatDir + path.sep));
const map = new Map(); // old posix rel -> new posix rel
const used = new Set();

for (const abs of files) {
  const rel = path.relative(root, abs).split(path.sep).join("/");
  const ext = path.extname(abs).toLowerCase() || ".bin";
  const hash = crypto.createHash("sha1").update(rel).digest("hex").slice(0, 16);
  let name = `${hash}${ext}`;
  let n = 0;
  while (used.has(name)) {
    n++;
    name = `${hash}_${n}${ext}`;
  }
  used.add(name);
  const dest = path.join(flatDir, name);
  fs.copyFileSync(abs, dest);
  const newRel = path.relative(root, dest).split(path.sep).join("/");
  map.set(rel, newRel);
  // Also map URL-encoded variants and backslash variants that might appear
  map.set(rel.replace(/ /g, "%20"), newRel);
}

// Rewrite references only in likely text surfaces (avoid walking inventory)
const textExts = new Set([".html", ".css", ".js", ".json", ".mjs", ".md"]);
const scanRoots = [
  path.join(root, "estate-services.html"),
  path.join(root, "index.html"),
  path.join(root, "about.html"),
  path.join(root, "products.html"),
  path.join(root, "product-details.html"),
  path.join(root, "contact.html"),
  path.join(root, "trade-program.html"),
  path.join(root, "assets", "css"),
  path.join(root, "js"),
  path.join(root, "tools"),
];

function collectText(scanRoots) {
  const out = [];
  for (const r of scanRoots) {
    if (!fs.existsSync(r)) continue;
    const st = fs.statSync(r);
    if (st.isFile()) {
      out.push(r);
      continue;
    }
    for (const ent of fs.readdirSync(r, { withFileTypes: true })) {
      const p = path.join(r, ent.name);
      if (ent.isDirectory()) {
        for (const f of walk(p)) {
          if (textExts.has(path.extname(f).toLowerCase())) out.push(f);
        }
      } else if (textExts.has(path.extname(ent.name).toLowerCase())) out.push(p);
    }
  }
  return out;
}

const replacements = [...map.entries()].sort((a, b) => b[0].length - a[0].length);
let filesTouched = 0;
let replaceCount = 0;
for (const fp of collectText(scanRoots)) {
  let t = fs.readFileSync(fp, "utf8");
  let changed = false;
  for (const [oldRel, newRel] of replacements) {
    if (t.includes(oldRel)) {
      const parts = t.split(oldRel);
      replaceCount += parts.length - 1;
      t = parts.join(newRel);
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(fp, t);
    filesTouched++;
  }
}

// Remove old nested trees under media (keep _flat)
for (const ent of fs.readdirSync(mediaRoot, { withFileTypes: true })) {
  const p = path.join(mediaRoot, ent.name);
  if (ent.name === "_flat") continue;
  if (ent.isDirectory()) rimraf(p);
  else fs.unlinkSync(p);
}

const report = {
  flattened: map.size,
  filesTouched,
  replaceCount,
  flatDir: "assets/vendor/wix/static/media/_flat",
  sample: [...map.entries()].slice(0, 5).map(([a, b]) => ({ from: a, to: b })),
};
fs.writeFileSync(
  path.join(root, "tools", "reports", "wix-media-flatten.json"),
  JSON.stringify(report, null, 2)
);
console.log(JSON.stringify(report, null, 2));
