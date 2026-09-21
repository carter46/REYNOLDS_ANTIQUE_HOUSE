/**
 * R1 — filters, no-image fallback, estate-services restore (archive read-only).
 */
import fs from "fs";
import path from "path";
import { ROOT, REPORTS, ensureDir, writeJson, walkFiles, toPosix } from "./lib.mjs";

const ARCHIVE = "C:\\My Web Sites\\REYNOLDS_ANTIQUE_HOUSE\\antics website";

function fixFilters() {
  const cats = [
    "Furniture",
    "Sculpture",
    "Mirrors",
    "Lighting",
    "Decor",
    "Art",
    "Accessories",
  ];
  const buttons =
    `<button type="button" data-cat="all" class="is-active">All</button>\n` +
    cats
      .map(
        (c) =>
          `<button type="button" data-cat="${c}">${c}</button>`
      )
      .join("\n");
  const file = path.join(ROOT, "products.html");
  let html = fs.readFileSync(file, "utf8");
  html = html.replace(
    /<div class="rah-filters" id="category-filters">[\s\S]*?<\/div>/,
    `<div class="rah-filters" id="category-filters">\n          ${buttons}\n        </div>`
  );
  fs.writeFileSync(file, html, "utf8");
  return { categories: cats };
}

function fixNoImageFallback() {
  const destDir = path.join(ROOT, "assets", "images", "placeholders");
  ensureDir(destDir);
  const dest = path.join(destDir, "no-image.jpg");
  // Minimal valid 1x1 JPEG
  const jpeg = Buffer.from(
    "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAGcP//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAQUCf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQMBAT8Bf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQIBAT8Bf//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEABj8Cf//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAT8hf//Z",
    "base64"
  );
  // Prefer copying a real archive inventory thumb if tiny jpeg exists near img
  let source = null;
  const candidates = [
    path.join(ARCHIVE, "newel.com", "img", "inventory", "no_image_available_300x300.jpg"),
    path.join(ARCHIVE, "newel.com", "img", "no_image_available_300x300.jpg"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      source = c;
      break;
    }
  }
  if (source) fs.copyFileSync(source, dest);
  else fs.writeFileSync(dest, jpeg);

  const catalogJs = path.join(ROOT, "js", "product-catalog.js");
  let js = fs.readFileSync(catalogJs, "utf8");
  js = js.replace(
    /\/assets\/img\/inventory\/no_image_available_300x300\.jpg/g,
    "/assets/images/placeholders/no-image.jpg"
  );
  fs.writeFileSync(catalogJs, js, "utf8");
  return { dest: toPosix(path.relative(ROOT, dest)), fromArchive: !!source };
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return { copied: 0 };
  ensureDir(dest);
  let copied = 0;
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, ent.name);
    const d = path.join(dest, ent.name);
    if (ent.isDirectory()) {
      copied += copyDir(s, d).copied;
    } else {
      ensureDir(path.dirname(d));
      if (!fs.existsSync(d)) {
        fs.copyFileSync(s, d);
        copied++;
      }
    }
  }
  return { copied };
}

function restoreEstate() {
  const srcHtml = path.join(ARCHIVE, "newel.com", "estate-services.html");
  if (!fs.existsSync(srcHtml)) {
    throw new Error("STOP: archive estate-services.html missing");
  }
  let html = fs.readFileSync(srcHtml, "utf8");

  // Copy Wix asset trees
  const wixStatic = copyDir(
    path.join(ARCHIVE, "static.wixstatic.com"),
    path.join(ROOT, "assets", "vendor", "wix", "static")
  );
  const para = copyDir(
    path.join(ARCHIVE, "static.parastorage.com"),
    path.join(ROOT, "assets", "vendor", "wix", "parastorage")
  );

  // Strip HTTrack comments
  html = html.replace(/<!--\s*Mirrored from[\s\S]*?-->/gi, "");
  html = html.replace(/<!--\s*Added by HTTrack[\s\S]*?-->/gi, "");
  html = html.replace(/<!--\s*\/Added by HTTrack\s*-->/gi, "");

  // Strip Google tag blocks
  html = html.replace(
    /<!-- Google tag[\s\S]*?<\/script>\s*<script>[\s\S]*?gtag\([\s\S]*?<\/script>/gi,
    ""
  );
  html = html.replace(
    /<script async src="https:\/\/www\.googletagmanager\.com\/gtag\/js[^"]*"><\/script>/gi,
    ""
  );
  html = html.replace(/<script>\s*window\.dataLayer[\s\S]*?<\/script>/gi, "");

  // Rewrite relative vendor paths to absolute local assets
  html = html.replace(/\.\.\/static\.wixstatic\.com\//g, "/assets/vendor/wix/static/");
  html = html.replace(/\.\.\/static\.parastorage\.com\//g, "/assets/vendor/wix/parastorage/");
  html = html.replace(/https:\/\/static\.wixstatic\.com\//g, "/assets/vendor/wix/static/");
  html = html.replace(/https:\/\/static\.parastorage\.com\//g, "/assets/vendor/wix/parastorage/");
  // JSON-escaped URLs inside wix model
  html = html.replace(/https:\\\/\\\/static\.wixstatic\.com\\\//g, "/assets/vendor/wix/static/");
  html = html.replace(/https:\\\/\\\/static\.parastorage\.com\\\//g, "/assets/vendor/wix/parastorage/");

  // Retarget Newel auction/about links to local contact/about (not commerce backends)
  html = html.replace(/https:\/\/www\.newelauctions\.com\/[^"'\s]*/g, "/contact.html");
  html = html.replace(/https:\/\/newel\.com\/about[^"'\s]*/g, "/about.html");
  html = html.replace(/https:\/\/www\.newel\.com\/[^"'\s]*/g, "/index.html");
  html = html.replace(/https:\/\/newel\.com\/[^"'\s]*/g, "/index.html");

  // Extract body-ish content: prefer #SITE_CONTAINER through end of container, else full after styles
  // Wrap with Reynolds chrome shell while keeping Wix body
  const hasDoctype = /<!DOCTYPE/i.test(html);
  // Pull styles at top (file starts with <style>) and site container
  let bodyInner = html;
  // Remove Newel duplicated site header/footer chrome if clearly marked — keep Wix SITE_CONTAINER
  // Inject chrome roots around main content

  const page = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Estate Services | Reynolds Antique House</title>
  <meta name="description" content="Estate services at Reynolds Antique House." />
  <meta name="theme-color" content="#1a1410" />
  <link rel="stylesheet" href="/assets/css/chrome.css" />
</head>
<body data-page="estate">
  <div id="site-header-root"></div>
  <main id="main" class="rah-estate-main">
    <div class="rah-page rah-prose" style="padding-bottom:1rem">
      <p><strong>Reynolds Antique House — Estate Services.</strong> The original gallery content below has been restored and localized for offline browsing. Some interactive Wix platform features may not run without their original cloud services.</p>
    </div>
    <div id="estate-restored-root">
${bodyInner}
    </div>
  </main>
  <div id="site-footer-root"></div>
  <script src="/js/site-chrome.js"></script>
</body>
</html>
`;

  fs.writeFileSync(path.join(ROOT, "estate-services.html"), page, "utf8");

  // Document lost functionality
  const md = `# Estate Services restore notes

## Source
Copied from archive \`newel.com/estate-services.html\` (read-only).

## Assets localized
- static.wixstatic.com → /assets/vendor/wix/static/ (${wixStatic.copied} files copied if missing)
- static.parastorage.com → /assets/vendor/wix/parastorage/ (${para.copied} files copied if missing)

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
`;
  fs.writeFileSync(path.join(REPORTS, "estate-services-restore.md"), md, "utf8");

  return {
    wixStaticCopied: wixStatic.copied,
    parastorageCopied: para.copied,
    outBytes: fs.statSync(path.join(ROOT, "estate-services.html")).size,
  };
}

function main() {
  ensureDir(REPORTS);
  const filters = fixFilters();
  const fallback = fixNoImageFallback();
  const estate = restoreEstate();
  const report = {
    phase: "R1",
    completedAt: new Date().toISOString(),
    filters,
    fallback,
    estate,
  };
  writeJson(path.join(REPORTS, "r1-summary.json"), report);
  console.log(JSON.stringify(report, null, 2));
}

main();
