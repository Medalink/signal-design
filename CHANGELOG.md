# Changelog

## Unreleased

### Added
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

### Changed
- The status bar is optional; without one its row collapses.
- The title bar and status bar use the rail background (`--sd-surface`).

## 0.0.0

- Baseline: tokens, themes (ink, graphite, light, auto), every HTML element,
  components, the Signal App Shell, digital rain, corner ornaments, border
  glow, auto-hiding scrollbars, hover shimmer, FPS counter, vanilla JS.
