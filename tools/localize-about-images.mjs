import fs from "fs";
import path from "path";

const WORK = "C:\\Users\\user pc\\OneDrive\\Documents\\carter\\REYNOLDS_ANTIQUE_HOUSE";
const ANTICS = "C:\\My Web Sites\\REYNOLDS_ANTIQUE_HOUSE\\antics website";
const DEST = path.join(WORK, "assets", "img", "about");
fs.mkdirSync(DEST, { recursive: true });

const aboutPath = path.join(WORK, "about.html");
let html = fs.readFileSync(aboutPath, "utf8");

const map = [
  ["../www.newel.com/img/Showroom.jpg", "Showroom.jpg", path.join(ANTICS, "www.newel.com", "img", "Showroom.jpg")],
  ["../reynoldsantiquehouse.com/img/Showroom.jpg", "Showroom.jpg", path.join(ANTICS, "www.newel.com", "img", "Showroom.jpg")],
  ["/assets/img/Showroom.jpg", "Showroom.jpg", path.join(ANTICS, "www.newel.com", "img", "Showroom.jpg")],
  ["/assets/img/keneddy_img.webp", "Showroom.jpg", path.join(ANTICS, "www.newel.com", "img", "Showroom.jpg")],
];

// Collect all relative ../ paths pointing into antics domains
const refs = new Set();
for (const m of html.matchAll(/(?:src|url\()['"]?(\.\.\/[^'")\s]+|\/assets\/img\/[^'")\s]+)/g)) {
  refs.add(m[1]);
}

function copyToAbout(srcAbs, name) {
  const dest = path.join(DEST, name);
  if (!fs.existsSync(srcAbs)) return null;
  if (!fs.existsSync(dest)) fs.copyFileSync(srcAbs, dest);
  return "/assets/img/about/" + name;
}

for (const ref of refs) {
  let srcAbs = null;
  let name = path.basename(ref.split("?")[0]);
  if (ref.startsWith("../")) {
    srcAbs = path.join(ANTICS, ref.replace(/^\.\.\//, "").replace(/\//g, path.sep));
  } else if (ref.startsWith("/assets/img/")) {
    // try archive newel.com/img
    const base = path.basename(ref);
    const cand = [
      path.join(ANTICS, "newel.com", "img", base),
      path.join(ANTICS, "www.newel.com", "img", base),
      path.join(WORK, "assets", "img", base),
    ];
    srcAbs = cand.find((p) => fs.existsSync(p)) || null;
  }
  if (!srcAbs || !fs.existsSync(srcAbs)) {
    console.log("SKIP", ref);
    continue;
  }
  const local = copyToAbout(srcAbs, name);
  if (!local) continue;
  const esc = ref.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  html = html.replace(new RegExp(esc, "g"), local);
  console.log("MAP", ref, "->", local);
}

// Force hero to Showroom
const showroomSrc = path.join(ANTICS, "www.newel.com", "img", "Showroom.jpg");
const showroomLocal = copyToAbout(showroomSrc, "Showroom.jpg");
if (showroomLocal) {
  html = html.replace(
    /background:#111 url\([^)]+\) center\/cover no-repeat;/g,
    `background:#111 url('${showroomLocal}') center/cover no-repeat;`
  );
}

fs.writeFileSync(aboutPath, html);
console.log("about images localized");
