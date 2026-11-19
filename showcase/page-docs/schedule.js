/** The doc sections of lib-schedule.html: see page-docs/index.js. */
export default {
  when: [
    "A roster over hours: one row per person or resource, with blocks for what each one is doing when.",
    "Work in several states at once: driving, planned, proposed, completed, and conflict blocks share one board, and a row can be marked as a conflict.",
    "A day with a present moment: a now line crosses every row at the current hour, with an optional time readout.",
  ],
  notWhen: [
    "Ranges with only a few lanes and no people or resources: a timeline does that (see Timeline).",
    "Values over time: a chart draws the shape (see Charts).",
    "Steps in a pipeline with jobs inside: a flow shows the stages (see Flow).",
  ],
  usage: "&lt;figure class=\"sd-schedule\" style=\"--start: 6; --end: 22\" aria-labelledby=\"roster-h\"&gt;\n  &lt;div class=\"sd-schedule-head\"&gt;\n    &lt;span class=\"sd-label sd-label-strong\" id=\"roster-h\"&gt;Driver roster&lt;/span&gt;\n    &lt;div class=\"sd-schedule-legend\"&gt;&lt;span data-status=\"driving\"&gt;&lt;i&gt;&lt;/i&gt;Driving&lt;/span&gt;&lt;span&gt;&lt;i&gt;&lt;/i&gt;Off duty&lt;/span&gt;&lt;/div&gt;\n  &lt;/div&gt;\n  &lt;div class=\"sd-schedule-board\"&gt;\n    &lt;div class=\"sd-schedule-canvas\"&gt;\n      &lt;div class=\"sd-schedule-grid\" aria-hidden=\"true\"&gt;&lt;i style=\"--at: 6\"&gt;&lt;/i&gt;&lt;i style=\"--at: 14\"&gt;&lt;/i&gt;&lt;i style=\"--at: 22\"&gt;&lt;/i&gt;&lt;/div&gt;\n      &lt;div class=\"sd-schedule-axis\" aria-hidden=\"true\"&gt;\n        &lt;span&gt;Driver&lt;/span&gt;\n        &lt;div&gt;&lt;span style=\"--at: 6\"&gt;06:00&lt;/span&gt;&lt;span style=\"--at: 14\"&gt;14:00&lt;/span&gt;&lt;span style=\"--at: 22\"&gt;22:00&lt;/span&gt;&lt;/div&gt;\n      &lt;/div&gt;\n      &lt;div class=\"sd-schedule-row\"&gt;\n        &lt;div class=\"sd-schedule-resource\" id=\"budi\"&gt;&lt;b&gt;Budi Santoso&lt;/b&gt;&lt;span&gt;VH-028 · 2h 40m of 8h&lt;/span&gt;&lt;/div&gt;\n        &lt;div class=\"sd-schedule-track\"&gt;\n          &lt;span class=\"sd-schedule-block\" tabindex=\"0\" aria-describedby=\"budi\" data-status=\"driving\" style=\"--from: 12.75; --to: 21\"&gt;&lt;span class=\"sd-schedule-label\"&gt;SHP-10482 → Semarang · 12:45–21:00 · Driving&lt;/span&gt;&lt;/span&gt;\n        &lt;/div&gt;\n      &lt;/div&gt;\n      &lt;span class=\"sd-schedule-now\" style=\"--at: 14.33\" data-label=\"14:20\"&gt;&lt;/span&gt;\n    &lt;/div&gt;\n  &lt;/div&gt;\n  &lt;figcaption class=\"sd-meta\"&gt;&lt;span&gt;Friday, 38 drivers&lt;/span&gt;&lt;/figcaption&gt;\n&lt;/figure&gt;",
  api: [
    { name: "sd-schedule", type: "class", desc: "The figure: a label column and an hour plot on one scale. CSS only." },
    { name: "--start, --end", type: "token", def: "0, 24", desc: "The range the board covers, in the unit you choose; hours in the demo." },
    { name: "--from, --to, --at", type: "token", desc: "Positions on that same scale for blocks, grid lines, axis ticks, and the now line." },
    { name: "--row-h, --label-w, --block-h, --axis-h", type: "token", def: "44px, 10rem, 26px, 26px", desc: "Row height, label column width, block height, and axis height." },
    { name: "--min-w", type: "token", def: "0", desc: "On <code>sd-schedule-canvas</code>: a minimum width, below which the board scrolls sideways." },
    { name: "sd-schedule-head, sd-schedule-legend", type: "class", desc: "A title row and a legend whose spans take the same <code>data-status</code> as the blocks." },
    { name: "sd-schedule-board, sd-schedule-canvas", type: "class", desc: "The scrolling wrapper and the positioned canvas that holds the grid, axis, rows, and now line." },
    { name: "sd-schedule-grid, sd-schedule-axis", type: "class", desc: "Hour lines from <code>i</code> children, and a header row with a corner label and ticks." },
    { name: "sd-schedule-row, sd-schedule-resource, sd-schedule-track", type: "class", desc: "One resource: its name and detail in a <code>b</code> and a <code>span</code>, and the track its blocks sit in." },
    { name: "sd-schedule-block, sd-schedule-label", type: "class", desc: "A time block, focusable, and its text; hover or focus reveals the full label." },
    { name: "sd-schedule-now", type: "class", desc: "A line at <code>--at</code> over the rows and under the blocks; <code>data-label</code> adds a readout." },
    { name: "data-status", type: "attribute", def: "off duty", desc: "<code>driving</code>, <code>planned</code>, <code>proposed</code>, <code>completed</code>, or <code>conflict</code> on a block or legend item; none is off duty." },
    { name: "data-state", type: "attribute", desc: "<code>conflict</code> on a row: a critical tint and a 2px edge." },
    { name: "aria-selected, data-selected", type: "ARIA", desc: "On a row: the selected row, drawn with the current fill." },
    { name: "data-chart-theme", type: "attribute", def: "mono", desc: "<code>mono</code> is black and white; <code>spectrum</code> recolors the board. Set it on the figure or any element above." },
  ],
  keyboard: [
    ["Tab", "Moves through the blocks, which carry <code>tabindex=\"0\"</code>."],
    ["Focus", "Reveals the focused block's full label and outlines it; it is the same view as hover."],
  ],
  a11y: [
    "Name the figure with <code>aria-labelledby</code> on the title, and add a <code>figcaption</code>.",
    "Mark the grid and the axis <code>aria-hidden=\"true\"</code>; the resource and the block labels carry the data.",
    "Give each block <code>tabindex=\"0\"</code> and <code>aria-describedby</code> pointing at its resource's id, so a focused block is read with who it belongs to.",
    "Write the status in the label text, such as \"· Driving\", since the fill alone does not say it; the mono theme tells states apart by fill, outline, and a dashed edge for proposed.",
    "A conflict row is tinted and takes a 2px edge, and its small text moves toward the foreground color to keep 4.5:1.",
  ],
  motion: [
    "A row's fill changes over 160ms on hover and focus.",
    "A block's border and text color change over 160ms.",
    "prefers-reduced-motion cuts those changes to near zero; the revealed label still appears.",
  ],
  responsive: [
    "The figure sizes to its container, and the board scrolls sideways when <code>--min-w</code> asks for more width.",
    "In a container 30rem wide or narrower, every second axis tick is hidden and block labels tighten their padding.",
    "Under 40rem the label column is 7rem wide.",
    "A block's label is cut to its width and revealed in full on hover or focus, clamped to the track so late blocks still have room.",
  ],
  notes: [
    "Keep <code>--start</code> and <code>--end</code> on the figure, and compute every <code>--from</code>, <code>--to</code>, and <code>--at</code> on that scale.",
    "The canvas holds the grid and the axis first, so rows alternate by their order after them.",
    "Color means status: leave off duty without a <code>data-status</code> and do not tone blocks for decoration.",
    "Use <code>data-chart-theme=\"spectrum\"</code> only when the colors carry data; the default is black and white.",
  ],
  related: [
    "timeline",
    "flow",
    "charts",
  ],
};
