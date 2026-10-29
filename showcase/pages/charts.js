import { mountLibrary } from "../library.js";
import { lazyChart } from "../lazy.js";

mountLibrary();
// After mountLibrary(), which snapshots each block's markup before these scripts fill it.
await import("./charts-gallery.js");

let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const noise = (a) => (rand() - 0.5) * 2 * a;
const now = Math.floor(Date.now() / 10_000) * 10_000;
const down = [];
const up = [];
const rtt = [];
const jLo = [];
const jHi = [];
let d = 4200;
let u = 1600;
for (let x = now - 30 * 60_000; x <= now; x += 10_000) {
  const k = (x - now) / 1_800_000 + 1;
  d += noise(220) + (4400 - d) * 0.06;
  u += noise(110) + (1700 - u) * 0.06;
  down.push({ x, y: Math.max(0, d + Math.sin(k * 8) * 500 + (k > 0.6 && k < 0.64 ? 3800 : 0)) });
  up.push({ x, y: Math.max(0, u) });
  const r = 4.2 + Math.sin(k * 6) * 0.7 + noise(0.5);
  const j = 0.5 + rand();
  rtt.push({ x, y: +r.toFixed(2) });
  jLo.push({ x, y: +(r - j).toFixed(2) });
  jHi.push({ x, y: +(r + j).toFixed(2) });
}
let core = null;
lazyChart(document.querySelector("#demo-core canvas"), {
  preset: "core",
  bucketSeconds: 10,
  live: 2,
  window: 30 * 60_000,
  envelope: 60,
  series: [
    { label: "Core ↓", data: down },
    { label: "Core ↑", data: up },
    { label: "Core → MDF RTT", unit: " ms", data: rtt, min: jLo, max: jHi },
  ],
}, (c) => (core = c));
let tick = now;
setInterval(() => {
  if (document.hidden) return;
  tick += 10_000;
  d = Math.max(0, d + noise(300) + (4400 - d) * 0.08);
  u = Math.max(0, u + noise(150) + (1700 - u) * 0.08);
  const r = 4.2 + noise(0.6);
  core?.append({
    "Core ↓": [{ x: tick, y: d }],
    "Core ↑": [{ x: tick, y: u }],
    "Core → MDF RTT": [{ x: tick, y: +r.toFixed(2), min: +(r - 0.8).toFixed(2), max: +(r + 0.8).toFixed(2) }],
  });
}, 2000);

const week = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
lazyChart(document.querySelector("#demo-line canvas"), {
  type: "line",
  labels: week,
  unit: " ms",
  series: [
    { label: "p50", data: [82, 80, 91, 88, 79, 70, 68] },
    { label: "p95", data: [190, 210, 262, 231, 200, 160, 150] },
    { label: "p99", data: [280, 300, 410, 330, 290, 220, 210] },
  ],
  markers: [{ axis: "y", value: 300, label: "SLO", tone: "warning" }],
});
lazyChart(document.querySelector("#demo-bar canvas"), {
  type: "bar",
  stacked: true,
  labels: week,
  series: [
    { label: "4xx", data: [41, 52, 66, 48, 59, 22, 18] },
    { label: "5xx", data: [6, 4, 31, 7, 5, 2, 1], tone: "critical" },
    { label: "timeout", data: [3, 6, 2, 8, 4, 1, 0] },
  ],
});
lazyChart(document.querySelector("#demo-hbar canvas"), {
  type: "hbar",
  labels: ["/api/search", "/api/export", "/api/reports", "/api/items", "/health"],
  unit: " ms",
  series: [{ label: "p95", data: [412, 388, 261, 174, 12] }],
});
const buckets = Array.from({ length: 18 }, (_, i) => (i + 1) * 25);
lazyChart(document.querySelector("#demo-hist canvas"), {
  type: "histogram",
  labels: buckets.map(String),
  series: [{ label: "requests", data: buckets.map((b) => Math.round(700 * Math.exp(-((b - 150) ** 2) / 5000) + rand() * 30)) }],
  markers: [{ value: 5, label: "p50" }, { value: 10, label: "p95", tone: "warning" }],
});

document.getElementById("demo-heat").innerHTML = Array.from({ length: 7 * 24 }, (_, i) => {
  const h = i % 24;
  const v = h >= 9 && h <= 17 && Math.floor(i / 24) < 5 ? 0.35 + rand() * 0.65 : rand() * 0.2;
  return `<i style="--v: ${v.toFixed(2)}"></i>`;
}).join("");
document.getElementById("demo-waffle").innerHTML =
  '<i data-s="1"></i>'.repeat(42) + '<i data-s="2"></i>'.repeat(31) + '<i data-s="3"></i>'.repeat(19) + "<i></i>".repeat(8);
document.getElementById("demo-uptime").innerHTML = Array.from({ length: 60 }, (_, i) => `<i data-state="${i === 38 ? "down" : i === 37 ? "degraded" : "ok"}"></i>`).join("");
