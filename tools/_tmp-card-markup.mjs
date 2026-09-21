import fs from "fs";
const h = fs.readFileSync(
  "C:/My Web Sites/REYNOLDS_ANTIQUE_HOUSE/antics website/newel.com/index.html",
  "utf8"
);
const i = h.indexOf("prince_colm");
console.log(h.slice(i - 400, i + 1600));
const j = h.indexOf('class="card2"');
console.log("\n---CARD2---\n");
console.log(h.slice(j, j + 500));
