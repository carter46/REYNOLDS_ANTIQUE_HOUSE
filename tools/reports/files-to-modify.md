# Files that would need modification (inventory)

## Must change / replace

- `index.html`
- `js/site-chrome.js`
- `assets/css/chrome.css`
- `about.html`
- `contact.html`
- `trade-program.html`
- `estate-services.html` (chrome wrapper / branding only if body OK)
- `products.html`
- `product-details.html`
- `js/product-catalog.js` (search `?q=`, homepage featured helper)

## Must add (copied from archive)

- `assets/img/**` (search icon, home_slider, keneddy, trade)
- `assets/css/newel/**` and/or `assets/css/home-newel.css`
- `assets/js/jquery*.js`, flexslider, bootstrap (as needed)
- `assets/fonts/**` (Typekit mirror + icon fonts + self-hosted Google families)
- `assets/vendor/bootstrap/**`

## Leave architecture

- `data/products.json` (populate UI only — no redesign of schema)
- Shared PDP pattern (`product-details.html?id=`)
- Do **not** recreate `product/*.html` forest

## Do not touch

- Archive under `C:\My Web Sites\REYNOLDS_ANTIQUE_HOUSE\**`
