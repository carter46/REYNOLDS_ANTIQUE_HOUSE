/**
 * Correctly stamp Width/Depth/Height onto each homepage card by product id.
 */
import fs from "fs";
import path from "path";

const ROOT = "C:\\Users\\user pc\\OneDrive\\Documents\\carter\\REYNOLDS_ANTIQUE_HOUSE";
const indexPath = path.join(ROOT, "index.html");
const catalog = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "products.json"), "utf8")
);
const byId = new Map(catalog.products.map((p) => [p.id, p]));

let html = fs.readFileSync(indexPath, "utf8");

// For each featured card block, find product id then set/replace the dim paragraph
html = html.replace(
  /(<div class="featured_container_col">[\s\S]*?product-details\.html\?id=)([^"'&]+)([\s\S]*?)(?:<p class="prod-dims"[^>]*>[\s\S]*?<\/p>|<p style="margin:0;font-size:12px;font-style:italic;text-align:right;[^"]*"><\/p>)/g,
  (full, pre, id, mid) => {
    const p = byId.get(id);
    const dim =
      (p && (p.dimensionsHtml || (p.dimensions || "").replace(/\n/g, "<br>"))) ||
      "";
    return (
      pre +
      id +
      mid +
      '<p class="prod-dims" style="margin:0;font-size:12px;font-style:italic;text-align:right;line-height:1.45;">' +
      dim +
      "</p>"
    );
  }
);

fs.writeFileSync(indexPath, html);

// verify a few
const checks = ["product-028069", "product-nwl8736", "product-nwl6949"];
for (const id of checks) {
  const re = new RegExp(
    id +
      '[\\s\\S]{0,800}?class="prod-dims"[^>]*>([\\s\\S]*?)<\\/p>'
  );
  const m = html.match(re);
  console.log(id, "=>", m ? m[1].replace(/<br>/g, " | ") : "MISSING", "| expected", byId.get(id)?.dimensionsHtml);
}
