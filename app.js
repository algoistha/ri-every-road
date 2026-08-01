(function () {
  "use strict";

  // MTFCC road-class styling per theme — grayscale hierarchy from faint (minor) to prominent (major)
  const THEMES = {
    dark: {
      outlineFill: "#141414",
      outlineStroke: "#3a3a3a",
      highlight: "#ff5a3c",
      roadOpacity: 0.9,
      placeText: "#f2f2f0",
      placeHalo: "rgba(11,11,12,0.9)",
      tideAccent: "#6fb8e0",
      icon: "☾", // moon — click to switch to light
      roadStyles: {
        S1100: { label: "Primary road / highway", color: "#ffffff", width: 1.4, dash: null },
        S1200: { label: "Secondary road",          color: "#dcdcdc", width: 1.0, dash: null },
        S1630: { label: "Ramp",                    color: "#c4c4c4", width: 0.7, dash: null },
        S1400: { label: "Local road / street",     color: "#9a9a9a", width: 0.45, dash: null },
        S1500: { label: "4WD trail",               color: "#707070", width: 0.4, dash: [1, 2] },
        S1640: { label: "Service drive",           color: "#7a7a7a", width: 0.4, dash: null },
        S1740: { label: "Private road",            color: "#6e6e6e", width: 0.4, dash: null },
        S1750: { label: "Internal / other",        color: "#5c5c5c", width: 0.35, dash: null },
        S1780: { label: "Parking lot road",        color: "#5c5c5c", width: 0.35, dash: null },
        S1710: { label: "Walkway / pedestrian",    color: "#565656", width: 0.35, dash: [1, 2] },
        S1730: { label: "Alley",                   color: "#5c5c5c", width: 0.35, dash: null },
        S1820: { label: "Bike path / trail",       color: "#565656", width: 0.35, dash: [1, 2] }
      },
      defaultStyle: { label: "Other", color: "#555555", width: 0.35, dash: null }
    },
    light: {
      outlineFill: "#eae9e4",
      outlineStroke: "#c7c5bd",
      highlight: "#d64526",
      roadOpacity: 0.95,
      placeText: "#171716",
      placeHalo: "rgba(244,244,241,0.9)",
      tideAccent: "#1a6fa3",
      icon: "☀", // sun — click to switch to dark
      roadStyles: {
        S1100: { label: "Primary road / highway", color: "#000000", width: 1.4, dash: null },
        S1200: { label: "Secondary road",          color: "#2b2b2b", width: 1.0, dash: null },
        S1630: { label: "Ramp",                    color: "#454545", width: 0.7, dash: null },
        S1400: { label: "Local road / street",     color: "#767676", width: 0.45, dash: null },
        S1500: { label: "4WD trail",               color: "#8f8f8f", width: 0.4, dash: [1, 2] },
        S1640: { label: "Service drive",           color: "#868686", width: 0.4, dash: null },
        S1740: { label: "Private road",            color: "#8f8f8f", width: 0.4, dash: null },
        S1750: { label: "Internal / other",        color: "#9c9c9c", width: 0.35, dash: null },
        S1780: { label: "Parking lot road",        color: "#9c9c9c", width: 0.35, dash: null },
        S1710: { label: "Walkway / pedestrian",    color: "#a3a3a3", width: 0.35, dash: [1, 2] },
        S1730: { label: "Alley",                   color: "#9c9c9c", width: 0.35, dash: null },
        S1820: { label: "Bike path / trail",       color: "#a3a3a3", width: 0.35, dash: [1, 2] }
      },
      defaultStyle: { label: "Other", color: "#a0a0a0", width: 0.35, dash: null }
    }
  };

  // draw order: minor roads first, major roads last (on top)
  const ORDER = ["S1750", "S1780", "S1730", "S1710", "S1820", "S1500", "S1640", "S1740", "S1400", "S1630", "S1200", "S1100"];

  // Rhode Island's 39 cities & towns, for orientation labels
  const PLACES = [
    { name: "Providence", lon: -71.4128, lat: 41.8240, tier: "city" },
    { name: "Warwick", lon: -71.4162, lat: 41.7001, tier: "city" },
    { name: "Cranston", lon: -71.4372, lat: 41.7798, tier: "city" },
    { name: "Pawtucket", lon: -71.3826, lat: 41.8787, tier: "city" },
    { name: "East Providence", lon: -71.3701, lat: 41.8137, tier: "city" },
    { name: "Woonsocket", lon: -71.4995, lat: 42.0029, tier: "town" },
    { name: "Newport", lon: -71.3128, lat: 41.4901, tier: "town" },
    { name: "Central Falls", lon: -71.3925, lat: 41.8904, tier: "town" },
    { name: "North Providence", lon: -71.4534, lat: 41.8481, tier: "town" },
    { name: "Johnston", lon: -71.5087, lat: 41.8179, tier: "town" },
    { name: "Cumberland", lon: -71.4359, lat: 41.9679, tier: "town" },
    { name: "Lincoln", lon: -71.4359, lat: 41.9179, tier: "town" },
    { name: "North Smithfield", lon: -71.5445, lat: 41.9834, tier: "town" },
    { name: "Smithfield", lon: -71.5495, lat: 41.9209, tier: "town" },
    { name: "Burrillville", lon: -71.6870, lat: 41.9668, tier: "town" },
    { name: "Glocester", lon: -71.6659, lat: 41.9168, tier: "town" },
    { name: "Scituate", lon: -71.6420, lat: 41.8154, tier: "town" },
    { name: "Foster", lon: -71.7295, lat: 41.8354, tier: "town" },
    { name: "West Warwick", lon: -71.5087, lat: 41.6996, tier: "town" },
    { name: "Coventry", lon: -71.5787, lat: 41.6957, tier: "town" },
    { name: "East Greenwich", lon: -71.4623, lat: 41.6527, tier: "town" },
    { name: "West Greenwich", lon: -71.6323, lat: 41.6301, tier: "town" },
    { name: "Middletown", lon: -71.2895, lat: 41.5223, tier: "town" },
    { name: "Portsmouth", lon: -71.2506, lat: 41.6001, tier: "town" },
    { name: "Tiverton", lon: -71.1959, lat: 41.6323, tier: "town" },
    { name: "Little Compton", lon: -71.1567, lat: 41.5240, tier: "town" },
    { name: "Jamestown", lon: -71.3651, lat: 41.4979, tier: "town" },
    { name: "Bristol", lon: -71.2687, lat: 41.6774, tier: "town" },
    { name: "Warren", lon: -71.2837, lat: 41.7326, tier: "town" },
    { name: "Barrington", lon: -71.3006, lat: 41.7401, tier: "town" },
    { name: "Westerly", lon: -71.8273, lat: 41.3776, tier: "town" },
    { name: "Charlestown", lon: -71.6412, lat: 41.3901, tier: "town" },
    { name: "Richmond", lon: -71.6598, lat: 41.5259, tier: "town" },
    { name: "Hopkinton", lon: -71.7995, lat: 41.4646, tier: "town" },
    { name: "Exeter", lon: -71.5776, lat: 41.5765, tier: "town" },
    { name: "North Kingstown", lon: -71.4595, lat: 41.5834, tier: "town" },
    { name: "South Kingstown", lon: -71.5292, lat: 41.4551, tier: "town" },
    { name: "Narragansett", lon: -71.4523, lat: 41.4501, tier: "town" },
    { name: "New Shoreham", lon: -71.5762, lat: 41.1707, tier: "town" }
  ];

  // NOAA CO-OPS tide stations along the RI coast (data: api.tidesandcurrents.noaa.gov)
  const TIDE_STATIONS = [
    { id: "8452660", name: "Newport", lon: -71.32614, lat: 41.504333 },
    { id: "8452944", name: "Conimicut Light", lon: -71.3433, lat: 41.7167 },
    { id: "8454000", name: "Providence", lon: -71.400665, lat: 41.807167 },
    { id: "8454049", name: "Quonset Point", lon: -71.411, lat: 41.5868 }
  ];
  const tideCache = new Map(); // station id -> { status: 'loading'|'ok'|'error', predictions }

  let theme = localStorage.getItem("ri-map-theme") || "dark";
  document.documentElement.setAttribute("data-theme", theme);

  const container = document.getElementById("map-container");
  const dpr = Math.max(window.devicePixelRatio || 1, 1);
  let width = window.innerWidth;
  let height = window.innerHeight;

  const canvas = d3.select(container).append("canvas").node();
  const ctx = canvas.getContext("2d");

  const tooltip = d3.select("#tooltip");
  const toggleBtn = document.getElementById("theme-toggle");
  toggleBtn.textContent = THEMES[theme].icon;

  let currentTransform = d3.zoomIdentity;
  let outlinePath2D = null;
  let roadBuckets = null;   // [{ mtfcc, path2d }]
  let quadtree = null;      // for hover hit-testing
  let highlightPath2D = null;
  let dataReady = false;

  function styleFor(mtfcc) {
    const t = THEMES[theme];
    return t.roadStyles[mtfcc] || t.defaultStyle;
  }

  function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    draw();
  }

  // Renders the full scene into any canvas context at any resolution.
  // resScale is an extra uniform magnification on top of the normal view —
  // 1 for the live on-screen canvas (where dpr is passed as resScale), or a
  // much larger number for high-res export. Because it's applied as one
  // outer ctx.scale() wrapping everything (including text), every existing
  // "divide by k" line-width/font/radius formula below stays correct
  // unchanged — the outer scale multiplies the whole result automatically.
  function renderMap(targetCtx, w, h, transform, resScale, opts) {
    opts = opts || {};
    targetCtx.setTransform(resScale, 0, 0, resScale, 0, 0);
    const t = THEMES[theme];
    targetCtx.fillStyle = t.outlineFill;
    targetCtx.fillRect(0, 0, w, h);
    if (!dataReady) return;

    const k = transform.k;

    targetCtx.save();
    targetCtx.translate(transform.x, transform.y);
    targetCtx.scale(k, k);

    targetCtx.fillStyle = t.outlineFill;
    targetCtx.fill(outlinePath2D);
    targetCtx.lineWidth = 1 / k;
    targetCtx.strokeStyle = t.outlineStroke;
    targetCtx.setLineDash([]);
    targetCtx.stroke(outlinePath2D);

    targetCtx.lineCap = "round";
    targetCtx.lineJoin = "round";
    targetCtx.globalAlpha = t.roadOpacity;
    for (const bucket of roadBuckets) {
      const style = styleFor(bucket.mtfcc);
      targetCtx.strokeStyle = style.color;
      targetCtx.lineWidth = Math.max(style.width / k, 0.12);
      targetCtx.setLineDash(style.dash ? style.dash.map(v => v / k) : []);
      targetCtx.stroke(bucket.path2d);
    }
    targetCtx.globalAlpha = 1;

    if (highlightPath2D) {
      targetCtx.setLineDash([]);
      targetCtx.strokeStyle = t.highlight;
      targetCtx.lineWidth = Math.max(2.4 / k, 1.6 / k);
      targetCtx.stroke(highlightPath2D);
    }

    targetCtx.restore();

    // town/city labels — drawn in screen space (not zoom-scaled) so text stays crisp
    targetCtx.textAlign = "center";
    targetCtx.lineJoin = "round";
    for (const p of PLACES) {
      const sx = p.px * k + transform.x;
      const sy = p.py * k + transform.y;
      if (sx < -60 || sx > w + 60 || sy < -30 || sy > h + 30) continue;
      const isCity = p.tier === "city";
      const dotR = isCity ? 2.6 : 1.8;
      targetCtx.beginPath();
      targetCtx.arc(sx, sy, dotR, 0, Math.PI * 2);
      targetCtx.fillStyle = t.placeText;
      targetCtx.fill();

      targetCtx.font = (isCity ? "700 13px " : "600 11px ") +
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
      targetCtx.textBaseline = "bottom";
      const ty = sy - dotR - 3;
      targetCtx.lineWidth = 3;
      targetCtx.strokeStyle = t.placeHalo;
      targetCtx.strokeText(p.name, sx, ty);
      targetCtx.fillStyle = t.placeText;
      targetCtx.fillText(p.name, sx, ty);
    }

    if (!opts.skipTideMarkers) {
      // NOAA tide stations — small diamond markers, clickable for today's tide predictions
      targetCtx.textBaseline = "middle";
      for (const s of TIDE_STATIONS) {
        const sx = s.px * k + transform.x;
        const sy = s.py * k + transform.y;
        if (sx < -20 || sx > w + 20 || sy < -20 || sy > h + 20) continue;
        const r = 4.5;
        targetCtx.beginPath();
        targetCtx.moveTo(sx, sy - r);
        targetCtx.lineTo(sx + r, sy);
        targetCtx.lineTo(sx, sy + r);
        targetCtx.lineTo(sx - r, sy);
        targetCtx.closePath();
        targetCtx.fillStyle = t.tideAccent;
        targetCtx.fill();
        targetCtx.lineWidth = 1.5;
        targetCtx.strokeStyle = t.placeHalo;
        targetCtx.stroke();
      }
    }
  }

  function draw() {
    renderMap(ctx, width, height, currentTransform, dpr);
  }

  const zoom = d3.zoom()
    .scaleExtent([1, 40])
    .on("zoom", (event) => {
      currentTransform = event.transform;
      draw();
    });

  d3.select(canvas).call(zoom);

  function hitTideStation(mx, my) {
    for (const s of TIDE_STATIONS) {
      if (s.px === undefined) continue;
      const sx = s.px * currentTransform.k + currentTransform.x;
      const sy = s.py * currentTransform.k + currentTransform.y;
      if (Math.hypot(mx - sx, my - sy) <= 10) return s;
    }
    return null;
  }

  d3.select(canvas)
    .on("mousemove", (event) => {
      const [mx, my] = d3.pointer(event);
      const tideHit = hitTideStation(mx, my);
      if (tideHit) {
        tooltip.style("display", "block").text(tideHit.name + " — click for today's tides");
        tooltip.style("left", (event.pageX + 14) + "px").style("top", (event.pageY + 10) + "px");
        canvas.style.cursor = "pointer";
        return;
      }
      if (!quadtree) return;
      const wx = (mx - currentTransform.x) / currentTransform.k;
      const wy = (my - currentTransform.y) / currentTransform.k;
      const found = quadtree.find(wx, wy, 6 / currentTransform.k);
      if (found) {
        tooltip.style("display", "block").text(found.name);
        tooltip.style("left", (event.pageX + 14) + "px").style("top", (event.pageY + 10) + "px");
        canvas.style.cursor = "pointer";
      } else {
        tooltip.style("display", "none");
        canvas.style.cursor = "default";
      }
    })
    .on("mouseleave", () => {
      tooltip.style("display", "none");
      canvas.style.cursor = "default";
    })
    .on("click", (event) => {
      const [mx, my] = d3.pointer(event);
      const tideHit = hitTideStation(mx, my);
      if (tideHit) {
        showTidePopup(tideHit, event.pageX, event.pageY);
      } else {
        hideTidePopup();
      }
    });

  const tidePopup = document.getElementById("tide-popup");

  function fmtTideTime(t) {
    const d = new Date(t.replace(" ", "T"));
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }

  function renderTidePopup(station) {
    const entry = tideCache.get(station.id);
    let body;
    if (!entry || entry.status === "loading") {
      body = `<div class="status">Loading tide predictions…</div>`;
    } else if (entry.status === "error") {
      body = `<div class="status">Couldn't load tide data right now.</div>`;
    } else {
      body = entry.predictions.map(p => `
        <div class="row">
          <span class="lbl">${p.type === "H" ? "High" : "Low"} — ${fmtTideTime(p.t)}</span>
          <span>${parseFloat(p.v).toFixed(1)} ft</span>
        </div>`).join("");
    }
    tidePopup.innerHTML = `
      <button class="close" title="Close" aria-label="Close">&times;</button>
      <div class="title">${station.name}</div>
      <div class="sub">Today's tide predictions (NOAA)</div>
      ${body}
    `;
    tidePopup.querySelector(".close").addEventListener("click", hideTidePopup);
  }

  function showTidePopup(station, pageX, pageY) {
    renderTidePopup(station);
    const left = Math.min(pageX + 14, window.innerWidth - 224);
    const top = Math.min(pageY + 10, window.innerHeight - 180);
    tidePopup.style.left = Math.max(8, left) + "px";
    tidePopup.style.top = Math.max(8, top) + "px";
    tidePopup.style.display = "block";

    const entry = tideCache.get(station.id);
    if (!entry || entry.status === "loading") {
      fetchStationTides(station.id).then(() => {
        if (tidePopup.style.display === "block") renderTidePopup(station);
      });
    }
  }

  function hideTidePopup() {
    tidePopup.style.display = "none";
  }

  function fetchStationTides(id) {
    if (tideCache.has(id) && tideCache.get(id).status !== "error") return Promise.resolve(tideCache.get(id));
    tideCache.set(id, { status: "loading" });
    const url = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=${id}&product=predictions&datum=MLLW&time_zone=lst_ldt&units=english&format=json&interval=hilo&date=today`;
    return fetch(url)
      .then(r => r.json())
      .then(data => {
        const entry = { status: "ok", predictions: data.predictions || [] };
        tideCache.set(id, entry);
        return entry;
      })
      .catch(() => {
        const entry = { status: "error" };
        tideCache.set(id, entry);
        return entry;
      });
  }

  function fetchAllTides() {
    TIDE_STATIONS.forEach(s => fetchStationTides(s.id));
  }

  function applyTheme() {
    document.documentElement.setAttribute("data-theme", theme);
    toggleBtn.textContent = THEMES[theme].icon;
    draw();
    renderLegend();
  }

  function renderLegend() {
    const t = THEMES[theme];
    const legend = d3.select("#legend");
    legend.html("");
    legend.append("div")
      .style("font-weight", "600")
      .style("margin-bottom", "6px")
      .text("Road class");
    [
      t.roadStyles.S1100,
      t.roadStyles.S1200,
      t.roadStyles.S1400,
      t.roadStyles.S1820
    ].forEach(style => {
      const row = legend.append("div").attr("class", "row");
      row.append("div")
        .attr("class", "swatch")
        .style("border-top", `${Math.max(style.width, 1.5)}px ${style.dash ? "dashed" : "solid"} ${style.color}`);
      row.append("div").attr("class", "label").text(style.label);
    });
  }

  function setupSearch(nameMap, path) {
    const allNames = Array.from(nameMap.keys()).sort((a, b) => a.localeCompare(b));

    const input = document.getElementById("search-input");
    const clearBtn = document.getElementById("search-clear");
    const results = document.getElementById("search-results");
    let matches = [];
    let activeIndex = -1;

    function highlightAndZoom(name) {
      const feats = nameMap.get(name);
      if (!feats || !feats.length) return;
      highlightPath2D = new Path2D(feats.map(f => path(f)).join(""));
      draw();

      const [[x0, y0], [x1, y1]] = path.bounds({ type: "FeatureCollection", features: feats });
      const pad = 90;
      const bw = Math.max(x1 - x0, 1);
      const bh = Math.max(y1 - y0, 1);
      let scale = Math.min((width - pad * 2) / bw, (height - pad * 2) / bh);
      scale = Math.max(1, Math.min(40, scale));
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      const transform = d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(scale)
        .translate(-cx, -cy);
      d3.select(canvas).transition().duration(600).call(zoom.transform, transform);
    }

    function clearHighlight() {
      if (!highlightPath2D) return;
      highlightPath2D = null;
      draw();
    }

    function renderResults() {
      results.innerHTML = "";
      if (!matches.length) {
        results.style.display = "none";
        return;
      }
      matches.forEach((name, i) => {
        const item = document.createElement("div");
        item.className = "search-result-item" + (i === activeIndex ? " active" : "");
        item.textContent = name;
        item.addEventListener("mousedown", (e) => {
          e.preventDefault();
          selectResult(name);
        });
        results.appendChild(item);
      });
      results.style.display = "block";
    }

    function selectResult(name) {
      input.value = name;
      matches = [];
      results.style.display = "none";
      clearBtn.style.display = "block";
      highlightAndZoom(name);
    }

    input.addEventListener("input", () => {
      const q = input.value.trim().toLowerCase();
      clearBtn.style.display = q ? "block" : "none";
      if (!q) {
        matches = [];
        renderResults();
        clearHighlight();
        return;
      }
      matches = allNames.filter(n => n.toLowerCase().includes(q)).slice(0, 8);
      activeIndex = matches.length ? 0 : -1;
      renderResults();
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        input.value = "";
        matches = [];
        renderResults();
        clearHighlight();
        clearBtn.style.display = "none";
        input.blur();
        return;
      }
      if (!matches.length) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        activeIndex = Math.min(activeIndex + 1, matches.length - 1);
        renderResults();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        activeIndex = Math.max(activeIndex - 1, 0);
        renderResults();
      } else if (e.key === "Enter") {
        e.preventDefault();
        selectResult(matches[activeIndex >= 0 ? activeIndex : 0]);
      }
    });

    clearBtn.addEventListener("click", () => {
      input.value = "";
      matches = [];
      renderResults();
      clearHighlight();
      clearBtn.style.display = "none";
      input.focus();
    });

    document.addEventListener("click", (e) => {
      if (!document.getElementById("search-box").contains(e.target)) {
        results.style.display = "none";
      }
      if (!document.getElementById("tide-popup").contains(e.target) && e.target !== canvas) {
        hideTidePopup();
      }
    });
  }

  toggleBtn.addEventListener("click", () => {
    theme = theme === "dark" ? "light" : "dark";
    localStorage.setItem("ri-map-theme", theme);
    applyTheme();
  });

  document.getElementById("zoom-in").addEventListener("click", () => {
    d3.select(canvas).transition().duration(200).call(zoom.scaleBy, 1.6);
  });
  document.getElementById("zoom-out").addEventListener("click", () => {
    d3.select(canvas).transition().duration(200).call(zoom.scaleBy, 1 / 1.6);
  });
  document.getElementById("zoom-reset").addEventListener("click", () => {
    d3.select(canvas).transition().duration(300).call(zoom.transform, d3.zoomIdentity);
  });

  function downloadCanvas(sourceCanvas, filename) {
    sourceCanvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = filename;
      link.href = url;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    }, "image/png");
  }

  // High-res export: renders the CURRENT view (whatever the user has panned/
  // zoomed to) into an off-screen canvas at a much larger pixel size, using
  // the same renderMap() the live view uses, then downloads it as a PNG.
  const MAX_EXPORT_PX = 14000; // stay safely under common browser canvas limits
  const EXPORT_PRESETS = [
    { label: "Wallpaper — 2560×1440", w: 2560 },
    { label: "Poster — 24×36 in @ 200 DPI", inches: 36, dpi: 200 },
    { label: "Wall print — 7 ft @ 150 DPI", inches: 84, dpi: 150 }
  ];

  function exportHighRes(targetW) {
    if (!dataReady) return;
    const scaleFactor = targetW / width;
    const targetH = Math.round(height * scaleFactor);
    const btn = document.getElementById("export-run");
    const originalLabel = btn ? btn.textContent : null;
    if (btn) { btn.textContent = "Rendering…"; btn.disabled = true; }

    setTimeout(() => {
      try {
        const off = document.createElement("canvas");
        off.width = targetW;
        off.height = targetH;
        const offCtx = off.getContext("2d");
        renderMap(offCtx, width, height, currentTransform, scaleFactor);
        downloadCanvas(off, `rhode-island-every-road-${theme}-${targetW}x${targetH}.png`);
      } catch (err) {
        console.error(err);
        alert("Export failed — try a smaller size.");
      } finally {
        if (btn) { btn.textContent = originalLabel; btn.disabled = false; }
      }
    }, 30);
  }

  function setupExportPanel() {
    const btn = document.getElementById("export-btn");
    const panel = document.getElementById("export-panel");
    const presetsEl = document.getElementById("export-presets");
    const widthInput = document.getElementById("export-width-in");
    const dpiInput = document.getElementById("export-dpi");
    const dimsOut = document.getElementById("export-dims");
    const runBtn = document.getElementById("export-run");

    EXPORT_PRESETS.forEach(preset => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "export-preset";
      b.textContent = preset.label;
      b.addEventListener("click", () => {
        panel.style.display = "none";
        const w = preset.w || Math.round(preset.inches * preset.dpi);
        exportHighRes(Math.min(w, MAX_EXPORT_PX));
      });
      presetsEl.appendChild(b);
    });

    function updateDims() {
      const inches = parseFloat(widthInput.value) || 0;
      const dpi = parseFloat(dpiInput.value) || 0;
      const w = Math.round(inches * dpi);
      const h = Math.round(w * (height / width));
      dimsOut.textContent = w > 0
        ? `${w.toLocaleString()} × ${h.toLocaleString()} px${w > MAX_EXPORT_PX ? " (will be capped)" : ""}`
        : "";
    }
    widthInput.addEventListener("input", updateDims);
    dpiInput.addEventListener("input", updateDims);
    updateDims();

    runBtn.addEventListener("click", () => {
      const inches = parseFloat(widthInput.value) || 0;
      const dpi = parseFloat(dpiInput.value) || 0;
      let w = Math.round(inches * dpi);
      if (!w || w < 100) return;
      w = Math.min(w, MAX_EXPORT_PX);
      panel.style.display = "none";
      exportHighRes(w);
    });

    btn.addEventListener("click", () => {
      panel.style.display = panel.style.display === "block" ? "none" : "block";
    });
    document.addEventListener("click", (e) => {
      if (!panel.contains(e.target) && e.target !== btn) panel.style.display = "none";
    });
  }
  setupExportPanel();

  resizeCanvas();

  Promise.all([
    fetch("data/ri-roads.topojson").then(r => r.json()),
    fetch("data/ri-outline.topojson").then(r => r.json())
  ]).then(([roadsTopo, outlineTopo]) => {
    const roadsObjectName = Object.keys(roadsTopo.objects)[0];
    const outlineObjectName = Object.keys(outlineTopo.objects)[0];

    const roadsGeo = topojson.feature(roadsTopo, roadsTopo.objects[roadsObjectName]);
    const outlineGeo = topojson.feature(outlineTopo, outlineTopo.objects[outlineObjectName]);
    // simplification can collapse very short stub segments to null geometry — drop those
    roadsGeo.features = roadsGeo.features.filter(f => f.geometry);

    const projection = d3.geoMercator().fitExtent(
      [[24, 24], [width - 24, height - 24]],
      outlineGeo
    );
    const path = d3.geoPath(projection);

    PLACES.forEach(p => {
      const pr = projection([p.lon, p.lat]);
      p.px = pr[0];
      p.py = pr[1];
    });
    TIDE_STATIONS.forEach(s => {
      const pr = projection([s.lon, s.lat]);
      s.px = pr[0];
      s.py = pr[1];
    });
    fetchAllTides();

    outlinePath2D = new Path2D(path(outlineGeo));

    // bucket roads by MTFCC so each class draws in a single stroke() call
    // instead of one call per road segment — this is what keeps pan/zoom smooth
    const byMtfcc = new Map();
    for (const f of roadsGeo.features) {
      const key = ORDER.includes(f.properties.MTFCC) ? f.properties.MTFCC : "OTHER";
      if (!byMtfcc.has(key)) byMtfcc.set(key, []);
      byMtfcc.get(key).push(f);
    }
    roadBuckets = [];
    if (byMtfcc.has("OTHER")) roadBuckets.push({ mtfcc: "OTHER", features: byMtfcc.get("OTHER") });
    ORDER.forEach(key => { if (byMtfcc.has(key)) roadBuckets.push({ mtfcc: key, features: byMtfcc.get(key) }); });
    roadBuckets.forEach(b => {
      b.path2d = new Path2D(b.features.map(f => path(f)).join(""));
    });

    // hover hit-testing index, sampled from projected road vertices
    const points = [];
    const nameMap = new Map();
    roadsGeo.features.forEach(f => {
      const name = f.properties.FULLNAME;
      if (!name) return;
      if (!nameMap.has(name)) nameMap.set(name, []);
      nameMap.get(name).push(f);
      for (const c of f.geometry.coordinates) {
        const p = projection(c);
        if (p) points.push({ x: p[0], y: p[1], name });
      }
    });
    quadtree = d3.quadtree().x(d => d.x).y(d => d.y).addAll(points);

    setupSearch(nameMap, path);

    dataReady = true;
    applyTheme();

    // total mapped length in miles, using geodesic length on the sphere
    const totalMeters = d3.sum(roadsGeo.features, d => d3.geoLength(d) * 6371008.8);
    const totalMiles = totalMeters / 1609.34;

    document.getElementById("stat-count").textContent = roadsGeo.features.length.toLocaleString();
    document.getElementById("stat-len").textContent = Math.round(totalMiles).toLocaleString();
    document.getElementById("hud").style.display = "block";
    document.getElementById("legend").style.display = "block";
    document.getElementById("search-box").style.display = "block";
    document.getElementById("export-btn").style.display = "flex";
    document.getElementById("loading").style.display = "none";
  }).catch(err => {
    document.getElementById("loading").textContent = "Failed to load road data: " + err.message;
    console.error(err);
  });

  window.addEventListener("resize", resizeCanvas);
})();
