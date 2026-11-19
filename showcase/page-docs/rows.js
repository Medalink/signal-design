/** The doc sections of lib-rows.html: see page-docs/index.js. */
export default {
  when: [
    "A list of work where each item has an outcome to read: the row shows a one-line outcome and a status line, and detail opens under it.",
    "A queue the user clears in order: a marker line between handled and new rows says where they stopped, and a pill above says how many arrived.",
    "Items that carry risk: a toned edge on the row flags the ones that need a look before the rest.",
  ],
  notWhen: [
    "Comparable records with columns: a table lines the values up (see Stats and tables).",
    "Rows that arrive, change, and leave while the user reads: a living table keeps them in groups (see Living tables).",
    "Messages from people: a message has an author, time column, and reply structure (see Messages).",
  ],
  usage: "&lt;article class=\"sd-row\" aria-current=\"true\"&gt;\n  &lt;span class=\"sd-dot\" data-tone=\"warning\"&gt;&lt;/span&gt;\n  &lt;div class=\"sd-row-body\"&gt;\n    &lt;p class=\"sd-row-title\"&gt;Fix the crash when a customer has no address&lt;/p&gt;\n    &lt;p class=\"sd-meta\"&gt;&lt;span&gt;Platform&lt;/span&gt;&lt;span&gt;07:55&lt;/span&gt;&lt;/p&gt;\n  &lt;/div&gt;\n  &lt;div class=\"sd-row-end\"&gt;\n    &lt;button class=\"sd-btn sd-btn-sm\" data-sd-toggle=\"detail-21\" aria-expanded=\"false\" aria-controls=\"detail-21\"&gt;Details&lt;/button&gt;\n  &lt;/div&gt;\n&lt;/article&gt;\n&lt;div class=\"sd-expand\" id=\"detail-21\"&gt;\n  &lt;div&gt;Detail goes here.&lt;/div&gt;\n&lt;/div&gt;\n&lt;div class=\"sd-marker\"&gt;&lt;span&gt;You are here&lt;/span&gt;&lt;/div&gt;",
  api: [
    { name: "sd-row", type: "class", desc: "One item: a marker, a body, and an optional end cell, at least 68px tall." },
    { name: "sd-row-body, sd-row-title", type: "class", desc: "The body holds a one-line outcome and a status line; the title truncates, or wraps to two lines on a phone." },
    { name: "sd-row-end", type: "class", desc: "Trailing actions such as a review or details button." },
    { name: "aria-current", type: "ARIA", desc: "On a row: the focused row, drawn with a 1px foreground edge." },
    { name: "data-edge", type: "attribute", desc: "Draws a 1px edge in the row's <code>data-tone</code>, for risk." },
    { name: "data-done", type: "attribute", desc: "A handled row: the title drops to the subtle grey, and a marker inside dims." },
    { name: "sd-marker", type: "class", desc: "A labeled divider line; <code>sd-marker-plain</code> is a sentence-case label, <code>sd-marker-end</code> is pushed to the end." },
    { name: "sd-expand", type: "class", desc: "Detail under a row: a block whose one child opens by animating its height." },
    { name: "data-sd-toggle", type: "attribute", desc: "On a trigger: the id of the <code>sd-expand</code> to open; the JS writes <code>aria-expanded</code> and <code>data-open</code>." },
    { name: "aria-expanded", type: "ARIA", desc: "On the trigger: true while its detail is open." },
    { name: "setExpanded(target, open?)", type: "function", desc: "Opens, closes, or toggles an <code>sd-expand</code> by id or element." },
  ],
  keyboard: [
    ["Tab", "Moves to the details button, or to the row when it is an <code>a</code>, <code>button</code>, or has a <code>tabindex</code>."],
    ["Enter, Space", "Activates the focused trigger and opens or closes its detail."],
  ],
  a11y: [
    "The trigger needs <code>aria-expanded</code> and <code>aria-controls</code> pointing at the <code>sd-expand</code> id; the JS keeps the first current.",
    "A closed <code>sd-expand</code> is <code>visibility: hidden</code>, so its buttons leave the tab order until it opens.",
    "Mark the focused row with <code>aria-current=\"true\"</code>; the edge it draws is not the only cue, since the row also takes focus outlines when it is a link or button.",
    "A dot carries no words: put the meaning in the meta line, such as <code>risk</code> in a danger tone.",
    "A <code>kbd</code> hint inside a button is read with its label; put it last.",
    "Done rows step back by a lighter title color, not opacity, so they stay readable.",
  ],
  motion: [
    "A row's opacity fades in 160ms and its background in 140ms.",
    "An <code>sd-expand</code> opens and closes by animating its height over 200ms.",
    "prefers-reduced-motion cuts these transitions to near zero; rows still open and close.",
  ],
  responsive: [
    "Under 48rem a row title wraps to two lines before it is cut; above that it truncates to one line.",
    "Under 40rem the row is 60px tall at least, its title steps down a size, and the edge moves from 12px to 8px outside the row.",
    "Under 40rem a marker drops its <code>sd-marker-plain</code> label and tightens its gap.",
  ],
  notes: [
    "Write the title as an outcome, a full line a reader can act on, not a ticket code.",
    "Place the <code>sd-expand</code> as the next sibling after its row, in the same column.",
    "Use <code>data-tone</code> with <code>data-edge</code> for risk; do not color the title.",
    "In React, render <code>aria-expanded</code> and <code>data-open</code> yourself and leave out <code>data-sd-toggle</code>: one writer per state.",
  ],
  related: [
    "stats",
    "living-tables",
    "badges",
    "feed",
  ],
};
