import fs from "fs";
import path from "path";
import { walkFiles, isValidImage, ROOT } from "./lib.mjs";

const S3 = path.join(ROOT, "s3-us-west-2.amazonaws.com", "prod-newel", "images", "inventory");
const products = walkFiles(path.join(ROOT, "newel.com", "product"), [".html"]);
let withSkuFolder = 0;
let withImages = 0;
let noSku = 0;
const byCount = { "0": 0, "1-3": 0, "4+": 0 };

for (const f of products) {
  const html = fs.readFileSync(f, "utf8");
  const m =
    html.match(/name=["']sku["']\s+value=["']([^"']+)/i) ||
    html.match(/inventory\/([A-Z0-9_-]+)\//i);
  if (!m) {
    noSku++;
    continue;
  }
  const sku = m[1];
  const dir = path.join(S3, sku);
  if (!fs.existsSync(dir)) continue;
  withSkuFolder++;
  const imgs = fs
    .readdirSync(dir)
    .filter((n) => /\.(jpe?g|png)$/i.test(n) && isValidImage(path.join(dir, n)));
  if (imgs.length >= 1) withImages++;
  if (imgs.length === 0) byCount["0"]++;
  else if (imgs.length <= 3) byCount["1-3"]++;
  else byCount["4+"]++;
}

console.log({ products: products.length, noSku, withSkuFolder, withImages, byCount });
