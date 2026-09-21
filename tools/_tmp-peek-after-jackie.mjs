import fs from "fs";
const h = fs.readFileSync(
  "C:/My Web Sites/REYNOLDS_ANTIQUE_HOUSE/antics website/newel.com/index.html",
  "utf8"
);
const i = h.indexOf("newel-featured-story");
const j = h.indexOf("related_item", i);
const k = h.indexOf("myCarousel3", i);
const m = h.indexOf("new_arrival", i);
console.log({ i, j, k, m });
console.log("---after jackie---");
console.log(h.slice(i + 2000, i + 4500));
// archive trending h2 css
const css = h.match(/\.trend-head h2\{[^}]+\}/);
console.log("css", css && css[0]);
const row = h.match(/\.row-title\{[^}]+\}/);
console.log("row", row && row[0]);
const hint = h.match(/\.row-title \.hint\{[^}]+\}/);
console.log("hint", hint && hint[0]);
