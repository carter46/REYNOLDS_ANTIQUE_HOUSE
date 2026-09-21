# Visual regression audit — Reynolds Antique House

**Mode:** Phase A (audit only for this document). Sources compared 2026-09-21.  
**Design source of truth:** `C:\My Web Sites\REYNOLDS_ANTIQUE_HOUSE\antics website\newel.com`  
**Working:** `C:\Users\user pc\OneDrive\Documents\carter\REYNOLDS_ANTIQUE_HOUSE`  
**Deployed:** https://reynoldsantiquehouse.com/  
**Live reference:** https://newel.com/

**Logo inventory:** `assets/images/reynolds_logoe.png` — 597,013 bytes, **1455×720**, `Format32bppArgb` (transparency-capable). **Not used** in current chrome (text wordmark instead).

**Root cause:** Implementation rebuilt a simplified static catalog shell instead of preserving archive layout/structure with rebrand-only changes.

---

## Page-by-page comparison matrix

| Page | Archive | Working | Deployed | Severity |
|------|---------|---------|----------|----------|
| Home | Full multi-section Newel marketing page (~2.4MB) | Stub: rah-hero + 8 cards | Matches stub | **CRITICAL** |
| About | Full (~1.88MB) | ~1KB prose stub | Stub | **CRITICAL** |
| Contact | Full (~1.87MB) | Mailto stub | Stub | **CRITICAL** |
| Trade Program | Full (~2.18MB) | ~1KB stub | Stub | **CRITICAL** |
| Estate Services | Full Wix+chrome (~4MB) | Restored Wix body + RAH chrome (~2.2MB) | Partial | **HIGH** |
| Products / categories | Searchspring listing + `products/**` trees | Single `products.html` + JSON filters | Simplified | **HIGH** |
| Product detail | 343× `/product/*.html` | Shared `product-details.html?id=` | Shared PDP | **MEDIUM** (architecture OK; chrome/layout wrong) |

---

## Page: Homepage

**Original archive source:** `antics website\newel.com\index.html`  
**Current working source:** `index.html`  
**Current deployed URL:** https://reynoldsantiquehouse.com/

### Missing sections
- `.utility-bar` (NYC · Est. + Sell/Consign, Auctions, Trade, About, Contact)
- Real header search (`#product-search` / top-left) — replaced by disabled italic note
- Image logo (`.logo__image`) — text wordmark instead; `reynolds_logoe.png` unused
- Account/Saved icon **slots** (spacing) — removed entirely (commerce removal collapsed layout)
- Mega-nav (Furniture, Art, Sculpture, Mirrors, Decorative Objects, Lighting, Style, Creators, Made to Order)
- `section.newel-hero` **product/banner slider**
- Featured inventory Bootstrap carousel (`.featured_container` / `#myCarousel`)
- `a.estate-hero` — Sell, Consign, Auction + Learn More / Get Free Valuation
- `section.trending` — Styles / Creators / Categories rows
- `.press` — “Where you've seen Newel”
- `section.newel-featured-story` — Get to Know
- Secondary TRENDING product carousel (`#myCarousel3`)
- Full Newel footer (subscribe, social, accordion columns, locations)

### Changed sections
- Hero: archive `.newel-hero` carousel → working `.rah-hero` static gradient
- Featured: carousel → left-ish max-width card grid “Featured from the Collection”
- Nav: mega → flat centered links
- Footer: rich → slim 3-column RAH footer

### Incorrect alignment
- Archive: full-bleed centered compositions, header 3-column grid with image logo ~220px
- Working: content in `.rah-page` max-width; hero copy bottom-left; nav `justify-content: center` without mega density; header height 108px vs archive ~132px

### Typography differences
- Archive chrome: **Jost**, **Cormorant Garamond**, Inter, Astoria (Typekit), UnifrakturMaguntia for press
- Working: Palatino Linotype / Segoe UI system stacks only

### Missing images
- Header uses no logo file
- No `img/home_slider/**` in working tree
- No estate/trending/press/get-to-know imagery on home
- Archive `img/banner/**` also **missing from archive disk** (legacy flexslider) — active hero uses base64 / CSS estate slide

### Incorrect images
- N/A on home (sections absent)

### Broken interactions
- No hero slider
- No trending scroll arrows
- No mega menus
- Search non-functional and **visually removed** (note only — violates “preserve search bar”)

### Branding differences
- Reynolds text branding present; Newel visual system absent
- Logo file exists but unused

### Structural differences
- Entire homepage reduced to 2 sections vs 10+ archive bands
- Shared injection kept, but chrome markup is not archive-parity

### Severity
**CRITICAL**

### Required restoration
Port archive homepage section stack + chrome CSS/JS; localize assets; populate product slots from 342 keep-set; insert `reynolds_logoe.png`; preserve search UI (disabled or local); rebrand estate/trending/get-to-know carefully; do not delete historical sections.

---

## Page: About

**Original archive source:** `newel.com\about.html`  
**Current working source:** `about.html`  
**Current deployed URL:** https://reynoldsantiquehouse.com/about.html

**Missing sections:** Full Newel about body, imagery, original typography/chrome.  
**Changed sections:** Replaced with 2-paragraph stub.  
**Severity:** **CRITICAL**  
**Required restoration:** Localize archive about content + shared restored chrome; rebrand Newel→Reynolds where appropriate; preserve historical narrative carefully.

---

## Page: Contact

**Original archive source:** `newel.com\contact.html`  
**Current working source:** `contact.html`  
**Current deployed URL:** https://reynoldsantiquehouse.com/contact.html

**Missing sections:** Archive contact layout, locations, styling.  
**Changed sections:** Minimal mailto form.  
**Broken interactions:** No recaptcha (correct to omit); layout not restored.  
**Severity:** **CRITICAL**  
**Required restoration:** Archive contact structure minus tracking/recaptcha; Reynolds contact details.

---

## Page: Trade Program

**Original archive source:** `newel.com\trade-program.html`  
**Current working source:** `trade-program.html`  
**Current deployed URL:** https://reynoldsantiquehouse.com/trade-program.html

**Missing sections:** Full trade page + `img/newel-trade-services.jpg` treatment.  
**Severity:** **CRITICAL**  
**Required restoration:** Port archive trade page; rebrand; localize images.

---

## Page: Estate Services

**Original archive source:** `newel.com\estate-services.html`  
**Current working source:** `estate-services.html`  
**Current deployed URL:** https://reynoldsantiquehouse.com/estate-services.html

**Changed sections:** Content largely restored (Wix); outer chrome is simplified RAH, not Newel-parity header.  
**Severity:** **HIGH**  
**Required restoration:** Keep estate body; wrap with restored shared chrome; fix leftover Newel strings where UI branding.

---

## Page: Products / categories

**Original archive source:** `newel.com\products.html` + `products/**` category HTML  
**Current working source:** `products.html` + `?cat=`  
**Current deployed URL:** https://reynoldsantiquehouse.com/products.html

**Structural differences:** Local JSON catalog (correct architecture) vs Searchspring commerce listing. Visual/nav chrome not Newel-parity.  
**Severity:** **HIGH**  
**Required restoration:** Keep JSON catalog; restore listing chrome/typography/alignment from archive listing CSS; map mega category links to `?cat=` / filters.

---

## Page: Product detail (shared PDP)

**Original archive source:** `newel.com\product\*.html` (343)  
**Current working source:** `product-details.html`  
**Current deployed URL:** https://reynoldsantiquehouse.com/product-details.html?id=…

**Structural differences:** Shared PDP is intentional and must stay. Visual chrome/gallery chrome diverge from Newel PDP.  
**Severity:** **MEDIUM**  
**Required restoration:** Keep `?id=` + JSON; restyle PDP shell to archive product-info CSS where compatible; restored shared header/footer.

---

## Mobile (all pages)

Working mobile: hamburger + dark flyout exists but lacks archive utility list, search launcher, mega IA.  
Homepage mobile missing all marketing bands.  
**Severity:** **CRITICAL** (home), **HIGH** (other stubs).

---

## Companion reports

- [missing-sections.md](missing-sections.md)
- [asset-recovery.md](asset-recovery.md)
- [homepage-restoration-plan.md](homepage-restoration-plan.md)
- [files-to-modify.md](files-to-modify.md)
- [risks-blockers.md](risks-blockers.md)
