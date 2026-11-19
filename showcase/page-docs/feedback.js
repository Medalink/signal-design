/** The doc sections of lib-feedback.html: see page-docs/index.js. */
export default {
  intro: "What the system tells the user while it works and after it finishes, from an inline note to a toast.",
  when: [
    "Something changed under the user: a note states it and offers the next step.",
    "Work has a length: progress shows the amount, or runs indeterminate when it has none.",
    "A list or screen has nothing to show yet: an empty state says what will appear here.",
  ],
  notWhen: [
    "A standing state on a row or item: a badge or status does that (see Badges).",
    "A result the user must not miss: a dialog holds the decision (see Overlays).",
  ],
  usage: "&lt;div class=\"sd-callout\" data-tone=\"danger\"&gt;\n  &lt;p class=\"sd-callout-title\"&gt;High risk&lt;/p&gt;\n  &lt;p&gt;Expires in 45 min. Review before approving.&lt;/p&gt;\n&lt;/div&gt;\n&lt;button data-sd-toast=\"Saved\"&gt;Save&lt;/button&gt;",
  api: [
    { name: "sd-note", type: "class", desc: "An inline line of text that takes a tone and can hold a button." },
    { name: "sd-callout, sd-callout-title", type: "class", desc: "A boxed note with a titled edge in its tone." },
    { name: "toast(text, { tone })", type: "function", desc: "Shows a short result at the edge; data-sd-toast does it from a click." },
    { name: "sd-progress", type: "class", desc: "A bar driven by --value, or data-state=\"indeterminate\" when the amount is unknown." },
    { name: "sd-progress-label", type: "class", desc: "The row above a bar: name and value at the ends." },
    { name: "sd-cells", type: "class", desc: "A row of small squares, i elements with data-on." },
    { name: "sd-skeleton, sd-skeleton-text", type: "class", desc: "A loading placeholder; keep it aria-hidden." },
    { name: "sd-checks", type: "class", desc: "A result list; each li takes a tone." },
    { name: "sd-empty, sd-empty-title", type: "class", desc: "An empty state with its ornament and a next action." },
  ],
  a11y: [
    "Give every progress bar role=\"progressbar\" with aria-label, and aria-valuenow when the value is known.",
    "A toast is announced as it appears; keep its text short enough to hear in one breath.",
    "Skeletons are decoration: aria-hidden, with the real wait described nearby.",
  ],
  motion: [
    "An indeterminate progress bar loops; everything else runs once.",
    "prefers-reduced-motion stops the loop and the skeleton shimmer; the state stays readable.",
  ],
  related: [
    "badges",
    "overlays",
    "setup",
  ],
};
