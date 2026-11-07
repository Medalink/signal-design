/**
 * The showcase's appearance settings, built once: theme, text font, chart
 * colors (only where the page has charts), scrollbars and the rain backdrop
 * (only where the page has rain). The doc topbar's Theme popover (library
 * pages and the overview) and the example bar's settings popover both fill
 * from settingsHtml(), so the two never drift. The sync, remembering and
 * click wiring live in viewport.js.
 */
export const THEMES = ["ink", "graphite", "paper", "auto"];

/** A theme seg: data-sd-theme buttons, which init() and setTheme() keep pressed. */
export const themeSeg = (label, extra = "sd-seg-inline") =>
  `<span class="sd-seg sd-seg-sm ${extra}" role="group" aria-label="${label}">${THEMES.map((t) => `<button type="button" data-sd-theme="${t}" aria-pressed="false">${t}</button>`).join("")}</span>`;

const seg = (id, label, options, attrs = "") =>
  `<div class="sd-field"><span class="sd-field-label" id="${id}-label">${label}</span><div class="sd-seg sd-seg-sm" id="${id}"${attrs} role="group" aria-labelledby="${id}-label">${options.map(([value, text]) => `<button type="button" data-value="${value}" aria-pressed="false">${text}</button>`).join("")}</div></div>`;

const hasCharts = () => !!document.querySelector(".sd-chart, .sd-plot, .sd-heatmap, .sd-waffle, .sd-uptime, .sd-meter, [data-sd-chart]");
const hasRain = () => !!document.querySelector("canvas[data-sd-rain]");

/** The settings fields, theme first. */
export function settingsHtml() {
  return (
    `<div class="sd-field"><span class="sd-field-label">Theme</span>${themeSeg("Theme", "")}</div>` +
    // init() restores the remembered font and keeps these buttons' aria-pressed in sync.
    `<div class="sd-field"><span class="sd-field-label" id="set-font-label">Text font</span><div class="sd-seg sd-seg-sm" role="group" aria-labelledby="set-font-label"><button type="button" data-sd-font="system" aria-pressed="false">system</button><button type="button" data-sd-font="leon-sans" aria-pressed="false">leon sans</button><button type="button" data-sd-font="source-code-pro" aria-pressed="false" aria-label="Source Code Pro">mono</button></div></div>` +
    (hasCharts() ? seg("set-chart-colors", "Chart colors", [["mono", "mono"], ["spectrum", "spectrum"]], " data-chart-colors") : "") +
    seg("set-scrollbars", "Scrollbars", [["auto", "hide when idle"], ["always", "always"]]) +
    (hasRain() ? `<div class="sd-field"><span class="sd-field-label">Backdrop</span><button class="sd-btn sd-btn-sm" data-sd-rain-toggle aria-pressed="false">Digital rain</button></div>` : "")
  );
}
