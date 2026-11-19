/** The doc sections of lib-ornaments.html: see page-docs/index.js. */
export default {
  when: [
    "Texture for a corner or an empty state: dust, drawn in squares that thin out away from the corner.",
    "A drawn picture behind a card, a cover, a hero, or an empty state: name an art style next to the placement.",
    "A bar or panel that needs depth along one edge: edge dust rises from the top or bottom.",
    "A border that reads brighter at the corners: <code>data-sd-edges</code>.",
  ],
  notWhen: [
    "Behind dense text that needs full contrast. Ornaments are faint on purpose, but keep them to corners and empty areas.",
    "Anything that must move with state: ornaments are still pictures with a slow sparkle (see Rain for work in progress).",
    "A mascot or scene: those are pieces you place, not a background (see Art).",
  ],
  usage: "&lt;div data-sd-ornaments=\"tl br\" data-sd-ornaments-size=\"260\"&gt;\n  Content\n&lt;/div&gt;\n&lt;article data-sd-ornaments=\"bottom waveform\" data-sd-ornaments-seed=\"notes\"&gt;\n  A short note.\n&lt;/article&gt;\n&lt;div data-sd-edges&gt;Glowing corners&lt;/div&gt;",
  api: [
    { name: "data-sd-ornaments", type: "attribute", def: "br", desc: "Placement words (tl, tr, bl, br, top, bottom, center) and an art style; none turns it off." },
    { name: "data-sd-ornaments-size", type: "attribute", def: "340", desc: "How far the ornament reaches, in px." },
    { name: "data-sd-ornaments-seed", type: "attribute", desc: "A word that varies contours, lattice, and waveform per item; the same seed draws the same picture." },
    { name: "data-sd-ornaments-style", type: "attribute", desc: "Set to circuit to grow traces instead of dust." },
    { name: "data-sd-ornaments-still", type: "attribute", desc: "Turns the sparkle off for one element." },
    { name: "data-sd-edges", type: "attribute", desc: "A border bright at the corners and faint along the sides, with a bright center on the top edge." },
    { name: "contours, lattice, waveform, dashed, book, stack", type: "attribute", desc: "The six art styles, written in the data-sd-ornaments value." },
    { name: "sd-empty", type: "class", desc: "Gets a center ornament without the attribute; data-sd-ornaments=\"none\" removes it." },
    { name: "paintOrnaments(element)", type: "function", desc: "Paints one element in the current theme's text color." },
    { name: "ornamentShapes(options)", type: "function", desc: "The dust, blocks, or circuit shapes as SVG, for a framework that draws its own." },
    { name: "ornamentArt(options)", type: "function", desc: "One art style as SVG shapes." },
    { name: "ORNAMENT_ART", type: "token", desc: "The map of art style names to their settings." },
  ],
  a11y: [
    "Ornaments are painted as a background of the element, so they take no clicks, add nothing to the accessibility tree, and need no label.",
    "They stay faint, so text over them keeps its contrast. Light themes use more ink than dark ones.",
    "Never put meaning in an ornament. Words and tone carry it.",
  ],
  motion: [
    "Dust and circuit pads sparkle: a few squares rest most of a slow cycle (9s by default, set per square) and lift in opacity briefly at their own offsets, run on the compositor.",
    "The sparkle pauses while the page scrolls. <code>prefers-reduced-motion</code> removes it, and <code>data-sd-ornaments-still</code> removes it for one element.",
    "Art styles are still pictures, the same on every load.",
  ],
  responsive: [
    "The pattern is drawn to the element's width, so it repaints when the box resizes.",
    "A center ornament fits the box's height, between 80px and 320px.",
  ],
  notes: [
    "The first corner gets blocks and a second corner gets dust, so two corners do not mirror each other.",
    "An art style with no placement defaults to the bottom right; an empty state defaults to the center.",
    "Colors come from <code>--sd-fg</code>, so every theme works. Do not set a hex value.",
  ],
  related: [
    "art",
    "rain",
    "feedback",
  ],
};
