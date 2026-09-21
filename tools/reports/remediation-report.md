# Reynolds Antique House — Remediation report

Factual summary of audit remediation (R0–R6). Archive at `C:\My Web Sites\REYNOLDS_ANTIQUE_HOUSE\antics website` was read/copied only; never modified.

## Overall verification

**PARTIAL** — all static/HTTP/data/image checks PASS; browser render checks **UNVERIFIED** (browser automation unavailable).

See `tools/reports/remediation-verify.json`.

## Keep-set

| Metric | Value |
|--------|-------|
| Archive product HTML | 343 |
| Current kept products | 342 |
| Excluded | 1 (`white-and-pink-loop-armchairs` — Cloudflare 520 shell) |

Reconciliation: `tools/reports/source-product-reconciliation.csv`

## Phase outcomes

### R0 — Baseline
- Archive confirmed present/unmodified by remediation.
- `remediation-baseline.json` + reconciliation CSV written.
- Gate passed: 343 → 342 with documented exclusion.

### R1 — P0 fixes
- Collection filters: Furniture, Sculpture, Mirrors, Lighting, Decor, Art, Accessories (+ All).
- No-image fallback → `/assets/images/placeholders/no-image.jpg`.
- Estate Services restored from archive with localized Wix assets and shared chrome roots; offline Wix limits documented in `estate-services-restore.md`.

### R2 — Field re-extraction
- Archive HTML re-read for 342 products; useful existing values preserved.
- Diff: `reextract-diff.csv` (prior run: 271 field updates).
- IDs/SKUs/valid image paths retained.

### R3 — Image repair
- Strict validation; missing working-tree images copied from archive where available.
- Keep-set unchanged at 342; `image-repair-exceptions.csv` empty (0 silent drops).

### R4 — Chrome visual parity
- Newel-derived header / main nav / mobile flyout / footer implemented only via `js/site-chrome.js` + `assets/css/chrome.css`.
- Injection architecture (`#site-header-root` / `#site-footer-root`) preserved.
- Commerce/tracking omitted; search remains a non-functional note.
- `products.html` honors `?cat=` from category nav links.

### R5 — Fonts / cleanup
- Remote Google Fonts and Searchspring CSS links removed from estate page.
- Remote `@font-face` URLs neutralized; system stacks via `#rah-font-override`.
- HTTrack markers and recaptcha remnant removed from served estate HTML.
- Shared chrome has no remote font CDNs.
- Primary live surface: no render-critical `https://` font/JS/CSS deps (`network.render_critical_https` PASS).

### R6 — Verification
- **342/342** products: JSON presence, titles, local image files, JPEG/PNG magic bytes — PASS.
- HTTP 200 for core pages + all 342 PDP shells + primary images — PASS.
- Invalid ID: client-side not-found UI present — PASS.
- Filters / estate / chrome / no commerce in chrome — PASS.
- Browser render (title/gallery/filters/JS errors) — **UNVERIFIED — static/source scan only**.

## Explicit non-goals honored

- Catalog not padded toward 1000.
- Shared PDP architecture not replaced.
- Archive not modified.
- No silent product drops.
- Commerce/tracking not reintroduced in shared chrome.
