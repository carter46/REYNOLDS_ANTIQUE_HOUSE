import fs from "fs";
const p =
  "C:/Users/user pc/OneDrive/Documents/carter/REYNOLDS_ANTIQUE_HOUSE/index.html";
let h = fs.readFileSync(p, "utf8");
const from =
  "col-xs-12 col-sm-12 col-md-6 col-lg-4 col-xl-3 imgboxsplit";
const to =
  "col-xs-12 col-sm-12 col-md-6 col-lg-4 col-xl-4 col-xxl-3 justify-content-xxl-center align-items-xxl-center imgboxsplit";
const n = h.split(from).length - 1;
h = h.split(from).join(to);
h = h.replace(
  /class="shadow1 img_box_shadow"/g,
  'class="shadow1 hvrcls img_box_shadow"'
);
h = h.replace(/class="card card-body h-100"/g, 'class="card card-body"');
fs.writeFileSync(p, h);
console.log({ colReplacements: n, hvrcls: (h.match(/hvrcls/g) || []).length });
