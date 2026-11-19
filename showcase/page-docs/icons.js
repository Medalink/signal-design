/** The doc sections of lib-icons.html: see page-docs/index.js. */
export default {
  when: [
    "An icon beside a word: <code>sd-icon-text</code> puts the icon and the text on one baseline.",
    "An icon-only button or toolbar control: the set has 112 line icons with square caps and mitered corners.",
    "An icon inside a button, row, navigation link, or the shell: they use the same <code>1.5cap</code> sizing, so the icon follows the text.",
  ],
  notWhen: [
    "Another icon library or a hand-copied path: take the icon from <code>icon(name)</code> or <code>&lt;Icon name&gt;</code>, so strokes and caps match.",
    "Coloring an icon for decoration: an icon takes <code>currentColor</code>, and color is for status.",
    "A picture or a drawn scene: use a pixel piece from <code>sd-art</code> (see Art).",
  ],
  usage: "&lt;span class=\"sd-icon-text\"&gt;\n  &lt;svg class=\"sd-icon\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" aria-hidden=\"true\"&gt;\n    &lt;rect x=\"4\" y=\"4\" width=\"11\" height=\"11\"/&gt;&lt;path d=\"M15 15l5.5 5.5\"/&gt;\n  &lt;/svg&gt;\n  Search\n&lt;/span&gt;",
  api: [
    { name: "sd-icon", type: "class", desc: "The icon box, sized to <code>1.5cap</code> of the text beside it, with a <code>1.05em</code> fallback for browsers without <code>cap</code>." },
    { name: "sd-icon-text", type: "class", desc: "An inline-flex row that sets an icon and a word on one baseline, 0.5em apart." },
    { name: "data-icon", type: "attribute", desc: "The set name of an icon, written by <code>icon(name)</code>." },
    { name: "icon(name, label?)", type: "function", desc: "Returns the SVG markup of one icon from <code>signal-design/js/icons</code>. An unknown name throws a <code>RangeError</code>." },
    { name: "ICONS, ICON_NAMES", type: "token", desc: "The paths keyed by name, and the list of names, from <code>signal-design/js/icons</code>." },
    { name: "Icon", type: "function", desc: "The React component, <code>&lt;Icon name=\"undo\" /&gt;</code>, from <code>signal-design/react</code>." },
    { name: "size-[1.5cap]", type: "class", desc: "The Tailwind form of the same size; pair it with <code>items-baseline</code> on the label." },
  ],
  a11y: [
    "<code>icon(name)</code> without a label renders <code>aria-hidden=\"true\"</code>, so a decorative icon next to text is skipped.",
    "<code>icon(name, label)</code> renders <code>role=\"img\"</code> with that <code>aria-label</code>, for an icon that carries meaning by itself.",
    "Give every icon-only control an <code>aria-label</code>; the icon is not its name.",
    "An icon takes <code>currentColor</code>, so it keeps the text's contrast in every theme.",
  ],
  motion: [
    "No transitions: an icon has no motion of its own.",
    "An icon in a button or link moves with the control, which changes over 120ms.",
  ],
  responsive: [
    "Icons are sized in <code>cap</code> units, so they scale with the text at any size, from the 14px label to the 38px display.",
    "Browsers without <code>cap</code>, such as WebKit before 17.2, keep the <code>1.05em</code> fallback, which is the same optical size at the default text scale.",
  ],
  notes: [
    "Take icons from the set: <code>icon(name)</code> in JS, or <code>&lt;Icon name&gt;</code> in React. Never copy a path by hand or add another icon library.",
    "Icons are drawn on the 24 grid with a 4-unit inset, stroked at 1.5 in <code>currentColor</code>, and never filled.",
    "Keep the icon as a child of the control it labels and give the control an <code>aria-label</code> when there is no text.",
  ],
  related: [
    "buttons",
    "nav-bars",
    "menus",
    "art",
  ],
};
