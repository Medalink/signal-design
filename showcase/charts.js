import { init } from "../src/js/index.js";
import { createChart, formatValue } from "../src/js/charts/index.js";

init();

// Seeded noise so every load (and every test run) draws the same chart.
let seed = 42;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const noise = (amp) => (rand() - 0.5) * 2 * amp;

const now = Math.floor(Date.now() / 10_000) * 10_000;
const HOUR = 36e5;

/* ---- core: 1h of 10s points ------------------------------------------- */
function coreSeries() {
  const down = [];
  const up = [];
  const rtt = [];
  const jMin = [];
  const jMax = [];
  let d = 4200;
  let u = 1600;
  for (let t = now - HOUR; t <= now; t += 10_000) {
    const k = (t - (now - HOUR)) / HOUR;
    d += noise(220) + (4400 - d) * 0.05;
    u += noise(120) + (1700 - u) * 0.05;
    let dv = d + Math.sin(k * 9) * 600;
    if (k > 0.62 && k < 0.66) dv += 8200 * Math.sin(((k - 0.62) / 0.04) * Math.PI); // a burst
    const gap = k > 0.3 && k < 0.33; // the collector dropped out
    down.push({ x: t, y: gap ? null : Math.max(0, dv) });
    up.push({ x: t, y: gap ? null : Math.max(0, u + Math.cos(k * 7) * 300) });
    const base = 4.2 + Math.sin(k * 5) * 0.8 + (k > 0.62 && k < 0.66 ? 6 : 0);
    const r = base + noise(0.6);
    const j = 0.6 + rand() * 0.9;
    rtt.push({ x: t, y: +r.toFixed(2) });
    jMin.push({ x: t, y: +(r - j).toFixed(2) });
    jMax.push({ x: t, y: +(r + j).toFixed(2) });
  }
  return { down, up, rtt, jMin, jMax };
}

const c = coreSeries();
const core = createChart(document.querySelector("#core canvas"), {
  preset: "core",
  bucketSeconds: 10,
  live: 2,
  window: HOUR,
  envelope: 120,
  series: [
    { label: "Core ↓", data: c.down },
    { label: "Core ↑", data: c.up },
    { label: "Core → MDF RTT", unit: " ms", data: c.rtt, min: c.jMin, max: c.jMax },
  ],
  thresholds: [{ label: "Warning 9 Gbps", value: 9000, level: "warning" }],
  ranges: [
    { from: now - 0.9 * HOUR, to: now - 0.8 * HOUR, kind: "maintenance", label: "Maintenance · switch firmware" },
    { from: now - 0.7 * HOUR, to: now - 0.67 * HOUR, kind: "missing", label: "No data" },
  ],
  events: [
    { x: now - 0.36 * HOUR, y: c.down[Math.round(0.64 * 360)]?.y ?? 8000, kind: "surge", label: "unexpected", unexpected: true },
    { x: now - 0.12 * HOUR, y: 2600, kind: "drop", label: "expected" },
  ],
});

// A live feed: a new point every 2 seconds, paused with the button.
let paused = false;
let t = now;
let d = c.down.at(-1).y;
let u = c.up.at(-1).y;
let r = c.rtt.at(-1).y;
setInterval(() => {
  if (paused || document.hidden) return;
  t += 10_000;
  d = Math.max(0, d + noise(300) + (4400 - d) * 0.08);
  u = Math.max(0, u + noise(150) + (1700 - u) * 0.08);
  r = Math.max(1, r + noise(0.5) + (4.5 - r) * 0.1);
  const j = 0.6 + rand() * 0.9;
  core.append({
    "Core ↓": [{ x: t, y: d }],
    "Core ↑": [{ x: t, y: u }],
    "Core → MDF RTT": [{ x: t, y: +r.toFixed(2), min: +(r - j).toFixed(2), max: +(r + j).toFixed(2) }],
  });
}, 2000);
document.querySelector("[data-pause]").addEventListener("click", (e) => {
  paused = !paused;
  e.currentTarget.setAttribute("aria-pressed", String(paused));
  e.currentTarget.textContent = paused ? "Resume feed" : "Pause feed";
  const status = document.querySelector("[data-live]");
  status.dataset.tone = paused ? "pending" : "success";
  status.textContent = paused ? "paused" : "live · 2s";
});

/* ---- bandwidth: 7 days of 5-minute rollups ---------------------------- */
const week = [];
const ghost = [];
const peaks = [];
const DAY = 24 * HOUR;
for (let x = now - 7 * DAY; x <= now; x += 5 * 60_000) {
  const h = new Date(x).getHours() + new Date(x).getMinutes() / 60;
  const workday = new Date(x).getDay() % 6 !== 0;
  const daily = Math.max(0, Math.sin(((h - 6) / 24) * Math.PI * 2)) * (workday ? 1 : 0.35);
  week.push({ x, y: 300 + daily * 2600 + noise(160) });
  ghost.push({ x, y: 280 + daily * 2300 + noise(80) });
}
for (let day = 0; day < 7; day++) {
  const slice = week.filter((p) => p.x >= now - (7 - day) * DAY && p.x < now - (6 - day) * DAY);
  const top = slice.reduce((a, b) => (b.y > a.y ? b : a), slice[0]);
  if (top) peaks.push(top);
}
createChart(document.querySelector("#bandwidth canvas"), {
  preset: "bandwidth",
  bucketSeconds: 300,
  tension: 0.35,
  smoothing: { window: 7 },
  rhythm: { hours: [7.5, 15.5] },
  series: [
    { label: "Internet ↓", data: week },
    { label: "Last week ↓", data: ghost, ghost: true, kind: "ghost" },
  ],
  peaks,
});

/* ---- latency: 8 hours of 60s points, with a forecast ------------------- */
const lat = [];
const lMin = [];
const lMax = [];
for (let x = now - 8 * HOUR; x <= now + HOUR; x += 60_000) {
  const k = (x - (now - 8 * HOUR)) / (9 * HOUR);
  const v = 18 + Math.sin(k * 12) * 6 + (k > 0.55 && k < 0.6 ? 28 : 0) + noise(2.5);
  const j = 1 + rand() * 3;
  lat.push({ x, y: +v.toFixed(2) });
  lMin.push({ x, y: +(v - j).toFixed(2) });
  lMax.push({ x, y: +(v + j).toFixed(2) });
}
createChart(document.querySelector("#latency canvas"), {
  preset: "latency",
  bucketSeconds: 60,
  series: [{ label: "Branch → core RTT", unit: " ms", data: lat, min: lMin, max: lMax }],
  thresholds: [
    { label: "Warning 40 ms", value: 40, level: "warning", unit: " ms" },
    { label: "Critical 60 ms", value: 60, level: "critical", unit: " ms" },
  ],
  forecastFrom: now,
});

/* ---- sd-plot: the app draws the SVG, the CSS styles it ----------------- */
const SVG = "http://www.w3.org/2000/svg";
function drawPlot(el, points, { grid = true } = {}) {
  const w = 600;
  const h = 100;
  const ys = points.map((p) => p.y).filter(Number.isFinite);
  const lo = Math.min(...ys);
  const hi = Math.max(...ys);
  const x0 = points[0].x;
  const span = points.at(-1).x - x0 || 1;
  const xy = (p) => [((p.x - x0) / span) * w, h - 4 - ((p.y - lo) / (hi - lo || 1)) * (h - 8)];
  const line = points.filter((p) => p.y != null).map((p) => xy(p).map((n) => n.toFixed(1)).join(",")).join(" ");
  el.querySelector("svg")?.remove();
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  svg.setAttribute("preserveAspectRatio", "none");
  svg.setAttribute("aria-hidden", "true");
  svg.innerHTML = `${grid ? `<path class="grid" d="M0 25H${w}M0 50H${w}M0 75H${w}"/>` : ""}<polygon class="area" points="0,${h} ${line} ${w},${h}"/><polyline class="line" points="${line}"/>`;
  el.prepend(svg);
  return { xy, w, h };
}

const recent = (key) => c[key].slice(-60);
const big = document.querySelector("#plot-down");
const geom = drawPlot(big, recent("down"));
const readout = document.createElement("span");
readout.className = "sd-plot-readout";
readout.hidden = true;
big.append(readout);
big.addEventListener("pointermove", (e) => {
  const r = big.getBoundingClientRect();
  const pts = recent("down").filter((p) => p.y != null);
  const t = (e.clientX - r.left) / r.width;
  const p = pts[Math.min(pts.length - 1, Math.max(0, Math.round(t * (pts.length - 1))))];
  const [, y] = geom.xy(p);
  let cross = big.querySelector(".cross");
  if (!cross) {
    cross = document.createElementNS(SVG, "path");
    cross.setAttribute("class", "cross");
    big.querySelector("svg").append(cross);
  }
  const x = geom.xy(p)[0];
  cross.setAttribute("d", `M${x} 0V${geom.h}`);
  readout.hidden = false;
  readout.innerHTML = `${new Date(p.x).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}<b>${formatValue(p.y, "Mbps")}</b>`;
  readout.style.left = `${Math.min(r.width - 150, Math.max(0, e.clientX - r.left + 12))}px`;
  readout.style.top = `${Math.max(0, (y / geom.h) * r.height - 30)}px`;
});
big.addEventListener("pointerleave", () => {
  readout.hidden = true;
  big.querySelector(".cross")?.remove();
});
for (const row of document.querySelectorAll("#sparks > div")) {
  const key = row.querySelector("[data-from]").dataset.from;
  const pts = recent(key);
  drawPlot(row.querySelector("[data-from]"), pts, { grid: false });
  row.querySelector("[data-last]").textContent = formatValue(pts.at(-1).y, key === "rtt" ? " ms" : "Mbps");
}

/* ---- theme switch for every chart -------------------------------------- */
const themeSeg = document.querySelector("#chart-theme");
let chartTheme = "mono";
try {
  chartTheme = localStorage.getItem("sd-chart-theme") || "mono";
} catch {}
function applyChartTheme(name) {
  chartTheme = name;
  for (const fig of document.querySelectorAll(".sd-chart, .sd-plot")) fig.dataset.chartTheme = name;
  for (const b of themeSeg.querySelectorAll("button")) b.setAttribute("aria-pressed", String(b.dataset.value === name));
  try {
    localStorage.setItem("sd-chart-theme", name);
  } catch {}
  document.dispatchEvent(new CustomEvent("sd:theme", { detail: { theme: document.documentElement.dataset.theme } }));
}
themeSeg.addEventListener("click", (e) => {
  const b = e.target.closest("button[data-value]");
  if (b) applyChartTheme(b.dataset.value);
});
applyChartTheme(chartTheme);

/* ---- formatter table --------------------------------------------------- */
const rows = [[1500, "Mbps"], [250000, "Mbps"], [0.5, "Mbps"], [1.2e6, "Mbps"], [12.3, " ms"]];
document.querySelector("#formats").innerHTML = rows
  .map(([v, unit]) => `<tr><td><code>formatValue(${v}, "${unit}")</code></td><td><code>${formatValue(v, unit)}</code></td></tr>`)
  .join("");
