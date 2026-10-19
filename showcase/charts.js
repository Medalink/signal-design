import { init } from "../src/js/index.js";
import { createChart, formatValue } from "../src/js/charts/index.js";
import { lazyChart } from "./lazy.js";

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
lazyChart(document.querySelector("#bandwidth canvas"), {
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
lazyChart(document.querySelector("#latency canvas"), {
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

/* ---- gallery: generic types on the same tokens --------------------------- */
const canvasOf = (id) => document.querySelector(`#${id} canvas`);
const hours = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, "0")}:00`);
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const wave = (h, peak = 14) => Math.max(0, Math.sin(((h - 6) / 24) * Math.PI * 2));

lazyChart(canvasOf("g-percentiles"), {
  type: "line",
  labels: hours,
  unit: " ms",
  series: [
    { label: "p50", data: hours.map((_, h) => Math.round(80 + wave(h) * 40 + noise(6))) },
    { label: "p95", data: hours.map((_, h) => Math.round(180 + wave(h) * 110 + noise(14))) },
    { label: "p99", data: hours.map((_, h) => Math.round(260 + wave(h) * 190 + (h === 15 ? 140 : 0) + noise(20))) },
  ],
  markers: [{ axis: "y", value: 300, label: "SLO 300 ms", tone: "warning" }],
});

lazyChart(canvasOf("g-region"), {
  type: "area",
  stacked: true,
  labels: hours,
  unit: "Mbps",
  series: ["US East", "US West", "Europe", "Asia"].map((label, i) => ({
    label,
    data: hours.map((_, h) => Math.round((900 - i * 170) * (0.35 + wave((h + i * 5) % 24) * 0.9) + noise(40))),
  })),
});

lazyChart(canvasOf("g-services"), {
  type: "bar",
  labels: days,
  unit: "",
  series: ["api", "web", "worker"].map((label, i) => ({
    label,
    data: days.map((_, d) => Math.round((5200 - i * 1400) * (d > 4 ? 0.45 : 1) + noise(500))),
  })),
});

lazyChart(canvasOf("g-errors"), {
  type: "bar",
  stacked: true,
  labels: hours.slice(8, 20),
  series: [
    { label: "4xx", data: hours.slice(8, 20).map(() => Math.round(40 + rand() * 30)) },
    { label: "5xx", data: hours.slice(8, 20).map((_, i) => Math.round(4 + rand() * 6 + (i === 6 ? 38 : 0))), tone: "critical" },
    { label: "timeout", data: hours.slice(8, 20).map(() => Math.round(rand() * 8)) },
  ],
});

const endpoints = [["/api/search", 412], ["/api/export", 388], ["/api/reports", 261], ["/api/items", 174], ["/api/upload", 158], ["/api/users", 96], ["/api/auth", 71], ["/health", 12]];
lazyChart(canvasOf("g-endpoints"), {
  type: "hbar",
  labels: endpoints.map((e) => e[0]),
  unit: " ms",
  series: [{ label: "p95", data: endpoints.map((e) => e[1]) }],
});

const buckets = Array.from({ length: 24 }, (_, i) => (i + 1) * 20);
const hist = buckets.map((b) => Math.round(900 * Math.exp(-((b - 140) ** 2) / (2 * 60 ** 2)) + 40 * Math.exp(-((b - 420) ** 2) / 800) + rand() * 25));
lazyChart(canvasOf("g-histogram"), {
  type: "histogram",
  labels: buckets.map((b) => `${b}`),
  series: [{ label: "requests", data: hist }],
  markers: [
    { value: 6, label: "p50 140 ms" },
    { value: 13, label: "p95 280 ms", tone: "warning" },
    { value: 20, label: "p99 420 ms", tone: "critical" },
  ],
});

const pts = Array.from({ length: 160 }, () => {
  const kb = 2 ** (rand() * 10);
  return { x: Math.round(kb), y: Math.max(12, Math.round(40 + kb * 0.35 + noise(60) + (rand() < 0.06 ? 400 : 0))) };
});
lazyChart(canvasOf("g-scatter"), {
  type: "scatter",
  unit: " ms",
  xUnit: " KB",
  series: [
    { label: "ok", data: pts.filter((p) => p.y < 300) },
    { label: "slow", data: pts.filter((p) => p.y >= 300), tone: "critical", size: 4 },
  ],
  markers: [{ axis: "y", value: 300, label: "300 ms", tone: "warning" }, { value: 512, label: "512 KB" }],
});

let depth = 20;
lazyChart(canvasOf("g-queue"), {
  type: "step",
  labels: Array.from({ length: 48 }, (_, i) => `${String(Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`),
  series: [{ label: "jobs waiting", data: Array.from({ length: 48 }, (_, i) => (depth = Math.max(0, depth + Math.round(noise(9)) + (i === 30 ? 60 : 0) - (i > 31 && i < 36 ? 14 : 0)))) }],
});

// Heatmap: deploys by weekday and hour.
document.querySelector("[data-heat-rows]").innerHTML = days.map((d) => `<span>${d}</span>`).join("");
document.querySelector("[data-heat]").innerHTML = days
  .flatMap((d, di) => hours.map((h, hi) => {
    const work = di < 5 && hi >= 9 && hi <= 17;
    const v = Math.min(1, (work ? 0.35 + rand() * 0.65 : rand() * 0.22) * (hi === 16 && di === 4 ? 0.1 : 1));
    return `<i style="--v: ${v.toFixed(2)}" title="${d} ${h} · ${Math.round(v * 24)} deploys"></i>`;
  }))
  .join("");

// Waffle: share of traffic in 100 squares.
const share = [["API", 42], ["Web", 27], ["Mobile", 18], ["Partners", 9]];
let cells = "";
share.forEach(([, n], i) => (cells += `<i data-s="${i + 1}"></i>`.repeat(n)));
cells += "<i></i>".repeat(100 - share.reduce((a, [, n]) => a + n, 0));
document.querySelector("[data-waffle]").innerHTML = cells;
document.querySelector("[data-waffle-key]").innerHTML =
  share.map(([l, n], i) => `<li><i data-s="${i + 1}"></i>${l}<b>${n}%</b></li>`).join("") + `<li><i style="border:1px solid var(--sd-line)"></i>Other<b>4%</b></li>`;

// Uptime: 90 days per service.
const services = [["api", [61, 62]], ["web", []], ["worker", [12, 40, 41]], ["search", [77]]];
document.querySelector("[data-uptime]").innerHTML = services
  .map(([name, bad]) => {
    const sq = Array.from({ length: 90 }, (_, d) => {
      const state = d < 3 && name === "search" ? "none" : bad.includes(d) ? (d % 2 ? "down" : "degraded") : "ok";
      return `<i data-state="${state}" title="${name} · day ${d + 1} · ${state}"></i>`;
    }).join("");
    const pct = (100 - bad.length * 0.21).toFixed(2);
    return `<div class="grid gap-2"><div class="flex justify-between text-sm"><span>${name}</span><span class="sd-subtle">${pct}%</span></div><div class="sd-uptime">${sq}</div></div>`;
  })
  .join("");

/* ---- theme switch for every chart -------------------------------------- */
const themeSeg = document.querySelector("#chart-theme");
let chartTheme = "mono";
try {
  chartTheme = localStorage.getItem("sd-chart-theme") || "mono";
} catch {}
function applyChartTheme(name) {
  chartTheme = name;
  for (const fig of document.querySelectorAll(".sd-chart, .sd-plot, .sd-heatmap, .sd-waffle, .sd-uptime, .sd-meter")) fig.dataset.chartTheme = name;
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
