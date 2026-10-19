# Signal design library: guide for AI agents

Read this before writing UI with Signal (`signal-design`). It is the contract:
what to install, the rules the design holds to, the parts to build from, and
how to check your work. The full component reference, with copyable HTML for
every part, is in `llms-full.txt` and `ai/components.json`.

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
5. **Two faces.** SF Pro (the system UI font; Segoe UI on Windows) in regular and medium for text,
   Source Code Pro (bundled) for code. No other families or weights.
6. **Motion on state change only.** 120–200ms transitions. Nothing loops for decoration.
7. **Style state, not classes.** The JS writes ARIA and `data-*` (`aria-pressed`,
   `aria-expanded`, `aria-current`, `aria-selected`, `data-open`, `data-tone`);
   the CSS keys on those. Set the same attributes from your own code to drive state.

## Themes

`<html data-theme="ink">` (default, near-black) · `graphite` (lighter dark) ·
`paper` (white; `light` is an older alias) · `auto` (ink, or paper when the OS
asks for light). `setTheme("paper")` switches and remembers; Shift+T cycles.
Any element can carry `data-theme` to theme a subtree. Charts add
`data-chart-theme="mono"` (default, greys) or `"spectrum"` (full palette).

## Building pages

Start from the closest pattern; copy its HTML from `ai/components.json` (search
by `title` or `classes`) rather than inventing markup.

| Need | Use |
|---|---|
| Reading page | `<main class="sd-page">` (720px column) or `sd-page sd-page-wide` |
| App with navigation | Signal App Shell: `sd-shell` > `sd-rail`, `sd-sidebar`, `sd-shell-main` (`sd-shell-header` or `sd-shell-bar`, `sd-shell-content`, optional `sd-shell-dock`), `sd-shell-aside`, `sd-statusbar sd-shell-status` |
| Desktop window chrome | `sd-titlebar` with `sd-window-controls` (`data-sd-window`) |
| Buttons | `sd-btn` + `sd-btn-primary` (one per view) / `sd-btn-ghost` / `sd-btn-link`, sizes `-sm` `-lg` `-icon` `-block` |
| Forms | `sd-field` > `sd-field-label` + control + `sd-field-hint`; inputs are styled unclassed |
| Choices | `sd-seg` (segmented), `role="switch"` checkbox, `sd-combobox`, `sd-tags`, `sd-number` |
| Overlays | `<dialog class="sd-dialog">` + `data-sd-open`; `popover` + `.sd-popover`; `data-sd-tip`; `toast()` |
| Lists and rows | `sd-item`, `sd-row`, `sd-table`, `sd-kv` |
| Status | `sd-badge`, `sd-status`, `sd-dot`, `sd-count`, `sd-progress`, `sd-checks` |
| Chat and feeds | `sd-message`, `sd-composer`, `sd-reactions`, `sd-banner`, `sd-file` |
| Data | `sd-stat`, `sd-stat-box`, `createChart(canvas, { type })`, `sd-plot`, `sd-heatmap`, `sd-uptime`, `sd-meter` |
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
- Building a custom dropdown, tooltip, modal or tabs. Use the native element plus Signal.
- Wrapping the app in your own sidebar layout instead of `sd-shell`.
