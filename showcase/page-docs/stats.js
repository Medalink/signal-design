/** The doc sections of lib-stats.html: see page-docs/index.js. */
export default {
  intro: "Numbers and their facts: a stat for one figure, a table for many rows, a key-value list for one record.",
  when: [
    "A dashboard leads with a few figures: stats carry them, deltas say which way they moved.",
    "Comparable rows with columns: a table, sortable when the user needs an order.",
    "One record's details beside its content: a key-value list, plain when keys get long.",
  ],
  notWhen: [
    "Values over time: a chart shows the shape (see Charts).",
    "Rows that arrive and leave while you watch: a living table does that (see Living tables).",
  ],
  usage: "&lt;div class=\"sd-stat\"&gt;\n  &lt;span class=\"sd-stat-value\"&gt;260&lt;small&gt;ms&lt;/small&gt;&lt;/span&gt;\n  &lt;span class=\"sd-stat-label\"&gt;Checkout p95&lt;/span&gt;\n  &lt;span class=\"sd-stat-delta\" data-tone=\"success\"&gt;−150ms&lt;/span&gt;\n&lt;/div&gt;",
  api: [
    { name: "sd-stat", type: "class", desc: "An inline stat: value over label, with an optional delta." },
    { name: "sd-stat-value, sd-stat-label", type: "class", desc: "The figure, with small for units, and its name." },
    { name: "sd-stat-delta", type: "class", desc: "The change since before, taking a tone." },
    { name: "sd-stat-box", type: "class", desc: "The boxed stat, with -sm, sd-stat-sub, and sd-stat-end." },
    { name: "sd-table", type: "class", desc: "The table, in an sd-table-wrap; -hover and -compact vary it." },
    { name: "th[data-sort]", type: "attribute", desc: "A sortable header; the JS sets aria-sort." },
    { name: "sd-num", type: "class", desc: "Tabular numbers on numeric cells, so digits line up." },
    { name: "sd-kv", type: "class", desc: "A key-value list; sd-kv-plain is sentence case and truncates long keys." },
  ],
  a11y: [
    "Mark the sorting column with aria-sort; the JS keeps it current as the order changes.",
    "A th needs scope or a table layout a screen reader can infer; keep the first row a header row.",
    "Units belong in the value text, so 260 ms is read as one figure.",
  ],
  motion: [
    "Hover states on rows and headers run 120-200ms.",
    "prefers-reduced-motion keeps the hover change without the transition.",
  ],
  related: [
    "charts",
    "rows",
    "living-tables",
  ],
};
