# Live deploy diagnosis — 2026-09-21

## Verdict

The live site at https://reynoldsantiquehouse.com/ is **not serving the current local project**.
Two separate problems are stacking:

1. **Incomplete / outdated upload** — Hostinger origin still has an older build (missing `responsive-search`, smaller/`older` `chrome.css` / `index.html` vs laptop).
2. **Aggressive CDN cache** — Hostinger `hcdn` serves JS/CSS with `Cache-Control: public, max-age=604800` (**7 days**). Hard refresh often still shows the old chrome.

Localhost `:8765` is correct because it reads files straight from disk.

## Evidence (fetched today)

| File | Local | Live (cache-bypass) | Match? |
|------|------:|--------------------:|:------:|
| `js/site-chrome.js` | 18852 B, has `responsive-search` + logo | ~18691 B, logo yes, **no** `responsive-search` | No |
| `assets/css/chrome.css` | 24353 B, has mobile under-logo search | 22080 B, **no** responsive-search rules | No |
| `index.html` | 62808 B | 58568 B | No |
| `reynolds_logoe.png` | 597013 B | 605428 B | Different file |

Without cache-bypass, CDN previously returned an even older `site-chrome.js` (~6.6 KB).

Server header: `Server: hcdn` (Hostinger CDN).

## What to do on Hostinger (required)

1. **Upload the full current folder** into `public_html` (overwrite):
   - All root `*.html`
   - `js/` (especially `site-chrome.js`, `product-catalog.js`)
   - `assets/css/` (especially `chrome.css`, `home-newel.css`)
   - `assets/images/reynolds_logoe.png`
   - `data/products.json`
   - new `.htaccess` (shortens cache)
2. In hPanel: **CDN → Purge Cache** (or “Clear cache”) for the domain.
3. Optional: File Manager → confirm `js/site-chrome.js` size is ~18–19 KB and contains the text `responsive-search`.
4. Open a private window to `https://reynoldsantiquehouse.com/?nocache=1` and verify logo + under-logo mobile search.

## Local changes made to help next deploy

- Added `.htaccess` so HTML is `no-cache` and JS/CSS only cache 5 minutes.
- Stamped `?v=<timestamp>` on CSS/JS links in all HTML pages so CDN treats them as new URLs after upload.

## Do not

- Upload only `index.html` — chrome is mostly in `js/site-chrome.js` + `assets/css/*`.
- Rely on normal refresh alone while CDN still holds 7-day JS/CSS.
