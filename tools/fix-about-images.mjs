import fs from "fs";
import path from "path";

const WORK = "C:\\Users\\user pc\\OneDrive\\Documents\\carter\\REYNOLDS_ANTIQUE_HOUSE";
const AR = "C:\\My Web Sites\\REYNOLDS_ANTIQUE_HOUSE\\antics website\\newel.com";

const about = fs.readFileSync(path.join(WORK, "about.html"), "utf8");
const refs = new Set();
for (const m of about.matchAll(/url\((['"]?)([^)'"]+)\1\)/g)) refs.add(m[2]);
for (const m of about.matchAll(/src=["']([^"']+)["']/g)) refs.add(m[1]);
console.log("ABOUT REFS:");
for (const r of refs) {
  if (!/img|assets|\.jpg|\.png|\.webp/i.test(r)) continue;
  const local = r.startsWith("/")
    ? path.join(WORK, r.replace(/^\//, "").replace(/\//g, path.sep))
    : path.join(WORK, r.replace(/\//g, path.sep));
  console.log((fs.existsSync(local) ? "OK  " : "MISS") + " " + r);
}

const arAbout = fs.readFileSync(path.join(AR, "about.html"), "utf8");
const hero = arAbout.match(/\.hero\{[^}]+background:[^;]+;/);
console.log("\nARCHIVE HERO BG:", hero && hero[0]);

// Fix bad rewritten paths in about.html
let fixed = about
  .replace(
    /url\('\.\.\/reynoldsantiquehouse\.com\/img\/Showroom\.jpg'\)/g,
    "url('/assets/img/keneddy_img.webp')"
  )
  .replace(
    /url\("\.\.\/reynoldsantiquehouse\.com\/img\/Showroom\.jpg"\)/g,
    "url('/assets/img/keneddy_img.webp')"
  )
  .replace(/src="\/assets\/img\/about_us_1\.png"/g, 'src="/assets/img/keneddy_img.webp"')
  .replace(/src="\/assets\/img\/about_us_2\.png"/g, 'src="/assets/img/keneddy_img.webp"');

// Prefer real showroom if present anywhere under assets
function findFile(root, name) {
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) stack.push(p);
      else if (e.name.toLowerCase() === name.toLowerCase()) return p;
    }
  }
  return null;
}

const showroom = findFile(path.join(AR, "img"), "Showroom.jpg") || findFile(AR, "Showroom.jpg");
if (showroom) {
  const dest = path.join(WORK, "assets", "img", "Showroom.jpg");
  fs.copyFileSync(showroom, dest);
  fixed = fixed.replace(/url\('\/assets\/img\/keneddy_img\.webp'\)/g, "url('/assets/img/Showroom.jpg')");
  console.log("copied Showroom.jpg");
}

fs.writeFileSync(path.join(WORK, "about.html"), fixed);
console.log("about.html patched");
