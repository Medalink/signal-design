# Changelog

## Unreleased

## 1.4.0 (2026-10-27)

### Changed
- `ToastProvider`'s `.sd-toaster` and `Tooltip`'s tip are manual popovers, so they paint above an open modal `<dialog>`. Their look is unchanged. A toast called while a dialog is open lifts the region above it. A toast over a modal can be read but not used: the page behind a modal is inert, so a click on a toast lands on the dialog (a centered `Dialog` closes on it unless it is `static`, a `Sheet` ignores it), and its action and hover hold work only once the dialog closes.
- React `DialogHeader` renders its title as an `h2` instead of a `span`, so the dialog has a heading for a screen reader, and `aria-labelledby` still points at it. `as` picks another level (`as="h3"`) or the old plain element (`as="span"`). The new `.sd-dialog-title` class resets the heading's type, margin and case, so the title looks exactly as it did.
- React `Tooltip`: one tip is open at a time on the page. Showing a tip closes the one that was open, where two could be open before (one opened by focus and one by hover, say).
- React `Dialog` always writes an `id` on its `<dialog>`: the one you pass (not `undefined`), or a generated one.
- `HoverCard` keeps its card beside the trigger while the page scrolls or resizes, and `HoverCard` and `HoverCardHost` share one card.
- Every optional prop in `signal-design/react` types is `prop?: T | undefined`, so a caller can pass `tone={undefined}` under `exactOptionalPropertyTypes`. `check.mjs` compiles a strict consumer with that option and fails on an optional property that lacks `| undefined`.
- The `@font-face` rules moved out of `tokens.css` into `font-<family>.css`. `signal-design`, `signal-design/css` and `dist/signal.css` still declare every face, so existing consumers get the same stylesheet plus the Literata faces, `--sd-font-reading` and the `sd-reading` rules.
- Showcase: one page per component type instead of nine long section pages.
  The rail holds five sections (Foundations, Components, Patterns, Scripting,
  Examples); each section's sidebar lists its pages under folding groups with
  page counts, and remembers folded groups. With the sidebar pinned a section
  opens its first page; collapsed, it peeks that section's pages in place.
  Crumbs read section, group, page, and each page ends with links to the pages
  before and after it.
- Old links keep working: `lib-components.html#components-buttons` and the
  other retired section pages redirect to the page that holds the block now.
- Field edges reach 3:1 against the page in every theme (WCAG 1.4.11). A new `--sd-line-control` token (Tailwind `border-line-control`) draws the edge of text inputs, selects, textareas, checkboxes, radios, addons, tags, number steppers and the composer. Hairlines between content keep `--sd-line`.
- `pnpm score` counts only what a user can see or reach: it skips visually hidden text, off-screen controls, controls that are already on or disabled, text links and scroll-only boxes on a phone, and schedule blocks (their size is the data). Hover counts a one-step fill change as feedback. `--components <file>` scores a branch's own snippets and usage notes, built with `SD_AI_OUT=dir node scripts/build-ai.mjs`.
- New `--text-3xs` token (12px, Tailwind `text-3xs`) for dense data: chart and schedule labels, counts, receipts, roster labels and small-avatar initials. Every 8 to 11px size in the components now uses it, so no Signal text renders under 12px.
- On a coarse pointer (phones, tablets) every control is at least `--sd-touch` (40px) tall, ranges, color inputs and sortable table headers included. A mouse keeps the desktop density. Text links in a sentence, checkboxes, radios and switches (their label is the target), and parts sized by their data are left alone.

### Added
- `sd-toolbar`: a row of toggle and action buttons with groups and separators, one tab stop, and `aria-pressed` styling (`sd-toolbar-btn`). A row wider than its container scrolls inside itself.
- `sd-manuscript` and `sd-manuscript-page`: a writing surface, one page at a reading measure (`--measure`, 40rem by default) on the canvas, with prose styles for headings, quotes and lists; `data-face="mono"` sets it in Source Code Pro.
- `sd-statusbar-seg`: status bar segments between hairlines, as text, a button, a toggle or a link, with an optional status dot.
- `signal-design/react`: `Toolbar`, `ToolbarGroup`, `ToolbarSeparator`, `ToolbarButton` (a toggle with `pressed` and `onPressedChange`), `ToolbarMore` (the overflow menu), `Manuscript` and `StatusSegment`. The toolbar keeps one tab stop and moves focus with the arrow keys, Home and End.
- Showcase example `react-editor.html`, and checks for the toolbar, status segments and manuscript in Chromium and WebKit.
- `sd-mark`: inline marks for a span of text something is attached to, keyed on `data-mark` (`comment`, `insert`, `delete`, `mention`, `entity`). Suggestions are green and pink like `sd-diff`, the open comment (`aria-current`) is the accent, a mention takes `--who`; comments and entities are grey, a resolved comment dots.
- `sd-hovercard`: a small preview panel that sits beside its trigger.
- `signal-design/react`: `Mark` and `HoverCard`. The card opens on hover after a delay or at once on focus, and closes on Escape, leave or blur; the pointer can move onto it.
- `sd-tree`: a nested document tree on `role="tree"`, rows indented by `--level`, a chevron that turns on `aria-expanded`, the selected item on `aria-selected`, and `data-drop` marks while an item is dragged.
- `signal-design/react`: `Tree` and `TreeItem`. One tab stop, the arrow-key pattern of an ARIA tree, `selected` and `expanded` as props. Reordering is a callback: `onMove` hears a drop or Alt+ArrowUp and Alt+ArrowDown and the app reorders its own data; no drag library.
- `signal-design/react`: `Combobox` and `CommandPalette` on the existing `sd-combobox` and `sd-command`. Items are passed in and filtered by label, keywords and value, or not at all with `filter={false}` for results you fetched; arrows, Enter and Escape, focus kept in the box with `aria-activedescendant`. `.sd-command-list` gets the scrolling list rule that `[data-sd-palette]` already had.
- `signal-design/react`: `RadioGroup` with `Radio` and `SegmentedControl` with `Segment` on native radios (one tab stop, arrow keys, `name` for forms), and `MenuItemCheckbox`, `MenuRadioGroup` and `MenuItemRadio` for `Menu`. A checkbox item leaves the menu open and a radio item closes it, as `init()` does.
- Art ornaments, drawn from Publighter's imagery: name a style next to the placement in `data-sd-ornaments` (`contours`, `lattice`, `waveform`, `dashed`, `book`, `stack`) and that picture replaces the dust. Still, 1px lines and small squares in the theme's text color, kept no louder than the dust (the README lists the contrast budget). `data-sd-ornaments-seed` gives each item its own contours, lattice or waveform.
- `ornamentArt()` and `ORNAMENT_ART` from `signal-design/js`, and the Art ornaments block on the Effects page.
- A check for the art ornaments in Chromium and WebKit: every style, theme and placement renders, is deterministic, adds no node, takes no click, moves nothing, and leaves text its contrast budget.
- `initScrollbars(mode)` in `signal-design/js`: turns on the auto-hiding scrollbars without `init()`. It sets `data-sd-scrollbars` on `<html>`, starts the scroll listener once however often it is called, and is safe beside React.
- `anchor` on `PopoverContent` and `MenuContent`: open a panel at a `{ x, y }` point, a rect, or an element or object with `getBoundingClientRect`, with no trigger. A context menu keeps the pointer in state and passes it as `anchor`. The corner sits on the point. The menu flips or shifts at the viewport edge and then overlaps the point by a few pixels, so a menu opened on mouse down is not light dismissed by the release. Light dismiss, Escape, the arrow keys and focus return all work. `place()` takes the same anchors.
- `Tooltip` props `delay` (milliseconds the pointer must rest before the tip shows; focus shows it at once unless that wait is still running on the trigger, and a touch tap shows it as the finger lifts), `className` (added to the tip) and `onOpenChange`.
- `Switch` and `Checkbox` can go without a `label` when `aria-label` or `aria-labelledby` names them. They render no text span and are only as wide as the control. `CheckboxProps` is unchanged, an interface with a required `label`; `BareCheckboxProps` is the bare shape, `SwitchProps` the labelled switch and `BareSwitchProps` the bare one, and all are exported.
- `Dialog` prop `unmountOnClose`: mounts the children only while the dialog is open and drops them after the fade-out. The default still keeps them mounted.
- `signal-design/react`: typed React 19 components with React as the only writer of state and no `init()`. Buttons, fields (`Field`, `Input`, `Textarea`, `Select`, `Checkbox`, `Switch`), badges, counts, avatars, cards, panels, empty states, tables, `Dialog` and `Sheet` on the native `<dialog>`, `Popover` and `Menu` on the popover API, `Tooltip`, `Tabs`, `ToastProvider` with `useToast()`, and the app shell (`AppShell`, `Rail`, `Sidebar`, `ShellMain`, `ShellToggle`, `useShell()`). `react` and `react-dom` are optional peer dependencies.
- Showcase examples `react.html` and `react-shell.html`, and checks for the bindings: a strict consumer compilation, a server render of every export in plain Node, and dialog, menu, tabs, toast, tooltip, table and shell behavior in Chromium and WebKit.
- React `Dialog` props `closeOnEscape` and `closeOnBackdrop` (default true) switch Escape and a backdrop click on their own. `static` is still the shorthand for both off, and either prop set to `true` turns its own way back on. `CommandPaletteProps` omits both, as it does `static`. The dialog writes what is off in `data-sd-static` (empty for both, `"escape"` or `"backdrop"` for one), and the `init()` handlers honor those values, so a page that also runs `init()` keeps it open too. A plain `data-sd-static` on your own `<dialog>` still turns both off.
- React `Tooltip` prop `closeDelay` (milliseconds, default 0): the tip stays after the pointer leaves the trigger, takes the pointer so it can be reached and read (`.sd-tooltip[data-hoverable]` has `pointer-events: auto`), and closes `closeDelay` after the pointer leaves the tip. Coming back to the trigger or the tip keeps it. Over an open modal `Dialog` the tip is inert, as a toast there is, so it lingers but the pointer cannot reach it. Without it nothing changes.
- React `Tooltip` warm window: a different trigger the pointer reaches while a tip is open, or within 300 ms of one closing, shows its tip at once and skips its `delay`. With no `delay` nothing changes. The trigger a tip just closed on, and any trigger after Escape, blur or a press elsewhere closed the tip, still waits.
- `Sheet side="bottom"` and `sd-sheet-bottom`: a bottom sheet as wide as the screen and as tall as its content up to `--sheet-max` (default 85dvh).
- `DialogHeader closeLabel`: the × button's accessible name, default "Close".
- `Manuscript wrapRef`: a ref to the scroller element around the page (`ref` still reaches the page).
- `Mark kind="find"` and `kind="check"`: a find match is a grey fill and a check match a dashed underline. The current one (`active`, `aria-current`) adds an outline and a heavier line, so it does not depend on color.
- `sd-weighted` and React `WeightedBar`: a bar of segments sized by weight toward a goal. A segment is `drafted`, `current` (outlined) or `planned`, and a trailing `open` segment is what is left to the goal.
- An icon set of 46 square-cap line icons on the 24 grid (history, text formatting, lists, alignment, comment, sparkle, person and account, object and place, edit and delete, copy, external link, sync, warning, chevrons and more). `signal-design/js/icons` exports `ICONS`, `ICON_NAMES` and `icon(name, label?)`, which returns the markup; React gets `<Icon name label>` with `IconName` typed. The component page lists every icon.
- `TreeItem actions`: rename, delete and the like on a tree row. Each action runs from its `key` while the item has focus (`aria-keyshortcuts` lists them) and has a pointer button in the row that is hidden from assistive technology and out of the tab order, so no interactive content sits inside the treeitem. When an action removes the focused item, focus goes to the nearest enabled one.
- `sd-resizable`, `sd-resize-handle` and React `ResizablePanel`: a panel of one size with a drag handle on the edge facing its neighbor (`edge` start, end, top or bottom), for use outside the App Shell. The handle is a focusable `separator` with `aria-valuemin`, `aria-valuemax` and `aria-valuenow` in pixels; the pointer drags it, Arrow keys, Home and End step it, and right-to-left text flips the direction.
- React `HoverCardHost`: the hover card for a trigger React does not render, such as a ProseMirror decoration. `ref.current.show(anchor, content)` opens it beside an element, a rect or a function that returns one; `hide()` closes it after `closeDelay` unless the pointer is on the card; `onOpenChange` hears every close.
- `sd-gutter-block`, `sd-gutter-marker` and React `GutterBlock` and `GutterMarker`: a square button in the page margin, level with a block's first line, for a comment or suggestion attached to the block. `kind="suggestion"` draws a dashed edge, `active` (`aria-current`) a heavier edge and a tint of the accent, `resolved` a faint one, and `side="start"` the other margin.
- Reading face: Literata (OFL, variable, weights 400 to 600, regular and italic, Latin and Latin Extended, 130 KB in four files) with `--sd-font-reading` and the `font-reading` utility. `<Manuscript face="reading">` (`data-face="reading"` on `sd-manuscript-page`) and the new `sd-reading` class set prose in it, with real italics and a semibold for `strong`. Interface text never uses it, and `data-font` does not change it.
- Font opt-out: `signal-design/css/core` (and `dist/signal-core.css`) is the whole library with no `@font-face`. Each face is its own file: `signal-design/css/fonts/source-code-pro`, `leon-sans` and `literata` (and `dist/font-<family>.css`). An app imports the core and the faces it uses, and the bundler copies only those files.
- Usage notes for the element, token, ASCII, field, presence-count and JS setup blocks, so every library block's copyable entry in `ai/components.json` says when to use it.
- `scripts/score.mjs` (`pnpm score`): scores every library block and every showcase page on what CI does not check (visible keyboard focus, hover feedback, 24px targets, phone touch targets, field edges at 3:1, text under 12px, clipped text, overflow, copyable HTML that renders differently on a bare page, classes no rule styles, untested behavior, parts no app composes), weights each finding and ranks them. `docs/scorecard.md` is the first ranking.

### Fixed
- `place()` no longer throws when the element or the anchor is null.
- A `Dialog` with no `DialogHeader` no longer writes an `aria-labelledby` that points at nothing, and a passed `aria-label` now names a dialog that has a header.
- `autoFocus` now works inside a React `Dialog`. React focuses an `autoFocus` field as it mounts, which a closed `<dialog>` cannot take, so the browser fell back to the first focusable element. A dialog now opens with focus on the element inside it that has `data-autofocus` (mark one), whether it mounts open, opens later, or remounts under `unmountOnClose`. `Button`, `IconButton`, `Input`, `Textarea`, `Select`, `Combobox`, `Checkbox` and `Switch` write `data-autofocus` when given `autoFocus`. A native `<input autoFocus>` of your own gets focus when it mounts with the dialog open, including under `unmountOnClose`; in a dialog that stays mounted and opens later, give it `data-autofocus`. With neither, the browser's default holds.
- A disabled `sd-check` (Checkbox, Radio and Switch, with a label or without) is faded once, to half opacity, by the label around it. The control's own disabled fade used to stack on that, so the control showed at one fifth opacity beside text at one half, and a bare switch with no text was nearly invisible. The control now matches its text. Anyone who relied on the fainter look can set `.sd-check > input:disabled { opacity: 0.4 }`.
- Chat showcase: a new reaction escapes its emoji before it goes into the
  markup.
- Ornaments no longer disturb a box's rows when the box has a row utility such as `space-y-*` or `divide-y`. In a scrolling box the sparkle layer took the utility's margin or line and pushed every row down; in a box that does not scroll it was the last child, so the real last row got a trailing margin or a stray divider. The layer is now always the box's first child and never takes a margin or border.
- A menu opened at a point on mouse down is no longer closed by the release. `place()` keeps a `{ x, y }` point inside the element when it flips above or left of the point or shifts at a viewport edge, overlapping it by 1px (5px above it, which also covers the 4px slide-in), where it used to end exactly at the point and leave the pointer just outside. An explicit positive `offset` still keeps its gap.
- `place()` no longer produces `NaNpx` for a rect with only `left` and `top`; a missing `right` or `bottom` counts as the `left` or `top`.
- `Checkbox` and `Switch` with `label={0}` (or `description={0}`) render the text; the check for a bare control treated `0` as no text and left the control with no name.
- Hand-written `label.sd-check` markup with plain text or its own span keeps its full width. The rule that shrinks a label to its control is now `.sd-check-bare`, which React's `Checkbox` and `Switch` add when they have no label or description, instead of every `.sd-check` without a `.sd-check-text` inside.
- A `Dialog` with a `DialogHeader` has its `aria-labelledby` in server-rendered HTML again. The header is found among the children by type, directly or in a fragment, instead of only by its layout effect after hydration; a header wrapped in a component of your own still names the dialog after hydration. A passed `aria-label` still wins, and a closed `unmountOnClose` dialog still points at nothing.
- A React `toast()` lifts the toaster above a dialog only when a modal one is open (`dialog:modal`). A dialog opened with `show()` no longer makes every toast hide and show the toaster again, which could take focus from a toast's button.
- The docs for a toast over a modal dialog say what happens: it is painted above the dialog but the page behind a modal is inert, so a click on it lands on the dialog (a centered `Dialog` closes through its backdrop unless it is `static`, a `Sheet` ignores it) and its action is unreachable. The showcase demo no longer puts an Undo action on a toast shown over its dialog.
- `Tooltip` focus rule: focus shows the tip at once unless the `delay` the pointer started on that trigger is still running, which then decides. A mouse press that focuses a button, or a click that focuses a text input (always `:focus-visible`), is part of the hover and waits out the delay; Tab, and any focus with no delay running, shows it at once, and `delay={0}` behaves as it did before this pull request. A touch tap shows the tip as the finger lifts, whatever the delay, which a tap that never focuses the trigger (Safari buttons) and a `delay` above 0 could not do before, and it stays until the trigger blurs or a press lands elsewhere. Scrolling cancels the touch and hides the tip.
- `initScrollbars()` does nothing when there is no `document`, so calling it in a client entry that is also evaluated on the server does not throw, and it no longer keeps a module-level flag: the DOM ignores the same scroll listener added twice. `signal-design/js` itself now imports in Node: `ornaments.js` and `scrolltabs.js` create their observers on first use instead of at load, with no change in the browser.
- `Checkbox` and `Switch` each have two signatures, the bare one (named by `aria-label` or `aria-labelledby`) first and the labelled one (`CheckboxProps`, `SwitchProps`) last. `Omit<CheckboxProps, "className">`, `Omit<SwitchProps, "className">` and `Omit<ComponentProps<typeof Checkbox>, "className">` spread back into the component, which a union did not allow. `SwitchProps` is now the labelled switch only (`Omit<CheckboxProps, "role">`) and `BareSwitchProps` is the bare one; `Omit` of a bare type makes its name optional again, so a bare wrapper is `BareCheckboxProps & { dense?: boolean }` with the extra prop destructured out.
- A menu opened at a point in the last four rows of the viewport is no longer closed by the release. `place()` kept the panel inside the viewport there, which left the points `vh-4` to `vh-1` outside it while the 4px slide-in ran. The panel now contains the point throughout the slide, so for a point that close to the bottom its last 4px can lie below the viewport.
- `PlaceAnchor` accepts the rect `place()` already placed beside: `left` and `top` are required, `right` and `bottom` are optional, and `width` and `height` are new. A missing `right` or `bottom` is `left` or `top` plus the `width` or `height`, or just `left` or `top` without one; `right` and `bottom` win over the sizes. `{ left, top, width, height }` is now a rect the types accept and `place()` sizes correctly, where it used to count as a rect of no size.
- `Radio` with `description={0}` renders the 0 in its description, as `Checkbox` does, where it left a bare `0` in the label. A label or description that is an empty array or an empty fragment counts as no text in `Checkbox` and `Switch` (the control is marked bare, as for no label) and in `Radio` (no empty description span).
- A React `toast()` no longer throws where `:modal` is not a selector (WKWebView before Safari 16.4). It looks for `dialog[open]` instead, so a toast still shows and lifts above an open dialog there, including one opened with `show()`.
- A long unbroken `sd-kv` value (an email, an id, a URL) wraps inside its column instead of widening the page.
- `.sd-faint` has a rule, and `.sd-option-desc` has its own color.
- A top bar's nav, a status bar and a title bar shrink in a narrow column instead of widening the page; a title bar drops its metrics under 32rem.
- A file input stays inside its column.
- `sd-ascii` holds the piece's space before it loads when `--cols` and `--rows` are set, so the page does not jump.
- A composer docked flush in `sd-shell-dock` gets the dock's 3:1 field edge, and an edited message's field keeps 3:1 on its fill.
- Install docs: the Vite plugin setup is shown, the React section says how to load the CSS and shows `Tabs` with its required `TabList label`, the charts section says to install Chart.js before the first dev run, a duplicated `dist/signal.js` example is gone, and the pin example names a real tag.
- Keyboard focus shows everywhere: nav links no longer clip their ring, checkboxes, radios and button inputs keep the shared ring, the composer outlines itself whether or not it is docked flush, a focused poll option or message scrolls clear of the feed's jump bar, rings stay inside a resizable panel's scrolling body, and a current find or check mark still shows focus.
- Hover shows on a resolved gutter marker, a `<details>` marker, the rail's home link and a linked wordmark. An edited message's field edge turns `--sd-fg` on focus, like any field.
- An `sd-meta` status line that wraps no longer starts its next line with a separator dot.
- Selecting an `sd-table` row no longer pushes its first cell sideways: a table whose rows carry `aria-selected` keeps room for the edge on every row and the header. React `TableRow selected={false}` now renders `aria-selected="false"`.
- Fields side by side in an `sd-form-row` keep their controls at the same height when one field's hint wraps; `sd-field` no longer stretches its control.
- `sd-number` is as tall as an input: its step buttons no longer add the large text line height.
- The remove button in an `sd-chip` is centered on the chip's text.
- A field whose control has `aria-invalid="true"` reddens its label, as `data-invalid` and `:user-invalid` already did.
- `data-sd-edges` keeps the element's own border under its glow, so an edged box's sides never fall below its real edge, reduced motion included.
- Paper's `--sd-line-control` is `#858585`, 3:1 on the shell background too.
- A message author's name and a quoted author take a 40px target on a coarse pointer without changing the line's height.
- Schedule labels keep 4.5:1 on a selected or conflicting row and on spectrum blocks: they lean 30% toward `--sd-fg`.
- On a coarse pointer, window controls keep the title bar's height, message action buttons stay square at 40px, and an inline `sd-message-author` button takes a 40px target without changing its line.
- The resize handles' 24px targets sit 12px each side of their line.
- `sd-sidebar-head` and `sd-rail-home` keep their 4rem height when used outside `sd-shell`, where `--shell-head` is not set.
- Numbers that change or line up in a column now use tabular figures, so they hold still when a digit changes: `sd-meta` times, `sd-badge`, `sd-pill`, `sd-status`, `sd-item-end` and `sd-item-group` counts, `sd-file-meta`, `sd-poll-meta`, `sd-stat-delta` and `sd-stat-sub`, `sd-kv` values, `sd-plot-readout`, `sd-tree-meta`, `sd-statusbar` segments, the `sd-steps` numbers and the `data-sd-countdown-value` seconds.
- `sd-sidebar-resize` and `sd-resize-handle` take a 24px pointer target around their 1px line (WCAG 2.5.8). The line itself does not move.

## 1.3.0 (2026-10-23)

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
