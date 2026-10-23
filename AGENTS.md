# Signal design library: guide for AI agents

Read this before writing UI with Signal (`signal-design`). It is the contract:
what to install, the rules the design holds to, the parts to build from, and
how to check your work. The full component reference, with copyable HTML for
every part, is in `llms-full.txt` and `ai/components.json`.

Changing Signal itself rather than using it? Read `CONTRIBUTING.md` too.

## What it is

A flat, square, monochrome design library: CSS components (`sd-` classes) on
Tailwind CSS v4 or as one prebuilt stylesheet, plus a small dependency-free JS
module that wires behavior through attributes. Optional charts on Chart.js.
It runs in browsers and in Tauri (WebView2, WKWebView, WebKitGTK).

## Install (from GitHub, not npm)

```bash
pnpm add github:Medalink/signal-design        # or: npm install github:Medalink/signal-design
pnpm add github:Medalink/signal-design#v0.1.0 # pin a tag or commit for reproducible builds
```

**With Tailwind v4** (no build step needed for Signal itself):

```css
/* app.css */
@import "tailwindcss";
@import "signal-design";
```

**Without Tailwind**: link `dist/signal.css` and keep `dist/fonts/` next to it.
`dist/` is built by the package's `prepare` script on a git install. If
`node_modules/signal-design/dist/` is missing, allow the script and reinstall
(npm: `npm approve-scripts signal-design`; pnpm: add `signal-design` to
`onlyBuiltDependencies`). Each GitHub Release
also has `signal-design-dist.zip` with `signal.css`, `signal.js` and the fonts.

**JS** (optional, but anything with a `data-sd-*` attribute needs it):

```js
import { init } from "signal-design/js";
init(); // once, after the DOM exists; every listener is delegated, so later markup works too
```

**Charts** (optional): `pnpm add chart.js@^4.5`, then `import { createChart } from "signal-design/charts"`.

## Hard rules (do not break these)

1. **Square corners.** No `rounded-*`, no `border-radius`. Avatars and checkboxes too.
2. **Flat.** No blurred `box-shadow`, no glow, no glass, no CSS gradients. Hairlines only.
3. **Color means something.** Only status and focus are colored, via the roles
   `accent`, `success`, `danger`, `warning`, `pending`, `extra` (`data-tone="danger"`,
   `text-danger`). Everything else, navigation included, is black, white and grey.
   Never use hues directly (`text-pink`, `#ff3366`).
4. **Tokens, not values.** Colors come from `--sd-*` variables or the Tailwind
   utilities built on them (`bg-canvas`, `bg-surface`, `text-fg-muted`, `border-line`).
   Never hard-code a hex value; themes would break.
5. **Two faces.** One text face in regular and medium, Source Code Pro (bundled) for code.
   The text face is SF Pro (the system UI font; Segoe UI on Windows) unless the
   font picker swaps it (see Fonts). Set families through `font-sans` / `font-mono`
   or `var(--sd-font-sans)` / `var(--sd-font-mono)`, never by name. No other weights.
6. **Motion on state change only.** 120–200ms transitions. Nothing loops for decoration.
7. **Style state, not classes.** The JS writes ARIA and `data-*` (`aria-pressed`,
   `aria-expanded`, `aria-current`, `aria-selected`, `data-open`, `data-tone`);
   the CSS keys on those. Set the same attributes from your own code to drive state.
8. **One writer per state.** When React, Vue or Svelte renders a piece's state,
   leave out its `data-sd-*` behavior attribute (`data-sd-seg`, `data-sd-toggle`,
   `data-sd-shell`, `data-sd-section`, `data-sd-reaction`, `data-sd-poll`,
   `data-sd-open`, `data-sd-combobox`…) and render the ARIA and `data-*` state
   yourself. `init()` also wires `role="tab"` and `.sd-shell` without an
   attribute; see README "Framework-owned state" before calling it there.

## Themes

`<html data-theme="ink">` (default, near-black) · `graphite` (lighter dark) ·
`paper` (white; `light` is an older alias) · `auto` (ink, or paper when the OS
asks for light). `setTheme("paper")` switches and remembers; Shift+T cycles.
Any element can carry `data-theme` to theme a subtree. Charts add
`data-chart-theme="mono"` (default, greys) or `"spectrum"` (full palette).

## Fonts

`<html data-font="system">` (default, SF Pro) · `leon-sans` (Leon Sans, bundled) ·
`source-code-pro` (Source Code Pro as the text face). `setFont("leon-sans")`
loads the face, then switches and remembers it; `<button data-sd-font="leon-sans">`
does the same on click. Any element can carry `data-font`. Only the text face
changes: code, charts and the rain stay in `--sd-font-mono`. A framework that
renders the choice sets `data-font` itself.

## Building pages

Start from the closest pattern; copy its HTML from `ai/components.json` (search
by `title` or `classes`) rather than inventing markup.

| Need | Use |
|---|---|
| Reading page | `<main class="sd-page">` (720px column) or `sd-page sd-page-wide` |
| App with navigation | Signal App Shell: `sd-shell` > `sd-rail`, `sd-sidebar`, `sd-shell-main` (`sd-shell-header` or `sd-shell-bar`, `sd-shell-content`, optional `sd-shell-dock`), `sd-shell-aside`, `sd-statusbar sd-shell-status` |
| A rail of places (groups, servers) | `sd-rail-tile` (picture, initials or icon) in a 72px rail (`--shell-rail: 4.5rem`); `aria-current`, `data-unread`, `data-pending`, corner `sd-badge-count` |
| Resizable sidebar | `sd-sidebar-resize` (`role="separator"`, `aria-valuemin`/`max`/`now`) last in `sd-sidebar`; `data-sd-shell="resize"` for the JS, or drive `--shell-sidebar` and `aria-valuenow` from your framework |
| Desktop window chrome | `sd-titlebar` with `sd-window-controls` (`data-sd-window`) |
| Buttons | `sd-btn` + `sd-btn-primary` (one per view) / `sd-btn-ghost` / `sd-btn-link`, sizes `-sm` `-lg` `-icon` `-block` |
| Icons | `sd-icon-text` > `sd-icon` + text; icons are sized to the text's cap height (`1.5cap`) and scale with it |
| Forms | `sd-field` > `sd-field-label` + control + `sd-field-hint`; inputs are styled unclassed |
| Choices | `sd-seg` (segmented; `sd-seg-wrap` in a narrow container), `sd-options` > `sd-option` (cards with a description or preview), `role="switch"` checkbox, `sd-combobox`, `sd-tags`, `sd-number` |
| Overlays | `<dialog class="sd-dialog">` + `data-sd-open`; `popover` + `.sd-popover`; `data-sd-tip`; `toast()` |
| Lists and rows | `sd-item`, `sd-row`, `sd-table`, `sd-kv` (`sd-kv-plain` for sentence-case, truncating keys) |
| Settings groups | `sd-panel` (560px), `sd-panel-wide` (1024px), `sd-panel-fluid` (no cap) |
| Status | `sd-badge`, `sd-status`, `sd-dot`, `sd-count`, `sd-progress` (`data-state="indeterminate"` when the amount is unknown; never a looping bar), `sd-checks`, `sd-level` (live level from `--level`, 0–1) |
| People | `sd-avatar` (`-sm` `-md` `-lg` `-xl`, or `--sd-avatar-size`) with `data-status`; on your own panel set `--sd-ring` to its background so the presence ring matches |
| Chat and feeds | `sd-message` (`--edge` role color, `data-own`, `data-selected`), `sd-composer`, `sd-reactions`, `sd-banner`, `sd-file`, `sd-link-card` (`-hero`, `-compact`, `-type`, `data-blocked`, `aria-busy`) |
| Data | `sd-stat`, `sd-stat-box`, `createChart(canvas, { type })`, `sd-plot`, `sd-heatmap`, `sd-uptime`, `sd-meter`, `sd-timeline` (`--from`/`--to` ranges over one axis), `sd-schedule` (hour roster, `data-status` blocks, mono/spectrum) |
| ASCII art | `mountAscii(el, piece)` from `signal-design/ascii` draws an `ascii-magic-art` piece as greys in `sd-ascii`; still until `aria-busy="true"` (`pnpm add ascii-magic-art`); `data-tone` colors the brightest level |
| Stream overlays (OBS) | `sd-scene` (1920×1080 units in `--sd-u`; `data-full`, `data-clear`) with `sd-scene-copy`, `sd-scene-bar`, `sd-scene-label`, `sd-cam`, `sd-scene-goal`, `sd-credits`, `sd-stream-alert`; `mountStream(scene).alert({ kind, name })` |
| Empty | `sd-empty` (gets a center ornament automatically) |

Tone anything with `data-tone`. Mark the current location with `aria-current`.
Use `sd-desktop-only` / `sd-phone-only` (split at 768px) for chrome that changes on phones.

## Accessibility (your part)

The library meets WCAG 2.2 AA contrast and wires keyboard behavior. You still must:
- give every icon-only control an `aria-label`;
- have one `<h1>` per page (use `class="sd-sr-only"` if it should not show);
- start the page with `<a class="sd-skip" href="#main">Skip to content</a>` and give
  the target `id="main" tabindex="-1"`;
- label a desktop title bar: `role="region" aria-label="Window"`;
- keep focus visible (do not remove outlines);
- respect `prefers-reduced-motion` in any motion you add.

## Check your work

```bash
npx signal-design check http://localhost:5173/          # your running app
npx signal-design check http://localhost:5173/ --a11y   # plus an axe WCAG 2.2 AA audit
```

It loads each URL in Chromium (Playwright) and fails on: rounded corners,
blurred shadows, CSS gradients, horizontal overflow at 1280/768/375px, fonts
that did not load, console errors, and (with `--a11y`) accessibility
violations. Needs `playwright` (and `axe-core` for `--a11y`) installed, and
`npx playwright install chromium` once.

## Files for tools

| File | What |
|---|---|
| `ai/components.json` | Every block: id, section, title, classes, `data-sd-*` attributes, copyable HTML, required JS, a JS snippet where one applies |
| `ai/tokens.json` | Every token resolved per theme (W3C design-token form), with contrast ratios |
| `llms-full.txt` | This guide plus every component's HTML, as one text file |
| `vscode/html-data.json`, `vscode/css-data.json` | Editor completions for `data-sd-*` and `--sd-*` |
| `src/js/index.d.ts`, `src/js/charts/index.d.ts` | Types for the JS API |
| `README.md` | Human documentation |

## Common mistakes

- Adding `rounded`, `shadow-lg` or `bg-gradient-*` from Tailwind habit. Remove them.
- Coloring navigation, headings or icons. Keep them grey; color is for status.
- Writing `color: #...` or `bg-[#...]`. Use a role token.
- Forgetting `init()`, so `data-sd-*` attributes do nothing.
- Keeping `data-sd-seg`, `data-sd-toggle` or `data-sd-reaction` on markup whose
  `aria-pressed`, `aria-expanded` or `data-open` a framework renders. Two
  writers drift apart; drop the attribute.
- Building a custom dropdown, tooltip, modal or tabs. Use the native element plus Signal.
- Wrapping the app in your own sidebar layout instead of `sd-shell`.

## Agent Traffic Control

Before working on an issue, follow [the ATC contributor skill](skills/atc/SKILL.md).
