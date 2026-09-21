import fs from "fs";
import path from "path";

const AR = "C:\\My Web Sites\\REYNOLDS_ANTIQUE_HOUSE\\antics website\\newel.com";
const WORK = "C:\\Users\\user pc\\OneDrive\\Documents\\carter\\REYNOLDS_ANTIQUE_HOUSE";
const OUT = path.join(WORK, "tools", "reports", "extracted");

function rebrand(html) {
  return html
    .replace(/Newel Online/gi, "Reynolds Antique House")
    .replace(/Newel Antiques/gi, "Reynolds Antique House")
    .replace(/\bNewel\b/g, "Reynolds Antique House")
    .replace(/NEWEL/g, "REYNOLDS ANTIQUE HOUSE")
    .replace(/www\.newel\.com/gi, "reynoldsantiquehouse.com")
    .replace(/https?:\/\/(www\.)?newel\.com[^"'\\\s]*/gi, "/products.html")
    .replace(/href="products[^"]*"/gi, 'href="/products.html"')
    .replace(/href="about\.html"/gi, 'href="/about.html"')
    .replace(/href="contact\.html"/gi, 'href="/contact.html"')
    .replace(/href="trade-program\.html"/gi, 'href="/trade-program.html"')
    .replace(/href="estate-services\.html"/gi, 'href="/estate-services.html"')
    .replace(/src="img\//g, 'src="/assets/img/')
    .replace(/url\('img\//g, "url('/assets/img/")
    .replace(/url\("img\//g, 'url("/assets/img/')
    .replace(/info@newel\.com/gi, "info@reynoldsantiquehouse.com")
    .replace(/trade@newel\.com/gi, "info@reynoldsantiquehouse.com")
    .replace(/Jake Baer, Fourth-Generation CEO/g, "Our Gallery Heritage")
    .replace(/\s+target="_blank"/g, "")
    .replace(/\s+rel="noopener"/g, "");
}

function extractBetween(html, startRe, endRe) {
  const s = html.search(startRe);
  if (s < 0) return "";
  const rest = html.slice(s);
  const e = rest.search(endRe);
  return e < 0 ? rest : rest.slice(0, e);
}

function styleContaining(html, needle) {
  const idx = html.indexOf(needle);
  if (idx < 0) return "";
  const styleStart = html.lastIndexOf("<style>", idx);
  const styleEnd = html.indexOf("</style>", idx);
  if (styleStart < 0 || styleEnd < 0) return "";
  return html.slice(styleStart, styleEnd + 8);
}

fs.mkdirSync(OUT, { recursive: true });

{
  const html = fs.readFileSync(path.join(AR, "about.html"), "utf8");
  const styleBlock = styleContaining(html, ".hero-eyebrow33");
  const body = extractBetween(
    html,
    /<section class="hero">/,
    /<footer|id="footer|<!-- Footer|class="footer|site-footer/
  );
  const out = rebrand(styleBlock + "\n" + body);
  fs.writeFileSync(path.join(OUT, "about-body.html"), out);
  console.log("about", out.length);
}

{
  const html = fs.readFileSync(path.join(AR, "trade-program.html"), "utf8");
  const styleBlock = styleContaining(html, ".hero-eyebrow4");
  const body = extractBetween(
    html,
    /<section class="hero">/,
    /<footer|id="footer|<!-- Footer|class="footer|site-footer/
  );
  const out = rebrand(styleBlock + "\n" + body);
  fs.writeFileSync(path.join(OUT, "trade-body.html"), out);
  console.log("trade", out.length);
}

{
  const html = fs.readFileSync(path.join(AR, "contact.html"), "utf8");
  const styleBlock = styleContaining(html, "contact_main_header");
  const body = extractBetween(
    html,
    /<div class="contact-us-desktop">/,
    /contact-us-mobile|<footer|id="footer|class="footer|site-footer/
  );
  const out = rebrand(styleBlock + "\n" + body);
  fs.writeFileSync(path.join(OUT, "contact-body.html"), out);
  console.log("contact", out.length);
}

const cfc = path.join(AR, "css", "contact-form.css");
if (fs.existsSync(cfc)) {
  fs.copyFileSync(cfc, path.join(WORK, "assets", "css", "newel", "contact-form.css"));
  console.log("copied contact-form.css");
}
