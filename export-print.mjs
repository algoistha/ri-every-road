// Generates a large, print-resolution PNG of the full road map for physical
// printing (posters, wall murals). Renders portrait, matching RI's true shape.
//
// Usage: node export-print.mjs [--height-in=84] [--dpi=150] [--theme=dark] [--out=ri-print.png]
import fs from "fs";
import nodePath from "path";
import { fileURLToPath } from "url";
import { geoMercator, geoPath, geoLength } from "d3-geo";
import * as topojson from "topojson-client";
import sharp from "sharp";

const __dirname = nodePath.dirname(fileURLToPath(import.meta.url));

const args = Object.fromEntries(process.argv.slice(2).map(a => {
  const [k, v] = a.replace(/^--/, "").split("=");
  return [k, v ?? true];
}));

const HEIGHT_IN = parseFloat(args["height-in"] || 84);
const DPI = parseFloat(args.dpi || 150);
const THEME = args.theme === "light" ? "light" : "dark";
const OUT = args.out || `ri-every-road-print-${THEME}-${HEIGHT_IN}in.png`;
const MAX_PX = 16000; // safety cap well under common raster/print-pipeline limits
const ROAD_LABEL_MIN_MI = parseFloat(args["road-label-min-mi"] || 3); // stricter than the interactive map — a static poster can't zoom to declutter

const THEMES = {
  dark: {
    bg: "#0b0b0c", outlineFill: "#141414", outlineStroke: "#3a3a3a",
    text: "#f2f2f0", halo: "#0b0b0c", muted: "#9a9a9a", roadLabelText: "#c9c9c9",
    roadStyles: {
      S1100: { color: "#ffffff", width: 1.4 }, S1200: { color: "#dcdcdc", width: 1.0 },
      S1630: { color: "#c4c4c4", width: 0.7 }, S1400: { color: "#9a9a9a", width: 0.45 },
      S1500: { color: "#707070", width: 0.4 }, S1640: { color: "#7a7a7a", width: 0.4 },
      S1740: { color: "#6e6e6e", width: 0.4 }, S1750: { color: "#5c5c5c", width: 0.35 },
      S1780: { color: "#5c5c5c", width: 0.35 }, S1710: { color: "#565656", width: 0.35 },
      S1730: { color: "#5c5c5c", width: 0.35 }, S1820: { color: "#565656", width: 0.35 }
    },
    defaultStyle: { color: "#555555", width: 0.35 }
  },
  light: {
    bg: "#f4f4f1", outlineFill: "#eae9e4", outlineStroke: "#c7c5bd",
    text: "#171716", halo: "#f4f4f1", muted: "#5c5c5c", roadLabelText: "#4a4a4a",
    roadStyles: {
      S1100: { color: "#000000", width: 1.4 }, S1200: { color: "#2b2b2b", width: 1.0 },
      S1630: { color: "#454545", width: 0.7 }, S1400: { color: "#767676", width: 0.45 },
      S1500: { color: "#8f8f8f", width: 0.4 }, S1640: { color: "#868686", width: 0.4 },
      S1740: { color: "#8f8f8f", width: 0.4 }, S1750: { color: "#9c9c9c", width: 0.35 },
      S1780: { color: "#9c9c9c", width: 0.35 }, S1710: { color: "#a3a3a3", width: 0.35 },
      S1730: { color: "#9c9c9c", width: 0.35 }, S1820: { color: "#a3a3a3", width: 0.35 }
    },
    defaultStyle: { color: "#a0a0a0", width: 0.35 }
  }
};
const T = THEMES[THEME];
const ORDER = ["S1750", "S1780", "S1730", "S1710", "S1820", "S1500", "S1640", "S1740", "S1400", "S1630", "S1200", "S1100"];

const CITIES = new Set(["Providence", "Warwick", "Cranston", "Pawtucket", "East Providence"]);
const PLACES = [
  { name: "Providence", lon: -71.4128, lat: 41.8240 }, { name: "Warwick", lon: -71.4162, lat: 41.7001 },
  { name: "Cranston", lon: -71.4372, lat: 41.7798 }, { name: "Pawtucket", lon: -71.3826, lat: 41.8787 },
  { name: "East Providence", lon: -71.3701, lat: 41.8137 }, { name: "Woonsocket", lon: -71.4995, lat: 42.0029 },
  { name: "Newport", lon: -71.3128, lat: 41.4901 }, { name: "Central Falls", lon: -71.3925, lat: 41.8904 },
  { name: "North Providence", lon: -71.4534, lat: 41.8481 }, { name: "Johnston", lon: -71.5087, lat: 41.8179 },
  { name: "Cumberland", lon: -71.4359, lat: 41.9679 }, { name: "Lincoln", lon: -71.4359, lat: 41.9179 },
  { name: "North Smithfield", lon: -71.5445, lat: 41.9834 }, { name: "Smithfield", lon: -71.5495, lat: 41.9209 },
  { name: "Burrillville", lon: -71.6870, lat: 41.9668 }, { name: "Glocester", lon: -71.6659, lat: 41.9168 },
  { name: "Scituate", lon: -71.6420, lat: 41.8154 }, { name: "Foster", lon: -71.7295, lat: 41.8354 },
  { name: "West Warwick", lon: -71.5087, lat: 41.6996 }, { name: "Coventry", lon: -71.5787, lat: 41.6957 },
  { name: "East Greenwich", lon: -71.4623, lat: 41.6527 }, { name: "West Greenwich", lon: -71.6323, lat: 41.6301 },
  { name: "Middletown", lon: -71.2895, lat: 41.5223 }, { name: "Portsmouth", lon: -71.2506, lat: 41.6001 },
  { name: "Tiverton", lon: -71.1959, lat: 41.6323 }, { name: "Little Compton", lon: -71.1567, lat: 41.5240 },
  { name: "Jamestown", lon: -71.3651, lat: 41.4979 }, { name: "Bristol", lon: -71.2687, lat: 41.6774 },
  { name: "Warren", lon: -71.2837, lat: 41.7326 }, { name: "Barrington", lon: -71.3006, lat: 41.7401 },
  { name: "Westerly", lon: -71.8273, lat: 41.3776 }, { name: "Charlestown", lon: -71.6412, lat: 41.3901 },
  { name: "Richmond", lon: -71.6598, lat: 41.5259 }, { name: "Hopkinton", lon: -71.7995, lat: 41.4646 },
  { name: "Exeter", lon: -71.5776, lat: 41.5765 }, { name: "North Kingstown", lon: -71.4595, lat: 41.5834 },
  { name: "South Kingstown", lon: -71.5292, lat: 41.4551 }, { name: "Narragansett", lon: -71.4523, lat: 41.4501 },
  { name: "New Shoreham", lon: -71.5762, lat: 41.1707 }
];

function formatRoadName(name) {
  return name
    .replace(/^I-\s*/, "I-")
    .replace(/^State Rte /, "RI-")
    .replace(/^US Hwy /, "US-")
    .trim();
}

// geometric midpoint of a projected point path + local tangent angle,
// normalized so label text never renders upside-down
function computeLabelAnchor(pts) {
  if (pts.length < 2) return null;
  const cum = [0];
  for (let i = 1; i < pts.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  }
  const total = cum[cum.length - 1];
  if (total === 0) return null;
  const half = total / 2;
  let idx = cum.findIndex(c => c >= half);
  if (idx <= 0) idx = 1;
  const t = (half - cum[idx - 1]) / (cum[idx] - cum[idx - 1] || 1);
  const a = pts[idx - 1], b = pts[idx];
  const x = a[0] + (b[0] - a[0]) * t;
  const y = a[1] + (b[1] - a[1]) * t;
  let angle = Math.atan2(b[1] - a[1], b[0] - a[0]);
  if (angle > Math.PI / 2) angle -= Math.PI;
  if (angle < -Math.PI / 2) angle += Math.PI;
  return { x, y, angleDeg: angle * 180 / Math.PI };
}

function readTopo(file) {
  const t = JSON.parse(fs.readFileSync(nodePath.join(__dirname, "data", file), "utf8"));
  const obj = t.objects[Object.keys(t.objects)[0]];
  return topojson.feature(t, obj);
}

const roadsGeo = readTopo("ri-roads.topojson");
roadsGeo.features = roadsGeo.features.filter(f => f.geometry);
const outlineGeo = readTopo("ri-outline.topojson");

// determine true aspect ratio of the state, then size the canvas so the
// requested physical dimension applies to the LONGER side (RI is portrait)
const probe = geoPath(geoMercator().fitSize([1000, 1000], outlineGeo));
const [[bx0, by0], [bx1, by1]] = probe.bounds(outlineGeo);
const aspect = (bx1 - bx0) / (by1 - by0); // width / height, < 1 = portrait

let H_PX, W_PX;
if (aspect <= 1) {
  H_PX = Math.round(HEIGHT_IN * DPI);
  W_PX = Math.round(H_PX * aspect);
} else {
  W_PX = Math.round(HEIGHT_IN * DPI); // HEIGHT_IN arg treated as the long-side inches
  H_PX = Math.round(W_PX / aspect);
}
if (Math.max(W_PX, H_PX) > MAX_PX) {
  const scale = MAX_PX / Math.max(W_PX, H_PX);
  W_PX = Math.round(W_PX * scale);
  H_PX = Math.round(H_PX * scale);
  console.warn(`Requested size exceeds safe raster limit; clamped to ${W_PX}x${H_PX}px.`);
}

const margin = Math.round(Math.min(W_PX, H_PX) * 0.02);
const projection = geoMercator().fitExtent([[margin, margin], [W_PX - margin, H_PX - margin]], outlineGeo);
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
  const style = T.roadStyles[key] || T.defaultStyle;
  const strokeW = Math.max(style.width * (DPI / 96), 0.6); // scale road weight up with DPI so it doesn't look hairline-thin at large size
  const d = byMtfcc.get(key).map(f => path(f)).join(" ");
  roadPaths += `<path d="${d}" fill="none" stroke="${style.color}" stroke-width="${strokeW.toFixed(2)}" stroke-linecap="round" stroke-linejoin="round" opacity="0.92"/>\n`;
});

const labelScale = DPI / 96;

// major road name labels — group same-named highways/arterials, use the
// longest contiguous stretch of each as the representative geometry
const majorByName = new Map();
for (const f of roadsGeo.features) {
  const mtfcc = f.properties.MTFCC;
  const name = f.properties.FULLNAME;
  if ((mtfcc !== "S1100" && mtfcc !== "S1200") || !name) continue;
  if (!majorByName.has(name)) majorByName.set(name, []);
  majorByName.get(name).push(f);
}
const roadLabelSize = 9 * labelScale;
let roadLabelSvg = "";
majorByName.forEach((feats, name) => {
  let longest = null, longestLen = 0;
  for (const f of feats) {
    const len = geoLength(f) * 6371008.8;
    if (len > longestLen) { longestLen = len; longest = f; }
  }
  if (!longest || longestLen / 1609.34 < ROAD_LABEL_MIN_MI) return;
  const pts = longest.geometry.coordinates.map(c => projection(c)).filter(p => p);
  const anchor = computeLabelAnchor(pts);
  if (!anchor) return;
  const label = formatRoadName(name);
  roadLabelSvg += `<text x="${anchor.x.toFixed(1)}" y="${anchor.y.toFixed(1)}" transform="rotate(${anchor.angleDeg.toFixed(2)} ${anchor.x.toFixed(1)} ${anchor.y.toFixed(1)})" text-anchor="middle" dominant-baseline="middle" font-family="Arial, Helvetica, sans-serif" font-size="${roadLabelSize.toFixed(1)}" font-weight="600" fill="${T.roadLabelText}" stroke="${T.halo}" stroke-width="${(2.5 * labelScale).toFixed(1)}" paint-order="stroke">${label}</text>\n`;
});

const labelSvg = PLACES.map(p => {
  const [x, y] = projection([p.lon, p.lat]);
  const isCity = CITIES.has(p.name);
  const size = (isCity ? 15 : 12) * labelScale;
  const weight = isCity ? 700 : 600;
  const r = (isCity ? 3 : 2) * labelScale;
  return `<g>
    <circle cx="${x}" cy="${y}" r="${r.toFixed(2)}" fill="${T.text}"/>
    <text x="${x}" y="${y - r - 3 * labelScale}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${size.toFixed(1)}" font-weight="${weight}" fill="${T.text}" stroke="${T.halo}" stroke-width="${(3 * labelScale).toFixed(1)}" paint-order="stroke">${p.name}</text>
  </g>`;
}).join("\n");

const titleSize = 30 * labelScale;
const subSize = 13 * labelScale;
const pad = 24 * labelScale;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W_PX}" height="${H_PX}" viewBox="0 0 ${W_PX} ${H_PX}">
  <rect width="${W_PX}" height="${H_PX}" fill="${T.bg}"/>
  <path d="${path(outlineGeo)}" fill="${T.outlineFill}" stroke="${T.outlineStroke}" stroke-width="${(1.2 * labelScale).toFixed(2)}"/>
  ${roadPaths}
  ${roadLabelSvg}
  ${labelSvg}
  <text x="${pad}" y="${H_PX - pad - subSize - 6 * labelScale}" font-family="Arial, Helvetica, sans-serif" font-size="${titleSize.toFixed(1)}" font-weight="800" letter-spacing="${2 * labelScale}" fill="${T.text}">RHODE ISLAND</text>
  <text x="${pad}" y="${H_PX - pad}" font-family="Arial, Helvetica, sans-serif" font-size="${subSize.toFixed(1)}" fill="${T.muted}">Every public road · ${roadsGeo.features.length.toLocaleString()} segments · U.S. Census TIGER/Line 2025</text>
</svg>`;

console.log(`Rendering ${W_PX}x${H_PX}px (${(W_PX/DPI).toFixed(1)}x${(H_PX/DPI).toFixed(1)} in @ ${DPI} DPI), ${THEME} theme...`);

sharp(Buffer.from(svg), { limitInputPixels: false })
  .withMetadata({ density: DPI })
  .png({ compressionLevel: 9 })
  .toFile(nodePath.join(__dirname, OUT))
  .then(() => console.log(`wrote ${OUT}`))
  .catch(err => { console.error(err); process.exit(1); });
