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
    if (!cache || !cache.products) return null;
    return cache.products.find((p) => p.id === id) || null;
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

  /** Newel-style product card used site-wide */
  function cardHtml(p) {
    const img =
      (p.images && p.images[0] && p.images[0].src) ||
      "/assets/images/placeholders/no-image.jpg";
    const href = "/product-details.html?id=" + encodeURIComponent(p.id);
    const price = p.price || "";
    const dimHtml =
      p.dimensionsHtml ||
      (p.dimensions
        ? esc(p.dimensions).replace(/\n/g, "<br>")
        : [p.width && "Width: " + esc(p.width), p.depth && "Depth: " + esc(p.depth), p.height && "Height: " + esc(p.height)]
            .filter(Boolean)
            .join("<br>"));
    return (
      '<article class="rah-product-card featured_container_col">' +
      '<div class="shadow1 hvrcls img_box_shadow card card-body">' +
      '<div class="product-container">' +
      '<a href="' +
      href +
      '"><img src="' +
      esc(img) +
      '" class="product-image" alt="' +
      esc(p.title) +
      '" loading="lazy" width="400" height="400" /></a>' +
      "</div>" +
      '<div class="price-part">' +
      '<h2 class="fw-light text-dark prod_title"><a href="' +
      href +
      '">' +
      esc(p.title) +
      "</a></h2>" +
      '<div class="price-row">' +
      '<div class="prince_colm">' +
      (price
        ? '<p class="prod-price">' +
          esc(price) +
          ' <span class="prod-currency">(USD)</span></p>'
        : '<p class="prod-price">Price on request</p>') +
      (p.sku ? '<p class="prod-sku">#' + esc(p.sku) + "</p>" : "") +
      "</div>" +
      (dimHtml
        ? '<div class="dimension_col"><p class="prod-dims">' + dimHtml + "</p></div>"
        : "") +
      "</div></div></div></article>"
    );
  }

  return { load, getProduct, byCategory, search, related, cardHtml };
})();
