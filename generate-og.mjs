// Generates a static 1200x630 PNG preview image (for og:image) from the same
// road data the interactive map uses. Run with: node generate-og.js
import fs from "fs";
import nodePath from "path";
import { fileURLToPath } from "url";
import { geoMercator, geoPath } from "d3-geo";
import * as topojson from "topojson-client";
import sharp from "sharp";

const __dirname = nodePath.dirname(fileURLToPath(import.meta.url));

const W = 1200, H = 630;
const BG = "#0b0b0c";
const OUTLINE_FILL = "#141414";
const OUTLINE_STROKE = "#3a3a3a";
const TEXT = "#f2f2f0";
const HALO = "#0b0b0c";

const ROAD_STYLES = {
  S1100: { color: "#ffffff", width: 2.2 },
  S1200: { color: "#dcdcdc", width: 1.6 },
  S1630: { color: "#c4c4c4", width: 1.1 },
  S1400: { color: "#9a9a9a", width: 0.7 },
  S1500: { color: "#707070", width: 0.6 },
  S1640: { color: "#7a7a7a", width: 0.6 },
  S1740: { color: "#6e6e6e", width: 0.6 },
  S1750: { color: "#5c5c5c", width: 0.55 },
  S1780: { color: "#5c5c5c", width: 0.55 },
  S1710: { color: "#565656", width: 0.55 },
  S1730: { color: "#5c5c5c", width: 0.55 },
  S1820: { color: "#565656", width: 0.55 }
};
const DEFAULT_STYLE = { color: "#555555", width: 0.55 };
const ORDER = ["S1750", "S1780", "S1730", "S1710", "S1820", "S1500", "S1640", "S1740", "S1400", "S1630", "S1200", "S1100"];

const CITIES = new Set(["Providence", "Warwick", "Cranston", "Pawtucket", "East Providence"]);
const PLACES = [
  { name: "Providence", lon: -71.4128, lat: 41.8240 },
  { name: "Warwick", lon: -71.4162, lat: 41.7001 },
  { name: "Cranston", lon: -71.4372, lat: 41.7798 },
  { name: "Pawtucket", lon: -71.3826, lat: 41.8787 },
  { name: "Newport", lon: -71.3128, lat: 41.4901 },
  { name: "Woonsocket", lon: -71.4995, lat: 42.0029 },
  { name: "Westerly", lon: -71.8273, lat: 41.3776 },
  { name: "Narragansett", lon: -71.4523, lat: 41.4501 },
  { name: "Bristol", lon: -71.2687, lat: 41.6774 }
];

function readTopo(file, key) {
  const t = JSON.parse(fs.readFileSync(nodePath.join(__dirname, "data", file), "utf8"));
  const obj = t.objects[key || Object.keys(t.objects)[0]];
  return topojson.feature(t, obj);
}

const roadsGeo = readTopo("ri-roads.topojson");
roadsGeo.features = roadsGeo.features.filter(f => f.geometry);
const outlineGeo = readTopo("ri-outline.topojson");

const projection = geoMercator().fitExtent([[28, 28], [W - 28, H - 28]], outlineGeo);
const path = geoPath(projection);

const byMtfcc = new Map();
for (const f of roadsGeo.features) {
  const key = ORDER.includes(f.properties.MTFCC) ? f.properties.MTFCC : "OTHER";
  if (!byMtfcc.has(key)) byMtfcc.set(key, []);
  byMtfcc.get(key).push(f);
}

let roadPaths = "";
ORDER.forEach(key => {
  if (!byMtfcc.has(key)) return;
  const style = ROAD_STYLES[key] || DEFAULT_STYLE;
  const d = byMtfcc.get(key).map(f => path(f)).join(" ");
  roadPaths += `<path d="${d}" fill="none" stroke="${style.color}" stroke-width="${style.width}" stroke-linecap="round" stroke-linejoin="round" opacity="0.92"/>\n`;
});

const labelSvg = PLACES.map(p => {
  const [x, y] = projection([p.lon, p.lat]);
  const isCity = CITIES.has(p.name);
  const size = isCity ? 15 : 12;
  const weight = isCity ? 700 : 600;
  return `<g>
    <circle cx="${x}" cy="${y}" r="${isCity ? 3 : 2}" fill="${TEXT}"/>
    <text x="${x}" y="${y - (isCity ? 8 : 6)}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${size}" font-weight="${weight}" fill="${TEXT}" stroke="${HALO}" stroke-width="3" paint-order="stroke">${p.name}</text>
  </g>`;
}).join("\n");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${BG}"/>
  <path d="${path(outlineGeo)}" fill="${OUTLINE_FILL}" stroke="${OUTLINE_STROKE}" stroke-width="1.2"/>
  ${roadPaths}
  ${labelSvg}
  <text x="30" y="${H - 26}" font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="700" fill="${TEXT}">Rhode Island — Every Road</text>
  <text x="30" y="${H - 10}" font-family="Arial, Helvetica, sans-serif" font-size="11" fill="#9a9a9a">${roadsGeo.features.length.toLocaleString()} road segments · U.S. Census TIGER/Line 2025</text>
</svg>`;

fs.writeFileSync(nodePath.join(__dirname, "og-source.svg"), svg);

sharp(Buffer.from(svg))
  .png()
  .toFile(nodePath.join(__dirname, "og-image.png"))
  .then(() => console.log("wrote og-image.png"))
  .catch(err => { console.error(err); process.exit(1); });
