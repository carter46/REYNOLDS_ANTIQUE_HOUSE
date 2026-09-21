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

  function cardHtml(p) {
    const img = (p.images && p.images[0] && p.images[0].src) || "/assets/images/placeholders/no-image.jpg";
    return (
      '<a class="rah-card-link" href="/product-details.html?id=' + encodeURIComponent(p.id) + '">' +
      '<div class="rah-card-img"><img src="' + img + '" alt="' + (p.title || "").replace(/"/g, "&quot;") + '" loading="lazy" /></div>' +
      '<h3 class="rah-card-title">' + (p.title || "") + "</h3>" +
      '<p class="rah-card-meta">' + (p.sku ? "Item # " + p.sku : "") + (p.price ? " · " + p.price : "") + "</p>" +
      "</a>"
    );
  }

  return { load, getProduct, byCategory, search, related, cardHtml };
})();
