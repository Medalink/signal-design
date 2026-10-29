import { mountBar, savedScrollbars } from "./viewport.js";
import { init } from "../src/js/index.js";
import { icon } from "../src/js/icons.js";
import { createChart } from "../src/js/charts/index.js";

mountBar();
init({ scrollbars: savedScrollbars() });

for (const el of document.querySelectorAll("[data-icon]")) el.insertAdjacentHTML("afterbegin", icon(el.dataset.icon));

const $ = (id) => document.getElementById(id);

/* ---- Simulated history: the same numbers every time for one range ----------- */

const MIN = 60_000;
const HOUR = 60 * MIN;
const RANGES = {
  "1h": { hours: 1, bucket: MIN, every: "1 min", seed: 11 },
  "24h": { hours: 24, bucket: 5 * MIN, every: "5 min", seed: 24 },
  "7d": { hours: 168, bucket: 30 * MIN, every: "30 min", seed: 7 },
  "30d": { hours: 720, bucket: 2 * HOUR, every: "2 h", seed: 30 },
};
// Where total memory climbs past the limit, as a share of the range, its width and how far it climbs (GiB).
const SURGES = {
  "1h": [],
  "24h": [[0.62, 0.05, 1.4]],
  "7d": [[0.31, 0.02, 1.1], [0.8, 0.016, 1.5]],
  "30d": [[0.2, 0.01, 1], [0.55, 0.008, 1.2], [0.9, 0.012, 2]],
};
const LIMIT = 3; // GiB, the combined limit of the containers that have one
const WSL = { cpus: 32, memory: 45.9 };
const WINDOWS = { cpus: 64, memory: 127.9 };
const GiB = 1024 ** 3;
const MiB = 1024 ** 2;

// Averages are shares of WSL's processors and GiB; traffic is MiB per hour; restarts and downtime are per week.
const CONTAINERS = [
  { name: "checkout-api", group: "acme-shop", cpu: 1.4, mem: 0.46, limit: 0.75, net: [310, 520], disk: [40, 90], restarts: 0, down: 0 },
  { name: "worker", group: "acme-shop", cpu: 2.1, mem: 0.38, limit: 0.5, net: [120, 90], disk: [210, 260], restarts: 3, down: 0.004 },
  { name: "storefront", group: "acme-shop", cpu: 0.5, mem: 0.31, limit: 0.5, net: [880, 1400], disk: [12, 30], restarts: 1, down: 0.001 },
  { name: "postgres", group: "acme-shop", cpu: 0.9, mem: 0.62, limit: 1, net: [260, 410], disk: [900, 1300], restarts: 0, down: 0 },
  { name: "redis", group: "acme-shop", cpu: 0.1, mem: 0.12, limit: 0.25, net: [190, 210], disk: [2, 18], restarts: 0, down: 0 },
  { name: "mailer", group: "acme-shop", cpu: 0.1, mem: 0.15, limit: null, net: [20, 60], disk: [1, 4], restarts: 2, down: 0.126 },
  { name: "blog-web", group: "blog", cpu: 0.2, mem: 0.21, limit: null, net: [240, 610], disk: [6, 9], restarts: 0, down: 0 },
  { name: "blog-db", group: "blog", cpu: 0.2, mem: 0.33, limit: null, net: [30, 45], disk: [160, 210], restarts: 0, down: 0 },
];
// Containers whose busiest minute went past their own memory limit, per range.
const OVER = { "1h": [], "24h": ["worker"], "7d": ["worker"], "30d": ["worker", "redis"] };

/** A small seeded generator, so a range always draws the same history. */
function rng(seed) {
  let a = seed * 2654435761;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function simulate(key) {
  const { hours, bucket, seed } = RANGES[key];
  const rnd = rng(seed);
  const count = (hours * HOUR) / bucket;
  const end = Math.floor(Date.now() / bucket) * bucket;
  // Busy minutes average out over wide buckets, so long ranges get a few lower peaks.
  const spikes = Array.from({ length: { 1: 2, 24: 4, 168: 9, 720: 14 }[hours] }, () => [rnd(), 0.4 + rnd() * 0.8, (8 + rnd() * 16) * { 1: 1, 24: 1, 168: 0.8, 720: 0.55 }[hours]]);
  const cpu = [];
  const memory = [];
  for (let i = 0; i < count; i++) {
    const at = end - (count - 1 - i) * bucket;
    const frac = i / (count - 1);
    const date = new Date(at);
    const day = Math.max(0, Math.sin(((date.getHours() + date.getMinutes() / 60 - 7) / 24) * Math.PI * 2));
    let c = 3.2 + 4 * day + rnd() * 1.4;
    for (const [at0, width, height] of spikes) c += height * Math.exp(-0.5 * (((frac - at0) * count) / (width * Math.max(1, count / 160))) ** 2);
    let m = key === "1h" ? 2.3 + 0.38 * frac + rnd() * 0.06 : 2.4 + 0.2 * day + rnd() * 0.08;
    for (const [at0, width, height] of SURGES[key]) m += height * Math.exp(-0.5 * ((frac - at0) / (width / 2)) ** 2);
    // The monitor was closed for a while: a gap, not a zero.
    const gap = key === "7d" && frac > 0.45 && frac < 0.48;
    cpu.push({ x: at, y: gap ? null : +Math.min(c, 100).toFixed(2) });
    memory.push({ x: at, y: gap ? null : +m.toFixed(3) });
  }

  const rows = CONTAINERS.map((c) => {
    const avg = c.cpu * (0.9 + rnd() * 0.2);
    const p95 = avg * (2 + rnd() * 1.2);
    const memAvg = c.mem * (0.92 + rnd() * 0.16);
    const memMax = c.limit
      ? OVER[key].includes(c.name) ? c.limit * (1.16 + rnd() * 0.2) : Math.min(memAvg * (1.1 + rnd() * 0.4), c.limit * 0.9)
      : memAvg * (1.1 + rnd() * 0.4);
    const down = hours >= 24 ? c.down : 0;
    return {
      name: c.name,
      group: c.group,
      cpuAvg: avg,
      cpuP95: p95,
      cpuMax: Math.min(100, p95 * (1.3 + rnd() * 0.9)),
      memAvg: memAvg * GiB,
      memMax: memMax * GiB,
      limit: c.limit ? c.limit * GiB : 0,
      netIn: c.net[0] * hours * (0.9 + rnd() * 0.2) * MiB,
      netOut: c.net[1] * hours * (0.9 + rnd() * 0.2) * MiB,
      diskRead: c.disk[0] * hours * (0.9 + rnd() * 0.2) * MiB,
      diskWrite: c.disk[1] * hours * (0.9 + rnd() * 0.2) * MiB,
      uptime: 100 * (1 - down * (0.9 + rnd() * 0.2)),
      restarts: hours >= 24 ? Math.round((c.restarts * hours) / 168 + (c.restarts ? rnd() * 0.8 : 0)) : 0,
    };
  });

  const events = Object.entries({ start: 0.55, stop: 0.42, restart: 0.12, create: 0.09, remove: 0.06 })
    .map(([kind, rate]) => [kind, Math.max(kind === "start" ? 1 : 0, Math.round(rate * hours * (0.8 + rnd() * 0.4)))])
    .sort((a, b) => b[1] - a[1]);
  return { key, bucket, cpu, memory, rows, events };
}

/* ---- Words and numbers ---------------------------------------------------- */

const count = (n) => n.toLocaleString("en-US");
const percent = (v) => `${v.toFixed(v >= 10 ? 0 : 1)}%`;
const pad = (n) => String(n).padStart(2, "0");
function bytes(n) {
  if (!n) return "0 B";
  const units = ["B", "KiB", "MiB", "GiB", "TiB"];
  const power = Math.min(units.length - 1, Math.floor(Math.log(n) / Math.log(1024)));
  const scaled = n / 1024 ** power;
  return `${scaled.toFixed(power === 0 || scaled >= 100 ? 0 : 1)} ${units[power]}`;
}
const gib = (v) => `${v.toFixed(1)} GiB`;
/** Two sizes in the unit of the larger one: "0.7 / 1.2 GiB". */
function pair(a, b) {
  const units = ["B", "KiB", "MiB", "GiB", "TiB"];
  const power = Math.min(units.length - 1, Math.floor(Math.log(Math.max(a, b, 1)) / Math.log(1024)));
  const part = (n) => {
    const scaled = n / 1024 ** power;
    return scaled.toFixed(power === 0 || scaled >= 100 ? 0 : 1);
  };
  return `${part(a)} / ${part(b)} ${units[power]}`;
}
const duration = (ms) => {
  const m = Math.round(ms / MIN);
  return m < 60 ? `${m} min` : m % 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m / 60} h`;
};
const moment = (at, key) => {
  const d = new Date(at);
  const clock = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return key === "1h" || key === "24h" ? clock : `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${clock}`;
};
const rangeWords = { "1h": "the last hour", "24h": "the last 24 hours", "7d": "the last 7 days", "30d": "the last 30 days" };

/* ---- The screen ------------------------------------------------------------- */

let key = "24h";
let sort = { key: "cpuAvg", dir: -1 };
let data = null;

const COLUMNS = [
  { key: "name", label: "Container", text: true },
  { key: "cpuAvg", label: "CPU avg", format: percent },
  { key: "cpuP95", label: "CPU p95", format: percent },
  { key: "cpuMax", label: "CPU max", format: percent },
  { key: "memMax", label: "Memory max/limit", format: (v, r) => (r.limit ? pair(v, r.limit) : `${bytes(v)} / —`), over: (r) => r.limit && r.memMax > r.limit },
  { key: "netIn", label: "Net in/out", format: (v, r) => pair(v, r.netOut) },
  { key: "diskRead", label: "Disk read/write", format: (v, r) => pair(v, r.diskWrite) },
  { key: "uptime", label: "Uptime", format: percent },
  { key: "restarts", label: "Restarts", format: count },
];

const table = $("table");

function drawHead() {
  table.innerHTML = `<thead><tr>${COLUMNS.map((c) => `<th data-sort="${c.key}" tabindex="0"${c.text ? "" : " data-num"}>${c.label}</th>`).join("")}</tr></thead><tbody></tbody>`;
  sortRows();
}

function sortRows() {
  const column = COLUMNS.find((c) => c.key === sort.key);
  const rows = [...data.rows].sort((a, b) => (column.text ? a.name.localeCompare(b.name) : a[sort.key] - b[sort.key]) * sort.dir);
  for (const th of table.tHead.rows[0].cells) {
    if (th.dataset.sort === sort.key) th.setAttribute("aria-sort", sort.dir > 0 ? "ascending" : "descending");
    else th.removeAttribute("aria-sort");
  }
  table.tBodies[0].innerHTML = rows
    .map(
      (r) =>
        `<tr>${COLUMNS.map((c) => {
          if (c.text) return `<td>${r.name}<span class="sd-subtle block text-sm">${r.group}</span></td>`;
          const text = c.format(r[c.key], r);
          return c.over?.(r) ? `<td class="sd-num whitespace-nowrap text-danger">${text}<span class="sd-sr-only"> over the limit</span></td>` : `<td class="sd-num whitespace-nowrap">${text}</td>`;
        }).join("")}</tr>`,
    )
    .join("");
}

function pick(th) {
  const next = th.dataset.sort;
  const column = COLUMNS.find((c) => c.key === next);
  sort = sort.key === next ? { key: next, dir: -sort.dir } : { key: next, dir: column.text ? 1 : -1 };
  sortRows();
}
table.addEventListener("click", (e) => {
  const th = e.target.closest("th[data-sort]");
  if (th) pick(th);
});
table.addEventListener("keydown", (e) => {
  const th = e.target.closest("th[data-sort]");
  if (th && (e.key === "Enter" || e.key === " ")) {
    e.preventDefault();
    pick(th);
  }
});

function stats(points) {
  const ys = points.filter((p) => p.y != null);
  const peak = ys.reduce((best, p) => (p.y > best.y ? p : best), ys[0]);
  return { peak, avg: ys.reduce((sum, p) => sum + p.y, 0) / ys.length, latest: ys.at(-1).y };
}

const nice = (v, step) => Math.ceil(v / step) * step;

/** Write a chart's facts under it, one span each; a fact with a tone is colored. */
function summarize(id, facts) {
  const line = document.querySelector(`#${id} [data-summary]`);
  line.replaceChildren(
    ...facts.map(({ text, tone }) => {
      const span = document.createElement("span");
      span.textContent = text;
      if (tone) span.className = `text-${tone}`;
      return span;
    }),
  );
}

/** Draw one chart again for the range; the canvas is reused. */
function plot(id, options, name, facts) {
  const canvas = document.querySelector(`#${id} canvas`);
  canvas.sdChart?.destroy();
  createChart(canvas, { type: "area", legend: options.series.length > 1, ...options });
  canvas.setAttribute("aria-label", `${name} over ${rangeWords[key]}. ${facts.map((f) => f.text).join(". ")}.`);
}

function render() {
  data = simulate(key);
  const { cpu, memory, bucket, events } = data;
  const c = stats(cpu);
  const m = stats(memory);
  const at = (p) => moment(p.x, key);
  const over = memory.filter((p) => p.y != null && p.y > LIMIT);
  const overBy = m.peak.y - LIMIT;

  $("peak-cpu").textContent = percent(c.peak.y);
  $("peak-cpu-note").textContent = `of WSL at ${at(c.peak)}`;
  $("peak-memory").textContent = gib(m.peak.y);
  $("peak-memory-box").toggleAttribute("data-tone", overBy > 0);
  if (overBy > 0) $("peak-memory-box").dataset.tone = "danger";
  $("peak-memory-note").textContent = overBy > 0 ? `${gib(overBy)} over the ${LIMIT} GiB limit at ${at(m.peak)}` : `${percent((m.peak.y / WSL.memory) * 100)} of WSL at ${at(m.peak)}`;
  $("running").textContent = (data.rows.reduce((sum, r) => sum + r.uptime, 0) / 100).toFixed(1);
  $("events").textContent = count(events.reduce((sum, [, n]) => sum + n, 0));
  $("events-note").textContent = events.slice(0, 3).map(([kind, n]) => `${kind} ${n}`).join(" · ");
  $("win-cpu").textContent = percent((c.peak.y * WSL.cpus) / WINDOWS.cpus);
  $("win-cpu-note").textContent = `of ${WINDOWS.cpus} processors at ${at(c.peak)}`;
  $("win-memory").textContent = percent((m.peak.y / WINDOWS.memory) * 100);
  $("win-memory-note").textContent = `of ${WINDOWS.memory} GiB at ${at(m.peak)}`;

  const cpuFacts = [{ text: `Peak ${percent(c.peak.y)} at ${at(c.peak)}` }, { text: `Average ${percent(c.avg)}` }, { text: `Latest ${percent(c.latest)}` }];
  const memFacts = [{ text: `Peak ${gib(m.peak.y)} at ${at(m.peak)}` }, { text: `Average ${gib(m.avg)}` }, { text: `Latest ${gib(m.latest)}` }];
  if (over.length) memFacts.push({ text: `Over the limit for ${duration(over.length * bucket)}`, tone: "danger" });
  summarize("cpu", cpuFacts);
  summarize("memory", memFacts);

  plot("cpu", { unit: "%", yMax: nice(c.peak.y * 1.15, 5), series: [{ label: "Total CPU", data: cpu }] }, "Total CPU, share of WSL", cpuFacts);
  // The part above the limit is its own series in the danger role; its neighbors join it so the line stays whole.
  const series = [{ label: "Total memory", data: memory }];
  if (over.length) {
    const high = (i) => memory[i]?.y != null && memory[i].y > LIMIT;
    series.push({ label: "Over the limit", tone: "critical", dash: [], data: memory.map((p, i) => ({ x: p.x, y: high(i - 1) || high(i) || high(i + 1) ? p.y : null })) });
  }
  plot(
    "memory",
    { unit: " GiB", yMax: nice(Math.max(LIMIT * 1.2, m.peak.y * 1.1), 0.5), series, markers: [{ axis: "y", value: LIMIT, label: `Limit ${LIMIT} GiB`, tone: "warning" }] },
    "Total memory",
    [...memFacts, { text: `The limit is ${LIMIT} GiB` }],
  );

  $("count").textContent = data.rows.length;
  drawHead();
  $("table-note").textContent = `CPU is a share of WSL's ${WSL.cpus} processors. p95 is taken over ${RANGES[key].every} averages, not single samples. Uptime is the share of watched time a container was running.`;
  $("oldest").textContent = moment(Date.now() - 31.4 * 24 * HOUR, "30d");
  $("status").textContent = `${key} · ${count(cpu.length)} samples, ${RANGES[key].every} apart`;
}

$("range").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-range]");
  if (!b || b.dataset.range === key) return;
  key = b.dataset.range;
  for (const other of $("range").querySelectorAll("button")) other.setAttribute("aria-pressed", String(other === b));
  render();
});

render();
