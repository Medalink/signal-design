# Changelog

## Unreleased

## 2.0.0 (2026-10-23)

### Changed
- `sd-message`: a new layout for conversations. A 64px time column on the
  left, then the text; the author's name (`sd-message-author`) opens the first
  line and the text follows inline. A grouped follow-up has no time and no
  name, and every row keeps one rhythm (4px above and below a 24px line), with
  no extra gap when the author changes. Avatars are no longer part of a
  message. Markup written for the avatar layout needs the new structure (see
  the Conversation page).
- Names take the person's color through `--who` and fall back to `extra`: the
  author, an `sd-mention` (text only, no fill), a quoted author and the reply
  bar. AGENTS.md rule 3 says so.
- `data-own` gives the viewer's own messages a grey edge instead of a fill.
- `sd-message-actions`: quick reactions, then Add reaction and Reply with key
  tips (`data-key`), then More. 32px targets, rules between the groups, and it
  is revealed by opacity, so Tab reaches it (it used `display: none`).
- `sd-reactions`: emoji first, a small quiet count, soft hairlines, and an
  `sd-reactions-add` button that shows on hover.
- `sd-typing`: the squares step like a cursor while someone types. AGENTS.md
  rule 6 allows live activity to loop while it lasts.
- `sd-composer`: one + (`sd-composer-add`) opens every content type, the text
  starts right after it, and send stays quiet until there is text.
- Paper: conversation hairlines are lighter.

### Added
- `sd-message-time`, `sd-message-tag`, `sd-message-meta`, `sd-message-timer`,
  `data-reply` with `sd-message-ref` and `sd-message-ref-mark`, `data-editing`
  with `sd-message-edit`, and `data-hover` to hold a row's hover while its menu
  is open.
- `sd-message-menu` (icon, label and key rows), `sd-add-menu` (the + menu)
  and `sd-emoji-picker` (search, categories, grid and a footer that names the
  emoji under the pointer).
- `sd-feed-day` (a day line that sticks to the top of the scroller over
  `--sd-feed-bg`), icons in the time column for `sd-event`, and `sd-feed-jump`
  (Jump to present).
- `sd-composer-reply` (the reply bar) and `sd-composer-status` (the typing
  line above the composer); in an `sd-shell-dock` they share one box.
- `sd-shell-dock[data-flush]` rests the dock on the bottom of the window.
- `sd-roster`: people in a large conversation, one section per role with a
  sticky, collapsible head and online / total, rows by `data-presence`
  (`online`, `offline`, `unresolved`) and an `sd-roster-more` row for paging.
- Motion on state change for conversations: `data-new` entrances for rows,
  events, reactions and status icons, `data-flash` for a jumped-to row and
  `data-leaving` to fold a row out.

### Fixed
- `sd-reply > b` no longer shrinks a name to one letter next to a long quote.
- `sd-composer` no longer overflows a narrow container.

## 1.2.0 (2026-10-22)

### Changed
- The ring around a presence square, the ring around a corner
  `sd-badge-count` and the gaps in an `sd-avatar-stack` take the color of
  what they sit on (`--sd-ring`, set by each Signal surface; the page canvas
  elsewhere). They were always `surface` (the stack: `canvas`), which showed
  on canvas, raised rows and overlays.
- A failed message keeps its danger edge while it is `aria-current`; before,
  the current edge hid it.
- Icons are sized to the text's cap height (`1.5cap`, with an `em` fallback)
  in buttons, rows, navigation, messages and the shell, so they follow the
  font instead of fixed px.
- Contributing: changelog entries go in `changes/` fragments, the generated AI
  files are rebuilt on `main` by the `ai-files` workflow, and behavior checks
  live one per file in `scripts/checks/`. See `CONTRIBUTING.md`.
- `font-sans` and `font-mono` now read `--sd-font-sans` and `--sd-font-mono`,
  so Tailwind utilities follow the picker. Charts and the digital rain read
  the code face from `--sd-font-mono` instead of naming it.
- Showcase: the single components page is now an overview plus one page per
  section (Tokens, Elements, Components, Conversation, Inputs, Charts, Effects,
  JS). The overview has a card for every page, and old `#section` links
  redirect to the page that holds them. `showcase/pages.js` is the one list of
  pages; the rail, nav palette, vite inputs and check scripts read it.
- Showcase: every page, library and example, has a bar at the top. It links back
  to the library, says where you are (a grey Mock badge on example apps), lists
  every page in a menu, and holds the theme, the width switch and a settings
  popover for the text font, chart colors, scrollbars and digital rain. It is
  compact on phones. The scrollbars choice is now remembered like the theme.
- Behavior checks in `scripts/checks/` declare the page they run on with
  `export const page = "<id>"`. See `CONTRIBUTING.md`.
- `sd-message[data-mention]` and `[aria-current]` no longer share a fill with the
  pane or with each other: they use new tokens `--sd-mention-fill` (7% of the
  text color) and `--sd-current-fill` (10%), defined in every theme and
  readable on both `--sd-canvas` and `--sd-surface`. Secondary text on those
  rows is lifted from `--sd-fg-faint` to `--sd-fg-subtle` to keep 4.5:1.
  `data-own` and `data-selected` are unchanged.

### Added
- `sd-rail-tile`: a square picture, initials or icon tile for a 72px rail of
  places, with `aria-current` and `data-unread` edges, a dashed `data-pending`
  tile and a corner `sd-badge-count`.
- `--sd-avatar-size` sets an avatar to any size, with the initials and the
  presence square following it; `sd-avatar-md` adds a 28px step.
  `data-status="afk"` is an alias for `away`.
- `sd-sidebar-resize`: a separator on the sidebar's edge. With
  `data-sd-shell="resize"` it drags, steps with the arrow keys, Home and End,
  and remembers the width per sidebar id; `setSidebarWidth(shell, px | null)`
  does it from code and `sd:shell` reports `width`. Without the attribute it
  is CSS and ARIA only, for apps that own the width.
- README "Framework-owned state" and AGENTS.md rule 8: which `data-sd-*`
  attributes to leave out when a framework renders the state, which classes
  then work with CSS alone, and what `init()` wires without an attribute
  (`role="tab"`, `.sd-shell`, popovers, scrollers, `.sd-empty`). The
  components page shows a framework-owned segmented control, expand and
  reaction.
- `sd-icon-text` and `sd-icon`: an icon and a word on one baseline, sized to
  the cap height. In Tailwind, `size-[1.5cap]` with `items-baseline` does the
  same.
- `sd-progress[data-state="indeterminate"]`: a static dashed bar in the
  pending tone for work of unknown size, with no looping motion, and
  `sd-progress-label` for the line above a bar.
- `sd-level`: a live level meter (2 to 8 bars) driven by `--level` from 0 to
  1, with `role="meter"`. Bars change only when the value crosses them; it
  never loops.
- `sd-options` and `sd-option`: selectable option cards with a title,
  description and optional preview, in a wrapping grid. Radios or checkboxes
  inside labels need no JS; buttons use `aria-pressed` or `aria-checked`.
- Link card variants: `sd-link-card-hero` (image, GIF or video on top),
  `sd-link-card-compact`, `sd-link-card-type` for documents, `data-blocked`
  with `sd-link-card-note`, a static loading state on `aria-busy="true"`, and
  `data-tone` on the edge.
- `sd-message` states: `--edge` for an author or role color on the start
  edge, `data-own` for a light own-message tint and `data-selected` for bulk
  selection. Edge order: failed > current > selected > mention > `--edge`.
- `signal-design/ascii`: `mountAscii(el, piece, { at, look, speed })` plays a
  piece from the optional peer `ascii-magic-art` as DOM text in `sd-ascii`.
  Palette colors become three greys by brightness and `data-tone` colors the
  brightest. It is still by default and plays only while the element or its
  closest `[aria-busy]` ancestor is `aria-busy="true"` (or `busy(true)`), on
  screen, in a visible tab and without `prefers-reduced-motion`. The text
  scales to fit its box and never scrolls sideways.
- An ASCII library page with a look switcher, a job that plays its art while it
  runs, a gallery that plays on hover or focus, an empty state and tones.
- Font picker: `data-font="system | leon-sans | source-code-pro"` on `<html>`
  or any element sets the text face; `setFont`, `getFont`, `restoreFont`,
  `FONTS`, `data-sd-font` and the `sd:font` event drive it. `system` (SF Pro)
  stays the default. Code, charts and the rain keep Source Code Pro.
- Leon Sans (OFL, 400-500, 115 KB) and a medium Source Code Pro text face are
  bundled. Each is fetched only when picked.
- Font tokens `--sd-font-sans`, `--sd-font-mono` and `--sd-font-system`.
- `sd-schedule`: a resource schedule grid, a roster over hours with a
  resource column, hour plot, `data-status` blocks (`driving`, `planned`,
  `proposed`, `completed`, `conflict`, unmarked off duty), a now line and
  a legend. Blocks, grid, ticks and the now line share one `--start`/`--end`
  hour scale. Each block has one full-text `sd-schedule-label` that ellipsizes
  at rest. Hover or focus reveals a wrapping label over adjacent slots,
  bounded by the track edges, without moving the time bar or resizing rows.
  A fixed bracket keeps the original interval visible during reveal. Full
  labels include time and status, with each block described by its resource.
  Resource names and details wrap at rest. The now line remains visible over
  highlighted rows and behind expanded labels. Static selection uses
  `data-selected`.
  Focusable static blocks support keyboard and touch access. Labels collapse
  when both hover and focus leave. Rows highlight on `--sd-raised` for hover
  and focus, conflicts tint on `--sd-chart-alert`, and
  `data-chart-theme="mono|spectrum"` switches the whole board black/white
  or full palette via the chart tokens.
- Showcase: each library page opens with what the section is for, its
  principles, and when to use it or leave it out, before the blocks.
- Showcase: a Themes side by side block on the Tokens page.
- `scripts/check-showcase-pages.mjs` and `scripts/check-showcase-bar.mjs`: checks
  for the page chrome, hash redirects and the bar, run by `scripts/check.mjs`.
  `check.mjs` also checks that every registry page has its file, script, rail
  icon and sections, and `--only webkit-1` runs the first WebKit job's pages.
- `scripts/check-showcase-build.mjs`: builds the showcase under `/signal-design/`
  and opens every page with and without `.html`, so a bundler that drops the bar
  fails the check.
- Stream scenes for OBS browser sources: `sd-scene`, a 16:9 frame laid out in
  1920×1080 units (`--sd-u`), with a masked fade, copy (kicker, title, count,
  line), a bottom bar of latest-event labels and socials, a webcam frame with
  a name tag, a goal in square cells, rolling credits and `sd-live`.
- `sd-stream-alert` and `mountStream(scene)`: queued follow, sub, raid and bits
  alerts in their tones, with a burst of flat square particles, a one-pass
  shimmer on the name, `sd:alert` events, and labels, goals and timers that
  update themselves.
- The Stream example: starting soon, in game, BRB and ending scenes on the
  rain field. `stream.html?scene=start|game|brb|end` is one scene alone, ready
  to add to OBS at 1920×1080; `&demo` plays sample alerts.
- `sd-timeline`: CSS-only ranges over a shared axis. A label column, one
  lane per row, bars placed with `--from`/`--to` percentages, a grid and a
  `--now` line on the same scale, axis ticks with `--at`, and an optional
  bracket `sd-timeline-mark` for a span inside the timeline. Tones a bar with
  `data-tone`; `--row-h`, `--label-w` and `--label-gap` tune the geometry.
- `sd-panel-wide` (capped at 1024px) and `sd-panel-fluid` (no cap) for
  settings-style pages; `sd-panel` stays at 560px.
- `sd-seg-wrap`: a segmented control whose items flow onto more rows in a
  narrow container. A plain `sd-seg` still keeps one row.
- `sd-kv-plain`: key-value keys in sentence case that truncate with an
  ellipsis instead of widening the grid. `sd-kv` keeps its small-caps keys.
- `sd-sidebar-head-sm`: a 16px title step (the default is 18px) for a sidebar
  head with an action or a longer title, such as "Direct Messages" in a 240px
  sidebar.

### Fixed
- `sd-sidebar-title` takes its size from its head (`font-size: inherit`), so
  on an `h2` the base heading size no longer overrides `sd-sidebar-head-sm`.
- `sd-message-head > b` and `sd-reply > b`: an author rendered as a `button` or
  `a` inside the `<b>` now truncates with an ellipsis. `<b>` clipped the
  atomic inline-block without one.
- `sd-message-body`: the content column is `minmax(0, 1fr)`, so a long
  unbroken author name no longer widens the row past its container.
- `sd-message-head > b` and `sd-reply > b`: author names truncate with an
  ellipsis (at most 60% and 40% of the row) instead of overflowing; the reply
  name was `flex-shrink: 0`.

## 1.1.1 (2026-10-19)

### Added

- Living Tables support collapsible groups, responsive metadata, and pointer
  or keyboard width resizing through `mountLivingTable(root)`.
- The showcase includes copyable HTML and JavaScript. `refresh()` reconciles
  rows, groups, and parent bounds after a container move.

## 1.1.0 (2026-10-19)

### Fixed
- Copy controls show a danger toast when the Clipboard API is unavailable or
  rejects a write: "Copy unavailable. Select the line instead." Successful
  copies still show "Copied". No insecure clipboard workaround is used.

### Added
- `mountCountdown(root)` presents authoritative remaining time, supports pause,
  resume and resync, and reports running, paused and complete state changes.
  It updates the existing progress component and accessible numeric values.
- `mountFeed(root, options)` preserves stable row anchors across DOM updates,
  navigates rows, reports the above count, and supports suspendable idle return.
- `hotkeys()` accepts sequences such as `g t`, `sequenceTimeout`, and `enabled`.
  Scoped bindings respect modal contexts, native controls, and handled events.

## 1.0.0 (2026-10-19)

### Added
- AI integration: `AGENTS.md` (the contract for agents), `llms.txt` and
  `llms-full.txt`, generated `ai/components.json` (every block's classes,
  attributes, HTML and required JS) and `ai/tokens.json` (every token per
  theme, W3C form, with contrast ratios), VS Code completion data in
  `vscode/`, a Cursor rule in `ai/rules/`, and a Claude Code plugin and
  marketplace with a `signal-design` skill. `pnpm build:ai` regenerates the
  files; CI fails when they are stale.
- `signal-design check <url> [--a11y]`: the hard-rule sweep and an axe audit
  for any project's pages (`bin/`, rules shared with `scripts/check.mjs`).
- Git installs build `dist/` through a `prepare` script.
- `dist/signal.js`, a prebuilt single-file ESM bundle of `signal-design/js`
  (`pnpm build:js`), stamped with the package version — vendoring apps can
  ship it next to `dist/signal.css` with no bundler of their own. Exported
  as `signal-design/dist/signal.js`. The charts entry stays unbundled.
- Release workflow: pushing a `v*` tag builds dist and attaches a
  `signal-design-dist.zip` (signal.css, fonts, and dist/signal.js when
  present) to the GitHub Release.
- Chart types on the same tokens: `line`, `area`, `step`, `bar` (grouped or
  stacked), `hbar`, `histogram`, `scatter`, plus CSS-only `sd-heatmap`,
  `sd-waffle`, `sd-uptime` and `sd-meter`; a gallery on `charts.html`.
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
- Text is set in SF Pro (the system UI font; Segoe UI on Windows) in regular
  and medium (500) in every theme. Source Code Pro stays bundled for code,
  charts and the rain. Bold rules now use `--font-weight-semibold` instead of
  a literal 600.
- Breadcrumbs on phones shrink each crumb to its first letter (Home > P > B);
  icon-only crumbs stay, full names stay readable to screen readers.
- Showcase: a slim top bar with the page links and the width switch replaces
  the floating Width button.
- The light theme is called paper: `data-theme="paper"`, `setTheme("paper")`,
  the `paper:` Tailwind variant. `light` still works everywhere as an alias
  (attribute, `setTheme`, `data-sd-theme`, a saved preference, `light:`).
- Accessibility: every showcase page passes axe-core WCAG 2.2 AA in all
  themes at desktop and phone width (`pnpm a11y`, in CI). Faint text is now
  4.5:1 on every surface (ink `#828282`, graphite `#8b8b8b`, light `#6a6a72`;
  subtle greys step up with it); graphite's danger is `#ff4775`; muted rows
  use color, not opacity; avatars pick dark or white ink (`--sd-on-tone`);
  shortcut groups are headings above separate lists (`p.sd-shortcuts-group`).
  New: `.sd-skip` skip link, and `init()` gives scrolling boxes a tab stop.
- Responsive shell: tablets (768–1023px) keep the rail and peek the sidebar;
  below 1200px the right panel floats over the content and starts closed;
  phone overlays sit under the title bar and close on Esc or a click outside.
  Phones are now under 768px. The composer hint hides on phones.
- Showcase: a Width button on every page previews it at 1440, 1024, 768, 390
  and 360px; checks cover 1024 and 768px too.
- Performance pass (Chrome, CPU slowed 4x, `pnpm perf`). Idle main-thread
  work per 3 s: components 915 → ~400–700 ms, shell 446 → 131, chat 442 →
  157, charts 1180 → 121–212.
  - Ornament sparkle runs as CSS opacity animations (three grouped layers per
    ornament) instead of SVG animation, and pauses while anything scrolls
    (`data-sd-scrolling-page` on `<html>`).
  - Ornaments for elements the browser isn't rendering (content-visibility,
    display: none) paint when they come into view.
  - The FPS counter samples 1 s out of every 4 s.
  - Chart effects draw at 30 fps on timer-scheduled frames, color strings
    are cached, and packets ride bandwidth lines only.
  - Showcase: off-screen sections use `content-visibility: auto`; charts
    below the fold build when they come near.
- Scrolling is much cheaper. The shell's content and sidebar scrollers get
  their own GPU layer (`will-change: scroll-position`); auto-hiding
  scrollbars restyle only the scroller, not its subtree, and touch the DOM
  only when the state changes; charts no longer redraw every frame after a
  live update (the effects layer rings the new point). The components page
  updates its crumbs and sidebar once scrolling settles.
- Shift+T steps the theme on every page (`init({ themeKey })`, `cycleTheme()`).
- The components page runs in the Signal App Shell: rail sections, a
  sidebar listing every block, crumbs that follow the scroll, a display
  panel (chart colors, scrollbars, code views, rain) and a status bar.
  Every block flips between Preview and Code in place, with copyable HTML
  and a note of the JS it needs. It now shows every component used on the
  example pages, plus a Charts section.
- `.sd-shell` uses `overflow: clip`, so anchor jumps can't slide the frame.
- Dropdown lists in Chromium use Signal's overlay and a white (or black)
  selected row instead of the OS blue (`appearance: base-select`).
- Empty states get a sparkling center ornament; `data-sd-ornaments="center"`.
- File cards wrap their upload progress under the name.
- Corner backgrounds are now called ornaments: `data-sd-ornaments`,
  `data-sd-ornaments-size`, `data-sd-ornaments-still`, `paintOrnaments`,
  `ornamentShapes`, `ORNAMENT_STYLES` (were `data-sd-corners`, `paintCorners`,
  `cornerShapes`, `CORNER_STYLES`).
- Ornaments sparkle slowly (off for reduced motion;
  `data-sd-ornaments-still` opts out).
- Graphite is now the lighter dark mode: `#0f0f0f` frame, `#151515` page,
  `#1a1a1a` panels, `#242424` raised, `#2e2e2e`/`#3d3d3d` lines, and ink's
  two-level text (`#f5f5f5`, `#a3a3a3`).
- Ink: crisper two-level text contrast. Text `#fafafa`, secondary text
  `#a3a3a3` (was `#d4d4d4`), subtle `#8a8a8a`, solid `#262626` lines.
- Rain pauses while its canvas is off screen.
- The hover shimmer keeps badge counts readable.
- The status bar is optional; without one its row collapses.
- The title bar and status bar use the rail background (`--sd-surface`).

### Fixed
- Window-control icons no longer render as black squares: `.sd-window-controls svg`
  now defaults to `fill: none; stroke: currentColor` (stroke-width 1.5), so the
  documented minimal markup — bare `<path>`/`<rect>` with no attributes — is
  visible on a dark title bar.
- An `.sd-shell` with no `.sd-sidebar` child no longer reserves the 18rem
  sidebar column: the content now fills the space beside the rail and scales
  with the window, same as a collapsed sidebar.
- Shell region components (`sd-rail`, `sd-sidebar`, `sd-shell-main`,
  `sd-shell-aside`, `sd-shell-status`, `sd-shell-topbar`, `sd-titlebar`) now
  claim their named grid area only as direct children of `.sd-shell`. Used
  standalone in an app's own layout, they no longer create implicit tracks in
  the host grid.

## 0.0.0

- Baseline: tokens, themes (ink, graphite, light, auto), every HTML element,
  components, the Signal App Shell, digital rain, corner ornaments, border
  glow, auto-hiding scrollbars, hover shimmer, FPS counter, vanilla JS.
