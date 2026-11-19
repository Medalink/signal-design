/** The doc sections of lib-ascii.html: see page-docs/index.js. */
export default {
  when: [
    "Art that should play only while the work behind it runs: it holds a still frame until <code>aria-busy=\"true\"</code> is on it or an ancestor.",
    "A card gallery where hover or a Play button starts a piece.",
    "An empty state or a status picture: a still piece, with <code>data-tone</code> coloring its brightest level when the picture is the status.",
  ],
  notWhen: [
    "Decoration that moves with nothing running. If nothing changed, nothing should move.",
    "Pieces drawn on square cells, such as a picture scene or photo: <code>mountAscii</code> does not draw them (see Art for pixel pieces).",
    "Rain behind a shell: the digital rain backdrop does that (see Rain).",
  ],
  usage: "&lt;div class=\"sd-ascii\" style=\"--cols: 48; --rows: 24\" role=\"img\" aria-label=\"Spinning torus\"&gt;&lt;/div&gt;\n\n&lt;script type=\"module\"&gt;\n  import { mountAscii } from \"signal-design/ascii\";\n  import * as piece from \"ascii-magic-art/pieces/spinning-torus.js\";\n  const art = mountAscii(document.querySelector(\".sd-ascii\"), piece, { at: 1.4, look: \"dots\" });\n  // art.busy(true) plays; aria-busy on the element or an ancestor does the same\n&lt;/script&gt;",
  api: [
    { name: "sd-ascii", type: "class", desc: "The box the art is drawn in, in the mono face." },
    { name: "mountAscii(el, piece, options)", type: "function", desc: "Draws a piece as text in el and returns render, busy, and destroy." },
    { name: "mountAscii options", type: "function", def: "at 0, look original, speed 1", desc: "at is the second of the still frame and of playback start; speed scales playback." },
    { name: "look", type: "function", def: "original", desc: "Option of mountAscii: original, dots, ascii, dense, numbers, binary, letters, blocks, squares, lines, or dither." },
    { name: "art.busy(on)", type: "function", desc: "Plays or holds whatever aria-busy says; with no argument it follows aria-busy again." },
    { name: "art.render(t)", type: "function", desc: "Draws the frame at t seconds now." },
    { name: "art.destroy()", type: "function", desc: "Stops and disconnects, keeping the last frame; call it before remounting with another look." },
    { name: "aria-busy", type: "ARIA", desc: "True on the art or its closest ancestor that has the attribute plays it; removing it holds the current frame." },
    { name: "data-tone", type: "attribute", desc: "danger, success, warning, pending, accent, or extra: paints the brightest level only." },
    { name: "--sd-ascii-size", type: "token", def: "12px", desc: "The largest character size; the text shrinks to fit the width." },
    { name: "--cols, --rows", type: "token", desc: "The art's grid; set them in the markup so the box holds its size before the art loads." },
  ],
  a11y: [
    "Give each piece <code>role=\"img\"</code> and an <code>aria-label</code> that says what it shows. The characters are not read.",
    "A Play button needs <code>aria-pressed</code> and a text name. Hover alone is not available to keyboard users.",
    "Color follows <code>data-tone</code> only on the brightest level. Say the status in words too.",
  ],
  motion: [
    "Still by default. It plays only while busy, on screen, in a visible tab, and without <code>prefers-reduced-motion</code>.",
    "Each piece runs at its own frame rate from the piece's metadata; pieces marked still never move.",
    "Removing <code>aria-busy</code> holds the frame it is on rather than snapping back.",
  ],
  responsive: [
    "The text is sized to fit the box width and never wider than <code>--sd-ascii-size</code>, so it never scrolls sideways.",
    "The box is at most <code>--cols</code> times 0.6 times the character size wide.",
  ],
  notes: [
    "Pieces come from the optional peer dependency <code>ascii-magic-art</code>: <code>pnpm add ascii-magic-art</code>, then import <code>ascii-magic-art/pieces/&lt;name&gt;.js</code>.",
    "Set <code>aria-busy</code> on the panel that is working so the art plays with it. A card can set it from hover or a Play button.",
    "Art from ascii-magic-art by ASCII Magic, MIT.",
  ],
  related: [
    "art",
    "rain",
    "feedback",
    "ornaments",
  ],
};
