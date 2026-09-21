# R4 — Chrome visual parity

## Changes
- Rewrote `assets/css/chrome.css` with Newel-derived header/nav/mobile-flyout/footer structure (warm paper, gold rule, sticky header, centered wordmark, uppercase nav triggers, dark footer).
- Rewrote `js/site-chrome.js` to inject that structure into `#site-header-root` / `#site-footer-root` only.
- Reynolds branding retained; Account / Login / Register / Saved Items / Cart / Checkout / Searchspring / commerce / tracking omitted.
- Search remains a non-functional note.
- `products.html` honors `?cat=` from nav category links.

## Architecture
Injection pattern preserved. Shared PDP architecture unchanged.

## Stop conditions
None triggered. No commerce/tracking reintroduced. Shared roots retained.
