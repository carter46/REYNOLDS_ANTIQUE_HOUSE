/**
 * Rewrite estate-services.html media URLs to flattened short paths.
 * Uses tools/reports/wix-media-flatten.json mapping + URI decoding.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const report = JSON.parse(
  fs.readFileSync(path.join(root, "tools", "reports", "wix-media-flatten.json"), "utf8")
);

// Rebuild full map from report sample is incomplete — rebuild from flat dir + saved map if present
// Prefer regenerating map by reading a sidecar written next run; for now scan flatten script output file
// The flatten script only saved a sample. Rebuild by matching basename of leaf file to hashed flat files
// via a full map file if we write it now from remaining evidence.

// Re-create map: for each flat file we have the hash of the OLD rel path.
// We didn't save the full map. Recover by re-hashing candidate old paths extracted from HTML.

import crypto from "crypto";

const flatDir = path.join(root, "assets", "vendor", "wix", "static", "media", "_flat");
const flatByHash = new Map();
for (const name of fs.readdirSync(flatDir)) {
  const hash = name.replace(/\.[^.]+$/, "").split("_")[0];
  flatByHash.set(hash, "assets/vendor/wix/static/media/_flat/" + name);
}

function sha16(s) {
  return crypto.createHash("sha1").update(s).digest("hex").slice(0, 16);
}

const estatePath = path.join(root, "estate-services.html");
let html = fs.readFileSync(estatePath, "utf8");

// Find all media path-like strings (with optional leading / and URL encoding)
const re = /\/?assets\/vendor\/wix\/static\/media\/[^"'\\\s>]+/g;
const found = new Set(html.match(re) || []);

let replaced = 0;
const unresolved = [];
const resolved = [];

for (const raw of [...found].sort((a, b) => b.length - a.length)) {
  const noLead = raw.replace(/^\//, "");
  let decoded = noLead;
  try {
    decoded = decodeURIComponent(noLead);
  } catch {
    /* keep */
  }
  // Also try with ~ for %7E already decoded
  const candidates = [noLead, decoded];
  // If path used ~mv2 vs _mv2 mismatch between HTML and filesystem
  candidates.push(decoded.replace(/~mv2/g, "_mv2"));
  candidates.push(decoded.replace(/_mv2/g, "~mv2"));

  let dest = null;
  for (const c of candidates) {
    const h = sha16(c);
    if (flatByHash.has(h)) {
      dest = flatByHash.get(h);
      break;
    }
  }
  if (!dest) {
    unresolved.push(raw);
    continue;
  }
  const withSlash = raw.startsWith("/") ? "/" + dest : dest;
  if (html.includes(raw)) {
    html = html.split(raw).join(withSlash);
    replaced++;
    resolved.push({ from: raw, to: withSlash });
  }
}

fs.writeFileSync(estatePath, html);
fs.writeFileSync(
  path.join(root, "tools", "reports", "wix-media-rewrite.json"),
  JSON.stringify({ replaced, unresolvedCount: unresolved.length, unresolved: unresolved.slice(0, 40), resolved: resolved.slice(0, 40) }, null, 2)
);
console.log(JSON.stringify({ replaced, unresolvedCount: unresolved.length, flatFiles: flatByHash.size }, null, 2));
