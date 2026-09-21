# Layout restore verification

**Date:** 2026-09-21  
**Phases completed:** A (audit) → B (homepage) → C (chrome) → D (pages) → E (verify)

## Homepage composition checklist

| Element | Status |
|---------|--------|
| Utility bar | RESTORED via `site-chrome.js` |
| Header search (top-left) | RESTORED — local `?q=` (no Searchspring) |
| Logo image `reynolds_logoe.png` | RESTORED |
| Icon spacers (Account/Saved removed) | RESTORED for centering |
| Mega-style nav | RESTORED (local category links) |
| Hero slider `.newel-hero` | RESTORED from archive extract |
| Featured inventory | RESTORED — 12 local products via catalog JS |
| Estate Sell/Consign/Auction band | RESTORED — rebranded Reynolds; CTA `/estate-services.html` |
| Trending Styles/Creators/Categories | RESTORED — local images + product links |
| Where you've seen / press | RESTORED — historical flag note |
| Get to Know story | RESTORED — historical Jackie/Newel archive copy retained; CTA → about |
| Footer with logo | RESTORED |

## Pages

| Page | Status |
|------|--------|
| About | Expanded story layout + archive imagery |
| Trade | Archive trade image + program copy |
| Contact | Centered layout + mailto (no recaptcha) |
| Products | Centered filters + `?q=` search |
| PDP | Shared JSON architecture retained + product-info CSS |
| Estate | Existing restored body + new shared chrome |

## Scans

- No Searchspring / gtag reintroduced in shared chrome
- Archive not modified
- Shared PDP architecture retained
- Deployed https://reynoldsantiquehouse.com/ will match after redeploy — **redeploy required**

## Browser render

Mark **UNVERIFIED** in environments without browser automation; static assembly verified by file presence and section extraction.

## Known gaps (from Phase A risks)

- Archive `img/banner/**` missing — hero uses archive `.newel-hero` (incl. embedded media)
- Google Fonts not fully self-hosted — Jost/Cormorant use local() fallbacks + archive Typekit copy under `assets/fonts/typekit`
- Press section flagged for management review
