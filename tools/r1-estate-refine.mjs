/**
 * Refine estate-services.html: unwrap nested document, drop Newel chrome,
 * keep Wix/site content + leading styles from archive copy already in working file
 * OR re-read archive and rebuild cleanly.
 */
import fs from "fs";
import path from "path";
import { ROOT, REPORTS, writeJson } from "./lib.mjs";

const ARCHIVE = "C:\\My Web Sites\\REYNOLDS_ANTIQUE_HOUSE\\antics website";

function main() {
  let html = fs.readFileSync(
    path.join(ARCHIVE, "newel.com", "estate-services.html"),
    "utf8"
  );

  // Leading custom styles (before DOCTYPE)
  const doctypeIdx = html.search(/<!DOCTYPE/i);
  const leadingStyles = doctypeIdx > 0 ? html.slice(0, doctypeIdx) : "";
  const doc = doctypeIdx > 0 ? html.slice(doctypeIdx) : html;

  // Prefer SITE_CONTAINER block
  let mainContent = "";
  const siteStart = doc.search(/id=["']SITE_CONTAINER["']/i);
  if (siteStart >= 0) {
    // back up to opening tag
    const open = doc.lastIndexOf("<", siteStart);
    // find matching end — use last </div> before body close is unreliable; capture from SITE_CONTAINER to before Newel footer or </body>
    const footerMatch = doc.search(/<footer[\s>]/i);
    const bodyClose = doc.search(/<\/body>/i);
    const end = footerMatch > siteStart ? footerMatch : bodyClose > siteStart ? bodyClose : doc.length;
    mainContent = doc.slice(open, end);
  } else {
    // fallback: body inner without header/footer
    const bodyOpen = doc.search(/<body[^>]*>/i);
    const bodyClose = doc.search(/<\/body>/i);
    if (bodyOpen >= 0 && bodyClose > bodyOpen) {
      const after = doc.indexOf(">", bodyOpen) + 1;
      mainContent = doc.slice(after, bodyClose);
      mainContent = mainContent.replace(/<header[\s\S]*?<\/header>/i, "");
      mainContent = mainContent.replace(/<footer[\s\S]*?<\/footer>/i, "");
    } else {
      mainContent = doc;
    }
  }

  // Also include Wix head assets: link/script/style from document head that reference local vendor
  const headMatch = doc.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  let headExtras = "";
  if (headMatch) {
    const head = headMatch[1];
    // keep style and link/script pointing at static.parastorage or wixstatic (already rewritten paths later)
    const bits = [];
    const styleRe = /<style[\s\S]*?<\/style>/gi;
    let m;
    while ((m = styleRe.exec(head))) bits.push(m[0]);
    const linkRe = /<link[^>]+>/gi;
    while ((m = linkRe.exec(head))) {
      if (/parastorage|wixstatic|stylesheet/i.test(m[0])) bits.push(m[0]);
    }
    const scriptRe = /<script[\s\S]*?<\/script>/gi;
    while ((m = scriptRe.exec(head))) {
      if (/parastorage|wixstatic|wix-essential|thunderbolt/i.test(m[0]) && !/googletagmanager|gtag/i.test(m[0])) {
        bits.push(m[0]);
      }
    }
    headExtras = bits.join("\n");
  }

  let bodyInner = leadingStyles + "\n" + headExtras + "\n" + mainContent;

  // Rewrites
  bodyInner = bodyInner.replace(/<!--\s*Mirrored from[\s\S]*?-->/gi, "");
  bodyInner = bodyInner.replace(/<!--\s*Added by HTTrack[\s\S]*?-->/gi, "");
  bodyInner = bodyInner.replace(/\.\.\/static\.wixstatic\.com\//g, "/assets/vendor/wix/static/");
  bodyInner = bodyInner.replace(/\.\.\/static\.parastorage\.com\//g, "/assets/vendor/wix/parastorage/");
  bodyInner = bodyInner.replace(/https:\/\/static\.wixstatic\.com\//g, "/assets/vendor/wix/static/");
  bodyInner = bodyInner.replace(/https:\/\/static\.parastorage\.com\//g, "/assets/vendor/wix/parastorage/");
  bodyInner = bodyInner.replace(/https:\\\/\\\/static\.wixstatic\.com\\\//g, "/assets/vendor/wix/static/");
  bodyInner = bodyInner.replace(/https:\\\/\\\/static\.parastorage\.com\\\//g, "/assets/vendor/wix/parastorage/");
  bodyInner = bodyInner.replace(/https:\/\/www\.newelauctions\.com\/[^"'\s]*/g, "/contact.html");
  bodyInner = bodyInner.replace(/https:\/\/(?:www\.)?newel\.com\/[^"'\s]*/g, "/contact.html");
  bodyInner = bodyInner.replace(/<script async src="https:\/\/www\.googletagmanager\.com[^"]*"><\/script>/gi, "");
  bodyInner = bodyInner.replace(/<script>\s*window\.dataLayer[\s\S]*?<\/script>/gi, "");

  // Strip any accidental nested Newel header/footer left in fragment
  bodyInner = bodyInner.replace(/<header class="header"[\s\S]*?<\/header>/i, "");
  bodyInner = bodyInner.replace(/<footer class="[^"]*"[\s\S]*?<\/footer>/i, "");

  const page = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Estate Services | Reynolds Antique House</title>
  <meta name="description" content="Estate services at Reynolds Antique House." />
  <meta name="theme-color" content="#1a1410" />
  <link rel="stylesheet" href="/assets/css/chrome.css" />
  <style>
    .rah-estate-main { max-width: 100%; overflow-x: hidden; }
    .rah-estate-note { max-width: 1280px; margin: 0 auto; padding: 1rem 1.25rem; font-size: .95rem; color: #6b5e52; }
  </style>
</head>
<body data-page="estate">
  <div id="site-header-root"></div>
  <main id="main" class="rah-estate-main">
    <p class="rah-estate-note"><strong>Reynolds Antique House — Estate Services.</strong> Restored from the original gallery page and localized for static/offline use. Some Wix cloud-only widgets may not initialize without their original services; content, imagery, and layout are preserved below.</p>
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
  writeJson(path.join(REPORTS, "r1-estate-refine.json"), {
    bytes: page.length,
    hasSiteContainer: /SITE_CONTAINER/i.test(bodyInner),
    hasNestedDoctype: /<!DOCTYPE/i.test(bodyInner),
    hasNewelHeader: /<header class="header"/i.test(bodyInner),
  });
  console.log("estate refined", page.length, "nestedDoctype", /<!DOCTYPE/i.test(bodyInner));
}

main();
