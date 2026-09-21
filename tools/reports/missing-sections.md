# Missing sections report

For each homepage section present in the archive / live Newel reference but absent or replaced on working + deployed Reynolds.

| Section | Present in archive? | Present on live newel.com? | Present on working/deployed? | Why removed (assessment) | Restorable from archive? | Assets needed | Rebrand / historical |
|---------|---------------------|----------------------------|------------------------------|--------------------------|--------------------------|---------------|----------------------|
| Utility bar | Yes `.utility-bar` | Yes | No | Simplified chrome rebuild | Yes | CSS only + SVG | Rebrand link labels |
| Header search UI | Yes `#product-search` | Yes | No (note only) | Commerce/Searchspring removal deleted UI | Yes — visual; no Searchspring | `img/search-icon.png` | Disabled or local `?q=` |
| Image logo | Yes `.logo__image` | Yes | No (text) | Text wordmark shortcut | Yes | `reynolds_logoe.png` | Replace Newel mark |
| Account/Saved spacing | Yes `.header__icons` | Yes | No | Commerce strip collapsed layout | Visual spacers only | CSS | Empty/spacer — no commerce |
| Mega navigation | Yes `.mainnav` + `.mega` | Yes | Flat links only | Over-simplified IA | Yes (link to local filters) | Mega CSS; optional images | Rebrand; local URLs |
| Hero product slider | Yes `.newel-hero` | Yes | Static `.rah-hero` | Redesign | Yes | Base64 or local product imgs; banner folder **missing** | Local products/estate |
| Featured Inventory carousel | Yes `#myCarousel` | Yes | Static 8-grid | Simplified | Yes | Local inventory images | Populate from 342 |
| Estate Sell/Consign/Auction band | Yes `.estate-hero` | Yes | Missing on home | Omitted | Yes (CSS band) | CSS gradient; optional banners **missing** | Rebrand to Reynolds; CTA → estate-services |
| Trending Now / Styles | Yes `#row-styles` | Yes | No | Omitted | Yes | `img/home_slider/style/*` | Links → products filters |
| Creators row | Yes `#row-creators` | Yes | No | Omitted | Yes | `img/home_slider/creator/*` | Local filters / about |
| Categories row | Yes `#row-categories` | Yes | No | Omitted | Yes | `img/home_slider/category/*` | `?cat=` |
| Where you've seen… | Yes `.press` | Yes | No | Omitted | Yes | CSS wordmarks (no logos required) | **Flag management** — historical Newel press names |
| Get to Know | Yes `.newel-featured-story` | Yes | No | Omitted | Yes | `img/keneddy_img.webp` | **Historical Jackie Kennedy / Newel story — flag or light rebrand** |
| Secondary TRENDING carousel | Yes `#myCarousel3` | Yes | No | Omitted | Yes | Local inventory | Populate from 342 |
| Rich footer | Yes Newel footer | Yes | Slim RAH footer | Simplified | Yes | Footer CSS + logo | Reynolds details; drop newsletter backend |

## Other pages

| Page | Missing vs archive |
|------|-------------------|
| About | Entire original content body |
| Contact | Original layout / locations / form chrome |
| Trade | Entire original content + trade imagery |
| Estate | Outer Newel-parity chrome (body largely present) |
| Products | Listing visual system / Searchspring UI (replace with local catalog + Newel look) |
| PDP | Per-product HTML forest (do **not** restore); missing Newel PDP chrome styling |
