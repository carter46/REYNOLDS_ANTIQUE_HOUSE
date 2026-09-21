import fs from "fs";
import path from "path";

const WORK = "C:\\Users\\user pc\\OneDrive\\Documents\\carter\\REYNOLDS_ANTIQUE_HOUSE";
const EXT = path.join(WORK, "tools", "reports", "extracted");

const HEAD = (title, desc, extras = []) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <meta name="description" content="${desc}" />
  <meta name="theme-color" content="#1a1410" />
  <link rel="stylesheet" href="/assets/vendor/bootstrap/bootstrap.min.css" />
  <link rel="stylesheet" href="/assets/fonts/typekit/tid5nrh.css" />
  <link rel="stylesheet" href="/assets/css/chrome.css" />
  <link rel="stylesheet" href="/assets/css/home-newel.css" />
  <link rel="stylesheet" href="/assets/css/newel/styles.css" />
${extras.map((h) => `  <link rel="stylesheet" href="${h}" />`).join("\n")}
</head>`;

function scopePageCss(css, root) {
  // Drop global resets that fight shared chrome
  return css
    .replace(/\*\s*\{[^}]*\}/g, "")
    .replace(/html\s*\{[^}]*\}/g, "")
    .replace(/body\s*\{[^}]*\}/g, `${root}{font-family:'EB Garamond',Georgia,serif;}`)
    .replace(/\.desktop_view,\.menu_mbl_view\s*\{[^}]*\}/g, "")
    .replace(/\.input-group-addon img\s*\{[^}]*\}/g, "")
    .replace(/img\s*\{display:inline[^}]*\}/g, `${root} img{display:inline;max-width:100%;height:auto;}`)
    .replace(/a\s*\{color:inherit; text-decoration:none;\}/g, `${root} a{color:inherit;text-decoration:none;}`);
}

function splitStyleBody(raw) {
  const m = raw.match(/<style>([\s\S]*?)<\/style>/);
  const style = m ? m[1] : "";
  let body = raw.replace(/<style>[\s\S]*?<\/style>/, "").trim();
  body = body
    .replace(/<!--body content part end -->[\s\S]*/i, "")
    .replace(/<!-- footer part start -->[\s\S]*/i, "")
    .replace(/<script>[\s\S]*?<\/script>/gi, (s) => {
      // keep reveal observer; drop history.replaceState spam if alone
      if (s.includes("IntersectionObserver") || s.includes("reveal")) return s;
      return "";
    });
  return { style, body };
}

function writePage(file, title, desc, extractedName, extras = [], rootClass = "rah-archive-page") {
  const raw = fs.readFileSync(path.join(EXT, extractedName), "utf8");
  const { style, body } = splitStyleBody(raw);
  const scoped = scopePageCss(style, `.${rootClass}`);
  // Fix leftover bad image paths
  let cleaned = body
    .replace(/src="\/img\//g, 'src="/assets/img/')
    .replace(/cdn-cgi\/l\/email-protection[^"]*/g, "mailto:info@reynoldsantiquehouse.com")
    .replace(/href="mailto:info@reynoldsantiquehouse.com"/g, 'href="mailto:info@reynoldsantiquehouse.com"');

  const html = `${HEAD(title, desc, extras)}
<body data-page="${file.replace(".html", "")}">
  <div id="site-header-root"></div>
  <main id="main" class="${rootClass}">
<style>
${scoped}
</style>
${cleaned}
  </main>
  <div id="site-footer-root"></div>
  <script src="/js/site-chrome.js"></script>
  <script>
  (function () {
    var reveals = document.querySelectorAll('.${rootClass} .reveal');
    if (!reveals.length) return;
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
        });
      }, { threshold: 0.12 });
      reveals.forEach(function (el) { io.observe(el); });
    } else {
      reveals.forEach(function (el) { el.classList.add('in'); });
    }
  })();
  </script>
</body>
</html>
`;
  fs.writeFileSync(path.join(WORK, file), html);
  console.log("wrote", file, html.length);
}

writePage(
  "about.html",
  "About | Reynolds Antique House",
  "About Reynolds Antique House — gallery heritage since 1939.",
  "about-body.html",
  [],
  "rah-about"
);

writePage(
  "trade-program.html",
  "Trade Program | Reynolds Antique House",
  "Trade program at Reynolds Antique House for designers and architects.",
  "trade-body.html",
  [],
  "rah-trade"
);

// Contact: keep mailto form; use extracted locations chrome + form
{
  const raw = fs.readFileSync(path.join(EXT, "contact-body.html"), "utf8");
  let body = raw
    .replace(/<style>[\s\S]*?<\/style>/, "")
    .replace(/cdn-cgi\/l\/email-protection[^"]*/g, "mailto:info@reynoldsantiquehouse.com")
    .replace(/href="mailto:info@reynoldsantiquehouse.com"/g, 'href="mailto:info@reynoldsantiquehouse.com"')
    // Cloudflare email protection links → real mailto
    .replace(/href="mailto:info@reynoldsantiquehouse.com"/g, 'href="mailto:info@reynoldsantiquehouse.com"');
  // Force Email Us links to mailto
  body = body.replace(/href="[^"]*email-protection[^"]*"/gi, 'href="mailto:info@reynoldsantiquehouse.com"');
  body = body.replace(/href="cdn-cgi[^"]*"/gi, 'href="mailto:info@reynoldsantiquehouse.com"');

  const html = `${HEAD("Contact | Reynolds Antique House", "Contact Reynolds Antique House.", [
    "/assets/css/newel/contact-form.css",
  ])}
<body data-page="contact">
  <div id="site-header-root"></div>
  <main id="main">
${body}
    <section class="rah-page" style="padding-top:0;">
      <form class="rah-contact-form" action="mailto:info@reynoldsantiquehouse.com" method="post" enctype="text/plain" style="max-width:640px;margin:2rem auto 3rem;">
        <h2 class="rah-section-title" style="font-size:1.5rem;">Send a Message</h2>
        <label for="name">Name</label>
        <input id="name" name="name" required />
        <label for="email">Email</label>
        <input id="email" name="email" type="email" required />
        <label for="message">Message</label>
        <textarea id="message" name="message" rows="6" required></textarea>
        <button class="rah-btn" type="submit">Send Email</button>
      </form>
    </section>
  </main>
  <div id="site-footer-root"></div>
  <script src="/js/site-chrome.js"></script>
</body>
</html>
`;
  fs.writeFileSync(path.join(WORK, "contact.html"), html);
  console.log("wrote contact.html", html.length);
}
