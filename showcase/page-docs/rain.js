/** The doc sections of lib-rain.html: see page-docs/index.js. */
export default {
  when: [
    "A shell or hero backdrop that shows work in progress: the rain is a still frame until a job runs.",
    "A switch the user controls: <code>data-sd-rain-toggle</code> turns it on or off and the browser remembers the choice.",
    "A stream scene that loops on purpose: <code>data-sd-rain=\"play\"</code> animates from the first frame.",
  ],
  notWhen: [
    "Decoration with nothing behind it. If nothing changed, nothing should move.",
    "Behind body text. Rain stays behind content; list what covers it with <code>data-sd-rain-skip</code>.",
    "A texture for a corner or an empty state: ornaments are still pictures (see Ornaments).",
  ],
  usage: "&lt;canvas class=\"sd-rain\" data-sd-rain aria-hidden=\"true\"&gt;&lt;/canvas&gt;\n&lt;button class=\"sd-btn\" data-sd-rain-toggle&gt;Animate rain&lt;/button&gt;\n\n&lt;script type=\"module\"&gt;\n  import { init, rain } from \"signal-design/js\";\n  init();\n  rain.busy(true);   // a job started\n  rain.busy(false);  // it finished\n&lt;/script&gt;",
  api: [
    { name: "sd-rain", type: "class", desc: "The canvas class; inside an sd-shell it fills the page area behind the content." },
    { name: "data-sd-rain", type: "attribute", def: "still", desc: "Mounts the rain on a canvas; the value \"play\" starts it animating." },
    { name: "data-sd-rain-style", type: "attribute", def: "glyphs", desc: "glyphs or squares." },
    { name: "data-sd-rain-skip", type: "attribute", desc: "A selector for opaque elements on top; the rain is not drawn under them." },
    { name: "data-sd-rain-toggle", type: "attribute", desc: "A button that switches the rain on or off; the script keeps its aria-pressed current." },
    { name: "rain.busy(isBusy)", type: "function", desc: "Plays while work runs and holds a still frame after, unless the user chose on or off." },
    { name: "rain.play(), rain.pause()", type: "function", desc: "Control every mounted rain at once." },
    { name: "rain.toggle()", type: "function", desc: "The user's switch; the choice is remembered across visits." },
    { name: "mountRain(canvas, { playing, style })", type: "function", desc: "Mounts one canvas without init() and returns play, pause, update, and destroy." },
    { name: "--sd-fg", type: "token", desc: "The rain's color: the theme's text color, white on dark and black on light." },
  ],
  a11y: [
    "Put <code>aria-hidden=\"true\"</code> on the canvas: it is decoration with no content.",
    "The toggle is a real button; its <code>aria-pressed</code> follows whether any rain is playing.",
    "The rain never carries meaning alone. Say that work is running in text or a progress bar as well.",
  ],
  motion: [
    "Still by default. It animates only while <code>rain.busy(true)</code> is on, after the user turns it on, or with <code>data-sd-rain=\"play\"</code>.",
    "<code>prefers-reduced-motion</code> keeps it still, including the busy state, and it pauses while the tab is hidden.",
    "The user's explicit on or off wins: <code>rain.busy()</code> does not override a remembered choice.",
  ],
  responsive: [
    "The canvas takes the size of the box you give it. Inside <code>sd-shell</code> it covers only the page area, not the rail or sidebar.",
  ],
  notes: [
    "Inside an <code>sd-shell</code> the rain skips <code>sd-shell-content</code>, the header bars, and the dock without <code>data-sd-rain-skip</code>. Elsewhere, list what covers it.",
    "The choice is stored in <code>localStorage</code> under <code>sd-rain</code>; a blocked store falls back to following the busy state.",
    "Rendering runs in a worker where <code>OffscreenCanvas</code> exists and on the main thread otherwise.",
    "Never color the rain. It stays black, white, and grey.",
  ],
  related: [
    "ornaments",
    "art",
    "ascii",
    "window",
  ],
};
