/** The doc sections of lib-rail.html: see page-docs/index.js. */
export default {
  when: [
    "A list of places the user belongs to (groups, servers, workspaces) beside the content, one square tile each.",
    "A tile needs to say whether it is current, has unread items, or is still joining.",
    "A count belongs on a tile corner: <code>sd-badge-count</code> with <code>data-corner</code>.",
    "A new member enters a group once and needs its name, rules and labels: <code>sd-welcome</code>.",
  ],
  notWhen: [
    "Navigation to sections of one app: <code>sd-rail-item</code> entries and a sidebar do that (see Sidebar).",
    "A horizontal set of views: tabs do that (see Bars and tabs).",
  ],
  usage: "&lt;nav class=\"sd-rail\" aria-label=\"Places\" style=\"--shell-rail: 4.5rem\"&gt;\n  &lt;div class=\"sd-rail-list\"&gt;\n    &lt;a class=\"sd-rail-tile\" href=\"#design\" aria-current=\"page\" aria-label=\"Design\"&gt;DE&lt;/a&gt;\n    &lt;a class=\"sd-rail-tile\" href=\"#ops\" data-unread aria-label=\"Operations, 3 unread\"&gt;OP\n      &lt;span class=\"sd-badge-count\" data-corner&gt;3&lt;/span&gt;\n    &lt;/a&gt;\n  &lt;/div&gt;\n  &lt;div class=\"sd-rail-tools\"&gt;\n    &lt;button class=\"sd-rail-tile\" aria-label=\"Add a group\"&gt;&lt;svg&gt;…&lt;/svg&gt;&lt;/button&gt;\n  &lt;/div&gt;\n&lt;/nav&gt;",
  api: [
    { name: "sd-rail", type: "class", desc: "The rail. In the shell, set <code>--shell-rail: 4.5rem</code> on <code>.sd-shell</code>; a rail on its own takes the same variable." },
    { name: "sd-rail-list", type: "class", desc: "The scrolling column of places; its scrollbar is hidden." },
    { name: "sd-rail-tools", type: "class", desc: "The fixed column at the bottom for tools such as Add and Settings." },
    { name: "sd-rail-sep", type: "class", desc: "A 1px separator between groups of tiles." },
    { name: "sd-rail-tile", type: "class", desc: "A square tile holding an <code>img</code>, initials or an <code>svg</code>. Use <code>a</code> or <code>button</code>, or a <code>span</code> for a tile that is not a control." },
    { name: "sd-rail-item", type: "class", desc: "An ordinary rail tool for navigation, next to the tiles." },
    { name: "aria-current", type: "ARIA", desc: "Marks the current place: an accent bar on the rail's outer side." },
    { name: "data-unread", type: "attribute", desc: "A short grey bar on the outer side for a place with unread items." },
    { name: "data-pending", type: "attribute", desc: "A dashed tile for a place still joining; use a <code>span</code> with <code>role=\"img\"</code>." },
    { name: "sd-badge-count", type: "class", desc: "A count; <code>data-corner</code> pins it to the tile's top corner and <code>data-tone=\"danger\"</code> marks a mention." },
    { name: "--tile", type: "token", def: "48px", desc: "The tile's size; the welcome head sets it to 56px." },
    { name: "--shell-rail", type: "token", def: "4.5rem", desc: "The rail's width; the edge bar is placed from it." },
    { name: "sd-welcome", type: "class", desc: "A frameless welcome block with <code>-head</code>, <code>-name</code>, <code>-count</code>, <code>-rules</code> and <code>-labels</code>." },
    { name: "RailTile, RailItem", type: "function", desc: "The React components that render these classes; <code>AppShell</code> hosts them." },
  ],
  keyboard: [
    ["Tab", "Moves through the tiles that are links or buttons; a <code>span</code> tile is not a stop."],
    ["Enter / Space", "Activates the focused tile; a toggle tile also carries <code>aria-pressed</code> or <code>aria-expanded</code>."],
  ],
  a11y: [
    "The tile's <code>aria-label</code> replaces its text, so put the name and any count in it (\"Operations, 3 unread\"); the corner badge alone is not read.",
    "Give a picture tile <code>alt=\"\"</code> and the name in <code>aria-label</code>.",
    "A tile that is not a control, such as the pending one or the one in the welcome head, is <code>role=\"img\"</code> with an <code>aria-label</code>.",
    "Name each tile with <code>data-sd-tip</code> too, so sighted users can read it on hover and focus; <code>data-sd-tip-side=\"right\"</code> places it beside the rail.",
    "Wrap the rail in a <code>nav</code> with an <code>aria-label</code>.",
    "In the welcome block, labels are real toggle buttons with <code>aria-pressed</code>, grouped by <code>role=\"group\"</code> and <code>aria-labelledby</code>; the check icon is <code>aria-hidden</code>.",
  ],
  motion: [
    "Tile hover and selected colors change in 120ms; the edge bar grows in 160ms.",
    "<code>prefers-reduced-motion</code> cuts both to 0.01ms.",
  ],
  responsive: [
    "Tiles keep a 48px square and an 8px gap, so a corner count never covers the tile above it; the list scrolls when it fills.",
    "In a shell with no sidebar, <code>data-phone-nav=\"bottom\"</code> turns the rail into a row under the page on phones; its home link and separator drop out.",
  ],
  notes: [
    "The rail takes the same attributes everywhere: set <code>aria-current</code>, <code>data-unread</code> and <code>data-pending</code> from your data, not from clicks.",
    "A tile's selected look also covers <code>aria-pressed=\"true\"</code> and <code>aria-expanded=\"true\"</code>.",
    "<code>sd-welcome</code> fills the conversation area or sits in an <code>sd-dialog-body</code>; it has one primary button (<code>sd-btn-block</code>).",
  ],
  related: [
    "sidebar",
    "window",
    "avatars",
    "overlays",
  ],
};
