/**
 * Rebuild homepage featured + trending carousels with archive-accurate Newel cards.
 * No commerce wishlist. Local PDP links + dimensions from products.json.
 */
import fs from "fs";
import path from "path";

const ROOT = "C:\\Users\\user pc\\OneDrive\\Documents\\carter\\REYNOLDS_ANTIQUE_HOUSE";
const catalog = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "products.json"), "utf8")
);
const byId = new Map(catalog.products.map((p) => [p.id, p]));

const FEATURED_IDS = [
  "product-028069",
  "product-nwl8736",
  "product-nwl6949",
  "product-055582",
  "product-duf0266b",
  "product-duf0064",
  "product-duf0729",
  "product-063540",
  "product-nwl7895",
  "product-nwl7595",
  "product-nwl8761",
  "product-nwl8737",
];

function esc(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}

function dimsHtml(p) {
  if (p.dimensionsHtml) return p.dimensionsHtml;
  if (p.dimensions) return esc(p.dimensions).replace(/\n/g, "<br>");
  return [p.width && `Width: ${esc(p.width)}`, p.depth && `Depth: ${esc(p.depth)}`, p.height && `Height: ${esc(p.height)}`]
    .filter(Boolean)
    .join("<br>");
}

function card(p, i) {
  const img =
    (p.images && p.images[0] && p.images[0].src) ||
    "/assets/images/placeholders/no-image.jpg";
  const href = "/product-details.html?id=" + encodeURIComponent(p.id) + "#id=" + encodeURIComponent(p.id);
  const price = p.price || "";
  const dim = dimsHtml(p);
  const active = i === 0 ? " active" : "";
  return `    <div class="carousel-item${active}">
      <div class="col-xs-12 col-sm-12 col-md-6 col-lg-4 col-xl-4 col-xxl-3 justify-content-xxl-center align-items-xxl-center imgboxsplit">
        <div class="card card-body">
          <div class="featured_container_col">
            <div class="shadow1 hvrcls img_box_shadow">
              <div class="d-xxl-flex justify-content-xxl-center product-container" style="text-align:center;">
                <a href="${href}"><img src="${esc(img)}" class="product-image" alt="${esc(p.title)}" loading="lazy"></a>
              </div>
              <div class="price-part d-xxl-flex flex-column justify-content-xxl-center align-items-xxl-center" style="border-top: 1px none var(--bs-primary-bg-subtle);">
                <h2 class="fw-light text-dark prod_title">${esc(p.title)}</h2>
                <div class="d-flex d-xxl-flex flex-row justify-content-xxl-start align-items-xxl-end" style="width: 100%;position: relative;top:15px;">
                  <div class="d-flex flex-column justify-content-xxl-start align-items-xxl-start prince_colm">
                    <div class="d-flex d-xxl-flex flex-row justify-content-xxl-start align-items-xxl-end" style="width: 100%;">
                      <p class="fw-normal text-dark" style="color:#000;font-size:14px;font-family:ASTORIA,Georgia,serif;margin-bottom:-4px;">${esc(price)}</p>
                      ${price ? '<p class="fw-light text-dark" style="color:#000;font-size:12px;font-family:ASTORIA,Georgia,serif;margin:0 0 0 4px;">(USD)</p>' : ""}
                    </div>
                    <div class="d-flex d-xxl-flex flex-row align-items-xxl-center" style="line-height:16px;padding-top:10px;">
                      <p class="fw-light text-start text-dark" style="font-size:14px;font-family:ASTORIA,Georgia,serif;margin:5px 0 0 0;">Available</p>
                    </div>
                    <div class="fw-light text-dark d-flex flex-row" style="width:50%;">
                      <p class="fw-light text-muted" style="color:#000;font-size:12px;font-family:ASTORIA,Georgia,serif;margin:0;padding-top:4px;">#${esc(p.sku || "")}</p>
                    </div>
                  </div>
                  <div class="d-flex flex-row justify-content-end align-items-end dimension_col">
                    <div class="d-flex d-xxl-flex flex-row justify-content-xxl-end align-items-xxl-end">
                      <p class="fw-light" style="text-align:right;color:#000!important;font-size:12px;letter-spacing:0;font-family:ASTORIA,Georgia,serif;line-height:24px;margin:0;font-style:italic;">${dim || "&nbsp;"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>`;
}

function carouselBlock(id, products) {
  return `<div id="${id}" class="carousel slide container-fluid" data-bs-ride="carousel" style="width:100%">
  <div class="carousel-inner w-100">
${products.map((p, i) => card(p, i)).join("\n")}
  </div>
  <button class="carousel-control-prev" type="button" data-bs-target="#${id}" data-bs-slide="prev">
    <span class="carousel-control-prev-icon" aria-hidden="true"></span>
    <span class="visually-hidden">Previous</span>
  </button>
  <button class="carousel-control-next" type="button" data-bs-target="#${id}" data-bs-slide="next">
    <span class="carousel-control-next-icon" aria-hidden="true"></span>
    <span class="visually-hidden">Next</span>
  </button>
</div>`;
}

const featured = FEATURED_IDS.map((id) => byId.get(id)).filter(Boolean);
const trending = featured.slice().reverse();

let html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");

function replaceCarousel(html, id, products) {
  const re = new RegExp(
    `<div id="${id}" class="carousel slide[\\s\\S]*?</div>\\s*</div>\\s*<button class="carousel-control-prev"[\\s\\S]*?</button>\\s*<button class="carousel-control-next"[\\s\\S]*?</button>\\s*</div>`,
    "m"
  );
  if (!re.test(html)) {
    console.error("FAIL find carousel", id);
    return html;
  }
  return html.replace(re, carouselBlock(id, products));
}

html = replaceCarousel(html, "myCarousel", featured);
html = replaceCarousel(html, "myCarousel3", trending);
fs.writeFileSync(path.join(ROOT, "index.html"), html);
console.log("rebuilt myCarousel + myCarousel3 with archive card markup", featured.length);
