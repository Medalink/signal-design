/** The doc sections of lib-buttons.html: see page-docs/index.js. */
export default {
  intro: "Every action a view offers, from the one solid primary down to a quiet link, with tones, sizes, icons, and a busy state.",
  when: [
    "A view has one clear action: the primary is that action and appears once.",
    "Rows and toolbars of secondary actions: ghost and link buttons keep them quiet.",
    "A destructive or costly step: a danger tone states the cost before the click.",
  ],
  notWhen: [
    "Single-select choices: a segmented control or option cards do that (see Choices).",
    "Navigation between pages: a link reads as navigation, a button reads as an action.",
  ],
  usage: "&lt;button class=\"sd-btn sd-btn-primary\"&gt;Approve&lt;/button&gt;\n&lt;button class=\"sd-btn\"&gt;Save for later&lt;/button&gt;\n&lt;button class=\"sd-btn sd-btn-ghost\"&gt;Cancel&lt;/button&gt;",
  install: {
    cmd: "pnpm add github:Medalink/signal-design",
    note: "Then <code>@import \"signal-design\"</code> after Tailwind, or link <code>dist/signal.css</code> with its fonts; pin a tag or commit for reproducible builds.",
  },
  examples: [
    {
      title: "Busy state",
      html: "<button class=\"sd-btn sd-btn-primary\" aria-busy=\"true\">Merging</button>\n<button class=\"sd-btn\" aria-busy=\"true\">Syncing</button>\n<button class=\"sd-btn\" disabled>Disabled</button>",
    },
    {
      title: "Destructive confirmation",
      html: "<button class=\"sd-btn\" data-tone=\"danger\">Delete branch</button>\n<button class=\"sd-btn sd-btn-ghost\">Keep it</button>",
    },
    {
      title: "Sizes",
      html: "<button class=\"sd-btn sd-btn-sm\">Small</button>\n<button class=\"sd-btn\">Default</button>\n<button class=\"sd-btn sd-btn-lg\">Large</button>",
    },
  ],
  responsive: [
    "Sizes are fixed, not fluid: the three sizes hold 26, 34, and 44 px of height at every viewport, and a long label wraps the row, not the button.",
    "A row of buttons wraps: <code>sd-actions</code> is a wrapping flex row, so toolbars fold onto more lines on narrow screens.",
    "Hover styles apply on touch too (there is no fine-pointer gate), so never put information only in hover; the press nudge gives touch its feedback.",
  ],
  notes: [
    "Pick a button for an action; a segmented control or option cards for a choice, a link for navigation.",
    "One <code>sd-btn-primary</code> per view: it is the view's main action, and ghost or link buttons carry the rest.",
    "Meaning comes from <code>data-tone</code>, never a color class; a danger tone states the cost of a destructive step before the click.",
    "While work runs, keep the button enabled with <code>aria-busy=\"true\"</code> instead of <code>disabled</code>, so it stays reachable and announced.",
  ],
  api: [
    { name: "sd-btn", type: "class", desc: "The button base: a raised fill that lifts on hover." },
    { name: "sd-btn-primary", type: "class", desc: "Solid foreground fill. One per view." },
    { name: "sd-btn-ghost", type: "class", desc: "Transparent until hover, for toolbars and quiet actions." },
    { name: "sd-btn-link", type: "class", desc: "A button that looks like a link." },
    { name: "sd-btn-sm, sd-btn-lg", type: "class", desc: "Smaller and larger sizes; sd-btn-icon is square for an icon only." },
    { name: "sd-btn-block", type: "class", desc: "Takes the full width of its column, for stacked forms." },
    { name: "sd-btn-group", type: "class", desc: "Joins buttons into one control with role=\"group\"." },
    { name: "data-tone", type: "attribute", def: "unset", desc: "success, danger, warning, pending, or accent, on plain and primary buttons." },
    { name: "aria-busy", type: "ARIA", def: "false", desc: "Shows work in flight without disabling the button." },
    { name: "sd-kbd", type: "class", desc: "A key look for any element, inside a button or beside it." },
  ],
  keyboard: [
    ["Enter", "Activates the focused button."],
    ["Space", "Activates the focused button."],
  ],
  a11y: [
    "An icon-only button needs an aria-label; there is no text to fall back on.",
    "Keep aria-busy instead of disabled while work runs, so the button stays reachable and announced.",
    "A kbd hint inside a button is read with its label; put the key last.",
  ],
  motion: [
    "Hover and press transitions run 120-200ms.",
    "prefers-reduced-motion stops the transitions; the state change stays visible.",
  ],
  related: [
    "choices",
    "menus",
    "overlays",
  ],
};
