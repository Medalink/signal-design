---
name: Signal
description: A flat, square, monochrome design library where color is reserved for meaning.
colors:
  canvas: "#000000"
  surface: "#0a0a0a"
  raised: "#191a1d"
  overlay: "#191a1d"
  line: "#262626"
  line-strong: "#333333"
  line-control: "#676767"
  fg: "#fafafa"
  fg-muted: "#a3a3a3"
  fg-subtle: "#949494"
  fg-faint: "#828282"
  primary: "#fafafa"
  on-primary: "#050506"
  accent: "#00d4ff"
  success: "#00ff88"
  danger: "#ff3366"
  warning: "#ff8800"
  pending: "#ffaa00"
  extra: "#8855ff"
  accent-deep: "#00718f"
  success-deep: "#00804a"
  danger-deep: "#c8003a"
  warning-deep: "#a84d00"
  pending-deep: "#855800"
  extra-deep: "#5b2fd1"
typography:
  display-xl:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"SF Pro Display\", \"Segoe UI\", system-ui, sans-serif"
    fontSize: "4.125rem"
    fontWeight: 400
    lineHeight: 1.04
    letterSpacing: "-0.03em"
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"SF Pro Display\", \"Segoe UI\", system-ui, sans-serif"
    fontSize: "2.375rem"
    fontWeight: 400
    lineHeight: 1.18
    letterSpacing: "-0.03em"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"SF Pro Display\", \"Segoe UI\", system-ui, sans-serif"
    fontSize: "1.4375rem"
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: "-0.025em"
  lead:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"SF Pro Display\", \"Segoe UI\", system-ui, sans-serif"
    fontSize: "1.1875rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "-0.025em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"SF Pro Display\", \"Segoe UI\", system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"SF Pro Display\", \"Segoe UI\", system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.16em"
  wordmark:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"SF Pro Display\", \"Segoe UI\", system-ui, sans-serif"
    fontSize: "0.90625rem"
    fontWeight: 500
    letterSpacing: "0.28em"
  data:
    fontFamily: "\"Source Code Pro\", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.35
    fontFeature: "\"tnum\""
  reading:
    fontFamily: "\"Literata\", \"Iowan Old Style\", \"Palatino Linotype\", Palatino, Georgia, \"Times New Roman\", serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.7
rounded:
  none: "0px"
spacing:
  unit: "4px"
  page-top: "56px"
  page-x: "24px"
  page-x-phone: "16px"
  panel: "22px"
components:
  button:
    backgroundColor: "transparent"
    textColor: "{colors.fg}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "7px 16px"
    height: "34px"
  button-hover:
    backgroundColor: "{colors.raised}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.none}"
    padding: "7px 16px"
    height: "34px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.fg}"
    rounded: "{rounded.none}"
    padding: "7px 16px"
  button-link:
    backgroundColor: "transparent"
    textColor: "{colors.fg-subtle}"
    padding: "0"
  button-sm:
    padding: "3px 10px"
    height: "26px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.fg}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "6px 10px"
    height: "34px"
  badge:
    backgroundColor: "transparent"
    textColor: "{colors.fg-subtle}"
    rounded: "{rounded.none}"
    padding: "2px 7px"
  chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.fg}"
    rounded: "{rounded.none}"
    padding: "3px 10px"
    height: "28px"
  pill:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.fg-muted}"
    rounded: "{rounded.none}"
    padding: "5px 12px"
  panel:
    backgroundColor: "transparent"
    rounded: "{rounded.none}"
    padding: "{spacing.panel}"
    width: "560px"
  card:
    backgroundColor: "{colors.canvas}"
    rounded: "{rounded.none}"
  item-current:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.fg}"
---

# Design System: Signal

## Overview

**Creative North Star: "The Instrument Panel"**

Signal is the black face of a lab instrument. At rest it is greys on near-black: hairline edges, quiet labels, numbers in a monospaced face. Nothing is lit until something reads out. When a check passes, a job fails, a cost lands or a value is selected, one small mark lights in the one color that means that thing, and goes dark again when the state ends. The panel is the same on every app it is fitted to; Whisper, Publighter and Watcher differ in what they measure, not in how the readouts look.

Parts are drawn, not built. A button, a field, a panel is an outline on the canvas, never an object with bulk: no rounding, no shading, no lift. State changes the line or the text (an edge goes from line to fg, a background steps from canvas to raised, a label brightens), never the shape. Density is that of a working tool: 34px controls, 16px body, uppercase tracked labels, content in a 720px column or a full app shell.

The system rejects the default look of neighboring kits: rounded corners, drop shadows, glass, glow, gradients and decorative color are all forbidden, and the `signal-design check` command fails a page that uses them.

**Key Characteristics:**
- Square corners everywhere, avatars and checkboxes included (0px).
- Flat: depth comes from tonal steps and 1px hairlines, never shadow.
- Monochrome by default; six signal colors, each with one meaning.
- One text face in two weights (400, 500); Source Code Pro for code and numbers; Literata only for long-form prose.
- Motion only on state change, 120–200ms; live activity (the typing squares, the rain while work runs) may loop only while it lasts.
- Four themes from one set of role tokens: ink (default), graphite, paper, auto.

## Colors

Near-black greys carry everything; six saturated signals are reserved for meaning and appear only as small marks. The frontmatter holds the ink theme (the default); every role switches per theme at runtime through `--sd-*` variables.

### Primary
- **Instrument White** (`--sd-primary`): the primary button's fill, the one filled control per view. It is the text color, not a hue: on ink it is near-white, on paper near-black.

### Signals
Each signal is a role, set through `data-tone` or a `--sd-*` token, and appears as a dot, an edge, a hairline border, a word or an 8% wash. Never as a large fill.
- **Selection Cyan** (`--sd-accent`): selected, active, now: a selected message's edge, text marks and highlights, a resize grip while dragged or focused, the timeline's "now" line, an Active badge. Focus rings and the current nav item are Text, not cyan.
- **Pass Green** (`--sd-success`): approved, passing, online, your position.
- **Risk Pink** (`--sd-danger`): irreversible, high risk, reject, invalid fields.
- **Cost Orange** (`--sd-warning`): costly.
- **Pending Amber** (`--sd-pending`): unproven, waiting, low confidence.
- **Presence Violet** (`--sd-extra`): people and presence; the fallback name color in conversations.

The `-deep` variants are the same hues dark enough to read on paper; the paper theme maps each role to its deep value.

### Neutral
- **Canvas Black** (`--sd-canvas`): the page.
- **Surface** (`--sd-surface`): one step up: rail, sidebar, cards, field fills, the shell's content box.
- **Raised** (`--sd-raised`): hover rows, the current item, raised controls.
- **Overlay** (`--sd-overlay`): popovers, menus, dialogs, tooltips.
- **Hairline** (`--sd-line`): default borders and dividers.
- **Strong Hairline** (`--sd-line-strong`): control borders and dividers that must read.
- **Control Edge** (`--sd-line-control`): a field's edge, held at 3:1 against every surface (WCAG 1.4.11).
- **Text** (`--sd-fg`): main text, focus rings, the current item's edge.
- **Muted Text** (`--sd-fg-muted`): descriptions, leads, subtitles.
- **Subtle Text** (`--sd-fg-subtle`): labels and meta.
- **Faint Text** (`--sd-fg-faint`): the quietest readable text (still 4.5:1): hints, timestamps, the quiet half of a display line.

### Themes

Ink is the frontmatter. The other themes move these roles:

| Role | graphite | paper |
|---|---|---|
| canvas | #151515 | #ffffff |
| surface | #1a1a1a | #f6f6f7 |
| raised | #242424 | #eeeef0 |
| fg | #f5f5f5 | #050506 |
| fg-muted | #adadad | #2e2e33 |
| fg-faint | #8b8b8b | #6a6a72 |
| danger | #ff4775 | the `-deep` value |

On paper every signal takes its `-deep` value. The full per-theme set is in `ai/tokens.json`.

`auto` follows the OS: ink, or paper when it asks for light. Any element may carry `data-theme` to theme a subtree. Charts add `data-chart-theme="mono"` (greys, default) or `"spectrum"`.

### Named Rules
**The Lit Readout Rule.** Color appears only when it means something: status, risk, selection. Navigation, headings, icons and current items stay grey. If a colored mark could be removed without losing information, it should not be there.

**The Tokens Not Values Rule.** Code reads `--sd-*` variables or the Tailwind utilities on them (`bg-canvas`, `text-fg-muted`, `border-line`). The hex values here are a reference; hard-coding one breaks every other theme.

**The Small Mark Rule.** A signal is a dot, a 1–3px edge, a hairline border at 40–45% mix, a word, or a wash at 8%. Only two small parts are filled solid: a toned primary button (the view's one action, when that action is the status, such as Approve or Delete) and a solid badge. A signal never fills a panel, a header or a region.

## Typography

**Display Font:** SF Pro, the system UI face (Segoe UI on Windows), through `--sd-font-sans`
**Body Font:** the same face
**Label/Mono Font:** Source Code Pro (bundled), through `--sd-font-mono`, for code, charts and numbers
**Reading Font:** Literata (bundled), through `--sd-font-reading`, for prose read at length only

**Character:** one plain system face does all interface work at two weights, so hierarchy comes from size, case, tracking and grey, never from boldness. The mono face is the instrument's readout.

A font picker (`data-font`) can swap the text face for Leon Sans or Source Code Pro; code, charts and the rain stay mono, and Literata is unaffected.

### Hierarchy
- **Display XL** (400, 4.125rem, 1.04): hero lines on landing surfaces; 3.125rem on phones.
- **Display** (400, 2.375rem, 1.18, -0.03em): the page's display line, often two-tone: the second clause in faint text ("32 open. 8 done."); 1.75rem on phones.
- **Title** (400, 1.4375rem, 1.3, -0.025em): page and panel titles.
- **Lead** (400, 1.1875rem, 1.55, muted): the sentence under a title.
- **Body** (400, 1rem, 1.5): all running text and controls.
- **Label** (400, 0.875rem, 0.16em, uppercase, subtle): section heads, field labels, badges, status lines.
- **Wordmark** (500, 0.90625rem, 0.28em, uppercase): the product name.
- **Data** (Source Code Pro 400, 0.75rem, tabular): chart labels, counts, initials. Nothing is set smaller than 0.75rem.

### Named Rules
**The Two Weights Rule.** Only 400 and 500 exist; `font-bold` resolves to 500. Medium is for the primary button, the wordmark and strong labels. Never reach for 600 or 700 in interface text.

**The Names Not Families Rule.** Set families through `font-sans`, `font-mono`, `font-reading` or their variables, never by name, so the font picker works.

**The Reading Room Rule.** Literata is for a manuscript or an article, with real italics and a semibold for strong text. Interface text never uses it.

## Layout

Two spatial models. A reading page is one centered column: 720px (`sd-page`), 1024px wide (`sd-page-wide`), with 56px above and 24px gutters (28px and 16px on phones). An app uses the Signal App Shell: a rail of places (96px, or 72px for tile rails), a resizable sidebar (288px), the main area (header or bar, content, optional dock for a composer), an optional aside (288px) and a status bar. Settings sit in panels capped at 560px, 1024px, or fluid.

Spacing runs on Tailwind's 4px unit. Controls are 34px tall (26px small); panels pad 22px; stacked panels sit 16px apart. The split between desktop and phone chrome is 768px (`sd-desktop-only`, `sd-phone-only`). Pages must not scroll horizontally at 1280, 768 or 375px.

## Elevation & Depth

None. Signal has no shadow scale; Tailwind's shadow, inset-shadow, drop-shadow and text-shadow utilities are cleared. Depth is tonal: canvas, then surface, then raised and overlay, each a small step lighter on dark themes, separated by 1px hairlines. An overlay is distinguished by its tone and its hairline edge, and a dialog by a flat backdrop (`--sd-backdrop`), never by a blur or a cast shadow.

### Named Rules
**The No Lift Rule.** Nothing floats. A popover, a menu and a dialog sit on the same plane as the page, set apart by tone and a hairline. Blurred `box-shadow`, glow, glass and backdrop blur are forbidden.

## Shapes

Every corner is square. Every radius token resolves to 0, avatars and checkboxes included; presence dots and status marks are 6px squares. Borders are 1px hairlines; emphasis moves to a 2–3px edge on one side (the current rail item's 2px fg bar, a selected message's start edge, a toned card's top edge). Forms are rectangles and lines; no circles and no notches. Even the parts named for round shapes (the counter pill, chips, avatars) are square.

## Components

### Buttons
Outlines that brighten under the pointer.
- **Shape:** square (0px), 1px border.
- **Default:** transparent fill, strong hairline border, fg text, 34px tall, 7px 16px padding, 0.02em tracking.
- **Hover / Focus:** the fill steps to raised and the border to faint text over 120ms; the label shimmers once. Focus is a 1px fg outline 2px out. Pressed drops 1px.
- **Primary:** filled with Instrument White, on-primary text, weight 500, no border; hover dims to 88% opacity. One per view.
- **Ghost / Link:** ghost drops the border; link is subtle text with a hairline underline 3px below, brightening to fg on hover.
- **Toned:** `data-tone` colors the text and a 40% hairline; hover adds an 8% wash and strengthens the hairline to 70%. A toned primary button fills solid with the tone and sets canvas-colored text.
- **Disabled / Busy:** disabled at 35% opacity; busy dims to 70% and says so in words, never with a spinner loop.

### Chips and Badges
- **Chip:** a square token on surface fill with a strong hairline, 28px tall, 3px 10px padding, fg text at 0.9375rem; a button chip shimmers on hover.
- **Pill:** a square counter ("↑ 21 new above"): canvas fill, hairline border, muted uppercase text tracked 0.12em, tabular numbers.
- **Badge:** uppercase label type, 0.14em tracking, 2px 7px padding, a hairline border at 45% of its tone (subtle grey by default), text in the tone, no fill. The solid badge fills with the tone, with canvas-colored medium text.
- **Status:** a 6px square dot in the tone, then a word in muted text with tabular numbers.

### Cards / Containers
- **Corner Style:** square (0px).
- **Background:** canvas for cards; panels inherit.
- **Shadow Strategy:** none (see Elevation & Depth).
- **Border:** 1px hairline; header, body and footer divided by hairlines. A toned card colors only its top edge. A linked card's border strengthens on hover.
- **Internal Padding:** 22px for panels.

### Inputs / Fields
- **Style:** surface fill, 1px control-edge border (3:1), square, 34px tall, 6px 10px padding. Inputs are styled unclassed.
- **Focus:** the border turns fg; no outline, no glow.
- **Error / Disabled:** invalid fields take a Risk Pink border (`:user-invalid` or `aria-invalid`).
- **Field:** an uppercase label above, the control, a faint hint below.

### Navigation
- **Style:** grey. Slim nav is uppercase tracked words in subtle text; tabs are subtle text tracked 0.08em on a hairline, with a 1px fg line under the selected one; sidebar links and list items take a raised fill and a 2px fg start edge when current.
- **States:** hover and current brighten to fg; navigation is never colored. Current is marked with `aria-current`, `aria-selected` or `aria-pressed`, and the CSS keys on those attributes.
- **Mobile:** the slim nav strip scrolls; the shell collapses its sidebar and swaps chrome at 768px.

### Display Line
The page's voice: one display-size sentence in two tones, the second clause faint. "32 open. 8 done." It replaces a heading plus a subtitle.

### Digital Rain
A canvas backdrop of falling mono glyphs behind the app shell. It is still until work runs (`rain.busy(true)`) and stops when the work ends; reduced motion keeps it still.

### Ornaments
Faint, still line art behind content (`data-sd-ornaments`): dust by default, or contours, lattice, waveform, dashed, book or stack by subject. They never move and never compete with text.

## Do's and Don'ts

### Do:
- **Do** read every color from a `--sd-*` role or its Tailwind utility, so all four themes work.
- **Do** keep every corner square (0px) and every edge a 1px hairline.
- **Do** separate layers by tone (canvas, surface, raised, overlay) and hairlines.
- **Do** color only status, risk and selection, through `data-tone` and the six roles, as small marks.
- **Do** use one primary button per view.
- **Do** style state through ARIA and `data-*` attributes (`aria-current`, `aria-pressed`, `data-open`, `data-tone`), and let one writer own each state.
- **Do** keep transitions at 120–200ms on `cubic-bezier(0.2, 0.8, 0.2, 1)` and only on state change.
- **Do** set numbers and code in Source Code Pro with tabular figures.
- **Do** copy markup from `ai/components.json` and run `signal-design check --a11y` on the result.

### Don't:
- **Don't** use `rounded-*` or any `border-radius`, on avatars and checkboxes too.
- **Don't** use blurred `box-shadow`, glow, glass, backdrop blur or CSS gradients.
- **Don't** color navigation, headings or icons, or use a hue directly (`text-pink`, `#ff3366`).
- **Don't** fill a header, panel or region with a signal color; only a toned primary button and a solid badge are solid.
- **Don't** use weights other than 400 and 500, or name a font family directly.
- **Don't** set interface text in Literata.
- **Don't** loop motion for decoration or use a looping progress bar; indeterminate progress is a static state. Only live activity (someone typing, work running) may loop, and only while it lasts.
- **Don't** build a custom dropdown, tooltip, modal, tabs or sidebar layout; use the native element plus Signal, and `sd-shell` for app frames.
