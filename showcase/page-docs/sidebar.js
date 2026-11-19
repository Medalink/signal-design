/** The doc sections of lib-sidebar.html: see page-docs/index.js. */
export default {
  when: [
    "A panel beside the content lists channels, folders or conversations: head on top, scrolling body below.",
    "A head holds an icon, a title and an action, at 18px or at 16px when it needs the room.",
    "Some rows should recede, such as muted channels and conversations, without losing contrast.",
    "The user should set the panel's width: drag the edge, or use the arrow keys.",
  ],
  notWhen: [
    "A row of top-level places with tiles and counts: the rail does that (see Rail).",
    "A short list of links inside the page: use <code>sd-sidebar-link</code> in a bar or tab list (see Bars and tabs).",
  ],
  usage: "&lt;div class=\"sd-sidebar\" id=\"channels\" style=\"--shell-sidebar: 15rem\"&gt;\n  &lt;div class=\"sd-sidebar-head\"&gt;\n    &lt;h2 class=\"sd-sidebar-title\"&gt;Channels&lt;/h2&gt;\n  &lt;/div&gt;\n  &lt;nav class=\"sd-sidebar-body\" aria-label=\"Channels\"&gt;\n    &lt;a class=\"sd-sidebar-link\" href=\"#general\" aria-current=\"page\"&gt;general&lt;/a&gt;\n    &lt;a class=\"sd-sidebar-link\" href=\"#random\" data-muted&gt;random&lt;/a&gt;\n  &lt;/nav&gt;\n  &lt;div class=\"sd-sidebar-resize\" role=\"separator\" aria-orientation=\"vertical\"\n    aria-label=\"Resize sidebar\" aria-controls=\"channels\"\n    aria-valuemin=\"160\" aria-valuemax=\"360\" aria-valuenow=\"240\"\n    tabindex=\"0\" data-sd-shell=\"resize\"&gt;&lt;/div&gt;\n&lt;/div&gt;",
  api: [
    { name: "sd-sidebar", type: "class", desc: "The panel. Its width is <code>--shell-sidebar</code>; inside the shell, set it on <code>.sd-shell</code>." },
    { name: "sd-sidebar-head", type: "class", desc: "The head: an optional icon, an <code>sd-sidebar-title</code> and actions. The title is 18px and ends in an ellipsis when it does not fit." },
    { name: "sd-sidebar-head-sm", type: "class", desc: "A head with a 16px title, for a head that also holds actions or a longer title." },
    { name: "sd-sidebar-title", type: "class", desc: "The title, on a <code>span</code> or an <code>h2</code>; it follows the head's size." },
    { name: "sd-sidebar-body", type: "class", desc: "The scrolling list area, usually a <code>nav</code> with an <code>aria-label</code>." },
    { name: "sd-sidebar-link", type: "class", desc: "A row link; <code>aria-current</code> marks the open one." },
    { name: "data-muted", type: "attribute", desc: "On <code>sd-sidebar-link</code> or <code>sd-item</code>: text and icon take the faint color, the avatar a grey fill. Hover and <code>aria-current</code> restore full strength." },
    { name: "sd-sidebar-resize", type: "class", desc: "The resize handle, last in the sidebar, with <code>role=\"separator\"</code>." },
    { name: "data-sd-shell=\"resize\"", type: "attribute", desc: "Lets <code>init()</code> drag the handle, step it from the keyboard and remember the width per sidebar <code>id</code>." },
    { name: "aria-valuemin, aria-valuemax, aria-valuenow", type: "ARIA", def: "224, 480", desc: "The handle's bounds and current width in px; <code>aria-valuenow</code> is kept current by the JS." },
    { name: "--shell-sidebar", type: "token", desc: "The sidebar width, such as <code>15rem</code>. The JS writes it in px while resizing." },
    { name: "setSidebarWidth(target, px)", type: "function", desc: "Sets the width, clamped to the handle's bounds, and remembers it; <code>null</code> returns to the authored width and forgets it." },
    { name: "data-resizing", type: "attribute", desc: "Set on the shell or sidebar while a drag runs. Set it yourself when a framework owns the width." },
    { name: "sd:shell", type: "event", desc: "Fires on the shell with <code>detail.width</code> after a resize; a sidebar used on its own fires nothing." },
  ],
  keyboard: [
    ["→ / ←", "Widen or narrow the sidebar by 16px, reversed in right-to-left text."],
    ["Shift + → / ←", "Step by 64px."],
    ["Home / End", "Jump to <code>aria-valuemin</code> or <code>aria-valuemax</code>."],
    ["Esc", "Cancels a drag and restores the width from before it."],
  ],
  a11y: [
    "The handle needs <code>role=\"separator\"</code>, <code>aria-orientation=\"vertical\"</code>, an <code>aria-label</code>, <code>aria-controls</code> pointing at the sidebar, the value attributes and <code>tabindex=\"0\"</code>.",
    "The handle's hit area is 24px wide around a 1px line, which meets the 24px target size of WCAG 2.5.8.",
    "Muted rows step back by color, not opacity, because opacity would drop text contrast below the 4.5:1 minimum.",
    "Give the body <code>nav</code> an <code>aria-label</code>; if the title is a heading, use an <code>h2</code>.",
  ],
  motion: [
    "The handle's line changes color and width in 120ms. While focused or dragged it is a 3px accent line.",
    "<code>prefers-reduced-motion</code> cuts these transitions to 0.01ms.",
  ],
  responsive: [
    "The handle is hidden below 48rem, and while the sidebar peeks over the page or sits in the phone drawer: those keep their width.",
    "Bounds come from the handle's attributes; without them the JS uses 224px and 480px.",
  ],
  notes: [
    "Only a sidebar with a <code>data-sd-shell=\"resize\"</code> handle gets a remembered width; it is stored in <code>localStorage</code> under the sidebar's <code>id</code>, so give it one.",
    "In React or another framework that owns the width, leave out <code>data-sd-shell</code>; set <code>--shell-sidebar</code> and <code>aria-valuenow</code> yourself (see Framework state).",
    "Copy a full shell with sidebar panels from <code>showcase/chat.html</code> in the repo.",
  ],
  related: [
    "rail",
    "window",
    "nav-bars",
    "owned",
  ],
};
