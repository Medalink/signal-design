/** The doc sections of lib-color.html: see page-docs/index.js. */
export default {
  when: [
    "Choosing a color, size, or duration for your own component: read a role token instead of a value.",
    "Checking a theme before you ship: switch ink, graphite, and paper from the Theme button.",
    "Reading how a role looks: the swatches and ratios on this page follow the current theme.",
  ],
  notWhen: [
    "Reaching for a brand hue: color is reserved for status and selection, so Signal has no decorative colors.",
    "Hard-coding a hex value: themes would stop applying, and paper deepens the signal colors a fixed value would not follow.",
    "Adding a shadow or glow: surfaces are flat and told apart by tone (see Rules).",
  ],
  usage: "&lt;span class=\"sd-badge\" data-tone=\"success\"&gt;Passed&lt;/span&gt;\n&lt;p class=\"text-danger\"&gt;Payment failed&lt;/p&gt;\n&lt;section data-theme=\"paper\" class=\"bg-canvas text-fg p-4\"&gt;\n  &lt;p class=\"text-fg-muted\"&gt;Themed on its own.&lt;/p&gt;\n&lt;/section&gt;",
  api: [
    { name: "--sd-accent", type: "token", desc: "Selected, active, now. Siblings: <code>--sd-success</code>, <code>--sd-danger</code>, <code>--sd-warning</code>, <code>--sd-pending</code>, <code>--sd-extra</code>." },
    { name: "data-tone", type: "attribute", def: "unset", desc: "accent, success, danger, warning, pending, extra, or neutral. Components read the result as <code>var(--tone)</code>." },
    { name: "--sd-canvas, --sd-surface, --sd-raised", type: "token", desc: "The page fill and the two steps above it." },
    { name: "--sd-tone-0 ... --sd-tone-3", type: "token", desc: "Region steps: chrome, side panels, content, and raised content." },
    { name: "--sd-field-fill", type: "token", desc: "The fill of a field, chip, or plain button." },
    { name: "--sd-fg, --sd-fg-muted, --sd-fg-subtle, --sd-fg-faint", type: "token", desc: "The four text roles, from body text down to the faintest. Utilities: <code>text-fg</code>, <code>text-fg-muted</code>." },
    { name: "--sd-line, --sd-line-strong, --sd-line-control", type: "token", desc: "Lines, for the places where a line means something. <code>--sd-line-control</code> is the edge of a text field." },
    { name: "data-theme", type: "attribute", def: "ink", desc: "ink, graphite, paper, or auto, on <code>&lt;html&gt;</code> or on any element to theme its subtree. <code>light</code> is an older name for paper." },
    { name: "setTheme(name)", type: "function", desc: "Sets <code>data-theme</code> on the root and remembers it. An unknown name throws." },
    { name: "getTheme(), cycleTheme(), restoreTheme()", type: "function", desc: "Read the theme, step to the next one, and apply the remembered one." },
    { name: "data-sd-theme", type: "attribute", desc: "On a button, sets that theme on click and keeps <code>aria-pressed</code> current. <code>data-sd-theme-cycle</code> steps through them." },
    { name: "sd:theme", type: "event", desc: "Fires on the document after a theme is set, with <code>detail.theme</code>." },
  ],
  keyboard: [
    ["Shift T", "Steps through ink, graphite, paper, and auto. <code>init({ themeKey })</code> changes the key, and an empty string turns it off."],
  ],
  a11y: [
    "Every text role, <code>fg-faint</code> included, reaches 4.5:1 on the canvas, surface, and raised fills of all three themes.",
    "Color is not the only signal for status: pending differs from warning by shape, with a ringed dot and a dashed badge edge.",
    "Focus rings and the current link are foreground, not a color.",
    "In a Windows contrast theme (<code>forced-colors: active</code>) the system repaints fills, and the parts show selected and current state in system colors.",
    "The shortcut ignores key presses inside text fields.",
  ],
  motion: [
    "<code>setTheme()</code> turns transitions off for one style pass, so every color changes at once instead of fading element by element.",
    "Tokens carry no motion of their own; the durations are on the Layout page.",
  ],
  responsive: [
    "Tokens do not depend on the viewport. A theme applies the same at every width.",
    "<code>data-theme=\"auto\"</code> follows the OS: ink, or paper when the OS asks for light.",
  ],
  notes: [
    "Name the job, not the hue: <code>text-danger</code>, never <code>text-pink</code> or a hex value.",
    "Only status and selection are colored. Navigation, headings, icons, and focus rings stay black, white, and grey.",
    "Three selection markers are accent: the bar beside the current <code>sd-rail-tile</code>, the edge and corner of a chosen <code>sd-option</code>, and the start edge of the command palette's active result.",
    "Never dim text with <code>opacity</code>; use <code>text-fg-muted</code> or <code>text-fg-faint</code>.",
    "A themed subtree needs only <code>data-theme</code>; tokens resolve against the nearest one.",
  ],
  related: [
    "rules",
    "type",
    "badges",
    "feedback",
  ],
};
