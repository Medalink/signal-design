/** The doc sections of lib-live-feed.html: see page-docs/index.js. */
export default {
  when: [
    "A feed of rows that arrive while the user reads: <code>beforeUpdate()</code> and <code>afterUpdate()</code> keep their place when you insert or replace rows.",
    "Keyboard reading through a list: wire <code>move()</code>, <code>newest()</code>, and <code>oldest()</code> to keys with <code>hotkeys()</code>.",
    "A feed the user scrolls away from: an optional idle return brings the view back to a target after a pause.",
  ],
  notWhen: [
    "A table whose rows change in place: a living table handles that (see Living tables).",
    "A message conversation with day breaks and a jump bar: the message feed has its own parts (see Feed).",
    "A short list that fits the screen. Plain rows need no mount.",
  ],
  usage: "&lt;div id=\"feed\" tabindex=\"0\" role=\"region\" aria-label=\"Activity feed\" style=\"max-height: 14rem; overflow-y: auto\"&gt;\n  &lt;article class=\"sd-row\" data-id=\"a-2\" data-order=\"2\"&gt;...&lt;/article&gt;\n  &lt;article class=\"sd-row\" data-id=\"a-1\" data-order=\"1\"&gt;...&lt;/article&gt;\n&lt;/div&gt;\n\n&lt;script type=\"module\"&gt;\n  import { mountFeed, hotkeys } from \"signal-design/js\";\n  const root = document.getElementById(\"feed\");\n  const feed = mountFeed(root);\n  hotkeys({ j: () =&gt; feed.move(1), k: () =&gt; feed.move(-1), \"g t\": () =&gt; feed.newest(), n: () =&gt; feed.oldest() }, { target: root });\n&lt;/script&gt;",
  api: [
    { name: "mountFeed(root, options)", type: "function", desc: "Mounts a scrollable feed and returns the controls below; init() does not mount it." },
    { name: "data-id", type: "attribute", desc: "A stable row id, used for selection and for holding place across updates." },
    { name: "data-order", type: "attribute", desc: "A numeric order; oldest() takes the lowest and newest() the highest." },
    { name: "select(id, { scroll, behavior })", type: "function", desc: "Makes a row current and scrolls it to the align position." },
    { name: "move(delta)", type: "function", desc: "Moves the current row in DOM order, clamped at both ends." },
    { name: "oldest(), newest()", type: "function", desc: "Select the lowest or highest data-order." },
    { name: "beforeUpdate(), afterUpdate()", type: "function", desc: "Bracket a synchronous DOM change so the rows in view stay where they are." },
    { name: "refresh()", type: "function", desc: "Reconciles the current row after rows changed without a bracketed update." },
    { name: "suspend(value)", type: "function", def: "true", desc: "Cancels the idle return and motion until called with false." },
    { name: "dispose()", type: "function", desc: "Removes listeners and timers and restores the root's overflow-anchor." },
    { name: "mountFeed options", type: "function", def: "itemSelector \".sd-row[data-id][data-order]\", idleMs 2400, returnDistance 260, align 0.45", desc: "itemSelector picks the rows; activeId, returnTarget, canReturn, idleMs, returnDistance, and align set the idle return." },
    { name: "data-sd-feed", type: "attribute", desc: "Written on the root while mounted." },
    { name: "aria-current", type: "ARIA", desc: "Set to true on the current row and removed from the others." },
    { name: "sd:feed", type: "event", desc: "Bubbles from the root when the state changes; detail is { activeId, aboveCount, returnPending }." },
    { name: "data-sd-scroll-tab", type: "attribute", desc: "Gives the scroll box a tab stop while it overflows, so a keyboard user can scroll it." },
  ],
  keyboard: [
    ["j, k", "Move to the next or previous row, as the page wires them with hotkeys()."],
    ["g then t", "Select the newest row, by data-order."],
    ["n", "Select the oldest row, by data-order."],
    ["Arrow keys, Page Up, Page Down, Home, End, Space", "Scroll as usual and cancel a pending idle return."],
  ],
  a11y: [
    "Give the scroll box <code>role=\"region\"</code>, an <code>aria-label</code>, and <code>tabindex=\"0\"</code> so the keys have a target and a keyboard user can scroll it.",
    "The current row carries <code>aria-current=\"true\"</code>; mounting sets it on the first row if none has it.",
    "The mount binds no keys itself. Keys come from <code>hotkeys()</code>, which ignores typing in inputs and the keys of a dialog that is open elsewhere.",
    "Announce the \"N above\" count in a <code>role=\"status\"</code> element if it matters, as the page does with <code>sd:feed</code>.",
  ],
  motion: [
    "Smooth movement takes 180ms with an ease-out curve, and only when you pass <code>behavior: \"smooth\"</code> or the idle return runs.",
    "Under <code>prefers-reduced-motion</code> the scroll jumps immediately.",
  ],
  responsive: [
    "The feed scrolls inside the box you size. Give it a <code>max-height</code> or a flex parent with <code>min-height: 0</code>.",
  ],
  notes: [
    "Keep <code>data-id</code> stable across renders. A row that gets a new id looks like a new row and loses its place.",
    "Rows hidden with <code>hidden</code> or <code>inert</code> are skipped by navigation.",
    "DOM order controls next and previous. Numeric <code>data-order</code> controls oldest and newest, so a newest-first feed still works.",
    "The idle return does nothing without a <code>returnTarget</code>, and by default it waits while a row inside the feed has <code>aria-expanded=\"true\"</code>.",
  ],
  related: [
    "feed",
    "rows",
    "living-tables",
    "countdown",
  ],
};
