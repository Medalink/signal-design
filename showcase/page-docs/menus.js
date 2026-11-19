/** The doc sections of lib-menus.html: see page-docs/index.js. */
export default {
  intro: "A native popover positioned next to its trigger: a menu of actions, or a small panel of facts.",
  when: [
    "Row actions that would crowd the row: one more button opens the rest.",
    "A choice of a few commands with shortcuts: the menu shows the keys.",
    "A short explanation belongs next to its term: a padded popover holds it.",
  ],
  notWhen: [
    "Search over many commands: the command palette does that (see Command palette).",
    "A decision that needs space or a form: a dialog does that (see Overlays).",
  ],
  usage: "&lt;button popovertarget=\"row-menu\" aria-haspopup=\"menu\"&gt;More&lt;/button&gt;\n&lt;div popover id=\"row-menu\" class=\"sd-popover\"&gt;\n  &lt;div class=\"sd-menu\" role=\"menu\" aria-label=\"Item actions\"&gt;\n    &lt;button role=\"menuitem\"&gt;Open&lt;/button&gt;\n    &lt;button role=\"menuitem\" data-tone=\"danger\"&gt;Delete&lt;/button&gt;\n  &lt;/div&gt;\n&lt;/div&gt;",
  api: [
    { name: "popovertarget", type: "attribute", desc: "The native attribute. The JS places the panel at the trigger and keeps aria-expanded in sync." },
    { name: "sd-popover", type: "class", desc: "The panel; sd-popover-pad gives it inner padding for prose." },
    { name: "data-sd-side", type: "attribute", def: "bottom", desc: "Preferred placement, such as top; the panel still flips at the edge." },
    { name: "data-sd-align", type: "attribute", def: "start", desc: "end aligns the panel with the trigger's far edge." },
    { name: "sd-menu", type: "class", desc: "The menu inside a popover, with role=\"menu\" or role=\"listbox\"." },
    { name: "role=\"menuitem\"", type: "ARIA", desc: "One command; menuitemradio and menuitemcheckbox carry aria-checked." },
    { name: "sd-menu-label", type: "class", desc: "A group heading inside the menu." },
    { name: "sd-menu-sep", type: "class", desc: "A separator between groups, an hr." },
    { name: "sd-menu-hint", type: "class", desc: "Faint trailing text for a shortcut." },
    { name: "sd-menu-item", type: "class", desc: "A link styled as a menu item." },
  ],
  keyboard: [
    ["↓ / ↑", "Moves between items, wrapping at the ends."],
    ["Home / End", "Jumps to the first or last item."],
    ["A-Z", "Types ahead to the next item that starts with those letters."],
    ["Esc", "Closes the menu and returns focus to the trigger."],
  ],
  a11y: [
    "Set aria-haspopup on the trigger; the JS keeps aria-expanded current.",
    "Give every menu an aria-label; the trigger's name alone does not describe the menu.",
    "Disabled items keep role=\"menuitem\" with aria-disabled, so they stay findable.",
  ],
  motion: [
    "The panel opens in about 150ms with a small move and fade.",
    "prefers-reduced-motion removes the move; the panel still appears and closes.",
  ],
  related: [
    "overlays",
    "command",
    "buttons",
  ],
};
