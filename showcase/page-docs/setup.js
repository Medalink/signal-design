/** The doc sections of lib-setup.html: see page-docs/index.js. */
export default {
  intro: "One import and one call: init() reads data-sd attributes and writes ARIA and data-* state that the CSS styles.",
  when: [
    "Plain HTML or server-rendered pages: attributes alone give dialogs, menus, tabs, and tooltips.",
    "Markup that arrives after load: every listener is delegated, so no re-init is needed.",
    "Theme switching with a remembered choice, and copy buttons with feedback.",
    "Live lists that must keep the reader's place: mountFeed.",
  ],
  notWhen: [
    "A page where the HTML works with CSS alone: each block says whether it needs JS.",
    "A framework already renders the state: leave out that piece's data-sd attribute and set ARIA yourself (see Framework state).",
    "Heavy components (living tables, countdowns, and feeds) mount explicitly. init() does not run them.",
  ],
  usage: "import { init } from \"signal-design/js\";\n\ninit(); // once, after the DOM exists",
  api: [
    { name: "init()", type: "function", desc: "Wires every data-sd attribute once, after the DOM exists." },
    { name: "toast(text, { tone })", type: "function", desc: "Shows a toast; data-sd-toast does it from a click." },
    { name: "hotkeys({ key: fn })", type: "function", desc: "A map of shortcuts, including sequences; returns the off function." },
    { name: "setTheme(name)", type: "function", desc: "ink, graphite, paper, or auto; remembers the choice." },
    { name: "data-sd-open, data-sd-close", type: "attribute", desc: "Opens a dialog as modal, closes the nearest one." },
    { name: "data-sd-toggle", type: "attribute", desc: "Opens and closes an .sd-expand, keeping aria-expanded in sync." },
    { name: "data-sd-seg", type: "attribute", desc: "A single-select button group; fires change." },
    { name: "data-sd-key", type: "attribute", desc: "Clicks the element when the key is pressed, unless the user is typing." },
    { name: "data-sd-tip", type: "attribute", desc: "A tooltip on hover and focus." },
    { name: "data-sd-copy", type: "attribute", desc: "Copies the target pre's text and toasts the result." },
    { name: "data-sd-theme, data-sd-theme-cycle", type: "attribute", desc: "Sets or steps the theme from a click." },
    { name: "mountFeed, mountCountdown, mountLivingTable", type: "function", desc: "The heavy mounts; call them yourself on teardown with dispose()." },
  ],
  keyboard: [
    ["Shift T", "Steps to the next theme, from data-sd-theme-cycle or the key itself."],
    ["Esc", "Closes the top dialog, popover, or tooltip."],
  ],
  a11y: [
    "The JS writes ARIA; it never reads classes back, so tests and frameworks can set the same attributes.",
    "Shortcuts ignore keys typed into a field, except Ctrl or Cmd combinations.",
    "Toasts and copy feedback are announced; the failure toast names the fallback.",
  ],
  motion: [
    "Dialogs, popovers, and menus move in 120-200ms.",
    "prefers-reduced-motion removes the movement; everything still opens and closes.",
  ],
  related: [
    "owned",
    "overlays",
    "command",
  ],
};
