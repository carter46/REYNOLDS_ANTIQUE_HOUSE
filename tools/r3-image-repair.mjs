/**
 * R3 — Strict image validation/repair for 342 keep-set. Never silent-drop.
 * Copy missing/invalid working images from archive when available.
 */
import fs from "fs";
import path from "path";
import {
  ROOT,
  REPORTS,
  ensureDir,
  isValidImage,
  writeCsv,
  writeJson,
  toPosix,
} from "./lib.mjs";

const ARCHIVE = "C:\\My Web Sites\\REYNOLDS_ANTIQUE_HOUSE\\antics website";
const ARCHIVE_INV = path.join(
  ARCHIVE,
  "s3-us-west-2.amazonaws.com",
  "prod-newel",
  "images",
  "inventory"
);
const WORK_INV = path.join(ROOT, "assets", "images", "inventory");

function findArchiveSibling(sku, basename) {
  const dir = path.join(ARCHIVE_INV, sku);
  if (!fs.existsSync(dir)) return null;
  const exact = path.join(dir, basename);
  if (isValidImage(exact)) return exact;
  const stem = basename.replace(/\.[^.]+$/, "").replace(/[a-f0-9]{4}$/i, "");
  const hit = fs.readdirSync(dir).find((n) => {
    const nb = n.replace(/\.[^.]+$/, "").replace(/[a-f0-9]{4}$/i, "");
    return nb === stem && isValidImage(path.join(dir, n));
  });
  return hit ? path.join(dir, hit) : null;
}

function main() {
  const catalogPath = path.join(ROOT, "data", "products.json");
  const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
  const repairs = [];
  const exceptions = [];
  let copied = 0;
  let ok = 0;
  let failed = 0;

  for (const p of catalog.products) {
    const sku = p.sku;
    if (!p.images || !p.images.length) {
      // try restore gallery from archive SKU folder
      const dir = path.join(ARCHIVE_INV, sku);
      if (fs.existsSync(dir)) {
        const files = fs
          .readdirSync(dir)
          .filter((n) => /\.(jpe?g|png)$/i.test(n) && isValidImage(path.join(dir, n)))
          .sort((a, b) => fs.statSync(path.join(dir, b)).size - fs.statSync(path.join(dir, a)).size)
          .slice(0, 12);
        if (files.length) {
          ensureDir(path.join(WORK_INV, sku));
          const images = [];
          for (const f of files) {
            const dest = path.join(WORK_INV, sku, f);
            if (!fs.existsSync(dest)) {
              fs.copyFileSync(path.join(dir, f), dest);
              copied++;
            }
            images.push({
              src: `/assets/images/inventory/${sku}/${f}`,
              alt: p.title || "",
            });
          }
          p.images = images;
          repairs.push({
            id: p.id,
            sku,
            action: "restored-gallery-from-archive-sku-folder",
            count: images.length,
          });
          ok += images.length;
          continue;
        }
      }
      exceptions.push({
        id: p.id,
        sku,
        path: "",
        reason: "no-images-and-archive-cannot-supply",
      });
      failed++;
      continue;
    }

    for (const im of p.images) {
      const rel = im.src.replace(/^\//, "").replace(/\//g, path.sep);
      const workPath = path.join(ROOT, rel);
      if (isValidImage(workPath)) {
        ok++;
        continue;
      }
      const basename = path.basename(workPath);
      const arch = findArchiveSibling(sku, basename);
      if (arch) {
        ensureDir(path.dirname(workPath));
        // If basename differs (sibling), update src
        const destName = path.basename(arch);
        const dest = path.join(WORK_INV, sku, destName);
        ensureDir(path.dirname(dest));
        if (!fs.existsSync(dest)) {
          fs.copyFileSync(arch, dest);
          copied++;
        }
        im.src = `/assets/images/inventory/${sku}/${destName}`;
        repairs.push({
          id: p.id,
          sku,
          action: "copied-from-archive",
          from: toPosix(path.relative(ARCHIVE, arch)),
          to: im.src,
        });
        ok++;
      } else {
        exceptions.push({
          id: p.id,
          sku,
          path: im.src,
          reason: "missing-invalid-and-archive-cannot-supply",
        });
        failed++;
      }
    }
  }

  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), "utf8");
  writeCsv(
    path.join(REPORTS, "image-repairs.csv"),
    ["id", "sku", "action", "from", "to", "count"],
    repairs.map((r) => ({
      id: r.id,
      sku: r.sku,
      action: r.action,
      from: r.from || "",
      to: r.to || "",
      count: r.count || "",
    }))
  );
  writeCsv(
    path.join(REPORTS, "image-repair-exceptions.csv"),
    ["id", "sku", "path", "reason"],
    exceptions
  );

  // Re-validate all JSON image paths
  let validRefs = 0;
  let invalidRefs = 0;
  for (const p of catalog.products) {
    for (const im of p.images || []) {
      const fp = path.join(ROOT, im.src.replace(/^\//, "").replace(/\//g, path.sep));
      if (isValidImage(fp)) validRefs++;
      else invalidRefs++;
    }
  }

  const summary = {
    keepSet: catalog.products.length,
    copiedFiles: copied,
    repairActions: repairs.length,
    exceptions: exceptions.length,
    validRefs,
    invalidRefs,
    silentDrops: 0,
    note: "Keep-set unchanged at 342; exceptions flagged only",
  };
  writeJson(path.join(REPORTS, "r3-summary.json"), summary);
  console.log(JSON.stringify(summary, null, 2));
  // Do not exit 2 on exceptions — plan says flag for management, keep products
}

main();
