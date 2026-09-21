# Homepage restoration plan (recipe — implement in Phase B)

Do **not** invent layout. Extract structure from archive `index.html` and adapt.

## Section order (restore exactly)

1. Shared chrome: utility-bar → header (search + `reynolds_logoe.png` + icon spacers) → gold rule → mainnav/mega → mobile flyout  
2. `section.newel-hero` carousel (local product/estate slides; keep arrows/JS pattern)  
3. Featured Inventory (`.featured_container` / carousel or equivalent visual grid matching card count/spacing) populated from 342 keep-set  
4. `a.estate-hero` — “Sell, Consign, Auction with **Reynolds**”; CTA → `/estate-services.html`  
5. `section.trending` — Styles / Creators / Categories with archive images; links → `/products.html?cat=` or search params  
6. `.press` — preserve structure; flag Newel press names for management; optional “historically associated with this gallery tradition” framing  
7. `section.newel-featured-story` — preserve Jackie Kennedy historical story; eyebrow “Get to Know” → Reynolds or flag; CTA → `/about.html`  
8. Optional secondary trending product row from keep-set  
9. Shared footer (archive structure, Reynolds brand/contact)

## Technical approach

1. Copy CSS/JS/img per `asset-recovery.md`.  
2. Extract homepage inline CSS (~97–1588 + hero) into `assets/css/home-newel.css`.  
3. Replace `index.html` `<main>` with adapted archive sections (local URLs, no Searchspring/gtag/HTTrack).  
4. Wire carousel JS (inline from archive, sanitized).  
5. Featured cards: render via `product-catalog.js` selecting N products (preserve visual density).  
6. Search: restore `#product-search` UI; `preventDefault` + note **or** navigate to `/products.html?q=` (prefer local filter in Phase C).

## Acceptance (homepage composition)

Utility bar, header, logo image, search bar, nav, hero **slider**, featured inventory, estate band, trending, creators, categories, where-seen, get-to-know, footer — desktop + mobile — match archive structure; Reynolds branding; no commerce.
