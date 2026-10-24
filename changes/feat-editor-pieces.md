### Added
- `sd-toolbar`: a row of toggle and action buttons with groups and separators, one tab stop, and `aria-pressed` styling (`sd-toolbar-btn`). A row wider than its container scrolls inside itself.
- `sd-manuscript` and `sd-manuscript-page`: a writing surface, one page at a reading measure (`--measure`, 40rem by default) on the canvas, with prose styles for headings, quotes and lists; `data-face="mono"` sets it in Source Code Pro.
- `sd-statusbar-seg`: status bar segments between hairlines, as text, a button, a toggle or a link, with an optional status dot.
- `signal-design/react`: `Toolbar`, `ToolbarGroup`, `ToolbarSeparator`, `ToolbarButton` (a toggle with `pressed` and `onPressedChange`), `ToolbarMore` (the overflow menu), `Manuscript` and `StatusSegment`. The toolbar keeps one tab stop and moves focus with the arrow keys, Home and End.
- Showcase example `react-editor.html`, and checks for the toolbar, status segments and manuscript in Chromium and WebKit.
- `sd-mark`: inline marks for a span of text something is attached to, keyed on `data-mark` (`comment`, `insert`, `delete`, `mention`, `entity`). Suggestions are green and pink like `sd-diff`, the open comment (`aria-current`) is the accent, a mention takes `--who`; comments and entities are grey, a resolved comment dots.
- `sd-hovercard`: a small preview panel that sits beside its trigger.
- `signal-design/react`: `Mark` and `HoverCard`. The card opens on hover after a delay or at once on focus, and closes on Escape, leave or blur; the pointer can move onto it.
