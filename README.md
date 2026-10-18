# Signal

A flat, square, mono design library for Tailwind CSS v4. It works in web apps,
Tauri apps and plain HTML.

- **One family, two weights.** Source Code Pro 400 and 600 for all text (bundled, OFL).
- **Square corners everywhere**, avatars and checkboxes included.
- **Flat surfaces.** No glass, glow, shadow or gradient.
- **Color is for important things:** risk, status, success and focus. Everything else, navigation included, is black, white and grey.
- **Motion on state change only:** 120–200ms transitions and a one-pass hover shimmer. The rain backdrop moves only while work runs. `prefers-reduced-motion` turns motion off.

## Use it with Tailwind v4

```css
/* app.css */
@import "tailwindcss";
@import "signal-design";
```

```js
import { init } from "signal-design/js";
init();
```

The tokens replace Tailwind's defaults, so utilities stay on-system:
`bg-canvas`, `bg-surface`, `text-fg-muted`, `border-line`, `text-danger`,
`text-2xs`, `tracking-caps`, `max-w-column`. Semantic utilities read live CSS
variables, so they follow the theme at runtime without a rebuild.

With Vite (`@tailwindcss/vite`, tested) the font URLs resolve on their own. The
Tailwind CLI does not rewrite `url()` inside imported packages; with the CLI,
copy `node_modules/signal-design/src/fonts` next to your output CSS as `fonts/`.
The PostCSS plugin has not been tested yet.

## Use it without Tailwind (plain HTML, Tauri, any framework)

Link the prebuilt bundle. It has the reset, tokens, element styles and every
`sd-` component, but no utilities. Keep `dist/fonts` next to it.

```html
<link rel="stylesheet" href="node_modules/signal-design/dist/signal.css">
<script type="module">
  import { init } from "./node_modules/signal-design/src/js/index.js";
  init();
</script>
```

The CSS and JS avoid Chromium-only features, so they behave the same in
WebView2 (Windows), WKWebView (macOS) and WebKitGTK (Linux).

## Themes

Set `data-theme` on `<html>` or on any element to theme a subtree.

| Theme | |
|---|---|
| `ink` (default, canonical) | Cool near-black greys, alpha hairlines |
| `graphite` (optional) | The lighter dark mode: grey `#1a1a1a` panels on a `#0f0f0f` frame, same two-level text as ink |
| `light` | White canvas, deepened signal colors for contrast |
| `auto` | `ink`, or `light` when the OS asks for it |

`setTheme("light")` switches and remembers it; `<button data-sd-theme="light">` does the same declaratively.

## Color roles

| Role | Means |
|---|---|
| `accent` | focus, current |
| `success` | approved, passing, your position |
| `danger` | irreversible, high risk |
| `warning` | costly |
| `pending` | unproven, waiting |
| `extra` | people, presence |

Components take a `data-tone` attribute with one of these names (or `neutral`).
Use the role, not the hue: `text-danger`, not `text-pink`.

`fg-faint` is below 4.5:1 on the canvas. Use it for decoration, disabled states
and large display text, not body copy.

## What is styled

- **Every HTML element**, unclassed: headings, text-level semantics, lists, tables,
  every input type, select, textarea, checkbox, radio, switch (`role="switch"`),
  range, color, file, progress, meter, details, dialog, popover, media.
- **Components** (`sd-` prefix): buttons, kbd, square markers, badges, chips, pill,
  avatars, status, counts, fields, input groups, checks, segmented control, dropzone,
  slim nav, tabs, breadcrumb, pagination, menu, side nav, top bar, status bar,
  notes, callouts, toasts, progress cells, skeleton, empty state, check lists,
  feed rows, the "you are here" marker, expand, tables, stats, key-value lists,
  code blocks, media frames, dialog, sheet, popover, tooltip, command panel,
  page column, panel, card, divider and layout helpers.

Open the showcase to see each one with its class names.

## Signal App Shell

A full app frame: an optional title bar, a 96px icon rail, a 288px sidebar
with collapsible groups, a breadcrumb header (or a solid header bar), the page,
an optional dock, an optional right panel and an optional status bar. On
phones a top bar replaces the rail, and the rail and sidebar open together as
a drawer. See `showcase/shell.html`.

```html
<div class="sd-shell">
  <header class="sd-shell-topbar">…</header>          <!-- phones -->
  <nav class="sd-rail">
    <a class="sd-rail-home" href="/">…</a>
    <div class="sd-rail-list">
      <a class="sd-rail-item" data-sd-section="projects" aria-current="true"><svg>…</svg><span>Projects</span></a>
    </div>
    <div class="sd-rail-tools">…</div>
  </nav>
  <aside class="sd-sidebar">
    <div class="sd-sidebar-panel" data-section="projects">
      <div class="sd-sidebar-head"><span class="sd-sidebar-title">Projects</span>
        <button data-sd-shell="sidebar">«</button></div>
      <nav class="sd-sidebar-body">
        <details class="sd-sidebar-group" open><summary>Views</summary>
          <a class="sd-sidebar-link" aria-current="page">All items</a></details>
      </nav>
    </div>
  </aside>
  <main class="sd-shell-main">
    <div class="sd-shell-header">…breadcrumb…</div>
    <div class="sd-shell-content">…</div>
  </main>
  <aside class="sd-shell-aside">…</aside>                <!-- optional -->
  <footer class="sd-statusbar sd-shell-status">…</footer>   <!-- optional -->
  <div class="sd-shell-scrim" data-sd-shell="close"></div>
</div>
```

| Control | Does |
|---|---|
| `data-sd-shell="sidebar"` | Pin or collapse the sidebar; the choice is remembered. |
| `data-sd-section="name"` on a rail item | Shows that section's sidebar panel. With the sidebar collapsed it peeks over the page; Escape or a click outside closes it. |
| `data-sd-shell="aside"` | Opens or closes the right panel. |
| `data-sd-shell="drawer"` | Opens the phone drawer and makes the page inert behind it. |

The page sits inset in two lighter boxes (`--sd-container`), a header bar and
the content, with a gap where the shell background shows. Put a rain canvas
first in the shell to fill that gap:

```html
<canvas class="sd-rain" data-sd-rain aria-hidden="true"></canvas>
```

When the sidebar is collapsed, the header's sidebar button flips to `»` and
can carry a `.sd-when-collapsed` label such as "Show sidebar".

The current section and page get a strong border on a raised grey; everything
else is grey, and nothing has a shadow.

### Title bar and window controls

For frameless desktop windows (Tauri with `decorations: false`). Put it first in
the shell; it takes the top row and is a drag region.

```html
<header class="sd-titlebar" data-tauri-drag-region>
  <span class="sd-titlebar-brand"><b>ACME</b></span>
  <div class="sd-titlebar-end">
    <span class="sd-titlebar-metric">CPU <b>3%</b></span>
    <div class="sd-window-controls">
      <button data-sd-window="minimize" aria-label="Minimize">…</button>
      <button data-sd-window="maximize" aria-label="Maximize">
        <svg class="sd-icon-maximize">…</svg><svg class="sd-icon-restore">…</svg></button>
      <button data-sd-window="close" aria-label="Close">…</button>
    </div>
  </div>
</header>
```

With Tauri (`withGlobalTauri: true`) the buttons call the window API, a double
click toggles maximize, and `data-maximized` swaps the icon. Without Tauri they
fire `sd:window` with `detail.action` for you to handle. On macOS
(`data-platform="mac"`, set by `init()`) the custom buttons hide and the brand
leaves room for the native ones.

### Header bar and dock

The solid alternative to the floating crumb bars, and a box below the content
for a composer or a footer toolbar. Both sit a gap apart from the content and
the rain skips them.

```html
<main class="sd-shell-main">
  <header class="sd-shell-bar">
    <div class="sd-shell-bar-title"><svg>…</svg><b>general</b><span>Team chat</span></div>
    <div class="sd-shell-bar-center">…</div>   <!-- hidden below 52rem of bar width -->
    <div class="sd-shell-bar-end">
      <button class="sd-icon-btn" popovertarget="inbox" aria-label="Inbox, 2 new">
        <svg>…</svg><span class="sd-badge-count" data-tone="danger">2</span></button>
    </div>
  </header>
  <div class="sd-shell-content" data-sd-corners data-sd-edges>…</div>
  <div class="sd-shell-dock" data-sd-corners data-sd-edges>…composer…</div>
</main>
```

`sd-popover-panel` with `sd-popover-head` and `sd-popover-body` makes a larger
popover for an inbox or a pinned list.

## Conversation and lists

Generic pieces for chat, comments, feeds and inboxes. See `showcase/chat.html`.

| Class | What |
|---|---|
| `sd-item` (+ `-body`, `-title`, `-sub`, `-end`) | A list row with avatar, text and meta; `data-unread`, `data-muted`. |
| `sd-avatar[data-status]` | `online`, `away`, `busy`, `offline` square. |
| `sd-badge-count` | A count on an icon, rail item or avatar. |
| `sd-message` | Avatar plus body; `data-grouped`, `data-mention`, `data-pending`, `data-failed`. `sd-message-actions` is the hover toolbar. |
| `sd-reply`, `sd-mention`, `sd-event` | Quoted reply, inline mention, system line. |
| `sd-reactions` | Toggle buttons with counts; fires `sd:reaction`. |
| `sd-receipts`, `sd-typing` | Read receipts and the typing line. |
| `sd-composer` (+ `-row`, `-chips`, `-hint`) | The message box. `data-sd-autogrow`, `data-sd-enter-submit`, and `data-sd-suggest="id"` for an `@` list. |
| `sd-banner` | A full-width notice with actions. |
| `sd-file`, `sd-link-card`, `sd-poll` | Attachment, link preview, poll (`--share` per option). |
| `sd-tiles`, `sd-tile` | Call grid; `data-speaking`, `data-muted`, `data-hand`. |
| `sd-grid-picker` | An emoji or icon grid (`--cols`). |

`data-sd-contextmenu="menu-id"` opens a menu at the pointer on right click,
Shift+F10 or the menu key, and fires `sd:contextmenu` with the target.

## Inputs

| Class | JS hook | What |
|---|---|---|
| `sd-combobox` | `data-sd-combobox` | Text field with a filtered list. |
| `dialog[data-sd-palette]` | `setOptions(dialog, items)` | Command palette; arrows, Enter, groups. |
| `sd-tags` | `data-sd-tags`, `data-name` | Tag entry with hidden inputs per tag. |
| `sd-number` | `data-sd-number`, `data-step` | Stepper with − and + buttons. |
| `sd-steps` | | Numbered wizard steps. |
| `sd-shortcuts` | `dialog[data-sd-shortcuts]` | Shortcut sheet; `?` opens it. |
| `sd-spark`, `sd-bars` | `data-values` | Sparkline and bar chart, no library. |
| `sd-diff` | | Diff lines with `data-line="+"`, `"-"`, `"@"`. |

## Digital rain

Monochrome glyph streams (Greek and Cyrillic letters, digits, a few marks; no words)
in the theme's text color: white on dark themes, black on light. It renders in
a worker when `OffscreenCanvas` exists and on the main thread otherwise, with
depth layers and cached trails, and no glow.

It is a still frame by default and moves only while work runs, which keeps
Signal's motion rule. `prefers-reduced-motion` keeps it still, and it pauses
while the tab is hidden.

```js
import { rain } from "signal-design/js";
rain.busy(true);   // a job started: animate, unless the user turned rain off
rain.busy(false);  // done: back to the still frame, unless the user turned it on
```

`<button data-sd-rain-toggle>` is the user's switch; the choice is remembered.

Rain only draws where it shows. Inside a shell it skips the content, bars and
dock. Elsewhere, list what covers it: `data-sd-rain-skip=".hero > *"`.
`data-sd-rain-style="squares"` swaps glyphs for squares.

## Corner ornaments

```html
<div class="sd-shell-content" data-sd-corners>…</div>
```

Dust in the bottom-right corner by default: small filled squares, outlines
and dots, strongest at the corner and thinning as they spread. Ask for two
corners (`data-sd-corners="tl br"`) and the first gets larger "blocks".
Theme text color only, seeded so it never changes between loads, and painted
as the element's background so it stays put while content scrolls.

## Scrollbars

`init()` hides scrollbars until something scrolls and hides them again 2s
after the position stops changing. Only the thumb color changes, so nothing
shifts. `init({ scrollbars: "always" })` keeps them visible.

## FPS counter

```html
<span class="sd-fps" data-sd-fps><b>--</b> fps</span>
```

Counts frames over 2 seconds. The number is
green at 58 fps and up (a 60 Hz screen reads 59 to 60), amber from 20, pink
below. `fps.subscribe(fn)` gives you the value in code.

## JS

Optional, no dependencies. Every listener is delegated, so markup added later
works without calling `init()` again. The JS only sets ARIA and `data-*` state;
the CSS styles that state, so your Tailwind build never needs to contain a class
the JS adds.

```js
import { init, toast, hotkeys, setTheme, openDialog, setExpanded } from "signal-design/js";

init();
toast("Approved #21", { tone: "success", action: { label: "Undo", onClick: undo } });
const off = hotkeys({ j: next, k: prev, "shift+n": newest, "mod+k": search });
```

| Attribute | Does |
|---|---|
| `data-sd-open="id"`, `data-sd-close` | Open a `<dialog>` as modal; close the nearest one. Backdrop click closes unless `data-sd-static`. |
| `popovertarget` + `.sd-popover` | Place the popover next to its trigger and flip at edges. In `role="menu"`: arrows, Home/End, type to jump. |
| `role="tab"` | Select tabs and panels, arrow keys, roving focus. |
| `data-sd-toggle="id"` | Open and close an `.sd-expand`, keep `aria-expanded` in sync. |
| `data-sd-seg` | Single-select button group; fires `change`. |
| `data-sd-key="a"` | Click the element when the key is pressed (not while typing). |
| `data-sd-tip="text"` | Tooltip on hover and focus. |
| `data-sd-copy="#id"` | Copy text and confirm with a toast. |
| `data-sd-toast="text"` | Show a toast on click. |
| `data-sd-theme="name"` | Switch theme and remember it. |
| `data-sd-window="minimize\|maximize\|close"` | Window buttons (Tauri or `sd:window`). |

TypeScript types ship in `src/js/index.d.ts`, including the `sd:*` events on
`document`.

## Charts

Two ways to chart, with one set of colors:

| Use | When |
|---|---|
| `sd-plot` | Your app has the points and wants a small static line or a sparkline. CSS only, no JS. |
| `createChart` | Time axes, units, several series, bands, tooltips, live data. Needs Chart.js. |

Both read the `--sd-chart-*` tokens and follow `data-chart-theme` (`mono` or
`spectrum`), set on the element or any element above it, so a sparkline in a
table matches the full chart above it. See `showcase/charts.html`.

### Small plots: `sd-plot`

Draw an SVG; the CSS styles the parts by class. `data-series` picks the color
of the matching chart series (`down`, `up`, `in`, `out`, `rtt`, `ghost`,
`baseline`); `data-tone` overrides it.

```html
<div class="sd-plot" data-series="down" style="--h: 140px">
  <svg viewBox="0 0 600 100" preserveAspectRatio="none">
    <path class="grid" d="M0 25H600M0 50H600M0 75H600"/>
    <polygon class="area" points="0,100 …points… 600,100"/>
    <polyline class="line" points="…points…"/>
  </svg>
  <span class="sd-plot-readout">5:46 pm<b>4.8 Gbps</b></span>
</div>
<span class="sd-plot sd-plot-inline" data-series="rtt"><svg>…</svg></span>
```

Also: `.dot`, `.cross` (a hover line), `.base`, `text`, `.sd-plot-note` for an
empty state. Scales and hover belong to your app. To format the readout the
same way the charts do, without loading Chart.js:
`import { formatValue } from "signal-design/js/charts/format"`.

### Live charts: `createChart`

Time-series charts for bandwidth and latency, on Chart.js. Chart.js is an
optional peer dependency: install it only if you use charts, and nothing in
`signal-design/js` imports it.

```bash
npm install chart.js
```

```html
<figure class="sd-chart" data-chart-theme="mono" style="--h: 480px">
  <div class="sd-chart-bar">
    <span class="sd-label">Core</span>
    <div class="sd-seg" data-sd-chart-scale>
      <button data-value="clamp">clamp</button><button data-value="p95">p95</button>
      <button data-value="p90">p90</button><button data-value="linear">linear</button>
      <button data-value="log">log</button>
    </div>
  </div>
  <div class="sd-chart-plot"><canvas></canvas></div>
</figure>
```

```js
import { createChart } from "signal-design/charts";

const core = createChart(canvas, {
  preset: "core",                       // "bandwidth" | "latency" | "core"
  bucketSeconds: 10,
  live: 10,                             // seconds between updates
  envelope: 120,                        // raw data: min/max ribbon + trend line
  series: [
    { label: "Core ↓", data: [{ x: ms, y: mbps }] },
    { label: "Core ↑", data: [...] },
    { label: "Core → MDF RTT", unit: " ms", data: [...], min: [...], max: [...] },
  ],
  thresholds: [{ value: 9000, level: "warning", label: "Warning 9 Gbps" }],
  ranges: [{ from, to, kind: "maintenance", label: "Switch firmware" }],
  events: [{ x, y, kind: "surge", unexpected: true }],
});
core.append({ "Core ↓": [{ x, y }] });
```

**Presets.** `bandwidth` is one Mbps panel. `latency` is one ms panel.
`core` stacks both on one time axis (weights 74 and 26), with one tooltip and
one crosshair across the two panels. Bandwidth values are Mbps and print on the
Kbps → Mbps → Gbps → Tbps ladder; latency prints as ms.

**Themes.** `data-chart-theme="mono"` (the default) is black and white: series
differ by grey and dash, and color is kept for thresholds, line heat, bursts and
alerts. `data-chart-theme="spectrum"` uses the full signal palette: green down,
pink up, cyan RTT with a violet jitter band, amber warnings. Both follow the
page theme (light gets deeper hues), and every color is a `--sd-chart-*` token
you can override.

**What a chart does.**

| Feature | How |
|---|---|
| Scale modes | `clamp` (p99), `p95`, `p90` cut the axis so one spike can't flatten the rest; `linear` fits all; `log` is a symmetric log scale. Remembered across visits; `[data-sd-chart-scale]` buttons switch it. |
| Off-scale peaks | A marker at the top of the panel with the real value when a clamped axis cuts a peak. |
| Tooltip | Every series at the pointer's time, beside the cursor; bucket span in the title; deltas on 10s data; jitter as ±. |
| Legend | Click a key to hide the series with its band and trend. |
| Crosshair | Dashed, across every panel. |
| Bands | `min`/`max` on a series draws a ribbon (jitter on RTT). `envelope` builds one from dense raw data. |
| Gaps | `y: null` breaks the line; `ranges` of kind `missing` shade it. |
| Thresholds, baselines | Dashed lines in warning, critical or baseline color. |
| Ranges | `maintenance`, `missing`, `alert`, `dip`, `spike`, with labels. |
| Events | `surge` and `drop` markers; unexpected ones ping. `peaks` marks daily peaks. |
| Line heat | Lines warm toward warning, then critical, near the top of the axis. |
| Forecast | `forecastFrom` shades the future and labels it. |
| Rhythm | On 2+ day windows: working hours and day lines. |
| Live | `append()` upserts at the tail, a ring pulses on the new point, value tags sit in the right gutter, and the window drifts with the clock. |
| Selection | Drag to select (fires `sd:chart-select`); with `zoom: true` it zooms and double click resets. |
| Effects | Square packets ride the bandwidth lines at a speed set by throughput, a heartbeat marks each live tip and turns amber, then grey, when the feed is late. |

**Motion.** The effects layer is continuous motion, which Signal otherwise
avoids, so it is guarded. It is off under `prefers-reduced-motion` and paused
while the tab is hidden, the chart is off screen or under the pointer. A frame
rate governor steps it down to half, a quarter, then off when the page runs
slow. Set it per chart with `effects: "full" | "subtle" | "off"`, or for every
chart with `setEffectsLevel()`.

Server-rendered pages can skip the JS call: put the options as JSON in a
`<script type="application/json">` inside `<figure data-sd-chart>` and call
`initCharts()`.

## Page concepts

The showcase has six pages built only from library parts: the components
reference (`index.html`), an app console (`shell.html`), a chat app
(`chat.html`), a multi-step form (`form.html`), a landing page
(`landing.html`) and live charts (`charts.html`).

## Develop

```bash
pnpm install
pnpm dev          # showcase at http://localhost:5178
pnpm build:css    # dist/signal.css + dist/fonts
node scripts/check.mjs http://localhost:5178/
```

`scripts/check.mjs` loads the showcase in Chromium and WebKit, in every theme, at
1280px and 375px. It fails on console errors, any rounded corner, any blurred
shadow, any gradient, horizontal scroll on phones, and broken dialog, popover,
menu, tabs, expand or segmented behavior.

## License

MIT. Source Code Pro is under the SIL Open Font License 1.1 (`src/fonts/OFL.txt`).
