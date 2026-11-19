/** The doc sections of lib-owned.html: see page-docs/index.js. */
export default {
  when: [
    "React, Vue, or Svelte renders the state of a piece: leave out its <code>data-sd-*</code> attribute and render the ARIA and <code>data-*</code> attributes the CSS keys on.",
    "The state lives in the component or store, and the markup should show it from one source.",
  ],
  notWhen: [
    "Plain HTML pages: keep the <code>data-sd-*</code> attributes and let <code>init()</code> write the state.",
    "State that the browser alone holds, such as a native <code>dialog</code>: you call <code>showModal()</code> and <code>close()</code> instead of rendering an attribute.",
  ],
  usage: "&lt;div className=\"sd-seg sd-seg-inline\" role=\"group\" aria-label=\"View\"&gt;\n  {[\"list\", \"board\"].map((v) =&gt; (\n    &lt;button key={v} type=\"button\" aria-pressed={view === v} onClick={() =&gt; setView(v)}&gt;{v}&lt;/button&gt;\n  ))}\n&lt;/div&gt;\n&lt;button className=\"sd-btn\" aria-expanded={open} aria-controls=\"details\" onClick={() =&gt; setOpen(!open)}&gt;Details&lt;/button&gt;\n&lt;div className=\"sd-expand\" id=\"details\" data-open={open || undefined}&gt;&lt;div&gt;...&lt;/div&gt;&lt;/div&gt;",
  api: [
    { name: "data-sd-seg", type: "attribute", desc: "Leave out. Render aria-pressed on each sd-seg button yourself." },
    { name: "data-sd-toggle", type: "attribute", desc: "Leave out. Render aria-expanded on the button and data-open on the sd-expand panel." },
    { name: "data-sd-reaction", type: "attribute", desc: "Leave out. Render aria-pressed and the count on sd-reactions buttons." },
    { name: "data-sd-shell, data-sd-section", type: "attribute", desc: "Leave out. Render data-sidebar, data-aside, data-drawer, and --shell-sidebar on sd-shell." },
    { name: "data-sd-open, data-sd-close", type: "attribute", desc: "Leave out on a dialog. Call showModal() and close() on dialog.sd-dialog." },
    { name: "aria-pressed", type: "ARIA", desc: "The state of a segmented button or a reaction." },
    { name: "aria-expanded", type: "ARIA", desc: "The state of the button that opens an sd-expand panel." },
    { name: "data-open", type: "attribute", desc: "Shows an sd-expand panel; the CSS keys on it." },
    { name: "initScrollbars(), initKeyboard(), initSweep(), initPredict()", type: "function", desc: "The parts of init() that write only their own attributes, safe beside a framework." },
  ],
  a11y: [
    "The ARIA state is the accessible state, so render it from your component state on every change. Do not let two writers set it.",
    "Keep <code>aria-controls</code> pointing at the panel's id.",
    "<code>init()</code> also wires <code>role=\"tab\"</code>, <code>.sd-shell</code>, popovers, and scrollers without an attribute. Read README \"Framework-owned state\" before calling it in an app that renders these.",
  ],
  motion: [
    "No motion of its own: this page is about who writes state. Each piece keeps its own transitions, and the reduced-motion rules of those pieces apply unchanged.",
  ],
  notes: [
    "One writer per state: if a framework renders a piece's state, do not also give it the <code>data-sd-*</code> attribute. Two writers drift apart.",
    "On pages with React, use <code>signal-design/react</code> components, which render the <code>sd-</code> classes and need no <code>init()</code>.",
    "For auto-hiding scrollbars call <code>initScrollbars()</code>; for a shell above the phone keyboard call <code>initKeyboard()</code>; for hover shimmers to finish call <code>initSweep()</code>; for <code>sd:predict</code> call <code>initPredict()</code>.",
  ],
  related: [
    "setup",
    "choices",
    "window",
    "predict",
  ],
};
