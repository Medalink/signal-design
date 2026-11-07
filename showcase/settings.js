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

/**
 * The theme choice as previews: each button shows a swatch painted by that
 * theme's own tokens (data-theme on the swatch), auto as ink beside paper.
 */
const swatch = (t) =>
  t === "auto"
    ? `<span class="set-swatch" aria-hidden="true"><span data-theme="ink"><i></i></span><span data-theme="paper"><i></i></span></span>`
    : `<span class="set-swatch" aria-hidden="true"><span data-theme="${t}"><i></i></span></span>`;
const themePicker = () =>
  `<span class="sd-seg sd-seg-sm set-themes" role="group" aria-label="Theme">${THEMES.map((t) => `<button type="button" data-sd-theme="${t}" aria-pressed="false">${swatch(t)}<span>${t}</span></button>`).join("")}</span>`;

/** Each font option is set in its own face, so the choice shows what it does. */
const FONT_CHOICES = [["system", "system"], ["leon-sans", "leon sans"], ["source-code-pro", "mono"]];
const fontPicker = () =>
  `<div class="sd-seg sd-seg-sm set-fonts" role="group" aria-labelledby="set-font-label">${FONT_CHOICES.map(([f, text]) => `<button type="button" data-sd-font="${f}" aria-pressed="false"${f === "source-code-pro" ? ' aria-label="Source Code Pro"' : ""}><span data-font="${f}">${text}</span></button>`).join("")}</div>`;

/** The settings fields, theme first. */
export function settingsHtml() {
  return (
    `<div class="sd-field"><span class="sd-field-label">Theme</span>${themePicker()}</div>` +
    // init() restores the remembered font and keeps these buttons' aria-pressed in sync.
    `<div class="sd-field"><span class="sd-field-label" id="set-font-label">Text font</span>${fontPicker()}</div>` +
    (hasCharts() ? seg("set-chart-colors", "Chart colors", [["mono", "mono"], ["spectrum", "spectrum"]], " data-chart-colors") : "") +
    seg("set-scrollbars", "Scrollbars", [["auto", "hide when idle"], ["always", "always"]]) +
    (hasRain() ? `<div class="sd-field"><span class="sd-field-label">Backdrop</span><button class="sd-btn sd-btn-sm" data-sd-rain-toggle aria-pressed="false">Digital rain</button></div>` : "")
  );
}
