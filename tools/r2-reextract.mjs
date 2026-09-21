/**
 * R2 — Re-extract product fields from archive; never overwrite useful with null.
 */
import fs from "fs";
import path from "path";
import {
  ROOT,
  REPORTS,
  writeCsv,
  writeJson,
  decodeHtmlEntities,
} from "./lib.mjs";

const ARCHIVE = "C:\\My Web Sites\\REYNOLDS_ANTIQUE_HOUSE\\antics website";

function pick(existing, archive, reasonPreferArchive) {
  const eEmpty = existing == null || existing === "";
  const aEmpty = archive == null || archive === "";
  if (eEmpty && aEmpty) return { final: existing ?? null, reason: "both-empty" };
  if (eEmpty && !aEmpty) return { final: archive, reason: "filled-from-archive" };
  if (!eEmpty && aEmpty) return { final: existing, reason: "kept-existing-archive-empty" };
  if (String(existing) === String(archive))
    return { final: existing, reason: "unchanged-same" };
  // Prefer longer/richer non-null archive for text fields
  if (reasonPreferArchive && String(archive).length > String(existing).length + 10) {
    return { final: archive, reason: "archive-richer" };
  }
  return { final: existing, reason: "kept-existing" };
}

function extractFromHtml(html) {
  const out = {};
  const h4 = html.match(/product-title-show-desktop[^>]*>([^<]+)</i);
  out.title = h4 ? decodeHtmlEntities(h4[1].trim()) : null;

  const descP = html.match(/product_description[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i);
  if (descP) out.description = decodeHtmlEntities(descP[1].replace(/<[^>]+>/g, "").trim());
  const descMeta = html.match(/name=["']description["']\s+content=["']([^"']*)["']/i);
  if ((!out.description || out.description.length < 20) && descMeta) {
    out.description = decodeHtmlEntities(descMeta[1]);
  }

  const priceM = html.match(/product_price[\s\S]*?<h5>\s*(\$[\d,]+(?:\.\d{2})?)/i);
  out.price = priceM ? priceM[1] : null;

  // Dimensions: common patterns
  let dim = null;
  const dimLabel = html.match(/Dimensions?\s*:?\s*<\/?(?:strong|span|b|td|th)[^>]*>\s*([^<]{3,120})/i);
  if (dimLabel) dim = decodeHtmlEntities(dimLabel[1].trim());
  if (!dim) {
    const dimRow = html.match(/>\s*Dimensions?\s*<[\s\S]{0,80}?>([^<]{3,120})</i);
    if (dimRow) dim = decodeHtmlEntities(dimRow[1].trim());
  }
  out.dimensions = dim;

  const field = (label) => {
    const re = new RegExp(
      label + "\\s*:?[\\s\\S]{0,40}?<span[^>]*>([^<]+)</span>",
      "i"
    );
    const m = html.match(re);
    return m ? decodeHtmlEntities(m[1].trim()) : null;
  };
  out.style = field("Style");
  out.period = field("Period") || field("Era");
  out.material = field("Material") || field("Materials");

  const avail = html.match(/Available Qty:\s*&nbsp;?(\d+)/i);
  out.availability = avail ? `Available Qty: ${avail[1]}` : null;

  return out;
}

function main() {
  const catalogPath = path.join(ROOT, "data", "products.json");
  const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
  const diffs = [];
  let updated = 0;

  for (const p of catalog.products) {
    const rel = (p.meta && p.meta.originalPath) || "";
    const archiveFile = path.join(ARCHIVE, rel.replace(/\//g, path.sep));
    if (!fs.existsSync(archiveFile)) {
      diffs.push({
        id: p.id,
        sku: p.sku,
        field: "_source",
        existing_value: rel,
        archive_value: "",
        final_value: rel,
        reason: "STOP-risk: archive-file-missing",
      });
      continue;
    }
    const html = fs.readFileSync(archiveFile, "utf8");
    const a = extractFromHtml(html);

    const fields = [
      "title",
      "description",
      "dimensions",
      "price",
      "material",
      "style",
      "period",
      "availability",
    ];
    for (const f of fields) {
      const existing = p[f] ?? null;
      const archive = a[f] ?? null;
      const preferArchive = f === "description" || f === "dimensions";
      const { final, reason } = pick(existing, archive, preferArchive);
      diffs.push({
        id: p.id,
        sku: p.sku,
        field: f,
        existing_value: existing ?? "",
        archive_value: archive ?? "",
        final_value: final ?? "",
        reason,
      });
      if (final !== existing) {
        p[f] = final;
        updated++;
      }
    }
  }

  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), "utf8");
  writeCsv(
    path.join(REPORTS, "reextract-diff.csv"),
    ["id", "sku", "field", "existing_value", "archive_value", "final_value", "reason"],
    diffs
  );
  const missingSources = diffs.filter((d) => d.reason.includes("archive-file-missing"));
  writeJson(path.join(REPORTS, "r2-summary.json"), {
    products: catalog.products.length,
    fieldDiffRows: diffs.length,
    fieldUpdates: updated,
    missingArchiveSources: missingSources.length,
    stop: missingSources.length > 0,
  });
  console.log(
    JSON.stringify(
      {
        products: catalog.products.length,
        fieldUpdates: updated,
        missingArchiveSources: missingSources.length,
      },
      null,
      2
    )
  );
  if (missingSources.length > 0) {
    console.error("STOP: unmapped archive sources");
    process.exit(2);
  }
}

main();
