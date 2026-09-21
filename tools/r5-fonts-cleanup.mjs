/**
 * R5 — Fonts and cleanup for live surface
 * - Drop remote Google Fonts / Searchspring CSS links
 * - Neutralize remote @font-face urls in estate-services.html
 * - Strip HTTrack markers
 * - Remove leftover commerce chrome fragments (recaptcha / searchspring)
 * - Inject local system font override
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const estatePath = path.join(root, "estate-services.html");

let html = fs.readFileSync(estatePath, "utf8");
const before = html.length;
const notes = [];

function count(re) {
  return (html.match(re) || []).length;
}

const googleBefore = count(/fonts\.googleapis\.com/gi);
const searchspringBefore = count(/searchspring/gi);
const httrackBefore = count(/HTTrack/gi);
const httpsBefore = count(/https:\/\//gi);

// Remove Google Fonts / Searchspring stylesheet links
html = html.replace(
  /<link[^>]+href=["'][^"']*fonts\.googleapis\.com[^"']*["'][^>]*>\s*/gi,
  () => {
    notes.push("removed google fonts link");
    return "";
  }
);
html = html.replace(
  /<link[^>]+href=["'][^"']*cdn\.searchspring\.net[^"']*["'][^>]*>\s*/gi,
  () => {
    notes.push("removed searchspring css link");
    return "";
  }
);

// Strip HTTrack markers
html = html.replace(/<!--\s*Added by HTTrack[\s\S]*?-->/gi, "");
html = html.replace(/<!--\s*\/Added by HTTrack\s*-->/gi, "");
html = html.replace(/<meta[^>]*Added by HTTrack[^>]*>/gi, "");

// Neutralize remote @font-face src urls (parastorage / googlefont cache)
html = html.replace(
  /@font-face\s*\{[^}]*url\(\s*['"]?https?:\/\/static\.parastorage\.com[^'")\s]+['"]?\s*\)[^}]*\}/gi,
  "/* remote @font-face removed (R5) */"
);
html = html.replace(
  /url\(\s*['"]?https?:\/\/static\.parastorage\.com\/[^'")\s]+['"]?\s*\)/gi,
  "url('') /* R5 remote font removed */"
);

// Remove g-recaptcha blocks (commerce remnant in embedded Newel footer)
html = html.replace(
  /<div[^>]*class=["'][^"']*g-recaptcha[^"']*["'][^>]*>[\s\S]*?<\/div>/gi,
  "<!-- recaptcha removed R5 -->"
);

// Inject local font override once
const override = `
<style id="rah-font-override">
/* R5: remote fonts dropped; local system stacks */
html, body, .SITE_CONTAINER, [class*="font_"], .wixui-rich-text__text {
  font-family: "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif !important;
}
.rah-font-sans {
  font-family: "Segoe UI", system-ui, sans-serif !important;
}
</style>
`;
if (!html.includes("rah-font-override")) {
  if (html.includes("</head>")) html = html.replace("</head>", override + "</head>");
  else html = override + html;
  notes.push("injected rah-font-override");
}

fs.writeFileSync(estatePath, html);

// Scan all served HTML + chrome/css/js (not vendor) for https / commerce
const serveRoots = [
  path.join(root, "index.html"),
  path.join(root, "about.html"),
  path.join(root, "products.html"),
  path.join(root, "product-details.html"),
  path.join(root, "contact.html"),
  path.join(root, "trade-program.html"),
  path.join(root, "estate-services.html"),
  path.join(root, "assets", "css", "chrome.css"),
  path.join(root, "js", "site-chrome.js"),
  path.join(root, "js", "product-catalog.js"),
];

const surfaceFindings = [];
for (const f of serveRoots) {
  if (!fs.existsSync(f)) continue;
  const t = fs.readFileSync(f, "utf8");
  const https = [...t.matchAll(/https:\/\/[^\s"'<>)]+/gi)].map((m) => m[0]);
  const http = [...t.matchAll(/http:\/\/[^\s"'<>)]+/gi)].map((m) => m[0]);
  const bad = [];
  if (/fonts\.googleapis|fonts\.gstatic|cdn\.searchspring|gtag\(|googletagmanager|g-recaptcha|recaptcha/i.test(t)) {
    bad.push("commerce_or_tracking_or_remote_font");
  }
  if (/Added by HTTrack/i.test(t)) bad.push("httrack");
  surfaceFindings.push({
    file: path.relative(root, f).replace(/\\/g, "/"),
    httpsUnique: [...new Set(https)],
    httpUnique: [...new Set(http)],
    flags: bad,
  });
}

const report = {
  phase: "R5",
  estate: {
    beforeBytes: before,
    afterBytes: html.length,
    googleFontsLinksBefore: googleBefore,
    searchspringBefore,
    httrackBefore,
    httpsBefore,
    googleFontsLinksAfter: (html.match(/fonts\.googleapis\.com/gi) || []).length,
    searchspringAfter: (html.match(/cdn\.searchspring\.net/gi) || []).length,
    httrackAfter: (html.match(/HTTrack/gi) || []).length,
    notes,
  },
  surfaceFindings,
  chromeFonts: "system stacks in chrome.css (no remote @font-face)",
};

fs.writeFileSync(
  path.join(root, "tools", "reports", "r5-summary.json"),
  JSON.stringify(report, null, 2)
);
console.log(JSON.stringify(report.estate, null, 2));
console.log(
  "surface flags:",
  surfaceFindings.filter((f) => f.flags.length || f.httpsUnique.length).map((f) => ({
    file: f.file,
    flags: f.flags,
    https: f.httpsUnique.slice(0, 8),
  }))
);
