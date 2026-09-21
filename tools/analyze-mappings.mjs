import fs from "fs";
import path from "path";

const ROOT = "C:\\Users\\user pc\\OneDrive\\Documents\\carter\\REYNOLDS_ANTIQUE_HOUSE";
const d = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "products.json"), "utf8"));

function count(term) {
  const re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  return d.products.filter((p) =>
    re.test([p.title, p.style, p.category, p.description, p.material].filter(Boolean).join(" "))
  ).length;
}

const names = [
  "Wormley", "Dunbar", "Springer", "Jansen", "Risom", "Robsjohn", "Hickory",
  "Ponti", "Baughman", "Murano", "Regency", "Venetian", "Grotto", "DiPasquale",
  "Jividen", "Gauthier", "Sprunger", "Chapter", "Milo", "Art Deco", "Art Nouveau",
  "Biedermeier", "English", "French", "Italian", "Asian", "Contemporary",
  "Mid-Century", "Mirror", "Lamp", "Bust", "Portrait", "Coffee", "Sculpture",
  "Lighting", "Furniture", "Art", "console", "chair", "table", "desk", "commode",
];
for (const n of names) console.log(String(count(n)).padStart(3), n);

const about = fs.readFileSync(path.join(ROOT, "about.html"), "utf8");
const refs = [...about.matchAll(/src="(\/assets\/img\/about\/[^"]+)"/g)].map((m) => m[1]);
console.log("\nABOUT IMAGES");
for (const r of [...new Set(refs)]) {
  const abs = path.join(ROOT, r.replace(/^\//, "").replace(/\//g, path.sep));
  console.log(fs.existsSync(abs) ? "OK  " : "MISS", r);
}

// Suggest creator remaps from title tokens (capitalized multi-word makers)
const bag = {};
for (const p of d.products) {
  const t = p.title || "";
  for (const m of t.matchAll(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\b/g)) {
    const name = m[1];
    if (name.length < 5) continue;
    bag[name] = (bag[name] || 0) + 1;
  }
}
console.log("\nTOP TITLE PROPER NOUNS");
console.log(
  Object.entries(bag)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 40)
    .map(([k, v]) => v + " " + k)
    .join("\n")
);
