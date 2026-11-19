/** The doc sections of lib-rules.html: see page-docs/index.js. */
export default {
  when: [
    "Status that needs a color: <code>sd-badge</code>, <code>sd-status</code>, <code>sd-dot</code>, and <code>sd-count</code> each take a tone from <code>data-tone</code>.",
    "Lists of work: rows, tables, key-value lists, and living tables show an outcome and expand for detail.",
    "Overlays: dialogs, sheets, popovers, menus, and tooltips are wired by <code>init()</code> from attributes.",
    "Before you write a component of your own: the hard rules say what it must not do, and <code>npx signal-design check</code> tests a page against them.",
  ],
  notWhen: [
    "Coloring navigation, headings, or icons: color is for status and selection, so those stay black, white, and grey.",
    "Your own sidebar layout around an app: use the App Shell, <code>sd-shell</code> (see Window and bars).",
    "State that React, Vue, or Svelte renders: leave out the <code>data-sd-*</code> behavior attribute and render the ARIA state yourself (see Framework state).",
  ],
  usage: "&lt;span class=\"sd-badge\" data-tone=\"danger\"&gt;Risk&lt;/span&gt;\n&lt;nav class=\"sd-nav\" aria-label=\"Sections\"&gt;\n  &lt;a href=\"/projects\" aria-current=\"page\"&gt;Projects&lt;/a&gt;\n  &lt;a href=\"/history\"&gt;History&lt;/a&gt;\n&lt;/nav&gt;\n&lt;button class=\"sd-btn\" data-sd-toggle=\"detail\" aria-expanded=\"false\"&gt;Details&lt;/button&gt;\n&lt;div class=\"sd-expand\" id=\"detail\"&gt;&lt;div&gt;Image, ports, and the last restart.&lt;/div&gt;&lt;/div&gt;",
  api: [
    { name: "sd-", type: "class", desc: "The prefix of every Signal class, such as <code>sd-btn</code> and <code>sd-badge</code>." },
    { name: "data-tone", type: "attribute", def: "unset", desc: "accent, success, danger, warning, pending, extra, or neutral. A component never takes a color class." },
    { name: "aria-pressed", type: "ARIA", desc: "A toggled or chosen control. The CSS styles it, and your code can set it." },
    { name: "aria-expanded", type: "ARIA", desc: "An open or closed control. <code>data-sd-toggle</code> keeps it in sync with its panel." },
    { name: "aria-current", type: "ARIA", desc: "The current location in navigation, such as <code>aria-current=\"page\"</code>. It reads as foreground, not as a color." },
    { name: "aria-selected", type: "ARIA", desc: "The chosen tab, option, or row." },
    { name: "data-sd-*", type: "attribute", desc: "Behavior that <code>init()</code> wires, such as <code>data-sd-seg</code>, <code>data-sd-toggle</code>, and <code>data-sd-open</code>." },
    { name: "init()", type: "function", desc: "Wires every <code>data-sd-*</code> attribute once. Its listeners are delegated, so markup added later works." },
    { name: "data-sd-check-ignore", type: "attribute", desc: "Exempts an element from named <code>signal-design check</code> rules, for what is right on purpose." },
  ],
  a11y: [
    "State lives in ARIA, so the styling and a screen reader read the same attribute: <code>aria-pressed</code>, <code>aria-expanded</code>, <code>aria-current</code>, and <code>aria-selected</code>.",
    "Color is never the only signal. Pending differs from warning by shape too: a ringed dot, and a dashed badge edge.",
    "Focus rings and the current link are foreground, not a color, so they hold their contrast in every theme.",
    "Every text role reaches 4.5:1 on the surfaces of its theme (see Color).",
    "<code>npx signal-design check &lt;url&gt; --a11y</code> adds an axe WCAG 2.2 AA audit to the rule checks.",
  ],
  motion: [
    "Transitions run 120-200ms.",
    "Hover shimmers play once per hover. Loops run only while work runs or when turned on.",
    "prefers-reduced-motion stops the loops and the transitions; the state change stays visible.",
  ],
  notes: [
    "Never write <code>rounded-*</code>, <code>shadow-lg</code>, or a hex value. Corners are square, surfaces are told apart by tone, and colors come from <code>--sd-*</code> tokens.",
    "Navigation, headings, and icons stay grey. Color means status or selection.",
    "Dimming text with <code>opacity</code> drops its contrast under 4.5:1; use <code>text-fg-muted</code> or <code>text-fg-faint</code>.",
    "One <code>sd-btn-primary</code> per view, and one writer per state: React, Vue, or Svelte renders the ARIA state, or the <code>data-sd-*</code> attribute does, never both.",
  ],
  related: [
    "color",
    "type",
    "owned",
    "buttons",
  ],
};
