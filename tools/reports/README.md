# Reynolds Antique House — build reports

## Phase 0 summary

- Mirror contained **343** product HTML pages (not 1,000).
- **342** products had complete local SKU image folders → **kept**.
- **1** dropped (no usable SKU images).
- **Shortfall: 658** vs target of 1,000. Per plan: do not pad with incomplete products.
- Keep/drop lists: `keep-list.csv`, `drop-list.csv`, `keep-list.json`, `phase0-summary.json`.

## Final architecture

- `data/products.json` — 342 product records
- `product-details.html?id=product-…` — shared PDP
- `js/site-chrome.js` + `assets/css/chrome.css` — shared chrome
- `assets/images/inventory/{SKU}/` — local images only

## Verification

See `verify-live.json` — verdict **PASS** (no HTTrack, no external HTTP(S) on live surface, 0 missing product images).

## Serve locally

From project root:

```bash
npx --yes serve -l 4173
```

Then open `http://localhost:4173/`
