# Estate Services restore notes

## Source
Copied from archive `newel.com/estate-services.html` (read-only).

## Assets localized
- static.wixstatic.com → /assets/vendor/wix/static/ (16 files copied if missing)
- static.parastorage.com → /assets/vendor/wix/parastorage/ (54 files copied if missing)

## Preserved
- Original Wix Thunderbolt markup, inline CSS, and media references (path-rewritten)
- Consignment alignment CSS and site container structure

## Removed / neutralized
- HTTrack mirror comments
- Google Tag Manager / gtag
- Absolute Newel / Newel Auctions URLs retargeted to local /contact.html, /about.html, /index.html

## Offline limitations (expected)
- Wix Thunderbolt runtime may still expect cloud session/APIs; interactive editor-elements that call remote services may not fully initialize offline.
- Readable structure, styles, and localized media remain in the page for static presentation.
- Shared Reynolds header/footer inject around the restored body.

## STOP assessment
Meaningful content was preserved (not replaced with a stub). Residual Wix cloud dependency for interactive widgets is documented, not used as a reason to delete content.
