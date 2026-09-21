# Asset recovery report

Copy **from** archive `C:\My Web Sites\REYNOLDS_ANTIQUE_HOUSE\antics website\newel.com\` (and siblings) **into** working `assets/` — Phase B+. Archive remains read-only.

## Logo (working — already present)

| Working path | Notes |
|--------------|-------|
| `assets/images/reynolds_logoe.png` | 1455×720 ARGB; use as `.logo__image` |

## Present in archive — must copy

| Archive path | Suggested working path |
|--------------|------------------------|
| `img/search-icon.png` | `assets/img/search-icon.png` |
| `img/keneddy_img.webp` | `assets/img/keneddy_img.webp` |
| `img/newel-online-logo-footer-updated.png` | Optional reference only — prefer Reynolds logo |
| `img/home_slider/style/*.jpg` (5) | `assets/img/home_slider/style/` |
| `img/home_slider/creator/*.jpg` (6) | `assets/img/home_slider/creator/` |
| `img/home_slider/category/*.jpg` (7) | `assets/img/home_slider/category/` |
| `img/newel-trade-services.jpg` | `assets/img/newel-trade-services.jpg` |
| `css/styles.css`, `bootstrap-mega-menu.min.css`, `bs-theme-overrides.css`, `Newel-Footer-1.css`, `flexslider.css`, `BrowseALL.css`, `NEWEL-PRODUCT-INFO.css`, `productinfo.css` | `assets/css/newel/` |
| `bootstrap/css/bootstrap.min.css`, `bootstrap/js/bootstrap.min.js` | `assets/vendor/bootstrap/` |
| `js/jquery-3.7.1.min.js`, `jquery.flexslider.js`, `bs-init.js` | `assets/js/` |
| Typekit mirror `../use.typekit.net/**` | `assets/fonts/typekit/` |
| Font Awesome / ionicons / line-awesome / material under `fonts/` | `assets/fonts/` |

## Featured / product imagery

Prefer existing working inventory: `/assets/images/inventory/{SKU}/…`  
Do not depend on archive S3 relative paths for keep-set products.

## Referenced in archive but MISSING on archive disk

| Path | Impact |
|------|--------|
| `img/banner/**` | Legacy flexslider banners — cannot recover from archive |
| `img/na-homepage-auction-lots-gif.gif` | Commented auction slide |
| `img/sell-consign-*-banner*.jpg` | Commented; active estate band is CSS-only |
| `img/newel-media-desktop.png` / `mobile` | Commented press banners |

**Mitigation:** Use active `.newel-hero` structure with local product images / CSS estate slide; keep CSS `.estate-hero` band; do not block restore on missing banner folder.

## Google Fonts

Not fully mirrored. Need self-host Jost / Cormorant Garamond / Inter (download once into `assets/fonts/google/` or extract if any copies exist) — report if unavailable.
