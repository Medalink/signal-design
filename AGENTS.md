# Signal design library: guide for AI agents

Read this before writing UI with Signal (`signal-design`). It is the contract:
what to install, the rules the design holds to, the parts to build from, and
how to check your work. The full component reference, with copyable HTML for
every part, is in `llms-full.txt` and `ai/components.json`.

Changing Signal itself rather than using it? Read `CONTRIBUTING.md` too. The component
tables in `docs/building-pages.md` and `README.md` are generated: add a file in `docs/tables/` instead of
editing a row.

## What it is

A flat, square, monochrome design library: CSS components (`sd-` classes) on
Tailwind CSS v4 or as one prebuilt stylesheet, plus a small dependency-free JS
module that wires behavior through attributes. Optional charts on Chart.js.
It runs in browsers and in Tauri (WebView2, WKWebView, WebKitGTK).

## Install (from GitHub, not npm)

```bash
pnpm add github:Medalink/signal-design        # or: npm install github:Medalink/signal-design
pnpm add github:Medalink/signal-design#v1.2.0 # pin a tag or commit for reproducible builds
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

**React 19** (optional): `import { Button, Dialog, Tabs } from "signal-design/react"` gives
typed components that render the `sd-` classes with React as the only writer.
They need no `init()`; do not call it on those pages. For auto-hiding
scrollbars there, call `initScrollbars()` from `signal-design/js` instead, and
`initKeyboard()` so a shell stays above the phone keyboard, `initSweep()` so
hover shimmers play through to the end, and `initPredict()` for `sd:predict`
and `data-sd-prefetch`.

## Hard rules (do not break these)

1. **Square corners.** No `rounded-*`, no `border-radius`. Avatars and checkboxes too.
2. **Tone, not lines.** Regions and boxes are told apart by background steps
   (`--sd-tone-0` chrome, `-1` side panels, `-2` content, `-3` raised;
   `--sd-field-fill` for a field, chip or plain button), not by borders. In
   paper, where that fill alone blends into white, a plain button, chip, pill
   and flow job also take a 1px `--sd-fill-edge` (transparent in ink and
   graphite). Where a
   bar or panel meets what scrolls beside it, it takes an edge shadow
   (`--sd-edge-below`, `-above`, `-left`, `-right`); a floating layer takes
   `--sd-lift`. No other blurred shadow, no glow, no glass. Lines stay only where
   they mean something: focus, a status color, the current or selected item, a
   dashed pending or drop zone, chart axes, the timeline, the outline of a
   checkbox, radio, switch or slider, and the bottom edge of a text field. A
   text field (input, select, textarea) keeps its fill and a 1px bottom edge in
   `--sd-line-control`, 3:1 against what surrounds it (WCAG 1.4.11), so it reads
   as a field. When an input sits in a composite that is itself the field (a tag
   list, the composer), the composite takes that edge and the input has none.
   The main content box keeps its edge.
3. **Color means something.** Only status and selection are colored, via the roles
   `accent`, `success`, `danger`, `warning`, `pending`, `extra` (`data-tone="danger"`,
   `text-danger`). Everything else, navigation included, is black, white and grey.
   Focus rings and current nav links and tabs (`aria-current`) are `fg`, not a
   color. Three selection markers are `accent`: the bar beside the current
   `sd-rail-tile`, the edge and corner of a chosen `sd-option`, and the start
   edge of the command palette's active result. A resize grip
   (`sd-sidebar-resize`, `sd-resize-handle`) is a 3px `accent` line while it is
   dragged or focused: it shows the edge that moves, so it stands in for the
   ring. Pending marks differ from
   warning by shape too: a ringed `sd-dot` and `sd-status` square, a dashed
   `sd-badge` edge.
   Never use hues directly (`text-pink`, `#ff3366`). In a conversation every
   name is colored: names take the person's color through `--who` (user data)
   and fall back to `extra`.
4. **Tokens, not values.** Colors come from `--sd-*` variables or the Tailwind
   utilities built on them (`bg-canvas`, `bg-surface`, `text-fg-muted`, `border-line`).
   Never hard-code a hex value; themes would break.
5. **Two faces, plus one to read.** One text face in regular and medium, Source Code Pro (bundled) for code.
   The text face is SF Pro (the system UI font; Segoe UI on Windows) unless the
   font picker swaps it (see Fonts). Set families through `font-sans` / `font-mono`
   or `var(--sd-font-sans)` / `var(--sd-font-mono)`, never by name. No other weights.
   The one exception is prose to be read at length (a manuscript, an article):
   `font-reading` / `var(--sd-font-reading)`, Literata, with real italics and a
   semibold for strong text. Interface text never uses it.
6. **Motion.** Transitions run 120–200ms. Loops are allowed, decoration included (the ornament
   sparkle, the `sd-typing` squares); `prefers-reduced-motion` stops them.
7. **Style state, not classes.** The JS writes ARIA and `data-*` (`aria-pressed`,
   `aria-expanded`, `aria-current`, `aria-selected`, `data-open`, `data-tone`);
   the CSS keys on those. Set the same attributes from your own code to drive state.
8. **One writer per state.** When React, Vue or Svelte renders a piece's state,
   leave out its `data-sd-*` behavior attribute (`data-sd-seg`, `data-sd-toggle`,
   `data-sd-shell`, `data-sd-section`, `data-sd-reaction`, `data-sd-poll`,
   `data-sd-open`, `data-sd-combobox`, `data-sd-follow`…) and render the ARIA and `data-*` state
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

`<Manuscript face="reading">` (or `class="sd-reading"`, or `font-reading`) sets
long-form prose in Literata, which `data-font` does not change.

**Ship only the faces you use.** The default stylesheet declares all of them
(Source Code Pro 6 files, Leon Sans, Literata 4). To ship fewer, import the core
and one file per face:

```css
@import "tailwindcss";
@import "signal-design/css/core";            /* no @font-face */
@import "signal-design/css/fonts/literata";  /* also: source-code-pro, leon-sans */
```

Without Tailwind, link `dist/signal-core.css` and `dist/font-<family>.css`.
A face you leave out falls back to the system stack.

## Building pages

Start from the closest pattern; copy its HTML from `ai/components.json` (search
by `title` or `classes`) rather than inventing markup.

The table of parts, one row per need (app shell, buttons, forms, overlays, lists, chat, data, art, React), is in [`docs/building-pages.md`](docs/building-pages.md). Read it before choosing markup.

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
- label every field with visible text (`sd-field-label`); a placeholder is a hint
  that disappears when you type, not a label;
- respect `prefers-reduced-motion` in any motion you add;
- in a Windows contrast theme (`forced-colors: active`) the system repaints every
  fill, and Signal's parts show selected, pressed and current state in the system
  colors. State you draw with a fill of your own needs one there too
  (`background-color: Highlight; color: HighlightText` under
  `@media (forced-colors: active)`).

## Translating labels

The words Signal's JS writes (toasts, aria-labels, empty rows) are English by
default. Replace them once with `setLabels({ "copy.done": "Kopiert" })` from
`signal-design/js`; keys and placeholders are in README "Translating labels".
React components take the same words as props (`closeLabel`, `emptyText`,
`busyText`, `pinLabel`, `collapseLabel`). `createChart(canvas, { locale })` sets
the language of a chart's dates and `text` its other words.

## Check your work

```bash
npx signal-design check http://localhost:5173/          # your running app
npx signal-design check http://localhost:5173/ --a11y   # plus an axe WCAG 2.2 AA audit
```

It loads each URL in Chromium (Playwright). Every finding starts with the rule
it breaks:

- `corners`: a rounded corner.
- `shadows`: a blurred shadow. Signal's own edge and lift shadows
  (`--sd-edge-*`, `--sd-lift`) pass.
- `type`: text in a weight other than 400 and 500 (600 only in the reading
  face), or in a family that is not `--sd-font-sans`, `--sd-font-mono` or
  `--sd-font-reading`.
- `color`: a color that is the same in the ink and paper themes and is not the
  value of any `--sd-*` token in ink, in paper or in the theme the page is in,
  such as a hex you wrote. Every element with `data-theme` flips along with the
  page, so a themed subtree or an app root is checked too. Tints of a token and a person's `--who` and `--edge`
  pass. A hex copied from a token's value passes too: the gate cannot tell it
  from the token, so write the token.
- `nav-color`: a heading, nav link, sidebar link, rail item, tab or breadcrumb
  link (or an icon in one) whose text color is a signal role. Status inside a
  `data-tone`, badge, count, dot or status, and a person's `--who`, pass.
- `primary`: more than one visible `sd-btn-primary` in a view. The view is the
  page, or the open dialog or popover the button is in. A gallery that shows
  variants side by side takes `data-sd-check-ignore="primary"`.
- `label`: a visible text field or textarea with a placeholder and no `<label>`,
  `aria-label`, `aria-labelledby` or `title`. axe accepts a placeholder as a name;
  it should not, because it disappears when the user types. The rule asks only
  for a name; the visible label (see Accessibility) is still yours to add.
- `overflow`: horizontal overflow at 1280/768/375px.
- `fonts`: a font that did not load.
- `console`: a console error.
- `a11y`: an accessibility violation (with `--a11y`).

Needs `playwright` (and `axe-core` for `--a11y`) installed, and
`npx playwright install chromium` once.

`--skip color,fonts` (or `--skip=color,fonts`; repeats add up) turns rules off
for the whole run; an unknown name exits 2.
`data-sd-check-ignore="color"` on an element exempts it and what it holds from
the rules it names (`"color type"` for two). It is for what is right on purpose,
such as a palette swatch; never use it to hide a violation.

## Files for tools

| File | What |
|---|---|
| `ai/components.json` | Every block: id, section, title, classes, `data-sd-*` attributes, copyable HTML, required JS, a JS snippet where one applies |
| `ai/tokens.json` | Every token resolved per theme (W3C design-token form), with contrast ratios |
| `llms-full.txt` | This guide plus every component's HTML, as one text file |
| `vscode/html-data.json`, `vscode/css-data.json` | Editor completions for `data-sd-*` and `--sd-*` |
| `src/js/index.d.ts`, `src/js/charts/index.d.ts`, `src/react/index.d.ts` | Types for the JS API, the charts API and the React components |
| `README.md` | Human documentation |

## Common mistakes

- Adding `rounded` or `shadow-lg` from Tailwind habit. Remove them.
- Coloring navigation, headings or icons. Keep them grey; color is for status.
- Dimming text with `opacity`. It drops contrast under 4.5:1; use `text-fg-muted`
  or `text-fg-faint`.
- Writing `color: #...` or `bg-[#...]`. Use a role token.
- Forgetting `init()`, so `data-sd-*` attributes do nothing.
- Keeping `data-sd-seg`, `data-sd-toggle` or `data-sd-reaction` on markup whose
  `aria-pressed`, `aria-expanded` or `data-open` a framework renders. Two
  writers drift apart; drop the attribute.
- Building a custom dropdown, tooltip, modal or tabs. Use the native element plus Signal.
- Wrapping the app in your own sidebar layout instead of `sd-shell`.

## Agent Traffic Control

Before working on an issue, follow [the ATC contributor skill](skills/atc/SKILL.md).
