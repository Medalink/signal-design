import "./viewport.js";
import { init, toast, getTheme, rain, selectSection, setScrollbars } from "../src/js/index.js";
import { lazyChart } from "./lazy.js";
import { mountCountdownDemo } from "./countdown.js";
import { mountLivingTableDemo } from "./living-table.js";

import { mountFeedDemo } from "./feed.js";
import { mountOwnedDemo } from "./owned.js";

/* ---- Preview / code: snapshot every block before any script touches it -- */

const blocks = [...document.querySelectorAll(".demo-block")];
const slug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const snapshots = new Map();
for (const block of blocks) {
  const parts = [...block.children].filter((el) => !el.matches("h3.sd-label, .demo-usage, script[data-demo-js]"));
  // outerHTML starts each part at column 0; strip its source indent too.
  snapshots.set(block, parts.map((el) => dedent(el.outerHTML)).join("\n\n"));
}

/** Strip the source indentation so the snippet starts at column 0. */
function dedent(html) {
  const lines = html.split("\n");
  const indents = lines.slice(1).filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length);
  const cut = indents.length ? Math.min(...indents) : 0;
  return lines.map((l, i) => (i === 0 ? l : l.slice(Math.min(cut, l.match(/^ */)[0].length)))).join("\n");
}

/** What init() wires in this block, so a copied snippet works. */
function jsNote(html) {
  if (/data-sd-living-table/.test(html)) return 'JS: Call <code>mountLivingTable(root)</code> from <code>signal-design/js</code>; <code>init()</code> does not mount it. Call <code>dispose()</code> on teardown.';
  if (/data-sd-countdown/.test(html)) return 'JS: Call <code>mountCountdown(root)</code> from <code>signal-design/js</code>, then <code>set({ remainingMs, running })</code>; <code>init()</code> does not mount it.';

  if (/data-sd-feed/.test(html)) return 'JS: Call <code>mountFeed(root, options)</code> and <code>hotkeys(map, options)</code> from <code>signal-design/js</code>; <code>init()</code> wires detail toggles.';
  const passive = /^data-sd-(ornaments-size|ornaments-still|rain-style|rain-skip|tip-side|align|side|static|chart-scale)$/;
  const attrs = [...new Set(html.match(/data-sd-[a-z-]+/g) || [])].filter((a) => !passive.test(a));
  const extras = [];
  if (/popovertarget/.test(html)) extras.push("popovertarget (placement, menu keys)");
  if (/role="tab"/.test(html)) extras.push('role="tab"');
  const all = [...attrs, ...extras];
  return all.length
    ? `JS: <code>init()</code> from <code>signal-design/js</code> wires ${all.map((a) => `<code>${a}</code>`).join(" · ")}.`
    : "No JS needed: the HTML works with the CSS alone.";
}

const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
blocks.forEach((block, n) => {
  const h3 = block.querySelector(":scope > h3.sd-label");
  if (!h3) return;
  const section = block.closest(".demo-section");
  block.id ||= `${section?.id ?? "block"}-${slug(h3.textContent)}`;
  const head = document.createElement("div");
  head.className = "demo-head";
  h3.replaceWith(head);
  head.append(h3);
  const toggle = document.createElement("div");
  toggle.className = "sd-seg sd-seg-sm sd-seg-inline";
  toggle.setAttribute("aria-label", `${h3.textContent}: view`);
  toggle.innerHTML = `<button type="button" data-view="preview" aria-pressed="true">Preview</button><button type="button" data-view="code" aria-pressed="false">Code</button>`;
  head.append(toggle);

  const code = document.createElement("div");
  code.className = "demo-code";
  const html = snapshots.get(block);
  const js = block.querySelector(":scope > script[data-demo-js]")?.textContent.trim();
  code.innerHTML =
    `<div class="sd-code"><div class="sd-code-head">HTML <button class="sd-btn sd-btn-sm sd-btn-ghost" data-sd-copy="#code-${n}">Copy</button></div><pre id="code-${n}"><code>${esc(html)}</code></pre></div>` +
    (js ? `<div class="sd-code"><div class="sd-code-head">JS <button class="sd-btn sd-btn-sm sd-btn-ghost" data-sd-copy="#code-${n}-js">Copy</button></div><pre id="code-${n}-js"><code>${esc(js)}</code></pre></div>` : "") +
    `<p class="demo-usage">${jsNote(snapshots.get(block))} CSS: <code>@import "signal-design"</code> after Tailwind, or link <code>dist/signal.css</code>.</p>`;
  head.after(code);
});

function setView(block, view) {
  block.dataset.view = view;
  for (const b of block.querySelectorAll(":scope > .demo-head [data-view]")) b.setAttribute("aria-pressed", String(b.dataset.view === view));
}
document.addEventListener("click", (event) => {
  const b = event.target.closest(".demo-head [data-view]");
  if (b) setView(b.closest(".demo-block"), b.dataset.view);
  const all = event.target.closest("[data-code-all]");
  if (all) for (const block of blocks) setView(block, all.dataset.codeAll);
});

/* ---- Sidebar panels: one link per block, grouped by section --------------- */

for (const panel of document.querySelectorAll(".sd-sidebar-panel[data-sections]")) {
  const groups = panel.dataset.sections.split(" ").map((id) => document.getElementById(id)).filter(Boolean);
  const count = groups.reduce((n, g) => n + g.querySelectorAll(".demo-block").length, 0);
  const icon = { foundations: "foundations", components: "components", charts: "charts", effects: "effects", code: "code" }[panel.dataset.section];
  panel.innerHTML =
    `<div class="sd-sidebar-head"><svg><use href="#i-${icon}"/></svg><span class="sd-sidebar-title">${panel.dataset.title}</span>` +
    `<button class="sd-btn sd-btn-ghost sd-btn-icon sd-btn-sm" data-sd-shell="sidebar" data-sd-key="[" aria-label="Collapse sidebar"><svg><use href="#i-collapse"/></svg></button></div>` +
    `<nav class="sd-sidebar-body" data-sd-ornaments="bottom" data-sd-ornaments-size="200" aria-label="${panel.dataset.title} blocks">` +
    groups
      .map((g) => {
        const links = [...g.querySelectorAll(".demo-block")].map((b) => `<a class="sd-sidebar-link" href="#${b.id}" data-block="${b.id}">${b.querySelector("h3").textContent}</a>`);
        return `<details class="sd-sidebar-group" open><summary>${g.querySelector("h2").textContent} <span class="sd-count">${links.length}</span></summary>${links.join("")}</details>`;
      })
      .join("") +
    `</nav><div class="sd-sidebar-foot">${count} blocks · Preview or Code on each</div>`;
}

init();
mountCountdownDemo();
mountOwnedDemo();
mountLivingTableDemo();

mountFeedDemo();

/* ---- Where you are: crumbs, sidebar and rail follow the scroll ---------- */

const shell = document.getElementById("shell");
const content = shell.querySelector(".sd-shell-content");
const sectionOf = new Map();
for (const panel of document.querySelectorAll(".sd-sidebar-panel[data-sections]")) {
  for (const id of panel.dataset.sections.split(" ")) sectionOf.set(id, panel);
}
let current = null;
let lastLink = null;
const seen = new Map();

// Updating crumbs, the sidebar and the rail restyles and re-lays out parts of
// the frame, so do it once the scroll settles, never on every frame of it.
function showWhereYouAre() {
  const top = [...seen].filter(([, y]) => y !== null).sort((a, b) => a[1] - b[1])[0]?.[0];
  if (!top || top === current) return;
  current = top;
  const panel = sectionOf.get(top.closest(".demo-section")?.id);
  const page = document.querySelector("[data-crumb-page]");
  const title = top.querySelector("h3")?.textContent ?? "";
  if (page.textContent !== title) page.textContent = title;
  if (panel) {
    const crumb = document.querySelector("[data-crumb-section]");
    if (crumb.textContent !== panel.dataset.title) crumb.textContent = panel.dataset.title;
    document.querySelector("[data-page-label]").textContent = panel.dataset.title;
    if (panel.hidden) {
      // Follow along in the sidebar only while it is pinned; never pop a peek.
      if (shell.dataset.sidebar !== "collapsed" && !("drawer" in shell.dataset)) selectSection(shell, panel.dataset.section);
      else for (const r of shell.querySelectorAll(".sd-rail-item[data-sd-section]")) r.toggleAttribute("aria-current", r.dataset.sdSection === panel.dataset.section);
    }
  }
  lastLink?.removeAttribute("aria-current");
  lastLink = document.querySelector(`.sd-sidebar-link[data-block="${top.id}"]`);
  lastLink?.setAttribute("aria-current", "page");
}
let settle = 0;
const later = () => {
  clearTimeout(settle);
  settle = setTimeout(showWhereYouAre, 140);
};
const spy = new IntersectionObserver(
  (entries) => {
    for (const e of entries) seen.set(e.target, e.isIntersecting ? e.boundingClientRect.top : null);
    later();
  },
  { root: content, rootMargin: "0px 0px -60% 0px" },
);
for (const block of blocks) spy.observe(block);
content.addEventListener("scroll", () => settle && later(), { passive: true });

/* ---- Display settings ----------------------------------------------------- */

function pick(group, value) {
  for (const b of document.querySelectorAll(`${group} [data-value]`)) b.setAttribute("aria-pressed", String(b.dataset.value === value));
}
function chartTheme(name) {
  document.documentElement.dataset.chartTheme = name;
  pick("#chart-theme", name);
  try {
    localStorage.setItem("sd-chart-theme", name);
  } catch {}
  document.dispatchEvent(new CustomEvent("sd:theme", { detail: { theme: getTheme() } }));
}
document.querySelector("#chart-theme").addEventListener("click", (e) => {
  const b = e.target.closest("[data-value]");
  if (b) chartTheme(b.dataset.value);
});
document.querySelector("#scrollbar-mode").addEventListener("click", (e) => {
  const b = e.target.closest("[data-value]");
  if (!b) return;
  setScrollbars(b.dataset.value);
  pick("#scrollbar-mode", b.dataset.value);
});
try {
  const saved = localStorage.getItem("sd-chart-theme");
  if (saved && saved !== "mono") chartTheme(saved);
} catch {}

/* ---- Token swatches, read live from the current theme ---------------- */

const ROLES = ["canvas", "surface", "raised", "overlay", "line", "line-strong", "fg", "fg-muted", "fg-subtle", "fg-faint", "primary", "on-primary"];
const SIGNALS = [
  ["accent", "focus, current"],
  ["success", "approved, passing"],
  ["danger", "irreversible, risk"],
  ["warning", "costly"],
  ["pending", "unproven, waiting"],
  ["extra", "people, presence"],
];
const INK = [1000, 950, 900, 850, 800, 700, 600, 500, 400, 300, 200, 100, 50];
const GRAPHITE = [950, 900, 850, 800, 700, 600, 500, 400, 300, 200];

const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

function swatch(varName, title, sub) {
  const el = document.createElement("div");
  el.className = "swatch";
  el.innerHTML = `<div class="swatch-chip"></div><div><p class="text-sm"></p><p class="text-2xs text-fg-subtle uppercase tracking-caps"></p><p class="text-2xs text-fg-faint"></p></div>`;
  el.querySelector(".swatch-chip").style.background = `var(${varName})`;
  el.querySelector(".text-sm").textContent = title;
  el.querySelector(".tracking-caps").textContent = sub;
  el.querySelector(".text-fg-faint").dataset.value = varName;
  return el;
}

function ramp(prefix, steps) {
  return steps.map((s) => {
    const el = document.createElement("div");
    el.className = "swatch";
    el.innerHTML = `<div class="swatch-chip" style="height:40px;background:var(--color-${prefix}-${s})"></div><p class="text-2xs text-fg-subtle">${s}</p>`;
    return el;
  });
}

const utilityFor = (role) => (role.startsWith("line") ? "border-" : role.startsWith("fg") ? "text-" : "bg-") + role;
document.querySelector('[data-swatches="roles"]').append(...ROLES.map((r) => swatch(`--sd-${r}`, r, utilityFor(r))));
document.querySelector('[data-swatches="signals"]').append(...SIGNALS.map(([r, m]) => swatch(`--sd-${r}`, r, m)));
document.querySelector('[data-swatches="ink"]').append(...ramp("ink", INK));
document.querySelector('[data-swatches="graphite"]').append(...ramp("graphite", GRAPHITE));

/* ---- Contrast ------------------------------------------------------------ */

function rgb(value) {
  const probe = document.createElement("span");
  probe.style.color = value;
  document.body.append(probe);
  const [r, g, b, a = 1] = getComputedStyle(probe).color.match(/[\d.]+/g).map(Number);
  probe.remove();
  return { r, g, b, a };
}
function luminance({ r, g, b }) {
  const f = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function ratio(fg, bg) {
  const [a, b] = [luminance(fg), luminance(bg)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
}

function renderContrast() {
  const bg = rgb(css("--sd-canvas"));
  const rows = ["fg", "fg-muted", "fg-subtle", "fg-faint", "accent", "success", "danger", "warning", "pending", "extra"].map((role) => {
    const r = ratio(rgb(css(`--sd-${role}`)), bg);
    const grade = r >= 7 ? ["AAA", "success"] : r >= 4.5 ? ["AA", "success"] : r >= 3 ? ["large only", "pending"] : ["fail", "danger"];
    return `<tr><td><span class="inline-block size-3 align-middle mr-2" style="background:var(--sd-${role})"></span>${role}</td><td class="sd-num">${r.toFixed(2)}</td><td><span class="sd-badge" data-tone="${grade[1]}">${grade[0]}</span></td></tr>`;
  });
  document.querySelector("[data-contrast]").innerHTML = `<thead><tr><th>Role</th><th class="sd-num">Ratio</th><th>Small text</th></tr></thead><tbody>${rows.join("")}</tbody>`;
}

function renderValues() {
  for (const el of document.querySelectorAll(".swatch [data-value]")) el.textContent = css(el.dataset.value);
}

/* ---- Type scale ---------------------------------------------------------- */

const SCALE = [
  ["2xs", "labels, status lines"],
  ["xs", "nav, wordmark, kbd"],
  ["sm", "meta, hints"],
  ["base", "body"],
  ["md", "dense lead"],
  ["lg", "row outcome, lead"],
  ["xl", "page title"],
  ["2xl", "display on phones"],
  ["3xl", "display"],
  ["4xl", "landing"],
  ["5xl", "hero"],
];
document.querySelector("[data-type-scale]").innerHTML =
  `<thead><tr><th>Token</th><th class="sd-num">Size</th><th>Use</th><th>Sample</th></tr></thead><tbody>` +
  SCALE.map(([t, use]) => {
    const px = parseFloat(css(`--text-${t}`)) * 16;
    return `<tr><td><code>text-${t}</code></td><td class="sd-num">${px}px</td><td class="text-fg-subtle">${use}</td><td class="whitespace-nowrap" style="font-size:var(--text-${t});line-height:1.2">Signal</td></tr>`;
  }).join("") +
  `</tbody>`;

/* ---- Theme-dependent bits ------------------------------------------------ */

function refresh() {
  renderValues();
  renderContrast();
}
document.addEventListener("sd:theme", () => requestAnimationFrame(refresh));
matchMedia("(prefers-color-scheme: light)").addEventListener("change", refresh);
refresh();
for (const b of document.querySelectorAll("[data-sd-theme]")) b.setAttribute("aria-pressed", String(b.dataset.sdTheme === getTheme()));

/* ---- Demo wiring --------------------------------------------------------- */

for (const cb of document.querySelectorAll("[data-indeterminate]")) cb.indeterminate = true;

for (const el of document.querySelectorAll("[data-cells]")) {
  const on = Number(el.dataset.on);
  for (let i = 0; i < Number(el.dataset.cells); i++) {
    const cell = document.createElement("i");
    if (i < on) cell.dataset.on = "";
    el.append(cell);
  }
}

document.addEventListener("click", (event) => {
  const t = event.target.closest("[data-demo-toast]");
  if (t) {
    toast(t.dataset.demoToast, {
      tone: t.dataset.demoTone,
      action: "demoUndo" in t.dataset ? { label: "Undo", onClick: () => toast("Undone") } : undefined,
    });
  }
  if (event.target.closest('[data-demo="motion"]')) {
    const row = document.querySelector("[data-demo-row]");
    row.classList.remove("animate-slide-in");
    void row.offsetWidth;
    row.classList.add("animate-slide-in");
  }
});

document.addEventListener("change", (event) => {
  const input = event.target;
  if (input.matches('.sd-dropzone input[type="file"]') && input.files.length) {
    input.closest(".sd-dropzone").querySelector("[data-file-names]").textContent = [...input.files].map((f) => f.name).join(" · ");
  }
});

/* ---- Effects demo: a job that animates the rain while it runs --------- */

document.querySelector("[data-demo-busy]")?.addEventListener("click", (event) => {
  const button = event.currentTarget;
  if (button.getAttribute("aria-busy") === "true") return;
  button.setAttribute("aria-busy", "true");
  rain.busy(true);
  setTimeout(() => {
    rain.busy(false);
    button.removeAttribute("aria-busy");
    toast("Job finished", { tone: "success" });
  }, 6000);
});

/* ---- Charts section --------------------------------------------------------- */

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
