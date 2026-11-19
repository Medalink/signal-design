/** The doc sections of lib-window.html: see page-docs/index.js. */
export default {
  when: [
    "A frameless desktop app (Tauri, or anything else) draws its own title bar with window buttons.",
    "A page needs the full Signal App Shell: rail, sidebar panels, crumb and action bars, content box and status bar.",
    "A solid header bar sits above the content, as the alternative to the floating crumb bars.",
    "An app shows a box under the content, such as a composer, in <code>sd-shell-dock</code>.",
  ],
  notWhen: [
    "A normal page in a browser tab: the browser already has a title bar, so skip <code>sd-titlebar</code>.",
    "A page with one column and no navigation: use <code>sd-page</code> (see Layout).",
  ],
  usage: "&lt;header class=\"sd-titlebar\" data-tauri-drag-region role=\"region\" aria-label=\"Window\"&gt;\n  &lt;span class=\"sd-titlebar-brand\"&gt;&lt;b&gt;ACME&lt;/b&gt;&lt;/span&gt;\n  &lt;div class=\"sd-titlebar-end\"&gt;\n    &lt;div class=\"sd-window-controls\"&gt;\n      &lt;button data-sd-window=\"minimize\" aria-label=\"Minimize\"&gt;…&lt;/button&gt;\n      &lt;button data-sd-window=\"maximize\" aria-label=\"Maximize\"&gt;…&lt;/button&gt;\n      &lt;button data-sd-window=\"close\" aria-label=\"Close\"&gt;…&lt;/button&gt;\n    &lt;/div&gt;\n  &lt;/div&gt;\n&lt;/header&gt;",
  api: [
    { name: "sd-titlebar", type: "class", desc: "The draggable bar, with <code>-start</code>, <code>-brand</code>, <code>-end</code> and <code>-metric</code> parts." },
    { name: "data-tauri-drag-region", type: "attribute", desc: "Makes the bar draggable in Tauri." },
    { name: "sd-window-controls", type: "class", desc: "The group of window buttons, which sit last in <code>sd-titlebar-end</code>." },
    { name: "data-sd-window", type: "attribute", desc: "<code>minimize</code>, <code>maximize</code> or <code>close</code> on a button. In Tauri it calls the window API; elsewhere it fires <code>sd:window</code>." },
    { name: "sd:window", type: "event", desc: "Fires on the title bar with <code>detail.action</code> when no Tauri window is present, so the app can act." },
    { name: "windowAction(action, bar)", type: "function", desc: "Runs the same action from your own code." },
    { name: "data-platform", type: "attribute", desc: "<code>mac</code>, <code>windows</code> or <code>linux</code>, set by <code>init()</code> unless you set it. On <code>mac</code> the custom buttons hide." },
    { name: "data-maximized", type: "attribute", desc: "Set on the bar while a Tauri window is maximized; it swaps the maximize and restore icons (<code>sd-icon-maximize</code>, <code>sd-icon-restore</code>)." },
    { name: "sd-shell-bar", type: "class", desc: "The header bar, with <code>-title</code>, <code>-center</code> and <code>-end</code>. The center item hides when the bar is narrower than 52rem." },
    { name: "sd-shell-dock", type: "class", desc: "A box under the content, such as a composer; <code>data-flush</code> rests it on the window bottom." },
    { name: "sd-icon-btn", type: "class", desc: "An icon button for a bar's end; give it an <code>aria-label</code>." },
    { name: "data-sd-edges", type: "attribute", desc: "Border glow that is brightest at the corners and faint along the sides." },
    { name: "sd-popover-panel", type: "class", desc: "A popover panel with <code>sd-popover-head</code> and <code>sd-popover-body</code>; <code>data-sd-align=\"end\"</code> aligns it to the trigger's far edge." },
  ],
  keyboard: [
    ["Tab", "Moves through the window buttons and the bar's controls in order."],
    ["Enter / Space", "Activates a window button."],
  ],
  a11y: [
    "Label the title bar: <code>role=\"region\" aria-label=\"Window\"</code>.",
    "Every window button and icon-only button needs an <code>aria-label</code>. In Tauri the maximize button's label switches to Restore while the window is maximized.",
    "Window buttons show a visible focus outline; leave it on.",
    "Keep one <code>h1</code> per page and the skip link at the start, as for any page.",
  ],
  motion: [
    "Window buttons change color in 100ms; icon buttons in the bar run 120ms.",
    "<code>prefers-reduced-motion</code> cuts those transitions to 0.01ms.",
  ],
  responsive: [
    "A double click on an empty part of the title bar maximizes the window; clicks on buttons, links and inputs do not.",
    "On macOS the bar keeps room (78px) for the native traffic lights and hides the custom buttons.",
    "In the shell, the sidebar moves into a drawer and the bars change below 48rem; <code>sd-desktop-only</code> and <code>sd-phone-only</code> split chrome at 768px.",
  ],
  notes: [
    "Copy the whole frame from <code>showcase/chat.html</code> in the repo; the package does not ship <code>showcase/</code>.",
    "Tauri's window API is used when <code>window.__TAURI__</code> is present (<code>app.withGlobalTauri</code>); the title bar then tracks maximized state.",
    "<code>shell.html</code> shows the full shell as a work queue.",
  ],
  related: [
    "rail",
    "sidebar",
    "nav-bars",
    "composer",
  ],
};
