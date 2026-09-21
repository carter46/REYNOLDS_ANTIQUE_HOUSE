# R5 — Fonts and cleanup

## Actions
- Removed 4 Google Fonts `<link>` tags from `estate-services.html`
- Removed Searchspring CSS `<link>`
- Neutralized remote `@font-face` URLs pointing at `static.parastorage.com`
- Stripped HTTrack markers
- Removed leftover `g-recaptcha` markup
- Injected `#rah-font-override` using local system stacks (Palatino / Georgia / Segoe UI)
- Shared chrome (`chrome.css` / `site-chrome.js`) uses system font stacks only — no remote font CDNs

## Live surface (HTML + chrome JS/CSS)
- No Google Fonts, Searchspring, HTTrack, or gtag on primary pages
- Estate page retains non-render-critical comment URL (`github.com/wix/yoshi`) inside vendor CSS comment only
- Vendor Wix bundles under `/assets/vendor/wix/` may still contain string literals for remote hosts; they are not linked as render-critical stylesheets/scripts from the shared chrome path

## Stop conditions
None triggered for primary live surface.
