/** The doc sections of lib-timeline.html: see page-docs/index.js. */
export default {
  when: [
    "Ranges that overlap in time: one lane per item on a shared axis shows when each started, ended, and ran beside the others.",
    "A plan or history with a few lanes: eras, phases of a build, or a sequence of hand-offs, where the dates matter more than the values.",
    "A repeating stretch worth naming: a mark under the lanes spans a range, such as a two-week loop.",
  ],
  notWhen: [
    "Values that change over time: a chart draws the shape (see Charts).",
    "Who is on at what hour: a schedule's hour roster does that (see Schedule).",
    "Steps that run in order with jobs inside: a flow shows the pipeline (see Flow).",
  ],
  usage: "&lt;figure class=\"sd-timeline\" aria-labelledby=\"build-h\"&gt;\n  &lt;div class=\"sd-timeline-head\"&gt;\n    &lt;span class=\"sd-label sd-label-strong\" id=\"build-h\"&gt;Eight-week build&lt;/span&gt;\n    &lt;span class=\"sd-status\"&gt;in motion&lt;/span&gt;\n  &lt;/div&gt;\n  &lt;div class=\"sd-timeline-body\"&gt;\n    &lt;div class=\"sd-timeline-labels\"&gt;\n      &lt;span class=\"sd-timeline-label\"&gt;Listen&lt;/span&gt;\n      &lt;span class=\"sd-timeline-label\"&gt;Build&lt;/span&gt;\n    &lt;/div&gt;\n    &lt;div class=\"sd-timeline-plot\"&gt;\n      &lt;div class=\"sd-timeline-grid\" aria-hidden=\"true\"&gt;&lt;i style=\"--at: 0\"&gt;&lt;/i&gt;&lt;i style=\"--at: 50\"&gt;&lt;/i&gt;&lt;i style=\"--at: 100\"&gt;&lt;/i&gt;&lt;/div&gt;\n      &lt;div class=\"sd-timeline-row\"&gt;&lt;span class=\"sd-timeline-track\"&gt;&lt;span class=\"sd-timeline-bar\" style=\"--from: 0; --to: 25\"&gt;&lt;/span&gt;&lt;/span&gt;&lt;/div&gt;\n      &lt;div class=\"sd-timeline-row\"&gt;&lt;span class=\"sd-timeline-track\"&gt;&lt;span class=\"sd-timeline-bar\" data-tone=\"accent\" style=\"--from: 20; --to: 87.5\"&gt;&lt;/span&gt;&lt;/span&gt;&lt;/div&gt;\n    &lt;/div&gt;\n  &lt;/div&gt;\n  &lt;div class=\"sd-timeline-axis\" aria-hidden=\"true\"&gt;&lt;span style=\"--at: 0\"&gt;W0&lt;/span&gt;&lt;span style=\"--at: 50\"&gt;W4&lt;/span&gt;&lt;span style=\"--at: 100\"&gt;W8&lt;/span&gt;&lt;/div&gt;\n  &lt;figcaption class=\"sd-meta\"&gt;&lt;span&gt;An eight-week build&lt;/span&gt;&lt;/figcaption&gt;\n&lt;/figure&gt;",
  api: [
    { name: "sd-timeline", type: "class", desc: "The figure: a label column and a plot column on one axis. CSS only, no canvas." },
    { name: "sd-timeline-head", type: "class", desc: "A title row, with a <code>sd-status</code> at the end if you want one." },
    { name: "sd-timeline-body, sd-timeline-labels, sd-timeline-label", type: "class", desc: "The two columns and the lane names in the left one, one per row, in capitals." },
    { name: "sd-timeline-plot, sd-timeline-row, sd-timeline-track", type: "class", desc: "The plot column, one lane per row, and the track a bar sits in." },
    { name: "sd-timeline-bar", type: "class", desc: "A range from <code>--from</code> to <code>--to</code>; two <code>b</code> children show its start and end labels." },
    { name: "sd-timeline-grid", type: "class", desc: "Vertical hairlines from <code>i</code> children, each at <code>--at</code>." },
    { name: "sd-timeline-now", type: "class", desc: "An accent line at <code>--at</code> for the present." },
    { name: "sd-timeline-axis", type: "class", desc: "A ticked axis under the plot; each <code>span</code> sits at <code>--at</code>." },
    { name: "sd-timeline-mark", type: "class", desc: "A bracket under the lanes from <code>--from</code> to <code>--to</code>, with a <code>b</code> label centered below it." },
    { name: "--from, --to, --at", type: "token", desc: "Positions as percentages of the axis, 0 to 100, shared by every part so rows line up." },
    { name: "--row-h, --label-w, --label-gap", type: "token", def: "30px, 8rem, 12px", desc: "Lane height, label column width, and the gap between the columns." },
    { name: "data-tone", type: "attribute", desc: "Colors a bar, its label, or a mark with a status role." },
  ],
  a11y: [
    "The figure needs a name: use <code>aria-labelledby</code> on the <code>figure</code> pointing at the head's title, and a <code>figcaption</code> that says what the chart shows.",
    "The grid, the now line, and the axis are decoration for the eye: mark them <code>aria-hidden=\"true\"</code>.",
    "The dates carry the data: keep the start and end labels in each bar, or say them in a list or the caption, since a bar's width alone is not readable by a screen reader.",
    "A tone on a bar is an add-on: the lane label and the bar's own labels say which item it is.",
  ],
  motion: [
    "No transitions: every part is drawn from its custom properties and does not animate.",
    "prefers-reduced-motion changes nothing here.",
  ],
  responsive: [
    "The figure sizes to its container: <code>container-type: inline-size</code> on <code>sd-timeline</code>.",
    "In a container 30rem wide or narrower the year labels inside bars are hidden, so short bars stay clean.",
    "Under 40rem the label column narrows to 7rem, lanes grow to 36px, and a lane label wraps instead of truncating.",
    "A bar too short for two labels keeps the start label and ends the second with an ellipsis.",
  ],
  notes: [
    "Compute <code>--from</code> and <code>--to</code> yourself as percentages of one span, and reuse the same scale in the grid, the now line, the axis, and the mark.",
    "Add one <code>sd-timeline-row</code> and one <code>sd-timeline-label</code> per lane, in the same order.",
    "Use <code>data-tone=\"accent\"</code> for the current item only; leave the rest grey.",
  ],
  related: [
    "charts",
    "schedule",
    "flow",
  ],
};
