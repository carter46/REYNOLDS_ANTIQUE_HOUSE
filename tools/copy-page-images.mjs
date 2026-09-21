import fs from "fs";
import path from "path";

const WORK = "C:\\Users\\user pc\\OneDrive\\Documents\\carter\\REYNOLDS_ANTIQUE_HOUSE";
const dest = path.join(WORK, "assets", "img");
const arImg = "C:\\My Web Sites\\REYNOLDS_ANTIQUE_HOUSE\\antics website\\newel.com\\img";

for (const f of [
  "0001_new.jpg",
  "about_us_2.png",
  "fl-img.png",
  "about_us_1.png",
  "newel-trade-services.jpg",
  "keneddy_img.webp",
]) {
  const src = path.join(arImg, f);
  const dst = path.join(dest, f);
  if (fs.existsSync(src) && !fs.existsSync(dst)) {
    fs.copyFileSync(src, dst);
    console.log("copied", f);
  } else {
    console.log(f, "local=", fs.existsSync(dst), "ar=", fs.existsSync(src));
  }
}
