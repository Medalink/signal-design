/**
 * Showcase bar: one slim bar at the top of every showcase page, library and
 * example alike. On the left it says where you are (the library, or a mock
 * app) and links back to the overview; a menu lists every page. On the right
 * are the settings that apply everywhere: theme, a width switch that opens
 * the same page in a frame at a device width (Esc or Full closes), and a
 * settings popover. The bar sits in the page flow (nothing is covered), is
 * compact on phones, and is absent inside the frame.
 *
 * The restore calls at the bottom run in the frame too, so a framed page
 * shows the same chart colors and scrollbars as the page that opened it.
 */
import { EXAMPLES, HOME, LIBRARY, byFile, exampleByFile } from "./pages.js";
import { getTheme, setScrollbars, setTheme } from "../src/js/index.js";

const SIZES = [
  { label: "Full", w: 0 },
  { label: "1440", w: 1440, h: 900, name: "Desktop 1440 × 900" },
  { label: "1024", w: 1024, h: 768, name: "Laptop 1024 × 768" },
  { label: "768", w: 768, h: 1024, name: "Tablet 768 × 1024" },
  { label: "390", w: 390, h: 844, name: "Phone 390 × 844" },
  { label: "360", w: 360, h: 780, name: "Small phone 360 × 780" },
];
const THEMES = ["ink", "graphite", "paper", "auto"];

const inFrame = new URLSearchParams(location.search).has("frame") || window !== window.top;

const store = {
  get: (key) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch {}
  },
};

const mark = `<svg class="sd-mark" viewBox="0 0 28 28" aria-hidden="true"><rect x="1" y="1" width="26" height="26" fill="none" stroke="currentColor" stroke-opacity=".3"/><rect x="6" y="15" width="4" height="7" fill="currentColor" fill-opacity=".45"/><rect x="12" y="11" width="4" height="11" fill="currentColor" fill-opacity=".7"/><rect x="18" y="6" width="4" height="16" fill="var(--sd-accent)"/></svg>`;
const sliders = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><rect x="14" y="5" width="4" height="4"/><rect x="6" y="15" width="4" height="4"/></svg>`;

const file = () => location.pathname.split("/").pop() || HOME.file;

function frameUrl() {
  const url = new URL(location.href);
  url.searchParams.set("frame", "");
  return url.toString();
}

/** Where this page sits: the library (with its page title) or a mock app (with its title). */
function here() {
  const library = byFile(file());
  if (library) return { mock: false, title: library.title };
  const example = exampleByFile(file());
  if (example) return { mock: true, title: example.title };
  return { mock: false, title: null };
}

const themeSeg = (label) =>
  `<span class="sd-seg sd-seg-sm sd-seg-inline" role="group" aria-label="${label}">${THEMES.map((t) => `<button type="button" data-sd-theme="${t}" aria-pressed="false">${t}</button>`).join("")}</span>`;

function menu() {
  const current = file();
  const link = (p) => `<a role="menuitem" href="./${p.file}"${p.file === current ? ' aria-current="page"' : ""}>${p.title}</a>`;
  return (
    `<div class="sd-menu-label" role="presentation">Library</div>` +
    [HOME, ...LIBRARY].map(link).join("") +
    `<div class="sd-menu-label" role="presentation">Example apps</div>` +
    EXAMPLES.map(link).join("")
  );
}

const seg = (id, label, options) =>
  `<div class="sd-field"><span class="sd-field-label" id="${id}-label">${label}</span><div class="sd-seg sd-seg-sm" id="${id}" role="group" aria-labelledby="${id}-label">${options.map(([value, text]) => `<button type="button" data-value="${value}" aria-pressed="false">${text}</button>`).join("")}</div></div>`;

const hasCharts = () => !!document.querySelector(".sd-chart, .sd-plot, .sd-heatmap, .sd-waffle, .sd-uptime, .sd-meter, [data-sd-chart]");
const hasRain = () => !!document.querySelector("canvas[data-sd-rain]");

function settings() {
  return (
    `<div class="sd-field vp-phone-only"><span class="sd-field-label">Theme</span>${themeSeg("Theme")}</div>` +
    // init() restores the remembered font and keeps these buttons' aria-pressed in sync.
    `<div class="sd-field"><span class="sd-field-label" id="vp-font-label">Text font</span><div class="sd-seg sd-seg-sm" role="group" aria-labelledby="vp-font-label"><button type="button" data-sd-font="system" aria-pressed="false">system</button><button type="button" data-sd-font="leon-sans" aria-pressed="false">leon sans</button><button type="button" data-sd-font="source-code-pro" aria-pressed="false" aria-label="Source Code Pro">mono</button></div></div>` +
    (hasCharts() ? seg("vp-chart-colors", "Chart colors", [["mono", "mono"], ["spectrum", "spectrum"]]) : "") +
    seg("vp-scrollbars", "Scrollbars", [["auto", "hide when idle"], ["always", "always"]]) +
    (hasRain() ? `<div class="sd-field"><span class="sd-field-label">Backdrop</span><button class="sd-btn sd-btn-sm" data-sd-rain-toggle aria-pressed="false">Digital rain</button></div>` : "")
  );
}

function pick(group, value) {
  for (const b of document.querySelectorAll(`#${group} [data-value]`)) b.setAttribute("aria-pressed", String(b.dataset.value === value));
}

function chartColors(name, { persist = true } = {}) {
  document.documentElement.dataset.chartTheme = name;
  // Pages that mark their own figures (the charts example) follow the same choice.
  for (const el of document.querySelectorAll("[data-chart-theme]")) el.dataset.chartTheme = name;
  pick("vp-chart-colors", name);
  if (persist) store.set("sd-chart-theme", name);
  document.dispatchEvent(new CustomEvent("sd:theme", { detail: { theme: getTheme() } }));
}

function scrollbars(mode, { persist = true } = {}) {
  setScrollbars(mode);
  pick("vp-scrollbars", mode);
  if (persist) store.set("sd-scrollbars", mode);
}

function mount() {
  const where = here();
  const bar = document.createElement("nav");
  bar.className = "vp-bar";
  bar.dataset.kind = where.mock ? "mock" : "library";
  bar.setAttribute("aria-label", "Showcase");
  bar.innerHTML =
    `<a class="vp-home" href="./${HOME.file}">${mark}<span>Library</span></a>` +
    (where.title
      ? `<span class="vp-here">${where.mock ? '<span class="sd-badge">Mock</span>' : '<span class="vp-sep" aria-hidden="true">/</span>'}<span class="vp-title">${where.title}</span></span>`
      : "") +
    `<button type="button" class="sd-btn sd-btn-ghost sd-btn-sm vp-pages-btn" popovertarget="vp-pages">Pages</button>` +
    `<span class="vp-end">` +
    `<span class="vp-theme">${themeSeg("Theme")}</span>` +
    `<span class="vp-widths"><span id="vp-label">Width</span><span class="sd-seg sd-seg-sm sd-seg-inline" role="group" aria-labelledby="vp-label">${SIZES.map(
      (s) => `<button type="button" data-vp="${s.w}" aria-pressed="${s.w === 0}" ${s.name ? `aria-label="${s.name}"` : ""}>${s.label}</button>`,
    ).join("")}</span></span>` +
    `<button type="button" class="sd-btn sd-btn-ghost sd-btn-sm sd-btn-icon" popovertarget="vp-settings" aria-label="Settings">${sliders}</button>` +
    `</span>`;
  // After the skip link, so that stays the first thing Tab reaches.
  const skip = document.querySelector("body > .sd-skip");
  (skip ? skip.after(bar) : document.body.prepend(bar));
  document.documentElement.classList.add("has-vp-bar");

  const pages = document.createElement("div");
  pages.id = "vp-pages";
  pages.className = "sd-popover";
  pages.setAttribute("popover", "");
  pages.innerHTML = `<div class="sd-menu" role="menu" aria-label="Pages">${menu()}</div>`;
  const panel = document.createElement("div");
  panel.id = "vp-settings";
  panel.className = "sd-popover sd-popover-pad vp-settings";
  panel.dataset.sdAlign = "end";
  panel.setAttribute("popover", "");
  panel.setAttribute("aria-label", "Settings");
  panel.innerHTML = settings();
  // Inside the nav, so the panels belong to its landmark; they open in the top layer, not in the bar.
  bar.append(pages, panel);

  const dialog = document.createElement("dialog");
  dialog.className = "vp-dialog";
  dialog.setAttribute("aria-label", "Page at a set width");
  dialog.innerHTML = `<div class="vp-head"><span class="vp-name"></span><div class="vp-head-end">${themeSeg("Theme")}<div class="sd-seg sd-seg-sm sd-seg-inline" role="group" aria-label="Width">${SIZES.map(
    (s) => `<button type="button" data-vp="${s.w}" ${s.name ? `aria-label="${s.name}"` : ""}>${s.label}</button>`,
  ).join("")}</div></div></div><div class="vp-stage"><iframe title="This page at a set width"></iframe></div>`;
  document.body.append(dialog);
  const frame = dialog.querySelector("iframe");
  const stage = dialog.querySelector(".vp-stage");

  function fit(size) {
    // Scale the frame down when the window is smaller than the device.
    const room = { w: stage.clientWidth - 32, h: stage.clientHeight - 32 };
    const scale = Math.min(1, room.w / size.w, room.h / size.h);
    frame.style.width = `${size.w}px`;
    frame.style.height = `${size.h}px`;
    frame.style.transform = scale < 1 ? `scale(${scale})` : "";
    dialog.querySelector(".vp-name").textContent = `${size.name}${scale < 1 ? ` · shown at ${Math.round(scale * 100)}%` : ""}`;
  }

  let current = SIZES[0];
  function show(w) {
    current = SIZES.find((s) => s.w === w) ?? SIZES[0];
    for (const b of document.querySelectorAll("[data-vp]")) b.setAttribute("aria-pressed", String(Number(b.dataset.vp) === current.w));
    if (!current.w) {
      if (dialog.open) dialog.close();
      return;
    }
    if (!dialog.open) {
      dialog.showModal();
      frame.src = frameUrl();
    }
    fit(current);
  }

  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-vp]");
    if (b) show(Number(b.dataset.vp));
    else if (e.target === dialog || e.target === stage) show(0);
    const chart = e.target.closest("#vp-chart-colors [data-value]");
    if (chart) chartColors(chart.dataset.value);
    const bars = e.target.closest("#vp-scrollbars [data-value]");
    if (bars) scrollbars(bars.dataset.value);
  });
  dialog.addEventListener("close", () => {
    for (const b of document.querySelectorAll("[data-vp]")) b.setAttribute("aria-pressed", String(Number(b.dataset.vp) === 0));
    frame.removeAttribute("src");
  });
  // The modal frame puts the bar out of reach, so its header carries the theme; pass it on to the framed page.
  document.addEventListener("sd:theme", ({ detail }) => {
    if (dialog.open) frame.contentWindow?.postMessage({ sdTheme: detail.theme }, location.origin);
  });
  addEventListener("resize", () => dialog.open && fit(current));

  pick("vp-chart-colors", store.get("sd-chart-theme") || "mono");
  pick("vp-scrollbars", store.get("sd-scrollbars") || "auto");
}

if (!inFrame) mount();
else {
  // The framed page takes theme changes from the page that framed it.
  addEventListener("message", (e) => {
    if (e.origin === location.origin && THEMES.includes(e.data?.sdTheme)) setTheme(e.data.sdTheme, { persist: false });
  });
}

// Run after init() (which resets scrollbars to "auto"), whether or not the bar mounted.
document.addEventListener("DOMContentLoaded", () => {
  const colors = store.get("sd-chart-theme");
  if (colors && colors !== "mono") chartColors(colors, { persist: false });
  const bars = store.get("sd-scrollbars");
  if (bars && bars !== "auto") scrollbars(bars, { persist: false });
});
