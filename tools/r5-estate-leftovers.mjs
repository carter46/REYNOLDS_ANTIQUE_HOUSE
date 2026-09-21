import fs from "fs";
const p = "estate-services.html";
let h = fs.readFileSync(p, "utf8");
h = h.replace(/<!--\s*recaptcha removed R5\s*-->/gi, "");
h = h.replace(/\/\*\.searchspring-content\s*\{[\s\S]*?\}\s*\*\//gi, "/* searchspring remnant removed R5 */");
h = h.replace(/https:\/\/blog\.newel\.com\/timeline\//gi, "/about.html");
fs.writeFileSync(p, h);
console.log("cleaned leftovers");
