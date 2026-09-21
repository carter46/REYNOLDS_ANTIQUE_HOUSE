import fs from "fs";
const p = "data/products.json";
const data = JSON.parse(fs.readFileSync(p, "utf8"));
for (const prod of data.products) {
  if (!prod.category) continue;
  let c = String(prod.category).replace(/\.html$/i, "").replace(/-/g, " ").trim();
  if (c.toLowerCase() === "funiture") c = "furniture";
  c = c.replace(/\b\w/g, (ch) => ch.toUpperCase());
  prod.category = c;
}
fs.writeFileSync(p, JSON.stringify(data, null, 2));
console.log([...new Set(data.products.map((x) => x.category))]);
