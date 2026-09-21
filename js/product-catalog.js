window.ReynoldsCatalog = (function () {
  let cache = null;

  async function load() {
    if (cache) return cache;
    const res = await fetch("/data/products.json");
    if (!res.ok) throw new Error("Failed to load catalog");
    cache = await res.json();
    return cache;
  }

  function getProduct(id) {
    if (!cache || !cache.products || id == null || id === "") return null;
    const raw = decodeURIComponent(String(id)).trim();
    const key = raw.toLowerCase();
    return (
      cache.products.find((p) => p.id === raw) ||
      cache.products.find((p) => String(p.id).toLowerCase() === key) ||
      cache.products.find((p) => String(p.sku || "").toLowerCase() === key) ||
      cache.products.find((p) => String(p.sku || "").toLowerCase() === key.replace(/^product-/, "")) ||
      cache.products.find((p) => String(p.id).toLowerCase() === "product-" + key) ||
      null
    );
  }

  function byCategory(cat) {
    if (!cache) return [];
    if (!cat || cat === "all") return cache.products.slice();
    const c = cat.toLowerCase();
    return cache.products.filter((p) => (p.category || "").toLowerCase().includes(c));
  }

  function search(query) {
    if (!cache) return [];
    const q = (query || "").trim().toLowerCase();
    if (!q) return cache.products.slice();
    return cache.products.filter((p) => {
      const hay = [p.title, p.sku, p.id, p.category, p.description, p.material, p.style, p.period]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }

  function related(product, limit) {
    if (!cache || !product) return [];
    return cache.products
      .filter((p) => p.id !== product.id && p.category === product.category)
      .slice(0, limit || 4);
  }

  function esc(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function dimsHtml(p) {
    if (p.dimensionsHtml) return p.dimensionsHtml;
    if (p.dimensions) return esc(p.dimensions).replace(/\n/g, "<br>");
    return [p.width && ("Width: " + esc(p.width)), p.depth && ("Depth: " + esc(p.depth)), p.height && ("Height: " + esc(p.height))]
      .filter(Boolean)
      .join("<br>");
  }

  /** Archive Newel product card markup (commerce controls removed).
   * Nesting must match archive: card.card-body > featured_container_col > hvrcls
   * Never put card/card-body on the same node as hvrcls — Bootstrap padding kills the absolute image well.
   */
  function cardHtml(p) {
    const img =
      (p.images && p.images[0] && p.images[0].src) ||
      "/assets/images/placeholders/no-image.jpg";
    const href =
      "/product-details.html?id=" +
      encodeURIComponent(p.id) +
      "#id=" +
      encodeURIComponent(p.id);
    const price = p.price || "";
    const dim = dimsHtml(p);
    return (
      '<div class="card card-body">' +
      '<div class="featured_container_col rah-product-card">' +
      '<div class="shadow1 hvrcls img_box_shadow">' +
      '<div class="d-xxl-flex justify-content-xxl-center product-container" style="text-align:center;">' +
      '<a href="' + href + '"><img src="' + esc(img) + '" class="product-image" alt="' + esc(p.title) + '" loading="lazy" /></a>' +
      "</div>" +
      '<div class="price-part d-xxl-flex flex-column justify-content-xxl-center align-items-xxl-center" style="border-top:1px none var(--bs-primary-bg-subtle);">' +
      '<h2 class="fw-light text-dark prod_title"><a href="' + href + '" style="color:inherit;text-decoration:none;">' + esc(p.title) + "</a></h2>" +
      '<div class="d-flex d-xxl-flex flex-row justify-content-xxl-start align-items-xxl-end" style="width:100%;position:relative;top:15px;">' +
      '<div class="d-flex flex-column justify-content-xxl-start align-items-xxl-start prince_colm">' +
      '<div class="d-flex d-xxl-flex flex-row justify-content-xxl-start align-items-xxl-end" style="width:100%;">' +
      '<p class="fw-normal text-dark" style="color:#000;font-size:14px;letter-spacing:0;font-family:ASTORIA,Georgia,serif;text-align:left;line-height:18px;margin-bottom:-4px;">' +
      esc(price) +
      "</p>" +
      (price
        ? '<p class="fw-light text-dark" style="color:#000;font-size:12px;letter-spacing:0;font-family:ASTORIA,Georgia,serif;text-align:left;line-height:12px;margin:0 0 0 4px;">(USD)</p>'
        : "") +
      "</div>" +
      '<div class="d-flex d-xxl-flex flex-row align-items-xxl-center" style="line-height:16px;padding-top:10px;">' +
      '<p class="fw-light text-start text-dark" style="font-size:14px;font-family:ASTORIA,Georgia,serif;margin:5px 0 0 0;">Available</p>' +
      "</div>" +
      '<div class="fw-light text-dark d-flex d-xxl-flex flex-row align-items-xxl-end" style="width:50%;">' +
      '<p class="fw-light text-end text-muted" style="color:#000;font-size:12px;font-family:ASTORIA,Georgia,serif;margin:0;padding-top:4px;">#' +
      esc(p.sku || "") +
      "</p></div></div>" +
      '<div class="d-flex flex-row justify-content-end align-items-end dimension_col">' +
      '<div class="d-flex d-xxl-flex flex-row justify-content-xxl-end align-items-xxl-end">' +
      '<p class="fw-light" style="text-align:right;color:#000!important;font-size:12px;letter-spacing:0;font-family:ASTORIA,Georgia,serif;line-height:24px;margin:0;font-style:italic;">' +
      (dim || "&nbsp;") +
      "</p></div></div>" +
      "</div></div></div></div></div>"
    );
  }

  return { load, getProduct, byCategory, search, related, cardHtml };
})();
