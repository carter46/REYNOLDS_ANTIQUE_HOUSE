# Branding / location occurrence audit

Date: 2026-09-23  
Scope: live site sources (`*.html`, `js/*.js`); excludes `tools/reports/**` archives and `assets/vendor/**`.

## REPLACE — branding / establishment year (1967 → 1993)

| File | Context | Action |
|------|---------|--------|
| `index.html` | `Since 1967` (eyebrow) | → `Since 1993` + New York → California |
| `index.html` | `Est. 1967` (eh-kicker) | → `Est. 1993` |
| `js/site-chrome.js` | `New York City · Est. 1967` | → `California · Est. 1993` |
| `about.html` | meta `since 1967` | → `since 1993` |
| `about.html` | `Est. 1967` hero eyebrow | → `Est. 1993` (keep Long Island City, NY in same line — address) |
| `about.html` | `began in 1967` | → `began in 1993` |
| `about.html` | `1967 to Today` | → `1993 to Today` |
| `about.html` | `t-year` / alt `founding, 1967` | → `1993` |
| `about.html` | comment `Est. 1967` | → `Est. 1993` |
| `about.html` | `since 1967` (commented mobile block) | → `1993` |
| `about.html` | `ESTABLISHED 1967` | → `ESTABLISHED 1993` |
| `about.html` | Years in Business `59` | → `33` |
| `estate-services.html` | `Since 1967` / `Est. 1967` / `Founded in 1967` (Wix copy) | → `1993` |
| `estate-services.html` | `Eighty-five years of knowing exactly…what it's worth.` | → exact approved 33-years line |
| `estate-services.html` | eyebrow `New York` (location brand with Since) | → `California` |

## REPLACE — location branding only (New York City / New York → California)

| File | Context | Action |
|------|---------|--------|
| `js/site-chrome.js` | `New York City` in utility bar | → `California` |
| `index.html` | eyebrow `· New York ·` | → `· California ·` |

## FLAG — do not change (physical address / maps)

| File | Context |
|------|---------|
| `about.html` | Skillman Avenue, Long Island City, NY 11101 (hero, visit block) |
| `about.html` | Google Maps embed (LIC coordinates) |
| `contact.html` | Long Island City headers, Skillman Ave lines, location `<option>` |
| `about.html` / `contact.html` | All street/city/zip presentation |

## FLAG — historical / editorial NY narrative (leave alone)

| File | Context |
|------|---------|
| `about.html` | Long Island City warehouse story, Broadway, 47th Street, Manhattan gallery, “New York's earliest live TV”, “roots … in New York” prose, etc. |

## NEVER ALTER — third-party

| File | Context |
|------|---------|
| `index.html` | `The New York Times` press mark |
| `about.html` | `The New York Times` in press row |

## FLAG — SEO / structured data

| Check | Result |
|-------|--------|
| JSON-LD / `addressLocality` | None found in live HTML |
| Open Graph location tags | None found |
| Meta description year | `about.html` “since 1967” — **replace** as branding (listed above) |
| Hidden location fields | Contact location select = physical LIC — **flag / keep** |

## Product catalog

| Check | Result |
|-------|--------|
| `data/products.json` `1967` | No matches |

## Homepage years line

| File | Current | Approved replacement |
|------|---------|----------------------|
| `index.html` | `Eighty-five years of knowing exactly what it’s worth.` | `33 years of knowing exactly what's on, what's it's worth` |
