# Signal

A flat, square, mono design library for Tailwind CSS v4. It works in web apps,
Tauri apps and plain HTML.

- **Two faces, two weights, and one to read.** SF Pro (system UI font, Segoe UI on Windows) in regular and medium for text; Source Code Pro (bundled, OFL) for code, charts and numbers. A font picker swaps the text face for Leon Sans or Source Code Pro. Literata (bundled, OFL) is for prose read at length, such as a manuscript, and never for interface text.
- **Square corners everywhere**, avatars and checkboxes included.
- **Flat surfaces.** No glass, glow or shadow.
- **Color is for important things:** risk, status, success and selection. Everything else, navigation included, is black, white and grey; focus rings and the current item are too.
- **Motion:** 120–200ms transitions and a one-pass hover shimmer. Loops are allowed: the ornament sparkle, and the rain while work runs. `prefers-reduced-motion` turns motion off.

## Install

From GitHub (this package is not on npm). Pin a tag or commit for
reproducible builds:

```bash
pnpm add github:Medalink/signal-design            # or npm install github:Medalink/signal-design
pnpm add github:Medalink/signal-design#v1.2.0     # a tag, or a commit SHA
```

Tailwind projects import the source and need no build. `dist/` (plain CSS and
the JS bundle) is built by the package's `prepare` script on a git install;
if `node_modules/signal-design/dist/` is missing, allow the script and
reinstall (npm: `npm approve-scripts signal-design`; pnpm: add `signal-design`
to `onlyBuiltDependencies`). Each GitHub Release also carries
`signal-design-dist.zip`.

## Use it with AI tools

The package carries what an AI agent needs to use it well:

| File | For |
|---|---|
| `AGENTS.md` | The contract: install, the hard rules, which part for which need, accessibility duties, checking. Point your project's own `AGENTS.md` at `node_modules/signal-design/AGENTS.md`. |
| `llms.txt`, `llms-full.txt` | The index, and the guide plus every component's HTML in one file. |
| `ai/components.json` | Every block from the library pages: classes, `data-sd-*` attributes, copyable HTML, the JS it needs. |
| `ai/tokens.json` | Every token resolved per theme (W3C design-token form) with contrast ratios. |
| `ai/rules/signal-design.mdc` | A Cursor rule; copy it to `.cursor/rules/`. |
| `vscode/*.json` | Editor completions for `data-sd-*` and `--sd-*` (see below). |

**Claude Code plugin.** The repo is a plugin marketplace with a
`signal-design` skill that loads the contract, copies real markup and runs the
checker:

```
/plugin marketplace add Medalink/signal-design
/plugin install signal-design@signal-design
```

**Checker.** Any project can test its pages against Signal's rules:

```bash
pnpm add -D playwright axe-core && npx playwright install chromium
npx signal-design check http://localhost:5173/ --a11y
```

It fails on rounded corners, blurred shadows, text in a weight other than 400
and 500 (600 in the reading face) or in a family that is not a Signal font
token, a color written by hand (the same in every theme and no `--sd-*` token's value;
a hex copied from a token passes),
a signal color on navigation or headings, a second primary button in one view,
a text field named only by its placeholder, horizontal overflow at 1280/768/375px,
fonts that did not load, console errors and (with `--a11y`) WCAG 2.2 AA
violations. `--widths` and `--theme` adjust the run. Every finding starts with
its rule (`corners`, `shadows`, `type`, `color`, `nav-color`, `primary`, `label`,
`overflow`, `fonts`, `console`, `a11y`). `--skip color,fonts` turns rules off for
the run, and an unknown name exits 2. `data-sd-check-ignore="color"` on an
element, such as a palette swatch, exempts it and what it holds from the rules
it names.

**Editor completions (VS Code).** Add to `.vscode/settings.json`:

```json
{
  "html.customData": ["./node_modules/signal-design/vscode/html-data.json"],
  "css.customData": ["./node_modules/signal-design/vscode/css-data.json"]
}
```

`pnpm build:ai` regenerates the `ai/`, `vscode/` and `llms-full.txt` files from
the library pages; CI fails when they are out of date.

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

With Vite, add the Tailwind plugin (tested):

```bash
pnpm add -D tailwindcss @tailwindcss/vite
```

```js
// vite.config.js
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({ plugins: [tailwindcss()] });
```

There the font URLs resolve on their own. The
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

No build step on the JS side either? Ship the prebuilt bundle instead of
importing from `src/`. It exports the same API as `signal-design/js`:

```html
<link rel="stylesheet" href="node_modules/signal-design/dist/signal.css">
<script type="module">
  import { init } from "./node_modules/signal-design/dist/signal.js";
  init();
</script>
```

`pnpm build:js` regenerates `dist/signal.js` (the charts entry is not
bundled; its Chart.js peer stays external).

The CSS and JS avoid Chromium-only features, so they behave the same in
WebView2 (Windows), WKWebView (macOS) and WebKitGTK (Linux).

## Themes

Set `data-theme` on `<html>` or on any element to theme a subtree.

| Theme | |
|---|---|
| `ink` (default, canonical) | Cool near-black greys, alpha hairlines |
| `graphite` (optional) | The lighter dark mode: grey `#1a1a1a` panels on a `#0f0f0f` frame, same two-level text as ink |
| `paper` | White canvas, deepened signal colors for contrast (`light` is the older name and still works) |
| `auto` | `ink`, or `paper` when the OS asks for light |

`setTheme("paper")` switches and remembers it; `<button data-sd-theme="paper">` does the same declaratively. `"light"` still works and means paper.

## Fonts

The text face is a role, like the colors. Set `data-font` on `<html>` or on any
element to change it for a subtree. Code stays in Source Code Pro whatever the
text face is.

| Font | |
|---|---|
| `system` (default) | SF Pro, the system UI font (Segoe UI on Windows) |
| `leon-sans` | Leon Sans, a geometric sans by Jongmin Kim (bundled, OFL, 115 KB, fetched only when picked) |
| `source-code-pro` | Source Code Pro for all text, with a real medium weight |

`setFont("leon-sans")` fetches the face, then switches and remembers it, so
text changes once instead of flashing through the fallback. It gives up waiting
after 400ms and switches anyway; the face fills in when it lands. When calls
overlap, the last one wins. `<button data-sd-font="leon-sans">` does the same on
click and keeps `aria-pressed` in sync.

Never name a family in your own CSS. Use the tokens, which follow the picker:

| Token | Tailwind | Is |
|---|---|---|
| `--sd-font-sans` | `font-sans` | The current text face |
| `--sd-font-mono` | `font-mono` | Source Code Pro, for code, charts and numbers |
| `--sd-font-reading` | `font-reading` | Literata, for prose read at length; `data-font` does not change it |
| `--sd-font-system` | | The system UI stack every text face falls back to |

To change a face for the whole app, override the `--sd-font-*` token, not
Tailwind's `--font-sans` or `--font-mono`. Charts, the rain and the picker read
the tokens, so they follow it.

### Reading face

Literata is a serif made for reading long text on screen (it was drawn for
Google Play Books), with true italics for emphasis and titles. It is SIL OFL 1.1,
and it ships as variable files cut to weights 400 to 600 at the default text
optical size, 130 KB in four files (regular and italic, Latin and Latin
Extended; the Latin Extended file is fetched only for a page that uses one of
its characters). `<Manuscript face="reading">` sets the page
in it; `class="sd-reading"` or `font-reading` does the same for any prose, with
a semibold `strong`. It is for text a person reads for minutes, not for labels,
buttons or tables.

### Ship only the faces you use

`@import "signal-design"` and `dist/signal.css` declare every bundled face: Source
Code Pro (six files, 202 KB), Leon Sans (115 KB) and Literata (four files, 130 KB).
A browser fetches a file only when text uses it, but a bundler copies every file
the CSS names. An app that wants fewer takes the core, which has the tokens, base
and every `sd-` component but no `@font-face`, and then one file per face:

```css
@import "tailwindcss";
@import "signal-design/css/core";
@import "signal-design/css/fonts/literata";
@import "signal-design/css/fonts/source-code-pro";
```

| Face file | Declares |
|---|---|
| `css/fonts/source-code-pro` | Source Code Pro (code) and its text-face cut for `data-font="source-code-pro"` |
| `css/fonts/leon-sans` | Leon Sans, for `data-font="leon-sans"` |
| `css/fonts/literata` | Literata, for `face="reading"`, `sd-reading` and `font-reading` |

Without Tailwind, link `dist/signal-core.css` and the `dist/font-<family>.css` of
each face, and keep `dist/fonts/` next to them. A face you leave out falls back
to the next family in its token: code to the system monospace, the reading face
to Iowan Old Style, Palatino or Georgia. `setFont("leon-sans")` with its face left
out switches the attribute and changes nothing visible.

## Color roles

| Role | Means |
|---|---|
| `accent` | selected, active, now |
| `success` | approved, passing, your position |
| `danger` | irreversible, high risk |
| `warning` | costly |
| `pending` | unproven, waiting |
| `extra` | people, presence |

Components take a `data-tone` attribute with one of these names (or `neutral`).
Use the role, not the hue: `text-danger`, not `text-pink`.

Every text color, `fg-faint` included, meets 4.5:1 on every surface of its
theme, so any of them can carry body copy.

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

## Icons

Icons are bare inline SVG, sized to the text. Signal draws them on a 24 grid
with 4 units of inset, so the box is `1.5cap`: the drawn shape spans the cap
height of the text beside it, and it follows the font at any size instead of
being pinned to px. Buttons, rows, navigation, messages and the shell use the
same rule.

```html
<span class="sd-icon-text">
  <svg class="sd-icon" viewBox="0 0 24 24" aria-hidden="true">…</svg>
  Save
</span>
```

`cap` is in every current engine (Safari 17.2 was the last to add it); the CSS
keeps an `em` fallback. Tailwind has no `cap` utility, but arbitrary values
take any CSS unit: `size-[1.5cap]` on the icon and `items-baseline` on the
label do the same. Icon-only controls still need an `aria-label`.

### The icon set

Signal draws a set of line icons for what an editor and its app need: history
(`undo`, `redo`), text (`bold`, `italic`, `underline`, `strike`, `list-bullet`,
`list-number`, `align-left`, `align-center`, `align-right`, `align-justify`),
margin and review (`comment`, `sparkle`, `history`, `bookmark`, `view`, `view-off`,
`link`, `unlink`), things (`person`, `person-remove`, `people`, `account`, `object`,
`place`, `write`, `edit`, `delete`, `copy`, `external`, `publish`, `download`, `sync`,
`warning`, `check`), status (`check-double`, `info`, `help`, `clock`, `timer`,
`block`, `shield-check`, `shield-alert`), chat (`hash`, `lock`, `reply`, `send`,
`pin`, `smile`, `select`, `image`, `file`, `join`, `leave`, `bell`, `bell-off`,
`megaphone`, `speaker`, `speaker-off`, `mic`, `phone`, `phone-off`), pictures for a
channel, a place or a group (`archive`, `bag`, `beaker`, `bolt`, `book`,
`building`, `bulb`, `calendar`, `desktop`, `fire`, `flag`, `gift`, `globe`, `home`,
`key`, `puzzle`, `rocket`, `tag`, `terminal`, `trophy`, `wrench`), app screens
(`container`, `chart`, `database`, `sliders`, `settings`, `logs`, `theme`, `rain`),
window controls (`minimize`, `maximize`, `restore`) and interface (`close`, `play`,
`pause`, `plus`, `minus`, `search`, `menu`, `more`, `arrow-right`, the four
`chevron-*`, `chevrons-left`, `chevrons-right`, `expand`, `contract`).
They follow the rest of the kit: straight lines and right angles, a 1.5 stroke
with square caps and mitered corners, `currentColor`, drawn inside the 4-unit
inset of the 24 grid so they size like any `sd-icon`. The component page lists
them all with their names.

```html
<button class="sd-btn sd-btn-icon sd-btn-ghost" aria-label="Undo">
  <svg class="sd-icon" data-icon="undo" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true"><path d="M9 5L4.5 9.5 9 14M4.5 9.5H15v8H9"/></svg>
</button>
```

`signal-design/js/icons` exports `ICONS` (each icon's path `d`), `ICON_NAMES` and
`icon(name, label?)`, which returns that markup for `innerHTML`; a `label`
makes it an image with that name, and an unknown name throws. In React,
`<Icon name="undo" />` renders the same SVG, decorative unless it has a
`label`, and `name` is typed as `IconName`.

## Signal App Shell

A full app frame: an optional title bar, a 96px icon rail, a 288px sidebar
with collapsible groups, a breadcrumb header (or a solid header bar), the page,
an optional dock, an optional right panel and an optional status bar. On
phones a top bar replaces the rail, and the rail and sidebar open together as
a drawer. See `showcase/chat.html` for the whole frame and `showcase/shell.html`
for one with no sidebar.

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
| `data-sd-shell="resize"` on a `.sd-sidebar-resize` | Drag, arrow keys (16px, Shift 64px), Home and End resize the sidebar between `aria-valuemin` and `aria-valuemax`; Escape cancels a drag. The width is remembered per sidebar `id`. |

The page sits inset in two lighter boxes (`--sd-container`), a header bar and
the content, with a gap where the shell background shows. Put a rain canvas
first in the shell to fill that gap:

```html
<canvas class="sd-rain" data-sd-rain aria-hidden="true"></canvas>
```

### Resizable sidebar

Put a separator last in the sidebar. It sits over the sidebar's trailing
border and is hidden while the sidebar is collapsed, peeking or in the phone
drawer.

```html
<aside class="sd-sidebar" id="sidebar">
  …
  <div class="sd-sidebar-resize" role="separator" aria-orientation="vertical"
       aria-label="Resize sidebar" aria-controls="sidebar" tabindex="0"
       aria-valuemin="224" aria-valuemax="480" aria-valuenow="288"
       data-sd-shell="resize"></div>
</aside>
```

With `data-sd-shell="resize"`, `init()` sets `--shell-sidebar` on the
`.sd-shell` (or on a `.sd-sidebar` used on its own), keeps `aria-valuenow`
current, sets `data-resizing` on it while a drag runs, stores the width in
`localStorage` under `sd-shell-sidebar-width:<sidebar id>`, and restores it on
load. `setSidebarWidth(shell, px)` does the same from code; `null` returns to
the width the page was authored with (an inline `--shell-sidebar`, else the
stylesheet's) and forgets the stored one. On a shell, `sd:shell` reports the
committed `width`; drags in progress do not fire it, and a standalone sidebar
fires nothing.

When a framework owns the width, leave out `data-sd-shell="resize"` and keep
the class, the role and the ARIA. Render `--shell-sidebar` on `.sd-shell` and
`aria-valuenow` on the separator from your state, handle the pointer and the
keys yourself, and set `data-resizing` on `.sd-shell` during a drag to get the
accent line, the column cursor and no text selection:

```jsx
<div className="sd-shell" style={{ "--shell-sidebar": `${width}px` }} data-resizing={dragging || undefined}>
  <aside className="sd-sidebar" id="sidebar">
    …
    <div className="sd-sidebar-resize" role="separator" aria-orientation="vertical"
         aria-label="Resize sidebar" aria-controls="sidebar" tabIndex={0}
         aria-valuemin={224} aria-valuemax={480} aria-valuenow={width}
         onPointerDown={startDrag} onKeyDown={stepWidth} />
  </aside>
```

When the sidebar is collapsed, the header's sidebar button flips to `»` and
can carry a `.sd-when-collapsed` label such as "Show sidebar".

The current section and page get a strong border on a raised grey; everything
else is grey, and nothing has a shadow.

### Compact rail of places

For an app whose rail lists places (groups, servers, workspaces) rather than
sections: square `sd-rail-tile`s with a picture, initials or an icon, in a
72px rail. Set `--shell-rail: 4.5rem` on `.sd-shell` (or on a rail used on its
own). Tiles mix with ordinary `sd-rail-item` tools.

```html
<div class="sd-rail-list">
  <a class="sd-rail-tile" href="/g/design" aria-current="page" aria-label="Design"><img alt="" src="design.png"></a>
  <a class="sd-rail-tile" href="/g/ops" data-unread aria-label="Operations, 3 unread">OP<span class="sd-badge-count" data-corner>3</span></a>
  <span class="sd-rail-tile" data-pending role="img" aria-label="Joining Hiking"><svg>…</svg></span>
</div>
```

| State | Looks like |
|---|---|
| `aria-current` (also `aria-pressed="true"`, `aria-expanded="true"`) | Strong border on a raised grey; `aria-current` adds a 40px edge on the rail's outer side. |
| `data-unread` | A 10px edge on the rail's outer side. |
| `data-pending` | A dashed border in a quieter grey, for a place that is still joining. |
| `.sd-badge-count[data-corner]` child | A count on the tile's top corner. Repeat it in `aria-label`, which replaces the tile's text. |

Use `a` or `button` for a tile you can open, which keeps keyboard focus; use a
`span` with `role="img"` for one that is not a control. `--tile` (48px) sets
the square; the edge follows `--shell-rail`. `sd-rail-item > .sd-avatar` still
fits a single avatar in a 96px icon-and-label rail; a tile is for rails that
are mostly places.

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
  <div class="sd-shell-content" data-sd-ornaments data-sd-edges>…</div>
  <div class="sd-shell-dock" data-sd-ornaments data-sd-edges>…composer…</div>
</main>
```

`data-flush` on the dock rests it on the bottom of the window: the shell gap
under it and its bottom border go, and its bridges still tie it to the content.

`data-joined` on `sd-shell-main` makes the bar, the content and the dock one
surface, for a page that reads as one column, such as a conversation: no gap
and no bridges, a hairline under the bar in line with the sidebar and aside
heads, and the dock's contents inset 16px (8px on phones). A composer in a
joined dock keeps its own edge, with the typing line over it. A split
`sd-shell-header` joins the same way: its crumbs and actions lose their boxes
and sit in one bar.

A count in `sd-icon-btn` sits after the icon, so it never covers the glyph.

`sd-popover-panel` with `sd-popover-head` and `sd-popover-body` makes a larger
popover for an inbox or a pinned list.

## Progress

`sd-progress` fills to `--value` (unitless `0`–`100`). When the amount is not
known yet, set `data-state="indeterminate"`: the bar becomes a static dashed
line in the pending tone (`data-tone` overrides it). It does not sweep or
pulse, because Signal moves only when state changes. Say what it waits for in
an `sd-progress-label` above it, and leave out `aria-valuenow`.

```html
<p class="sd-progress-label"><span>Checking for updates</span><span>waiting</span></p>
<div class="sd-progress" data-state="indeterminate" role="progressbar" aria-label="Checking for updates"></div>
```

Once the amount is known, drop `data-state` and set `--value` and
`aria-valuenow`; the bar shrinks to the value in 200ms. A native `<progress>`
without a `value` stays an empty track.

## Conversation and lists

Generic pieces for chat, comments, feeds and inboxes. See `showcase/chat.html`.

| Class | What |
|---|---|
| `sd-item` (+ `-body`, `-title`, `-sub`, `-end`) | A list row with avatar, text and meta; `data-unread`, `data-muted`. |
| `sd-avatar` (+ `-sm`, `-md`, `-lg`, `-xl`) | 22, 28, 34 and 48px squares (24px without a size class). `--sd-avatar-size` sets any other size, such as a profile preview; the initials and the presence square grow with it. |
| `sd-avatar[data-status]` | `online`, `away` (or `afk`), `busy`, `offline` square on the corner. |
| `sd-badge-count` | A count on an icon, rail item, rail tile or avatar. |
| `sd-message` (+ `-time`, `-body`, `-text`, `-author`, `-tag`, `-meta`, `-timer`, `-head`, `-status`, `-edit`) | A 64px time column, then the text; the author's name opens the first line in their color (`--who`). `data-grouped` (no time or name), `data-mention`, `data-pending`, `data-failed`, `data-own` (grey edge), `data-selected`, `data-reply`, `data-editing`, `data-hover`, and `--edge` for an author or role color. An `sd-badge` after the author says what they are (Agent). |
| `sd-message-actions` | The hover bar: quick reactions, then actions with `data-key` tips, then More. Revealed by opacity, so Tab reaches it. |
| `sd-message-menu`, `sd-add-menu`, `sd-emoji-picker` | The More menu (icon, label, key), the composer's + menu, and the emoji picker (search, categories, grid, a footer naming the emoji). |
| `sd-message-ref` (+ `sd-message-ref-mark`) | The quoted line above a reply; its mark sits in the time column. |
| `sd-reply`, `sd-mention`, `sd-event` | Quoted reply in a body or chip, inline mention (name color, no fill), system line with its icon in the time column. |
| `sd-feed-day`, `sd-feed-jump` | A day line that sticks to the top of the scroller (`--sd-feed-bg` is the pane color), and the Jump to present bar after the scroller. `data-sd-follow` on the scroller keeps the newest row in view while the reader is at the bottom (rows arriving, images loading, a composer growing under it), holds still once they scroll up, and runs the jump bar: `hidden` while at the bottom, its button goes back down. |
| `sd-reactions` (+ `-add`) | Emoji-first toggle buttons with a small count; fires `sd:reaction`. |
| `sd-receipts`, `sd-typing` | Read receipts and the typing line (its squares step while someone types). |
| `sd-composer` (+ `-row`, `-add`, `-send`, `-reply`, `-status`, `-chips`, `-hint`) | The message box: one + for every content type, the textarea, and a send that stays quiet until there is text. `-status` holds the typing line above it. In an `sd-shell-dock` they share one box. `data-sd-autogrow`, `data-sd-enter-submit`, and `data-sd-suggest="id"` for an `@` list. |
| `sd-roster` (+ `-group`, `-head`, `-label`, `-count`, `-row`, `-avatar`, `-name`, `-more`) | People in a large conversation: a section per role with a sticky, collapsible head, rows by `data-presence` (`online`, `offline`, `unresolved`), and a Show more row. An `sd-badge` after `-name` (Agent) takes the row's end. |
| `sd-banner` | A full-width notice with actions. |
| `sd-file`, `sd-link-card`, `sd-poll` | Attachment, link preview, poll (`--share` per option: its share of the voters, 0 to 100). A file row with no preview under it can be one `<button class="sd-file">` that opens the file. |
| `sd-file-preview` | A `<pre>` as the last child of a `<div class="sd-file">`: a text file's first lines, full width under the row, mono and muted, clipped to 7 lines with an ellipsis. Keep the file's actions in buttons inside it (`sd-file-dl`), never the whole card in one `<button>`: a `<pre>` cannot sit in a button, and its lines would become the button's name. |
| `sd-poll-head`, `-foot`, `-voters`, `data-chosen` | A decision: a poll one person decides, such as an agent asking to approve or deny. `-head` holds its state badge and the time left, `data-tone` lights its edge while it waits, `data-chosen` marks the pick, `-voters` names who tapped an option in their `--who`. `-foot` is a meta row under the options. |
| `sd-link-card-hero`, `-compact`, `-type`, `-note`, `-actions` | Link preview variants: image on top, one tight block, a document with its type, a reason line, and buttons under the text (Join on an invite). `data-blocked` and `aria-busy="true"` are states. |
| `sd-link-card-media`, `-dismiss`, `-thumb-label`, `-thumb-action` | A card that is only an image or GIF, shown whole; a dismiss button; a label and an action over the media. `role="link"` on a `<div>` card hovers like a link. |
| `sd-shot` (+ `-caption`, `-hint`, `-status`, `-note`) | A media frame at `--ratio`. As a `<button>` it is an image attachment that opens a viewer: the border strengthens on hover and focus and `-hint` (a decorative icon, `expand`) shows then. `aria-busy="true"` shows `-status` (Downloading); `data-failed` shows `-note` (a danger reason) in place of the media. |
| `sd-tiles`, `sd-tile` | Call grid; `data-speaking`, `data-muted`, `data-hand`. |
| `sd-grid-picker` | An emoji or icon grid (`--cols`). |
| `sd-level` | A live level meter, such as a microphone input: 2 to 8 `<i>` bars that light up to `--level` (`0`–`1`). |

`sd-level` moves only when your level changes. Write `--level` and
`aria-valuenow` from the same value, for example each audio analyser frame; a
bar fades in 120ms when the value crosses it, and nothing loops while the level
holds. Bars rise in height from left to right, `--h` sets the tallest (default
`1.5cap`), and `data-tone` colors the lit bars.

```html
<span class="sd-level" data-tone="success" role="meter" aria-label="Microphone level"
  aria-valuemin="0" aria-valuemax="1" aria-valuenow="0.6" style="--level: 0.6"><i></i><i></i><i></i></span>
```

Cut-outs take the color of what they sit on: the ring around a presence
square, the ring around a corner `sd-badge-count`, and the gaps in an
`sd-avatar-stack`. Every Signal surface (rail, sidebar, cards, the content
box, menus, popovers, dialogs, hovered and current rows) sets `--sd-ring` to
its own background, and outside them it is the page canvas. On a panel of
your own, set it to the panel's background:
`<div class="bg-surface" style="--sd-ring: var(--sd-surface)">` (Tailwind:
`[--sd-ring:var(--sd-surface)]`).

Link cards come in a few shapes for one URL preview:

- `sd-link-card-hero` puts the thumb across the top at 1.91:1, the og:image
  ratio. The thumb can be an `<img>`, an animated GIF or a muted `<video>`.
- `sd-link-card-compact` is one tight block with a 40px thumb and no
  description, for a busy chat.
- `sd-link-card-type` replaces the thumb with a page labelled `pdf`, `docx` and
  so on; put the page count and size in `sd-link-card-desc`.
- `data-blocked` marks a preview the app refused to fetch: a dashed border, a
  danger edge (or the `data-tone` you set) and an `sd-link-card-note` with the
  reason. Render it as a `<div>`, not a link.
- `aria-busy="true"` turns the site, title and description slots into static
  placeholder bars while the preview loads. Add `role="status"` and a
  `sd-sr-only` line so screen readers hear it.
- `sd-link-card-actions` holds buttons under the text. An embed shaped like a
  link card, such as a group invite, uses it for Join. A card with actions is a
  `<div>`.
- A card the app opens itself is a `<div role="link" tabindex="0">`; it takes
  the pointer cursor and the same hover edge as an `<a>` card.
- `sd-link-card-dismiss` goes on an `sd-btn sd-btn-ghost sd-btn-icon sd-btn-sm`
  that removes the preview. It holds the top of the end column; in a hero or
  media card it floats over the image's corner. Put it right after the site
  line, and stop its click from opening the card. Do not use it on a card with
  a side thumb or `-type` page: they hold the same column.
- `sd-link-card-media` is a card that is only an image, GIF or `<video>`. It
  needs no `-hero` and no padding classes: the thumb (`sd-link-card-thumb`, an
  `<img>`, or a `<div>` holding the `<img>` or `<canvas>`) shows whole, never
  cropped, up to 20rem tall. Set `--sd-media-max` for another height, or add
  `sd-link-card-compact` for 6rem. `sd-link-card-thumb-label` (Paused) and
  `sd-link-card-thumb-action` (an `sd-btn sd-btn-sm`, Play) go inside a
  `<div>` thumb, over its corners.
- Width: a card fills its column up to 32rem; as a direct child of
  `sd-message-body` it takes the full body width up to 30rem, like a file or a
  poll. Do not set `max-width` on a card.

```html
<div class="sd-link-card" data-blocked>
  <span class="sd-link-card-site">free-prizes.example</span>
  <span class="sd-link-card-title">free-prizes.example/claim?id=4417</span>
  <span class="sd-link-card-note">Preview blocked: this site is on the unsafe list.</span>
</div>
<div class="sd-link-card" aria-busy="true" role="status">
  <span class="sd-sr-only">Loading link preview</span>
  <span class="sd-link-card-site"></span><span class="sd-link-card-title"></span>
  <span class="sd-link-card-desc"></span><span class="sd-link-card-thumb"></span>
</div>
```

A message's start edge carries one color at a time. `--edge` sets an author
or role color; it is user data, so pass it as a custom property
(`style="--edge: var(--role-color)"`) rather than a tone, and note that it
inherits, so a wrapper can set it for a run of messages. State edges win over
it in a fixed order: `data-failed` > `aria-current` > `data-selected` >
`data-mention` > `data-own` > `--edge`. `data-own` gives the viewer's own messages a grey
edge (`--sd-line-strong`) and no fill; `data-selected` (an accent edge on `--sd-raised`) marks
messages picked for a bulk action. `data-mention` and `aria-current` have their
own fills, `--sd-mention-fill` and `--sd-current-fill`, which read against both
`--sd-canvas` and `--sd-surface`. Names take `--who`, the person's name color
(user data, like `--edge`), on the author, an `sd-mention`, a quoted author and
the reply bar, and fall back to `extra`: every name in a conversation is colored.
The app decides grouping (same author within a few minutes) and sets
`data-grouped`. Author names in `sd-message-head`, `sd-message-ref` and
`sd-reply` truncate with an ellipsis, and the body column shrinks, so a long
unbroken name cannot push a row off-screen. `data-selected` is only the look: expose the
choice with a real control, such as a labelled checkbox in the message.

`data-sd-contextmenu="menu-id"` opens a menu at the pointer on right click,
Shift+F10 or the menu key, and fires `sd:contextmenu` with the target. On a
touch screen a long press opens it where the finger lifts (iOS sends no right
click); past the hold the row carries `data-sd-held`, and on a coarse pointer
the row does not start a text selection, so put Copy in the menu.

On phones give the composer's textarea `enterkeyhint="send"`, so the keyboard's
return key reads Send when `data-sd-enter-submit` sends on Enter.

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
| `sd-options`, `sd-option` | `data-sd-seg` (buttons only) | Option cards in a wrapping grid: title, description, optional preview. |

Option cards are for a choice that needs more than a word: a theme with a
preview, an audio profile with a sentence about it. Put radios (one choice) or
checkboxes (several) inside labels and the cards need no JS; the input covers
the card, so clicks, arrow keys and focus are the browser's own. Buttons work
too, with `aria-pressed` or `aria-checked`, and `data-sd-seg` on the grid
keeps one of them pressed. The selected card gets a 2px edge, a raised fill
and a solid corner square. `--min` sets the narrowest column (default 12rem).

```html
<div class="sd-options" role="radiogroup" aria-label="Theme">
  <label class="sd-option">
    <input type="radio" name="theme" value="ink" checked>
    <span class="sd-option-preview" aria-hidden="true">…</span>
    <span class="sd-option-title">Ink</span>
    <span class="sd-option-desc">Near-black. The default.</span>
  </label>
  …
</div>
```

Mark a decorative preview `aria-hidden="true"` so it stays out of the
choice's accessible name.

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

## ASCII art

Pieces from [ascii-magic-art](https://github.com/kailashsr38/ascii-magic-art)
(by ASCII Magic) play as text inside Signal's rules. The package is an
optional peer dependency, and nothing in `signal-design/js` imports
`signal-design/ascii`.

```bash
pnpm add ascii-magic-art
```

```html
<div class="sd-ascii" role="img" aria-label="Spinning torus"></div>
```

```js
import { mountAscii } from "signal-design/ascii";
import * as piece from "ascii-magic-art/pieces/spinning-torus.js";

const art = mountAscii(document.querySelector(".sd-ascii"), piece, { at: 1.4, look: "dots" });
art.busy(true);   // play now; art.busy() follows aria-busy again
art.destroy();
```

The art is DOM text in a `<pre>`, so it is selectable and takes the theme. The
piece's own colors are not painted: each palette color becomes one of three
greys by its brightness (`--sd-fg`, `--sd-fg-muted`, `--sd-fg-subtle`), and the
brightest is the strongest, so every theme reads. `data-tone="danger"` (or any
tone) colors the brightest level and nothing else. `look` redraws a piece in
other characters: `dots`, `ascii`, `dense`, `numbers`, `binary`, `letters`,
`blocks`, `squares`, `lines` or `dither`. `at` is the second of the still frame
and `speed` scales playback. Square-cell pieces (`meta.cell === "square"`) are not drawn: `mountAscii`
throws a `TypeError` for them.

**Motion.** A piece is a still frame. It plays only while it is busy: the
element, or its closest ancestor with `aria-busy`, says `aria-busy="true"`, or
`busy(true)` was called (an explicit call wins until `busy()`). It also needs
to be on screen and in a visible tab, and `prefers-reduced-motion` keeps it
still. When it stops it keeps the frame it is on.

Call `destroy()` when you remove the element: it is the normal teardown, and
it releases the shared observers once the last mount is gone. A mount whose
element has left the document drops itself the next time the page's `aria-busy`
or visibility state changes, which is a backstop and not a replacement.
Mounting again on an element destroys the mount that was there, and the old
handle then does nothing.

The text fits the width of its box and never scrolls sideways: size it with
`--sd-ascii-size` (12px by default, the largest it draws). Give `.sd-ascii` a
definite width: block flow, or an explicit width or flex-basis. It collapses to
nothing in a shrink-to-fit box such as an auto-width flex item, an absolutely
positioned box without a width, or a table cell. Load pieces with a
dynamic `import()` so a page only fetches the ones it shows.

**Pieces.** 54 of the package's pieces are square-cell, mostly hand-built
picture scenes. `mountAscii` does not draw them, and the showcase does not load
them.

**License.** The package and its pieces are MIT, except `ocean-sunset` and
`starry-ridge`: halftones of Unsplash photos, under the Unsplash License. Both
are among the square-cell pieces. Credit the source where you show the art: "Art from
ascii-magic-art by ASCII Magic, MIT".

## Stream scenes

`sd-scene` is a 16:9 broadcast frame for OBS browser sources, laid out in
1920×1080 units (`--sd-u` is one pixel of that frame), so the same markup reads
as a small preview and as a full 1080p source. `data-full` fills the viewport;
`data-clear` drops the background for a scene that sits over game capture.

Pieces: `sd-scene-fade` (a flat canvas layer masked open on one side, or
`data-side="center"`), `sd-scene-copy` > `sd-scene-kicker`, `sd-scene-title`,
`sd-scene-count`, `sd-scene-line`; `sd-scene-bar` with `sd-scene-label`s and
`sd-scene-bar-end`; `sd-scene-labels`; `sd-cam` > `sd-cam-feed` + `sd-cam-tag`;
`sd-scene-goal` around an `sd-cells`; `sd-credits` > `sd-credits-roll`; and the
alert, `sd-stream-alert` > `sd-stream-alert-body`. `sd-live` is the blinking
live square.

```js
import { mountStream } from "signal-design/js";
const stream = mountStream(document.querySelector(".sd-scene"));
stream.alert({ kind: "follow", name: "nightowl_42" });
stream.alert({ kind: "raid", name: "tidepool", detail: "Raiding with 42 viewers" });
```

Alerts queue and show one at a time, in their tone (follow is `extra`, sub
`success`, raid `accent` and big, bits `warning`), with a burst of flat square
particles and one shimmer across the name. `[data-sd-latest="follow"]`,
`[data-sd-goal="sub"]` and `[data-sd-timer="300"]` / `"up"` update on their own.
A stream scene loops (rain, credits, the live square), and
`prefers-reduced-motion` stops it. See
`showcase/stream.html`; `stream.html?scene=start` is the scene alone as a source.

## Ornaments

```html
<div class="sd-shell-content" data-sd-ornaments>…</div>
```

Dust in the bottom-right corner by default: small filled squares, outlines
and dots, strongest at the corner and thinning as they spread. Ask for two
corners (`data-sd-ornaments="tl br"`) and the first gets larger "blocks".
Theme text color only, seeded so it never changes between loads, and painted
as the element's background so it stays put while content scrolls.

About one square in eight sparkles: it rests most of a slow 6 to 14 second
cycle, then brightens briefly, each at its own offset, so the ornament glints
without pulling the eye. It is an animated SVG, so it costs no script per
frame. `prefers-reduced-motion` turns it off, and `data-sd-ornaments-still` keeps
one element still.

Empty states (`.sd-empty`) get a center ornament on their own: a small dust
field behind the message, sparkling the same way. `data-sd-ornaments="none"`
turns it off, and `data-sd-ornaments="center"` puts one on any box.

### Art ornaments

```html
<article data-sd-ornaments="contours">…</article>
<aside data-sd-ornaments="tl lattice" data-sd-ornaments-size="260">…</aside>
<div class="sd-empty" data-sd-ornaments="dashed">…</div>
<article data-sd-ornaments="contours" data-sd-ornaments-seed="elderwood">…</article>
```

Name a style next to the placement and that drawing replaces the dust. With no
placement it goes bottom right, or the center of an `.sd-empty`. The styles are
ported from Publighter's generated covers and its landing book:

| Style | Draws | For |
|---|---|---|
| `contours` | nested hand-drawn rings, like map hills | fiction |
| `lattice` | a grid of small squares that thins out | research |
| `waveform` | a signal over its noise | blogs and notes |
| `dashed` | nested dashed frames | empty and planned things |
| `book` | the hero's open book: hinged pages, a wire lattice, pixel text rows with the first 60% written | the editor, a hero |
| `stack` | a manuscript: a page, two behind it, ruled text and a caret | manuscripts |

Placements are the dust's: `tl`, `tr`, `bl`, `br`, `top`, `bottom` (an edge,
across the box) and `center`. `data-sd-ornaments-size` is the picture's side in
px (default 340); keep it at or under the box so the book and the stack are not
cut. `data-sd-ornaments-seed` takes a number or any text and gives each item
its own `contours`, `lattice` or `waveform`, so every project can have its own
cover; `dashed`, `book` and `stack` are the same every time.

They are still pictures, drawn as 1px lines and small squares in the theme's
text color. Nothing animates, so there is no reduced-motion variant and
`data-sd-ornaments-still` has no effect. Nothing is added to the DOM, so a box
and its content do not move, and the background takes no clicks. A caption is
yours to add (the library's figures use `sd-label`).

**Contrast budget.** The art is drawn no louder than the dust at its corner:
within about 0.2 of the dust's worst case below, a little better on ink and
graphite and a little worse on paper. On its single brightest pixel, over `--sd-canvas` and `--sd-surface`,
in every style and placement, text keeps at least this much contrast. The
check measures it in Chromium and WebKit and fails below the budget column.

| Theme | `--sd-fg` | `--sd-fg-muted` | `--sd-fg-subtle` | Dust, for reference |
|---|---|---|---|---|
| ink | 11.9:1 | 4.9:1 | 4.1:1 | 11.8, 4.9, 4.0 |
| graphite | 9.5:1 | 4.6:1 | 3.6:1 | 9.4, 4.6, 3.6 |
| paper | 9.7:1 | 6.4:1 | 3.1:1 | 9.8, 6.5, 3.2 |
| Budget | 7:1 | 4.5:1 | 3:1 | |

That is the worst case, at the strongest pixel. Keep small labels
(`--sd-fg-subtle`) off the corner the art grows from.

## Scrollbars

`init()` hides scrollbars until something scrolls and hides them again 2s
after the position stops changing. Only the thumb color changes, so nothing
shifts. `init({ scrollbars: "always" })` keeps them visible.

A page that must not call `init()`, such as a React app, gets the same
scrollbars from `initScrollbars()` in `signal-design/js`. It sets
`data-sd-scrollbars` on `<html>` and starts the scroll listener once, and
nothing else. Call it again to change the mode, as in `initScrollbars("always")`.
It does nothing without a `document`, and `signal-design/js` imports in Node, so a
client entry that server rendering also evaluates does not throw.

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
| `data-sd-open="id"`, `data-sd-close` | Open a `<dialog>` as modal; close the nearest one. Escape and a backdrop click close it unless `data-sd-static` (empty: both off; `data-sd-static="escape"` or `"backdrop"`: only that one off). |
| `popovertarget` + `.sd-popover` | Place the popover next to its trigger and flip at edges. In `role="menu"`: arrows, Home/End, type to jump. |
| `role="tab"` | Select tabs and panels, arrow keys, roving focus. |
| `data-sd-toggle="id"` | Open and close an `.sd-expand`, keep `aria-expanded` in sync. |
| `data-sd-seg` | Single-select button group; fires `change`. |
| `data-sd-key="a"` | Click the element when the key is pressed (not while typing). |
| `data-sd-tip="text"` | Tooltip on hover and focus. |
| `data-sd-copy="#id"` | Copy text and confirm with a toast; if the browser cannot copy, explain that the text can be selected instead. |
| `data-sd-toast="text"` | Show a toast on click. |
| `data-sd-theme="name"` | Switch theme and remember it. |
| `data-sd-font="name"` | Switch the text font (`system`, `leon-sans`, `source-code-pro`) and remember it. |
| <kbd>Shift</kbd>+<kbd>T</kbd> | Steps the theme on every page (`init({ themeKey })` changes or turns it off; `cycleTheme()` does it from code). |
| `data-sd-window="minimize\|maximize\|close"` | Window buttons (Tauri or `sd:window`). |

TypeScript types ship in `src/js/index.d.ts`, including the `sd:*` events on
`document`.

### Countdowns

Call `mountCountdown(root)` explicitly, then supply
`set({ remainingMs, running })` whenever your authoritative time changes.
The root contains `[data-sd-countdown-value]` for whole seconds and an optional
`.sd-progress[role="progressbar"]` for elapsed percent. Give the progress bar
an accessible label. `init()` does not mount countdowns.

The controller uses a deadline while running and retains the supplied value
while paused. It sets `data-state="running|paused|complete"`, numeric ARIA,
and `--value`; `sd:countdown` reports state transitions with `remainingMs`
and `running`. Zero completes the display. Progress uses the largest remaining
time supplied since mount or the last completion. Dispose before mounting a different task.
`dispose()` stops timers and later updates. Eligibility and actions stay with
your application; the displayed countdown does not authorize anything.

### Live feeds and scoped shortcuts

`mountFeed(root, options)` controls a scroll box of `.sd-row[data-id][data-order]`
rows. IDs stay stable across updates. Numeric order controls `oldest()` and
`newest()`; `move(delta)` follows DOM order. `select(id)` accepts application
targets. Selection writes `aria-current`; `sd:feed` reports `activeId`, the
count of rows entirely above the viewport, and `returnPending`.

Call `beforeUpdate()`, change the DOM synchronously, then call `afterUpdate()`
to retain the visible anchor, including while reading expanded details.
`refresh()` reconciles selection without anchoring. Optional `returnTarget`
returns a row ID or marker element for idle return after `idleMs` (default
2400). `canReturn` defaults to false while a descendant is expanded.
`suspend(true)` cancels return and motion; `suspend(false)` allows future
scrolls to arm return. `dispose()` removes listeners and timers.

`hotkeys(map, { target, enabled, sequenceTimeout, repeat })` scopes bindings to an
event target. `enabled` accepts a boolean or event predicate. Sequences such
as `"g t"` expire after `sequenceTimeout` milliseconds (default 900). A single
key binding takes precedence if it is also a sequence prefix. Single-key bindings repeat by default for held navigation keys. Use
`repeat: false` for action bindings. Sequences never repeat. Handled events,
composition, native Enter/Space, and typing are ignored, except the
existing Mod and Escape bindings while typing. Bind modal shortcuts to that
dialog; document bindings pause while a modal is open. Call the returned
function to remove bindings and pending sequences.

### Living tables

Living tables keep one native table and its cells while metadata folds beneath
the row title. Ordinary `sd-table` markup keeps its existing behavior.
Use `.sd-living-table[data-sd-living-table]` around `.sd-table-wrap > table.sd-table`.
Give the wrapper an id, and add a hidden `[data-sd-living-resize]` sibling with
an accessible label. The showcase and `ai/components.json` contain a complete
copyable example with its mounting code.

Use one `thead` row of `th[scope="col"]` cells. The first column is the row title.
Set `data-fold="1"` on headers that fold at 48rem, and `data-fold="2"` on those
that fold at 32rem. Each `tbody[data-id]` has a stable, unique group id. Start it
with `tr.sd-living-table-group > th[scope="rowgroup"][colspan]`, spanning all
columns, and a disabled button with `aria-expanded="true"`. Optional
`.sd-living-table-count` text inside the button receives the row count.
Item rows start with `th[scope="row"]` and have one cell per column.
Unmounted content stays a static table with disabled disclosures and a hidden grip.

```js
import { mountLivingTable } from "signal-design/js";
const table = mountLivingTable(document.getElementById("work-table"));
table.toggle("review", false);
table.resize({ width: 480 });
table.resize({ width: null });
table.refresh();
table.dispose();
```

Mount explicitly after the DOM exists. `init()` does not mount living tables.
Duplicate live mounts throw. `toggle(id, open?)` uses the group id and toggles
when `open` is omitted. `resize({ width })` accepts finite CSS pixels or `null`.
The effective minimum is 320px or the available parent width, whichever is smaller.
The maximum is the parent content width. Parent shrinkage clamps the rendered
width while retaining the requested width for regrowth. The grip reports the
rendered width through `aria-valuenow`.

Drag the trailing grip with a mouse, pen, or touch. Arrow keys resize by 16px,
Shift arrows by 64px, Home selects the minimum, and End selects the maximum.
Horizontal controls respect RTL. Escape, pointer cancellation, or lost capture
cancels a drag. No height resize or persistence is included.

`refresh()` reconciles added or removed rows and groups, their roles, counts,
and visual metadata labels. Call it after moving a mounted table to another
container to update width bounds and observe the current parent.
Generated labels follow header text changes.
Authored `data-label` values take precedence. Change the column schema only
after disposal, then remount.
Replacing header nodes with the same column count and fold settings is supported.
`dispose()` restores owned attributes, inline styles and priorities, count text,
and each group's original disclosure and row visibility. It removes listeners
and observers. Later calls do nothing.

`sd:living-table` bubbles on committed changes with `{ width, collapsed }`.
`width` is the rendered CSS width; `collapsed` contains stable group ids.
Mounting, unchanged calls, and intermediate drag positions emit no event.
CSS container queries and subgrid handle layout, requiring Chromium 117+ or
Safari 16+. Folded column headers retain their table associations. Visual field
labels use CSS generated content with empty alternative text.

### State contract

The JS only writes attributes and `data-*`; the CSS only keys on those (never
a JS-added class). So the same state can be driven from code without the JS —
tests, app bindings, a verification harness — and anything that reads state
gets the same answer:

| State | Where it applies |
|---|---|
| `data-tone="success\|pending\|danger\|accent\|warning\|extra\|neutral"` | Tones a subtree: cards, chips, items, stat boxes, checks, progress. Resolves to `--tone`. |
| `aria-selected="true"` | Selection in `sd-tabs`, `sd-item`, `sd-table` rows, `sd-seg`, `sd-grid-picker`, `sd-menu`. |
| `aria-pressed="true"` | Toggle state in `sd-chip`, `sd-seg`, `sd-option`, `sd-poll-option`, `sd-reactions`, `sd-icon-btn`. |
| `aria-expanded="true"` | `sd-icon-btn` (popover/menu triggers), `sd-rail-item`; `aria-controls` points at the panel. |
| `data-own`, `data-selected`, `--edge`, `--who` on `.sd-message` | Own-message grey edge, bulk selection, author or role edge color, name color. |
| `aria-current` (any value but `"false"`) | Current location in `sd-nav`, `sd-sidenav`, `sd-sidebar-link`, `sd-breadcrumb`, `sd-pagination`, `sd-rail-item`, `sd-rail-tile`, `sd-message`; `sd-steps` uses `aria-current="step"`. |
| `aria-sort="ascending\|descending"` | Sort direction of a `th[data-sort]` in `sd-table`. |
| `--shell-sidebar` on `.sd-shell`, `aria-valuenow` on `.sd-sidebar-resize`, `data-resizing` | Sidebar width in px, its separator's value, and a drag in progress; written by `data-sd-shell="resize"` and `setSidebarWidth`. |
| `data-sidebar`, `data-aside`, `data-drawer`, `data-peek` | `sd-shell` layout state; toggled by `setSidebar`/`setAside`/`setDrawer` and read back from `dataset`. `.sd-expand` panels open/close via `data-open` (kept in sync with `aria-expanded`). |
| `--value` on `.sd-progress` | Progress, unitless `0`–`100`. |
| `data-state="indeterminate"` on `.sd-progress` | Unknown amount: a static dashed bar in the pending tone. |
| `--level` on `.sd-level` | Live level, unitless `0`–`1`; pair it with `aria-valuenow`. |
| `data-theme` (element or `<html>`) | Themes a subtree; `setTheme` also remembers it in `localStorage`. |
| `data-font` (element or `<html>`) | Sets the text face of a subtree; `setFont` also remembers it in `localStorage`. |
| `data-sd-scrolling` on `<html>` | Present while the page is scrolling; drives the auto-hiding scrollbars. |

Events bubble on `document`: `sd:tab`, `sd:theme`, `sd:font`, `sd:shell`, `sd:window`,
`sd:contextmenu`, `sd:reaction` — with `detail` payloads typed in
`src/js/index.d.ts`.

### Framework-owned state

When React, Vue, Svelte or any other framework renders a piece's state, that
framework is the only writer. Leave out the piece's `data-sd-*` behavior
attribute and render the state attributes from the State contract above. The
JS writes the same attributes the framework renders. With both writing, the
DOM and the framework's state drift apart, and the next render undoes the
click.

```jsx
// React owns the view: no data-sd-seg, aria-pressed comes from state.
<div className="sd-seg" role="group" aria-label="View">
  {["list", "board"].map((v) => (
    <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)}>{v}</button>
  ))}
</div>
```

These classes work with CSS alone once you render their state:

| Class | Render this | Leave out | You handle |
|---|---|---|---|
| `sd-seg` | `aria-pressed` on each button | `data-sd-seg` | Clicks; the `change` event is gone. |
| `sd-expand` + its trigger | `data-open` on the panel, `aria-expanded` and `aria-controls` on the trigger | `data-sd-toggle` | Clicks. |
| `sd-shell` | `data-sidebar="collapsed"`, `data-aside="open"`, `data-drawer`, `data-peek`, `--shell-sidebar` | `data-sd-shell`, `data-sd-section` | Toggles, Escape, `inert` on `.sd-shell-main` while the drawer is open, focus. |
| `sd-rail-item`, `sd-sidebar-link`, `sd-nav`, `sd-sidenav`, `sd-breadcrumb`, `sd-pagination`, `sd-item`, `sd-message` | `aria-current`, `aria-selected`, `aria-expanded` | `data-sd-section` | Routing. |
| `sd-sidebar-panel` | `hidden` on the panels that are not shown | `data-sd-section` | Which panel shows. |
| `sd-reactions` | `aria-pressed` and the count in `<b>` | `data-sd-reaction` | Counting; `sd:reaction` is gone. |
| `sd-poll` | `aria-pressed` on options, `--share` on each | `data-sd-poll` | Single or multiple choice. |
| `dialog.sd-dialog` | `showModal()` and `close()` from your code | `data-sd-open`, `data-sd-close` | Focus return in WebKit (`openDialog` does it). |
| `sd-composer` | your textarea height, `hidden` on `.sd-suggest`, `aria-selected` on its options | `data-sd-autogrow`, `data-sd-enter-submit`, `data-sd-suggest` | Growing, Enter to send, mentions. |
| `sd-feed-jump` | `hidden` on the jump bar, the feed's scroll position | `data-sd-follow` | Staying at the newest row, the jump back down. |
| `sd-combobox`, `sd-tags`, `sd-number`, `sd-command` | `aria-expanded`, `aria-selected`, `hidden` on options, chips, the value | `data-sd-combobox`, `data-sd-tags`, `data-sd-number`, `data-sd-palette` | Filtering, keys, values. |
| `sd-progress`, `sd-table th[data-sort]`, `data-tone` | `--value`, `aria-sort`, `data-tone` | (none) | Nothing: these have no JS. |

Safe to keep in framework apps, because they write only nodes and attributes
Signal creates: `toast()`, `hotkeys()`, `data-sd-key`, `data-sd-copy`,
`data-sd-toast`, `data-sd-theme`, `data-sd-font`, and `data-sd-tip` (it adds a tooltip to
`<body>` and sets `aria-describedby` on the owner while it shows, so do not
render `aria-describedby` there yourself). `mountFeed`, `mountCountdown` and
`mountLivingTable` own the subtree you mount them on. Do not render state
inside it.

`init()` also acts on some markup that has no `data-sd-*` attribute. If your
framework owns one of these, do not call `init()` on that page, or let Signal
own the piece and copy its events into your state:

- `role="tablist"` and `role="tab"`: on load and on every click or arrow key,
  it writes `aria-selected` and `tabindex` on the tabs and `hidden` on their
  panels (`sd:tab` reports it).
- `.sd-shell`:
  - On load it applies the stored `sd-shell-sidebar` choice as `data-sidebar`.
  - Between 48rem and 64rem it sets `data-sidebar="collapsed"`, on load and
    when the window crosses that range.
  - Below 75rem it removes `data-aside="open"`.
  - Escape, or a click on an `sd-sidebar-link` while the sidebar peeks or
    the drawer is open, clears `data-peek` and `data-drawer`, and below
    75rem also `data-aside` (`sd:shell` reports it).
- `[popovertarget]` with a `[popover].sd-popover`: positions the popover
  (inline `style`, `data-side`), sets `aria-expanded` on the invoker, and
  closes the popover when a `menuitem` or `option` in it is clicked.
- `<dialog open>`: Escape closes it unless it has `data-sd-static` or
  `data-sd-static="escape"`.
- `.sd-table-wrap`, `.sd-code > pre`, `pre.sd-diff`, `.sd-statusbar`: get
  `tabindex="0"` when they overflow and `data-sd-scrolling` while they
  scroll. `<html>` gets `data-sd-scrollbars` and `data-sd-scrolling-page`.
- `.sd-empty`: gets inline background styles, and an `aria-hidden` span unless
  it has `data-sd-ornaments="none"`.
- `.sd-titlebar`: gets `data-maximized` from the Tauri window.

## React

`signal-design/react` is a set of typed React 19 components for the parts that
carry state. They render the `sd-` classes and the ARIA and `data-*` state from
the State contract, so React is the only writer and none of them needs
`init()`. It is part of this package: `react` and `react-dom` are optional peer
dependencies, and nothing changes for a project without React.

The components bring no CSS. Load Signal once, as in the sections above:
`@import "signal-design";` with Tailwind, or `import "signal-design/dist/signal.css";`
without it.

```jsx
import { useState } from "react";
import { Button, Dialog, DialogBody, DialogClose, DialogFooter, DialogHeader, Field, Input } from "signal-design/react";

function Rename({ name, save }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(name);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Rename</Button>
      <Dialog open={open} onOpenChange={setOpen} size="sm">
        <DialogHeader>Rename</DialogHeader>
        <DialogBody>
          <Field label="Name" error={value ? undefined : "Name is required."}>
            <Input value={value} onChange={(event) => setValue(event.target.value)} />
          </Field>
        </DialogBody>
        <DialogFooter>
          <DialogClose><Button variant="ghost">Cancel</Button></DialogClose>
          <Button variant="primary" onClick={() => { save(value); setOpen(false); }}>Save</Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}
```

Tabs take their state the same way; `TabList` needs a `label`:

```jsx
import { Tab, TabList, TabPanel, Tabs } from "signal-design/react";

<Tabs defaultValue="overview">
  <TabList label="Project">
    <Tab value="overview">Overview</Tab>
    <Tab value="activity">Activity</Tab>
  </TabList>
  <TabPanel value="overview">…</TabPanel>
  <TabPanel value="activity">…</TabPanel>
</Tabs>
```

| Part | Components | State |
|---|---|---|
| Buttons | `Button`, `IconButton`, `buttonClass()` for links | `busy` sets `aria-busy` |
| Fields | `Field`, `Input`, `Textarea`, `Select`, `Checkbox`, `Switch` | `Field` gives its control the id, `aria-describedby`, `aria-invalid` and `required`; the controls are native, so `value` or `defaultValue` and `checked` or `defaultChecked` both work; `Checkbox` and `Switch` take `label` and `description`, or just `aria-label` or `aria-labelledby` for a bare control in a table cell or toolbar, which renders no text and is only as wide as the control; type a wrapper with `CheckboxProps` or `SwitchProps` (or `Omit<…, "className">` of them, or of `ComponentProps<typeof Checkbox>`) for the labelled form and `BareCheckboxProps` or `BareSwitchProps` for the bare one, and for a bare wrapper write `BareCheckboxProps & { dense?: boolean }` and destructure the extra prop, because `Omit` of a bare type makes the name optional again |
| Status | `Badge`, `CountBadge`, `Avatar`, `AvatarStack` | `tone` is `data-tone`, `status` is `data-status` |
| Surfaces | `Card`, `Panel`, `EmptyState`, `Table` with its rows, headers and cells | `TableHeader sort` is `aria-sort`, `TableRow selected` is `aria-selected` |
| Overlays | `Dialog`, `Sheet`, `Popover`, `Menu`, `Tooltip`, `ToastProvider` with `useToast()` | `open` or `defaultOpen` with `onOpenChange` |
| Navigation | `Tabs`, `TabList`, `Tab`, `TabPanel` | `value` or `defaultValue` with `onValueChange` |
| Shell | `AppShell`, `Rail`, `RailItem`, `Sidebar`, `SidebarPanel`, `SidebarGroup`, `SidebarLink`, `ShellMain`, `ShellToggle`, `ShellAside`, `Statusbar`, `useShell()` | `sidebar`, `aside`, `drawer` and `section`, each controlled or default |

What they take over from `init()`:

- **Dialog and Sheet** run on the native `<dialog>`. `showModal()` follows
  `open`, the browser keeps focus inside and handles Escape, and its `close`
  event reaches `onOpenChange`. Focus returns to the opener and a backdrop
  click closes it. `static` turns off both Escape and the backdrop;
  `closeOnEscape={false}` or `closeOnBackdrop={false}` turns off just one, and
  set to `true` with `static` turns that one back on, so `static closeOnEscape`
  keeps Escape and ignores the backdrop. The `<dialog>` carries what is off in
  `data-sd-static` (empty for both, `"escape"` or `"backdrop"` for one), which
  the handlers of `init()` read, so a page that runs `init()` beside a React
  `Dialog` keeps it open the same way. A `Sheet`
  is pinned to the right, or to the left with `side="left"` or the bottom with
  `side="bottom"` (the full width, as tall as its content up to 85% of the
  screen, `--sheet-max`). `DialogHeader` names its × button `Close`; give
  `closeLabel="Close inspector"` when the screen needs more.
  A `DialogHeader` also names the dialog, and its title is the dialog's
  heading: an `h2`, or the level you pass as `as="h3"` (`as="span"` for none).
  It looks the same at every level. Leave the header out and name it with
  `aria-label` or `aria-labelledby` on the `Dialog`; an `aria-label` wins
  over a header, and no `aria-labelledby` is written when there is no header.
  Server output carries the name when the `DialogHeader` is a child of the
  `Dialog` or in a fragment there; a header inside a component of your own
  names it once the page has hydrated.
  A dialog opens with focus on the element inside it that has `data-autofocus`,
  each time it opens: mounted open, opened later, or remounted by
  `unmountOnClose`. Mark one element; with several, which one wins is not
  defined. `Button`, `IconButton`, `Input`, `Textarea`, `Select`, `Combobox`,
  `Checkbox` and `Switch` take `autoFocus` and write `data-autofocus` for you.
  A native `<input autoFocus>` of your own gets focus when it mounts with the
  dialog open, including each time `unmountOnClose` mounts it again; in a
  dialog that stays mounted and opens later, write `data-autofocus` on it. With
  neither, the browser focuses the first focusable element, as it does for any
  `<dialog>`.
  Children stay mounted while the dialog is closed. `unmountOnClose` mounts
  them only while it is open and drops them after the fade-out, so state inside
  starts fresh each time.
- **Popover and Menu** run on the native popover API. The trigger links to the
  panel with `popovertarget`, so a click on it toggles instead of dismissing
  and reopening. The panel is placed next to the trigger and flips at the
  viewport edge. In a menu the arrows, Home and End move focus, a letter jumps
  to the next item that starts with it, disabled items are skipped, and
  choosing an item closes the menu and returns focus to the trigger. A panel
  with no trigger opens at an `anchor` on `PopoverContent` or `MenuContent`
  instead: a `{ x, y }` point, a rect, or an element or object with
  `getBoundingClientRect`. For a context menu keep the pointer in state, set it
  in `onContextMenu` (after `preventDefault()`) together with `open`, and pass
  `anchor={point}`. The menu's corner sits on the point. It opens above the
  point or shifts at the viewport edge, and then it overlaps the point by a few
  pixels, so the point is always inside the menu: on macOS and Linux the
  `contextmenu` event fires on mouse down, and releasing the button outside
  the menu would light dismiss it. Light dismiss, Escape and the arrow
  keys work as for a trigger, and focus goes back to whatever had it when the
  menu opened. A second right-click moves the open menu; focus stays where
  that click put it.
- **Tabs** are roving: arrows, Home and End move focus and select.
- **Toasts** are rendered by React inside one live region. A toast fades with
  `data-leaving` for 160ms before it is removed, and hovering one holds it. The
  region is a manual popover in the top layer, so a toast shows above a modal
  `Dialog`; calling `toast()` while one is open lifts the region above it. A
  dialog that opens over a toast already on screen covers it until the next
  toast. A toast over a modal can be read but not used. The page behind a
  modal is inert and the toaster is part of it, so a click on a toast lands on
  the dialog instead (a click outside the box of a centered `Dialog` closes it
  unless it is `static`; a `Sheet` ignores it), the hover hold does nothing,
  and the keyboard cannot reach a toast's action. Put no `action` on a toast
  you show while a modal is open; show it after the dialog closes.
- **Tooltip** is a manual popover too, so it shows above a modal dialog. Its
  look and the `role="tooltip"` and `aria-describedby` link are unchanged.
  `delay` (milliseconds, default 0) holds back the pointer only: the tip waits
  until the pointer has rested on the trigger that long, and leaving first
  shows nothing. Focus shows it at once unless that delay is still running on
  the trigger, which then decides. Tab shows it at once; a mouse press that
  focuses the trigger, or the input a click focuses, is part of the hover and
  waits out the delay. A touch tap shows it as the finger lifts, whatever the
  delay, and it stays until the trigger blurs or a press lands elsewhere.
  One tip is open at a time on the page. A different trigger the pointer
  reaches while a tip is open, or within 300 ms of one closing, shows its tip
  at once and skips its `delay`, so a row of icon buttons waits once. The
  trigger a tip just closed on waits its delay again, and so does any trigger
  after Escape, blur or a press elsewhere closed the tip.
  `closeDelay` (milliseconds, default 0) keeps the tip up after the pointer
  leaves. The tip then takes the pointer, so it can be reached and read; it
  closes `closeDelay` after the pointer leaves the tip, and coming back to the
  trigger or the tip keeps it. Without `closeDelay` the tip goes as the pointer
  leaves and takes no pointer. Over an open modal `Dialog` the tip is inert,
  like a toast there: it lingers, but the pointer cannot reach it.
  `className` is added to the tip beside `sd-tooltip`. `onOpenChange(open)`
  reports each show and hide, including Escape and blur.
- **AppShell** renders `data-sidebar`, `data-aside`, `data-drawer` and
  `data-peek`, makes the page `inert` behind the drawer, closes the peek, the
  drawer and a floating right panel on Escape, and moves focus into the drawer.

What stays yours: remembering the sidebar choice (`sidebar` is a plain prop, so
use your own storage), collapsing the sidebar on tablets, resizing it (the
Resizable sidebar section has the framework recipe), and routing. A `RailItem`
or `SidebarLink` renders an `<a>` when it has `href`; call your router in
`onClick`. `SidebarLink` still closes the peek or drawer when `onClick` prevents
the default.

Every module is safe to import on the server, and a closed dialog, popover or
tooltip renders without touching `window` or `document`. jsdom has no
`showModal` or `showPopover`: stub them in the test setup before opening one.

Do not call `init()` on a page that uses these. It would write the same
attributes a second time (tabs, `.sd-shell`, `[popovertarget]`,
`<dialog open>`); the list under Framework-owned state says what it touches.
The helpers that write only their own nodes stay safe beside React:
`hotkeys()`, `setTheme()`, `data-sd-theme`, `data-sd-copy` and `data-sd-key`.
For the auto-hiding scrollbars, call `initScrollbars()` from `signal-design/js`
once at startup (`initScrollbars("always")` keeps them visible): it sets
`data-sd-scrollbars` on `<html>`, marks whatever scrolls with
`data-sd-scrolling`, and touches nothing else. For a shell on a phone, call
`initKeyboard()` too: while the on-screen keyboard is up it sets
`data-sd-keyboard`, `--sd-view-height` and `--sd-view-top` on `<html>`, and
`sd-shell` fits the screen above the keyboard instead of sliding its header
off the top. `init()` calls both.
`react.html` and `react-shell.html` in the showcase use every component above, and `react-editor.html` the editor parts below.

### Editor parts

The parts a document editor is built from, in CSS and as React components:

```jsx
<Toolbar label="Formatting">
  <ToolbarGroup label="Text">
    <ToolbarButton label="Bold" pressed={bold} onPressedChange={setBold}>B</ToolbarButton>
  </ToolbarGroup>
  <ToolbarSeparator />
  <ToolbarMore><MenuItem>Clear formatting</MenuItem></ToolbarMore>
</Toolbar>
<Manuscript measure="38rem"><h1>Chapter one</h1><p>…</p></Manuscript>
<Statusbar><StatusSegment>1,284 words</StatusSegment><StatusSegment end tone="success">Saved</StatusSegment></Statusbar>
```

- `Toolbar` (`sd-toolbar`) is one tab stop; arrows, Home and End move between its buttons, and a disabled button is skipped. `ToolbarButton` is a toggle when it has `pressed`. A row wider than its container scrolls inside itself; `ToolbarMore` is the menu for the actions you fold away yourself, since only you know which they are.
- `Manuscript` (`sd-manuscript` around `sd-manuscript-page`) is the page: `measure` sets its width (default 40rem, about 66 characters) and it shrinks with its container. `face="reading"` sets it in Literata (see Fonts) and `face="mono"` in Source Code Pro. `ref` reaches the page and `wrapRef` the scroller around it (`wrapClassName` styles it), for scroll position and typewriter scrolling. Put your editor's content element inside it; headings, quotes and lists are styled.
- `StatusSegment` (`sd-statusbar-seg`) is a fact in the status bar: text, a button with `onClick`, a toggle with `pressed`, or a link with `href`; `tone` adds a status dot. In an App Shell the bar is `Statusbar`, which keeps only `.sd-status` on phones; anywhere else use `<footer className="sd-statusbar">`.

- `Mark` (`sd-mark` with `data-mark`) is a span of text something is attached to: `comment`, `insert`, `delete`, `mention`, `entity`, `find` (a match of the search) or `check` (a match of a spelling, grammar or style check). It is a `mark`, `ins` or `del` element by kind, a link with `href`, and a button with `onClick`; `active` is the open comment or the current find or check match (`aria-current`) and `resolved` a settled comment. A find match is a grey fill and a check match a dashed underline; the current one adds an outline and a heavier line, so it shows without telling colors apart. Color means something: an insertion is green and a deletion pink, as in `sd-diff`, the open comment is the accent, a mention takes `--who`; comments and entities are grey. Fills and underlines wrap across lines.
- `GutterBlock` (`sd-gutter-block`) is a block of the page (`as` is its element, default `div`) that carries a `GutterMarker` (`sd-gutter-marker`), a square button in the margin level with the block's first line, for what is attached to the block as a whole. The marker's props are `marker`: `label` (its accessible name, required), `count` or children as its content, `kind="suggestion"` for a dashed edge, `active` for the open one (`aria-current`: a heavier edge and a tint of the accent) and `resolved` for a settled one (faint). `side="start"` puts it in the leading margin. It sits in the page's side padding, centered in it, so the text keeps its width; the padding is 6vw between 16px and 72px, and the marker (24px) shrinks to fit when the padding is narrower.
- `HoverCard` (`sd-hovercard`) is a preview beside its trigger, on hover after `openDelay` (300ms) or at once on keyboard focus; Escape, leaving the trigger and the card, or moving focus away closes it, and the pointer can move onto it. The trigger is its one child and must be focusable, so a `Mark` that is not a link or button needs `tabIndex={0}`. The card is not in the tab order: put what it shows, and any action, somewhere else too.
- `HoverCardHost` is the same card for a trigger React does not render, such as a ProseMirror decoration. Render it once with a `ref`; the code that owns the trigger calls `ref.current.show(anchor, content, { side, align, label })` to open it at once (a second call replaces what it shows) and `ref.current.hide()` to close it after `closeDelay` unless the pointer has moved onto the card (`hide({ immediate: true })` closes it now). `anchor` is an element, anything with `getBoundingClientRect`, a rect `{ left, top, right, bottom }` such as ProseMirror's `coordsAtPos`, or a function that returns one, which is measured again when the page scrolls or resizes. The owner decides when to open, so it keeps its own open delay, sets `aria-describedby` to `ref.current.id` on the trigger and clears it in `onOpenChange`, which hears every real open and close, including Escape and the pointer leaving the card.

- `Tree` and `TreeItem` (`sd-tree`) are a document tree. React owns `selected` and `expanded` (the ids of the open branches); a closed branch renders none of its children. One tab stop that lands on the selected item; Up, Down, Home and End move without wrapping, Right opens a branch or steps into it, Left closes it or steps to the parent, Enter and Space select. Reordering is reported, never done: `onMove({ id, targetId, position })` runs on a drop or on Alt+ArrowUp and Alt+ArrowDown, with `position` `before`, `after` or `inside`, and you reorder your own data. Giving `onMove` is what makes the rows draggable; the drag is the browser's own, so there is no drag library, and a branch cannot be dropped into itself. `actions` on a `TreeItem` (`{ label, key, icon?, tone?, onSelect }`) are what can be done to it, such as rename and delete. A treeitem cannot hold buttons, so each action runs from its `key` (`F2`, `Delete`, a plain key without modifiers) while the item has focus, and `aria-keyshortcuts` lists them. The buttons in the row are for the pointer: hidden from assistive technology, out of the tab order, and shown on hover, keyboard focus and selection. An action that removes the focused item moves focus to the nearest enabled item.

- `ResizablePanel` (`sd-resizable`) is a panel of one size that the layout around it gives way to, with a drag handle (`sd-resize-handle`) on the edge facing its neighbor: `edge="end"` is a panel on the left in left-to-right text, `"start"` one on the right, `"top"` or `"bottom"` a dock. React owns `size` (pixels; `defaultSize` 288) and hears every change in `onSizeChange`, clamped to `minSize` (160) and `maxSize` (640). The handle is the window splitter of the ARIA practices: a focusable `separator` named by `label` with `aria-valuemin`, `aria-valuemax` and `aria-valuenow` in pixels, that a pointer drags and Arrow keys (`step` 16px, Shift four times that), Home and End move. Arrows follow the screen, so in right-to-left text an end handle's ArrowRight shrinks its panel. The panel's children sit in `sd-resizable-body`, which scrolls when they are taller than the panel, so the handle stays on the edge; `bodyProps` reaches it, and a body with nothing focusable in it needs `bodyProps={{ tabIndex: 0 }}` so the keyboard can scroll it. `sd-sidebar-resize` is the same handle for the App Shell's sidebar; without React, set `--size` and `aria-valuenow` yourself and `data-resizing` on the panel while a drag runs.

- `Combobox` (`sd-combobox`) is a searchable select; `CommandPalette` (`sd-command`) is a search box over a list on a modal dialog. Both take `items` (`{ value, label, keywords?, group?, hint?, href?, disabled? }`) and neither fetches: they filter what you pass on label, keywords and value, and for results from a server you give `filter={false}`, follow `onInputValueChange` or `onQueryChange`, and pass back what arrived (`busy` marks the list `aria-busy`). Focus stays in the box and the highlighted option is named by `aria-activedescendant`; arrows move over enabled items and wrap, Enter chooses, Escape closes. The combobox owns `value`, `inputValue` and `open` as props and reverts unchosen text on blur; `name` adds a hidden input for a form. The palette owns `open` and `query`, clears the query when it closes, and calls `onSelect(item, event)`: a link item follows its `href` unless you call `event.preventDefault()`, as a router does.

- `RadioGroup` with `Radio`, and `SegmentedControl` with `Segment`, are native radios, so the browser gives each a single tab stop, arrows that move and check (which wrap at the ends or not as the browser decides), and form submission with `name`. React owns `value`. `SegmentedControl` draws the same radios as `sd-seg`; `inline`, `wrap` and `size="sm"` are its modifiers.
- `MenuItemCheckbox` (`menuitemcheckbox`) and `MenuItemRadio` inside `MenuRadioGroup` (`menuitemradio`) join `MenuItem` in a `Menu`. As with `init()`, choosing a checkbox item leaves the menu open so several can be set in a row, and choosing a radio item checks it and closes the menu; `onSelect` can prevent that on a radio item.

`react-editor.html` in the showcase uses every part.

## Charts

Two ways to chart, with one set of colors:

| Use | When |
|---|---|
| `sd-plot` | Your app has the points and wants a small static line or a sparkline. CSS only, no JS. |
| `createChart` | Time axes, units, several series, bands, tooltips, live data. Needs Chart.js. |

Both read the `--sd-chart-*` tokens and follow `data-chart-theme` (`mono` or
`spectrum`), set on the element or any element above it, so a sparkline in a
table matches the full chart above it. See `showcase/lib-charts.html`, and
`showcase/charts.html` for charts in an app screen.

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

### Chart types

`createChart(canvas, { type })` draws generic charts on the same tokens:

| `type` | For |
|---|---|
| `line` | Trends; several series, `markers` for an SLO or target |
| `area` | Volumes; `stacked: true` for parts of a total |
| `step` | Counts that change in jumps (queue depth, replicas) |
| `bar` | Comparisons; grouped by default, `stacked: true` for parts |
| `hbar` | Rankings, with the value at each bar's end |
| `histogram` | Distributions, with percentile `markers` |
| `scatter` | Two measures per point, with quadrant `markers` |

```js
createChart(canvas, {
  type: "line",
  labels: ["00:00", "01:00", …],
  unit: " ms",
  series: [{ label: "p50", data: [82, 80, …] }, { label: "p95", data: […] }],
  markers: [{ axis: "y", value: 300, label: "SLO 300 ms", tone: "warning" }],
});
```

Series take colors 1 to 6 (`--sd-chart-1` … `--sd-chart-6`) in order, or a
`tone` (`critical`, `warning`, …) for the one that matters. In mono, lines also
take a dash each, so five greys stay apart.

Five more charts are plain HTML and CSS, built from squares:

| Class | Markup |
|---|---|
| `sd-heatmap` | `<i style="--v: .4">` per cell, `--cols` for the width; `sd-heatmap-key` for less → more |
| `sd-waffle` | 100 `<i data-s="1–6">` cells, part of a whole; `sd-key` for the legend |
| `sd-uptime` | `<i data-state="ok\|degraded\|down\|none">` per period |
| `sd-meter` | `--value`, `--target`, `--warn`, `--crit` (0–100); `data-over` turns it critical |
| `sd-weighted` | `<i data-state="drafted\|current\|planned\|open" style="--weight: n">` per segment, sized by its share of the weights; a trailing `open` segment is what is left to a goal. React: `WeightedBar` |

### Timelines: `sd-timeline`

Ranges over one axis: eras, phases, windows. A label column and a plot
column; every row shares the same percentage scale. CSS only.

```html
<figure class="sd-timeline">
  <div class="sd-timeline-head">
    <span class="sd-label sd-label-strong">Platform eras</span>
    <span class="sd-status" data-tone="accent">now</span>
  </div>
  <div class="sd-timeline-body">
    <div class="sd-timeline-labels">
      <span class="sd-timeline-label">Web · 1</span>
    </div>
    <div class="sd-timeline-plot">
      <div class="sd-timeline-grid"><i style="--at: 0"></i></div>
      <span class="sd-timeline-now" style="--at: 100"></span>
      <div class="sd-timeline-row">
        <span class="sd-timeline-track">
          <span class="sd-timeline-bar" style="--from: 0; --to: 24"><b>2001</b><b>2007</b></span>
        </span>
      </div>
    </div>
  </div>
  <div class="sd-timeline-axis"><span style="--at: 0">2001</span></div>
  <figcaption class="sd-meta"><span>Twenty-five years of platform eras</span></figcaption>
</figure>
```

Bars use `--from` and `--to` (percent). `sd-timeline-now` and the grid use
`--at`; the axis ticks do too. `sd-timeline-mark` brackets a span with
`--from`/`--to` and a label. `data-tone` colors a bar, its label and the mark.

### Schedules: `sd-schedule`

A roster over hours: who is on what, when. A resource column and an hour
plot; the board covers `--start` to `--end` and every block, grid line,
tick and the now line place by the same hour scale. CSS only.

```html
<figure class="sd-schedule" style="--start: 6; --end: 22">
  <div class="sd-schedule-head">
    <span class="sd-label sd-label-strong">Driver roster</span>
    <div class="sd-schedule-legend">
      <span data-status="driving"><i></i>Driving</span>
      <span data-status="planned"><i></i>Planned</span>
      <span><i></i>Off duty</span>
    </div>
  </div>
  <div class="sd-schedule-board">
    <div class="sd-schedule-canvas">
      <div class="sd-schedule-grid" aria-hidden="true"><i style="--at: 8"></i></div>
      <div class="sd-schedule-axis" aria-hidden="true">
        <span>Driver</span>
        <div><span style="--at: 8">08:00</span></div>
      </div>
      <div class="sd-schedule-row" data-selected>
        <div class="sd-schedule-resource" id="schedule-budi"><b>Budi Santoso</b><span>VH-028 · 2h of 8h</span></div>
        <div class="sd-schedule-track">
          <span class="sd-schedule-block" tabindex="0" aria-describedby="schedule-budi" data-status="driving" style="--from: 12.75; --to: 21"><span class="sd-schedule-label">SHP-10482 → Semarang · 12:45–21:00 · Driving</span></span>
        </div>
      </div>
      <span class="sd-schedule-now" style="--at: 14.33" data-label="14:20"></span>
    </div>
  </div>
  <figcaption class="sd-meta"><span>Friday, 38 drivers</span></figcaption>
</figure>
```

`data-status` names what a block means: `driving`, `planned`, `proposed`
(dashed), `completed`, `conflict`; no attribute is off duty. A row takes
`data-state="conflict"` for the tinted exception row and
`data-selected` for a selected static row. Use `aria-selected="true"` only
with a supporting role and container, such as `role="row"` inside a
`role="grid"`. Colors come from the chart tokens:
`data-chart-theme="spectrum"` (on the schedule or any ancestor)
recolors the whole board; mono is black and white with color kept for
conflicts and the now line.

Each block contains one `sd-schedule-label` with its job, time range, and
human-readable status. Derive this text, `--from`, `--to`, and `data-status`
from the same schedule data. CSS hour positions and status attributes are
not spoken by assistive technology. Give each resource a unique `id` and
reference it from its blocks with `aria-describedby`. Resource names and
details wrap at rest and can increase the row's height.

The label ellipsizes at rest. Hovering or focusing the block temporarily expands the
label over adjacent slots, within the track edges, and wraps the full text.
The time bar and row keep their original size and position. A bracket below
the bar marks its original interval while the label expands. Add `tabindex="0"`
to static blocks so keyboard and touch users can focus them. These are text,
with no activation action. The full text remains available to assistive
technology without a duplicate `aria-label` or `title`.

The label collapses after the pointer leaves and focus moves away. Touch
or mouse-click focus can remain until another element receives focus.
Expanded labels are at most `20rem` wide unless the time bar is wider. The board scrolls
horizontally when `--min-w` requires it. Its scroll viewport can also clip
very tall labels at its edges, so leave enough vertical room for your label
lengths or provide a separate detail view for unusually long descriptions.

### Flows: `sd-flow`

A pipeline: stages left to right, each a column of jobs, on a dot grid. Each
stage's jobs sit centered on one line, so neighboring stages are joined by
one bus that both draw a half of. CSS only.

```html
<figure class="sd-flow" aria-labelledby="flow-h">
  <div class="sd-flow-head">
    <span class="sd-label sd-label-strong" id="flow-h">Stages</span>
    <div class="sd-flow-legend">
      <span data-status="done"><i></i>Done</span>
      <span data-status="running"><i></i>Running</span>
      <span data-status="queued"><i></i>Queued</span>
    </div>
  </div>
  <div class="sd-flow-board">
    <div class="sd-flow-canvas">
      <div class="sd-flow-stage" role="group" aria-labelledby="flow-build" data-status="done">
        <div class="sd-flow-stage-head" style="--value: 100">
          <i></i><b id="flow-build">Build</b><span>2m 10s</span><span>2/2</span>
        </div>
        <div class="sd-flow-jobs">
          <button class="sd-flow-job" type="button" data-status="done"><i></i><b>build-web</b><span>1m 48s</span><span class="sd-sr-only">Done</span></button>
          <button class="sd-flow-job" type="button" data-status="done"><i></i><b>build-desktop</b><span>2m 10s</span><span class="sd-sr-only">Done</span></button>
        </div>
      </div>
      <div class="sd-flow-stage" role="group" aria-labelledby="flow-verify" data-status="running">
        <div class="sd-flow-stage-head" style="--value: 33">
          <i></i><b id="flow-verify">Verify</b><span>3m 12s</span><span>1/3</span>
        </div>
        <div class="sd-flow-jobs">
          <button class="sd-flow-job" type="button" data-status="running" style="--value: 43" aria-current="true"><i></i><b>e2e-chromium</b><span>3m 12s · 18/42</span><span class="sd-sr-only">Running</span></button>
        </div>
      </div>
    </div>
  </div>
  <figcaption class="sd-meta"><span>main</span><span>6m 12s</span></figcaption>
</figure>
```

`data-status` is `done`, `running`, `queued`, `waiting` (on a person),
`failed` or `skipped`, on a stage, a job and a legend entry; the empty `<i>`
is its square mark. The edges out of a stage follow the stage's status:
solid once it is done, dashed while it runs, grey before and after a
failure. `--value` (0–100) fills a stage head's line and a running job's
underline. `aria-current` marks the job whose detail is open.

Colors come from the chart tokens: `data-chart-theme="spectrum"` (on the
flow or any ancestor) recolors it; mono keeps done and running in greys and
colors only waiting and failed. A job is a `button` or a link when it opens
something, or a `div` when it does not. The mark is not spoken, so put the
status in words inside the job (`sd-sr-only` when it is not shown).

A job has a fixed height and its name ends in an ellipsis, since a wrapped
job would move the line every bus is drawn on. Set `--stage-w` (default
`12.5rem`) for longer names; the board scrolls horizontally when the stages
do not fit.

### Checklists: `sd-checklist`

Named checks, each with a status mark, its result and, while it runs, its
progress. It takes the flow's `data-status` words and marks, so a run's flow
and its checks read as one. CSS only.

```html
<section class="sd-checklist" aria-labelledby="checks-h">
  <div class="sd-checklist-head">
    <span class="sd-label sd-label-strong" id="checks-h">Checks</span>
    <span class="sd-meta"><span>2 passed</span><span>1 running</span></span>
  </div>
  <ul>
    <li data-status="done"><i></i><b>Type check</b><span>0 errors</span><span class="sd-sr-only">Passed</span></li>
    <li data-status="done"><i></i><b>Lint</b><span data-tone="pending">2 warnings</span><span class="sd-sr-only">Passed</span></li>
    <li data-status="running" style="--value: 43"><i></i><b>End to end</b><span>18 / 42</span><span class="sd-sr-only">Running</span></li>
  </ul>
</section>
```

The result takes the check's status color; `data-tone` on it names an
exception, such as warnings on a check that passed. A running check takes
`--value` (0–100) and draws the stage head's 2px line under its words.
`data-chart-theme="spectrum"` on the checklist, or on an ancestor it shares
with a flow, recolors it. `sd-checks` stays the plain inline list of
outcomes.

### Live charts: `createChart`

Time-series charts for bandwidth and latency, on Chart.js. Chart.js is an
optional peer dependency: install it only if you use charts, and nothing in
`signal-design/js` imports it.

```bash
npm install chart.js
```

Install it before the first dev run. Vite caches its dependency scan, so if
you add Chart.js to a running project, restart the dev server with
`vite --force`.

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
page theme (paper gets deeper hues), and every color is a `--sd-chart-*` token
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
| Live | `append()` upserts at the tail, the effects layer rings the new point, value tags sit in the right gutter, and the window drifts with the clock. |
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

## Translating labels

Signal writes a few words itself: the toasts of `data-sd-copy`, the names of the
remove button on a tag and of the sidebar toggle, the empty row of a list. They
are English until you replace them. Nothing is translated for you and no second
language ships.

**JS.** One table, set once at startup. A value is a string with `{name}`
placeholders, or a function of the values (for plurals); `undefined` restores
the English default. An unknown key throws. A `data-sd-empty` or an `aria-label`
on the element still wins over the table.

```js
import { setLabels } from "signal-design/js";
setLabels({ "copy.done": "Kopiert", "tags.remove": "{value} entfernen" });
```

| Key | Placeholders | English |
|---|---|---|
| `copy.done`, `copy.failed` | | `Copied`, `Copy unavailable. Select the line instead.` |
| `list.empty` | | `No matches` |
| `tags.remove` | `value` | `Remove {value}` |
| `spark.trend` | `values` | `Trend: {values}` |
| `fps.value` | `value` | `{value} frames per second` |
| `table.resize`, `table.width` | `value` | `Resize table width`, `{value} pixels wide` |
| `shell.pin`, `shell.collapse` | | `Pin sidebar open`, `Collapse sidebar` |
| `window.maximize`, `window.restore` | | `Maximize`, `Restore` |
| `countdown.remaining` | `count`, `state` | `{count} second(s) remaining, {state}` |
| `countdown.running`, `.paused`, `.complete` | | `running`, `paused`, `complete` |
| `stream.<kind>.label`, `.detail` | | `New follower`, `Welcome to the stream`, … for `follow`, `sub`, `raid`, `bits` |

`DEFAULT_LABELS` lists every key with its English value. A stream alert's own
`label` and `detail` win over the table.

**React.** Every default is a prop: `closeLabel` (`DialogHeader`), `label`
(`CommandPalette`, `HoverCard`, `ResizablePanel`, `ToolbarMore`, `ToolbarGroup`),
`listLabel`, `emptyText` and `busyText` (`Combobox`, `CommandPalette`),
`pinLabel` and `collapseLabel` (`ShellToggle`), and `title` on a `TreeAction`.
The components do not read the JS table.

**Charts.** `createChart(canvas, { locale: "de" })` writes month names, am/pm and
the 12 or 24 hour clock for a BCP-47 tag; the default is `"en"` and its output is
unchanged. The order of the fields in a date and the digits do not change.
`text` replaces the chart's own words (`forecast`, `bucket`, `total`, …, listed in
`DEFAULT_CHART_TEXT`). `setChartDefaults({ locale, text })` sets both for every
chart made afterwards. The charts keep their own table, so they work with the
bundled `dist/signal.js` too.

**CSS.** The one word the stylesheet draws is the `muted` mark on a call tile
(`sd-tile[data-muted]`). Set `--sd-tile-muted-label: "stumm"` on the tile or any
ancestor to replace it.

## Page concepts

The showcase is built only from library parts. `index.html` is the overview,
with a card for every other page. The library reference is one page per
component type (`lib-buttons.html`, `lib-fields.html`, `lib-charts.html`),
filed the way an app files its pages: the rail holds the sections
(Foundations, Components, Patterns, Scripting, Examples), and each section's
sidebar lists its pages under folding groups (Forms, Navigation, Status, Data
and so on). Each page is an app in
the Signal App Shell and shows its blocks with a Preview / Code flip
(copyable HTML, the JS it needs, and a JS snippet where one applies). Example apps use those parts together in real app screens: a container
dashboard (`shell.html`), a group chat (`chat.html`), AI settings (`form.html`),
a download page (`landing.html`), usage stats (`charts.html`), and two built from
the React components (`react.html`, `react-shell.html`). A bar at the top
of every page links back to the overview and holds the theme, width and
settings controls; example apps carry a grey Mock marker in it.
`showcase/pages.js` lists every page.

## Accessibility

Every showcase page passes axe-core's WCAG 2.2 A/AA and best-practice rules in
ink, graphite and paper, at desktop and phone width (`pnpm a11y`, also in CI).
What the library does for you:

- Text colors meet 4.5:1 on every surface of each theme, hover rows included;
  muted rows and done rows step back by color, never by opacity.
- Avatars pick dark or white ink for their tone.
- `init()` gives scroll boxes with no focusable content (wide tables, code,
  diffs, the phone status bar) a tab stop while they scroll.
- `.sd-skip` is a skip link that shows when focused:
  `<a class="sd-skip" href="#main">Skip to content</a>` as the first element.
- Motion (rain, sparkle, chart effects) stops under `prefers-reduced-motion`.

What stays yours: names for icon-only buttons (`aria-label`), one `<h1>` per
page, and a `role="region"` with a label on a desktop title bar.

## Responsive

The shell has four sizes:

| Width | Layout |
|---|---|
| under 768px | Top bar; rail and sidebar open as a drawer; the right panel is an overlay. |
| 768–1023px | Rail and content; the sidebar slides in over the page when a section is picked. |
| 1024–1199px | Rail, sidebar and content; the right panel floats over the content. |
| 1200px and up | Everything side by side. |

Overlays sit under a desktop title bar, close on a click outside or Esc, and
the right panel starts closed wherever it would cover the page.
`sd-desktop-only` and `sd-phone-only` split at 768px. Every showcase page has a
**Width** button (bottom left) that opens the same page at 1440, 1024, 768, 390
or 360px, and `scripts/check.mjs` checks for horizontal overflow at 1280, 1024,
768 and 375px.

## Develop

```bash
pnpm install
pnpm dev          # showcase at http://localhost:5178
pnpm build:css    # dist/signal.css + dist/fonts
node scripts/check.mjs http://localhost:5178/
pnpm perf          # load, idle, scroll and theme cost per page, CPU slowed 4x
pnpm a11y          # axe-core audit of every page, theme and width
```

`scripts/check.mjs` loads the showcase in Chromium and WebKit, in every theme, at
1280px and 375px. It fails on console errors, any rounded corner, any blurred
shadow, a font weight or family outside Signal's, a hard-coded color, colored
navigation, a second primary button on an example screen, a text field named only by its
placeholder, horizontal scroll on phones, and broken dialog, popover, menu, tabs, expand or
segmented behavior. Its findings start with the rule's name, as the command's do.

Before opening a pull request, read `CONTRIBUTING.md`: changelog entries go in
`changes/`, and the generated AI files are rebuilt on `main`, not in the pull
request.

## License

MIT. Source Code Pro, Leon Sans and Literata are under the SIL Open Font License 1.1 (`src/fonts/OFL.txt`, `src/fonts/OFL-LeonSans.txt`, `src/fonts/OFL-Literata.txt`).
