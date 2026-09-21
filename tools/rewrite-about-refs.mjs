import fs from "fs";
import path from "path";

const WORK = "C:\\Users\\user pc\\OneDrive\\Documents\\carter\\REYNOLDS_ANTIQUE_HOUSE";
const aboutPath = path.join(WORK, "about.html");
const dest = path.join(WORK, "assets", "img", "about");
let html = fs.readFileSync(aboutPath, "utf8");

// Rewrite any remaining ../blog.newel.com/.../filename to /assets/img/about/filename
html = html.replace(/\.\.\/blog\.newel\.com\/wp-content\/uploads\/2019\/12\/([^"' )\]]+)/g, (m, file) => {
  const local = path.join(dest, file);
  return fs.existsSync(local) ? `/assets/img/about/${file}` : m;
});
html = html.replace(/\.\.\/reynoldsantiquehouse\.com\/img\/([^"' )\]]+)/g, (m, file) => {
  const local = path.join(dest, file);
  const alt = path.join(WORK, "assets", "img", file);
  if (fs.existsSync(local)) return `/assets/img/about/${file}`;
  if (fs.existsSync(alt)) return `/assets/img/${file}`;
  return m;
});
html = html.replace(/\/assets\/img\/(newel-about-us-sustainability-6\.jpg|newel-auctions-lg\.jpg|about_us_1\.png|about_us_2\.png)/g, (m, file) => {
  const local = path.join(dest, file);
  if (fs.existsSync(local)) return `/assets/img/about/${file}`;
  if (file.startsWith("about_us")) return "/assets/img/about/Showroom.jpg";
  return m;
});
// static.wixstatic press logos — leave or hide
html = html.replace(/\.\.\/static\.wixstatic\.com\/[^"' )\]]+/g, "/assets/img/about/Showroom.jpg");

fs.writeFileSync(aboutPath, html);
console.log("rewrote about refs");
