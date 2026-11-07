/**
 * Showcase bar: one slim bar at the top of every example page (the mock
 * apps). It says the page is a mock app, links back to the library, and lists
 * every page in a menu. On the right are theme, a width switch that opens the
 * same page in a frame at a device width (Esc or Full closes), and a settings
 * popover. The bar sits in the page flow (nothing is covered), is compact on
 * phones, and is absent inside the frame.
 *
 * Library pages and the overview have no bar: their doc topbar carries the
 * same settings in its Theme popover, filled from settings.js. mountBar()
 * wires those settings, the sync with a width frame and the remembered chart
 * colors on every page, and builds the bar only on example pages. It and
 * savedScrollbars() run in the frame too, so a framed page shows the same
 * chart colors and scrollbars as the page that opened it.
 */
import { HOME, LIBRARY, SECTIONS, byKey } from "./pages.js";
import { getTheme, setScrollbars, setTheme } from "../src/js/index.js";
import { THEMES, settingsHtml, themeSeg } from "./settings.js";

const SIZES = [
  { label: "Full", w: 0 },
  { label: "1440", w: 1440, h: 900, name: "Desktop 1440 × 900" },
  { label: "1024", w: 1024, h: 768, name: "Laptop 1024 × 768" },
  { label: "768", w: 768, h: 1024, name: "Tablet 768 × 1024" },
  { label: "390", w: 390, h: 844, name: "Phone 390 × 844" },
  { label: "360", w: 360, h: 780, name: "Small phone 360 × 780" },
];

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

const page = byKey(document.documentElement.dataset.page);

function frameUrl() {
  const url = new URL(location.href);
  url.searchParams.set("frame", "");
  return url.toString();
}

/** The overview and the library pages carry the doc topbar, not this bar. */
const onDocPage = () => page === HOME || LIBRARY.includes(page);

function menu() {
  const link = (p) => `<a role="menuitem" href="./${p.file}"${p === page ? ' aria-current="page"' : ""}>${p.title}</a>`;
  const label = (text) => `<div class="sd-menu-label" role="presentation">${text}</div>`;
  return (
    link(HOME) +
    SECTIONS.flatMap((s) => s.groups.map((g) => label(g.title) + g.pages.map(link).join(""))).join("")
  );
}

function pick(group, value) {
  for (const b of document.querySelectorAll(`${group} [data-value]`)) b.setAttribute("aria-pressed", String(b.dataset.value === value));
}

/**
 * The one setter for chart colors. The bar's control (marked
 * data-chart-colors) and the width frame both call it, so they agree with
 * the page and with what is remembered.
 */
export function setChartColors(name, { persist = true } = {}) {
  document.documentElement.dataset.chartTheme = name;
  // Pages that mark their own figures (the charts example) follow the same choice.
  for (const el of document.querySelectorAll("[data-chart-theme]")) el.dataset.chartTheme = name;
  pick("[data-chart-colors]", name);
  if (persist) store.set("sd-chart-theme", name);
  announce("chartColors", name);
  document.dispatchEvent(new CustomEvent("sd:theme", { detail: { theme: getTheme() } }));
}

/**
 * Settings the width frame and the page that opened it keep in step. The
 * sender has already stored a value, so the receiver applies it without
 * storing it.
 */
const SYNCED = {
  theme: { get: getTheme, valid: (v) => THEMES.includes(v), apply: (v) => setTheme(v, { persist: false }) },
  chartColors: {
    get: () => document.documentElement.dataset.chartTheme || "mono",
    valid: (v) => v === "mono" || v === "spectrum",
    apply: (v) => setChartColors(v, { persist: false }),
  },
};
// What each setting last was here, sent or received. A change that matches it is not news, so a value
// applied because the other side sent it is never sent back, however many messages are queued.
const shown = {};
// The window on the other end: the opener inside a frame, the open frame on a page, otherwise none.
let peer = () => null;

function announce(key, value) {
  if (shown[key] === value) return;
  shown[key] = value;
  peer()?.postMessage({ sdSync: { key, value } }, location.origin);
}

function receive(e) {
  if (e.source !== peer() || e.origin !== location.origin) return;
  const { key, value } = e.data?.sdSync ?? {};
  if (!SYNCED[key]?.valid(value)) return;
  shown[key] = value;
  SYNCED[key].apply(value);
}

/** The remembered scrollbar mode, for the init({ scrollbars }) each entry makes. */
export const savedScrollbars = () => (store.get("sd-scrollbars") === "always" ? "always" : "auto");

function scrollbars(mode) {
  setScrollbars(mode);
  pick("#set-scrollbars", mode);
  store.set("sd-scrollbars", mode);
}

/**
 * Fill the settings panel of a page that has one (the doc topbar's Theme
 * popover) and wire the chart colors and scrollbars, wherever the panel is.
 * Runs before init(), which restores the theme and font into the new buttons.
 */
function mountSettings(panel) {
  if (panel) panel.innerHTML = settingsHtml();
  document.addEventListener("click", (e) => {
    const chart = e.target.closest("#set-chart-colors [data-value]");
    if (chart) setChartColors(chart.dataset.value);
    const bars = e.target.closest("#set-scrollbars [data-value]");
    if (bars) scrollbars(bars.dataset.value);
  });
  pick("[data-chart-colors]", store.get("sd-chart-theme") || "mono");
  pick("#set-scrollbars", savedScrollbars());
}

function buildBar() {
  const bar = document.createElement("nav");
  bar.className = "vp-bar";
  bar.dataset.kind = "mock";
  bar.setAttribute("aria-label", "Showcase");
  bar.innerHTML =
    `<a class="vp-home" href="./${HOME.file}">${mark}<span>Library</span></a>` +
    (page ? `<span class="vp-here"><span class="sd-badge">Mock</span><span class="vp-title">${page.title}</span></span>` : "") +
    `<button type="button" class="sd-btn sd-btn-ghost sd-btn-sm vp-pages-btn" popovertarget="vp-pages">Pages</button>` +
    `<span class="vp-end">` +
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
  panel.className = "sd-popover sd-popover-pad settings-panel";
  panel.dataset.sdAlign = "end";
  panel.setAttribute("popover", "");
  panel.setAttribute("aria-label", "Settings");
  panel.innerHTML = settingsHtml();
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
  });
  dialog.addEventListener("close", () => {
    for (const b of document.querySelectorAll("[data-vp]")) b.setAttribute("aria-pressed", String(Number(b.dataset.vp) === 0));
    frame.removeAttribute("src");
  });
  // The modal frame puts the bar out of reach, so its header carries the theme, which syncs to the framed page.
  peer = () => (dialog.open ? frame.contentWindow : null);
  // The framed page can close the frame too.
  addEventListener("message", (e) => {
    if (e.source === frame.contentWindow && e.origin === location.origin && e.data?.sdClose) show(0);
  });
  addEventListener("resize", () => dialog.open && fit(current));
}

/**
 * Wire the page's settings and restore the saved chart colors; mount the bar
 * on an example page (not in a frame). Each page entry calls it before init():
 * the package marks only CSS as side-effect free, so a bare
 * `import "./viewport.js"` is tree-shaken out of the production build. The
 * entry passes savedScrollbars() to init() itself.
 */
export function mountBar() {
  for (const [key, setting] of Object.entries(SYNCED)) shown[key] = setting.get();
  addEventListener("message", receive);
  document.addEventListener("sd:theme", ({ detail }) => announce("theme", detail.theme));
  if (!inFrame) {
    if (!onDocPage()) buildBar();
  } else if (window.parent !== window) {
    peer = () => window.parent;
    // The frame holds the focus, so Esc never reaches the dialog that holds it.
    // Judged on the way down: a Signal tooltip removes itself on this same Esc before the bubble phase.
    let closes = false;
    addEventListener("keydown", (e) => {
      closes = e.key === "Escape" && !e.isComposing && !document.querySelector('[role="tooltip"], :popover-open, dialog[open]');
    }, true);
    addEventListener("keydown", (e) => {
      if (closes && !e.defaultPrevented) window.parent.postMessage({ sdClose: true }, location.origin);
    });
  }
  // After the bar, so the bar's own settings panel is wired and marked too.
  mountSettings(document.getElementById("doc-appearance"));

  // After the page script has run, so a library page has already snapshotted its blocks as authored, whether or not the bar mounted.
  document.addEventListener("DOMContentLoaded", () => {
    const colors = store.get("sd-chart-theme");
    if (colors && colors !== "mono") setChartColors(colors, { persist: false });
  });
}
