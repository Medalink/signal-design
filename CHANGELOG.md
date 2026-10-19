# Changelog

## Unreleased

### Added
- The built `dist/signal.css` carries a `/*! signal-design <version> */`
  banner from `package.json`, so vendored copies can be identified.
- `sd-plot`, a chart an app draws itself as SVG (`sd-plot-inline` for
  sparklines), with tone-colored line, soft area, hairline grid, dots,
  crosshair, readout and empty note.
- `sd-stat-box`, a boxed stat with a tone edge for dashboards, plus
  `sd-stat-sub` and a `sd-stat-end` action slot; `sd-stat-box-sm`.
- Sortable table headers: `th[data-sort]` with `aria-sort` arrows.
- A dashboard-style stat box, plot and sortable-header demo in the showcase.
- App shell for frameless desktop windows: `sd-titlebar` with `sd-window-controls`
  (Tauri window API, or an `sd:window` event), macOS layout.
- `sd-shell-bar`, a solid header bar, and `sd-shell-dock`, a box below the
  content; both a gap apart with bridges, and skipped by the rain.
- Conversation and list pieces: `sd-item`, `sd-message`, `sd-reply`,
  `sd-mention`, `sd-event`, `sd-reactions`, `sd-receipts`, `sd-typing`,
  `sd-composer`, `sd-suggest`, `sd-banner`, `sd-file`, `sd-link-card`,
  `sd-poll`, `sd-tiles`, `sd-grid-picker`, avatar status, `sd-badge-count`,
  `sd-icon-btn`, `sd-popover-panel`, and a context menu.
- Inputs: `sd-combobox`, command palette (`setOptions`), `sd-tags`,
  `sd-number`, `sd-steps`, `sd-shortcuts`, `sd-spark`, `sd-bars`, `sd-diff`.
- Italic font faces.
- Page concepts: chat app, multi-step form, landing page.
- TypeScript types (`src/js/index.d.ts`).
- CI: the check suite in Chromium and WebKit on every push and pull request.
- `data-sd-rain-skip` to keep rain off covering elements outside a shell.
- Charts (`signal-design/charts`, Chart.js as an optional peer): bandwidth,
  latency and the stacked core view; mono and spectrum themes; scale modes
  with a symmetric log scale; bands, envelopes, thresholds, ranges, events,
  heat, forecast, live updates, value tags, selection and a guarded effects
  layer. `charts.html` shows all of it.
- `sd-plot` reads the chart tokens and follows `data-chart-theme`;
  `data-series` picks a series color.
- Redesigned landing page.

### Changed
- Ink: crisper two-level text contrast. Text `#fafafa`, secondary text
  `#a3a3a3` (was `#d4d4d4`), subtle `#8a8a8a`, solid `#262626` lines.
- Rain pauses while its canvas is off screen.
- The hover shimmer keeps badge counts readable.
- The status bar is optional; without one its row collapses.
- The title bar and status bar use the rail background (`--sd-surface`).

## 0.0.0

- Baseline: tokens, themes (ink, graphite, light, auto), every HTML element,
  components, the Signal App Shell, digital rain, corner ornaments, border
  glow, auto-hiding scrollbars, hover shimmer, FPS counter, vanilla JS.
