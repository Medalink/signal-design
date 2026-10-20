import { getTheme } from "../../src/js/index.js";
import { mountLibrary } from "../library.js";

mountLibrary();

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

/* ---- Motion replay ------------------------------------------------------- */

document.addEventListener("click", (event) => {
  if (event.target.closest('[data-demo="motion"]')) {
    const row = document.querySelector("[data-demo-row]");
    row.classList.remove("animate-slide-in");
    void row.offsetWidth;
    row.classList.add("animate-slide-in");
  }
});
