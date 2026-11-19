/** The doc sections of lib-surfaces.html: see page-docs/index.js. */
export default {
  when: [
    "Interactive text that should answer a hover: buttons, links, nav items, tabs, and menu items sweep once without extra markup.",
    "A figure the page drives itself, such as an upload percentage: <code>data-sd-sweep=\"progress\"</code> draws the band where your code sets <code>--sd-sweep</code>.",
    "Scroll areas that should stay clean until used: scrollbars show while something scrolls and hide again 2s after it stops.",
  ],
  notWhen: [
    "Text that is not interactive. The shimmer marks what responds to a pointer.",
    "A loading state: use a progress bar or a skeleton (see Feedback).",
    "A scrollbar that must always be visible: pass <code>init({ scrollbars: \"always\" })</code> instead of restyling it.",
  ],
  usage: "&lt;button class=\"sd-btn\"&gt;Hover me&lt;/button&gt;\n&lt;button class=\"sd-btn\" style=\"--sd-sweep-duration: 400ms\"&gt;Fast&lt;/button&gt;\n&lt;span data-sd-sweep=\"progress\" style=\"--sd-sweep: 0\"&gt;Uploading 0%&lt;/span&gt;\n\n&lt;script type=\"module\"&gt;\n  import { init } from \"signal-design/js\";\n  init({ scrollbars: \"auto\" });\n&lt;/script&gt;",
  api: [
    { name: "--sd-sweep-duration", type: "token", def: "1s", desc: "How long one sweep takes; links default to 1.4s." },
    { name: "--sd-sweep-easing", type: "token", def: "linear", desc: "The curve of the band's progress, for example linear(0, 0.7 30%, 1)." },
    { name: "--sd-sweep", type: "token", desc: "The band's place from 0 to 1; the page sets it with data-sd-sweep=\"progress\"." },
    { name: "data-sd-sweep", type: "attribute", desc: "hold gives any element the sweep, hover stops it when the pointer leaves, progress draws it from --sd-sweep." },
    { name: "data-sd-sweeping", type: "attribute", desc: "Written by the script while a sweep plays, so it finishes even if the pointer only brushes past." },
    { name: "initSweep()", type: "function", desc: "Wires the play-through behavior; init() calls it, and a framework app can call it alone." },
    { name: "init({ scrollbars })", type: "function", def: "auto", desc: "auto hides the thumb when idle; always keeps scrollbars visible." },
    { name: "setScrollbars(mode)", type: "function", desc: "Changes the scrollbar mode after init()." },
    { name: "initScrollbars(mode)", type: "function", desc: "The scrollbars alone, for pages that skip init(), such as React ones." },
    { name: "data-sd-scrollbars", type: "attribute", desc: "Set on the html element with the mode." },
    { name: "data-sd-scrolling", type: "attribute", desc: "On whatever scrolls, while it scrolls and for 2s after." },
  ],
  a11y: [
    "The shimmer changes no content and no focus. It uses the text's own color, so contrast holds before, during, and after the sweep.",
    "A scroll box that has no focusable child needs <code>tabindex=\"0\"</code> and an <code>aria-label</code> so a keyboard user can scroll it.",
    "Scrollbars change only the thumb color, so layout does not shift when they appear.",
  ],
  motion: [
    "A sweep runs once per hover, 1s by default and 1.4s on links, and plays to the end after the pointer leaves.",
    "With <code>prefers-reduced-motion</code> or <code>forced-colors</code> there is no sweep, and the text keeps its hover color.",
    "No transitions on scrollbars: the thumb color switches while something scrolls and switches back 2s after it stops.",
  ],
  notes: [
    "The shimmer needs no class: buttons other than primary, nav links, tabs, menu items, chips, pills, and segmented buttons get it from the CSS.",
    "A framework page that skips <code>init()</code> calls <code>initSweep()</code> and <code>initScrollbars()</code> itself.",
  ],
  related: [
    "buttons",
    "nav-bars",
    "feedback",
    "rain",
  ],
};
