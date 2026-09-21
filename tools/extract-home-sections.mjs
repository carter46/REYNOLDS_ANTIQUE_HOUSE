import fs from "fs";
import path from "path";

const arch = path.join(
  "C:\\My Web Sites\\REYNOLDS_ANTIQUE_HOUSE",
  "antics website",
  "newel.com",
  "index.html"
);
const html = fs.readFileSync(arch, "utf8");
const outDir = "tools/reports/extracted";
fs.mkdirSync(outDir, { recursive: true });

function extract(startNeedle, endNeedle) {
  const a = html.indexOf(startNeedle);
  if (a < 0) return null;
  const b = html.indexOf(endNeedle, a + startNeedle.length);
  if (b < 0) return html.slice(a, a + 50000);
  return html.slice(a, b);
}

const parts = {
  utility: extract('<div class="utility-bar">', "<!-- ── MAIN HEADER"),
  estate: (() => {
    const a = html.indexOf('<a class="estate-hero"');
    if (a < 0) return null;
    const b = html.indexOf("</a>", a);
    return html.slice(a, b + 4);
  })(),
  trending: extract('<section class="trending">', '<section class="newel-featured-story"'),
  story: (() => {
    const a = html.indexOf('<section class="newel-featured-story"');
    if (a < 0) return null;
    const b = html.indexOf("</section>", a);
    return html.slice(a, b + 10);
  })(),
  hero: (() => {
    const a = html.indexOf('<section class="newel-hero"');
    if (a < 0) return null;
    const b = html.indexOf("</section>", a);
    return html.slice(a, b + 10);
  })(),
  featuredHead: extract("featured inventory", '<div id="myCarousel"'),
};

for (const [k, v] of Object.entries(parts)) {
  fs.writeFileSync(path.join(outDir, k + ".html"), v || "MISSING");
  console.log(k, v ? v.length : "MISSING");
}
