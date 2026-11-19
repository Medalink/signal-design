/** The doc sections of lib-predict.html: see page-docs/index.js. */
export default {
  when: [
    "The next step costs a load: a route, a chunk, an image, or a dialog. <code>sd:predict</code> lets you start it before the click.",
    "A link to another page on the same origin: <code>data-sd-prefetch</code> adds a prefetch hint, and <code>data-sd-prerender</code> prerenders it.",
    "Targets in Signal's own parts: rail tiles, thread chips, image attachments, and <code>[data-sd-open]</code> buttons are targets with no attribute.",
  ],
  notWhen: [
    "Work with side effects or a cost you cannot undo. A prediction can be wrong, so only start work that is safe to waste.",
    "Changing what the user sees. The attribute <code>data-sd-predicted</code> has no style of its own, so the prediction stays invisible.",
    "Another origin. Prefetch and prerender skip them.",
  ],
  usage: "&lt;button class=\"sd-btn\" data-sd-predict data-to=\"/settings\"&gt;Settings&lt;/button&gt;\n&lt;a href=\"/reports\" data-sd-prefetch&gt;Reports&lt;/a&gt;\n\n&lt;script type=\"module\"&gt;\n  import { init } from \"signal-design/js\";\n  init();\n  document.addEventListener(\"sd:predict\", (event) =&gt; {\n    const { via, eta } = event.detail;\n    preloadRoute(event.target.dataset.to);\n  });\n&lt;/script&gt;",
  api: [
    { name: "data-sd-predict", type: "attribute", desc: "Makes any element a target; the value \"off\" on a target or an ancestor opts out." },
    { name: "data-sd-predicted", type: "attribute", desc: "Set on the current predicted target and removed when it leaves; it has no style." },
    { name: "sd:predict", type: "event", desc: "Bubbles from the target once per approach; detail.via is path, hover, touch, or focus, and detail.eta is the milliseconds until arrival on a path prediction only." },
    { name: "predict(el, fn)", type: "function", desc: "Makes el a target and calls fn(detail) on each prediction; returns a function that undoes both." },
    { name: "data-sd-prefetch", type: "attribute", desc: "On a link: adds a prefetch for its href once; a value overrides the URL." },
    { name: "data-sd-prerender", type: "attribute", desc: "On a link: prerenders the page with a speculation rule, or prefetches it where those are missing." },
    { name: "prefetch(href), prerender(href)", type: "function", desc: "Do the same from code; they return false when skipped." },
    { name: "initPredict()", type: "function", desc: "Starts the watcher; init() calls it, and a framework app can call it alone." },
    { name: "sd-rail-tile, sd-thread-chip, button.sd-shot, [data-sd-open]", type: "class", desc: "Targets without the attribute." },
  ],
  a11y: [
    "Prediction changes nothing for assistive technology: no focus move, no role, no live region.",
    "Keyboard focus counts as a prediction (<code>via: \"focus\"</code>), so keyboard users get the same early load.",
    "Do not use a prediction to open or move anything. The click or key press stays the only action.",
  ],
  motion: [
    "No motion: the watcher reads pointer position and writes an attribute, with no transitions.",
    "Pointer events from a touch pointer are not tracked; a touch on a target predicts with <code>via: \"touch\"</code>.",
  ],
  notes: [
    "It fires once per approach, and again only after the prediction has left the target.",
    "A pointer passing over a target on its way elsewhere is not a hover: it has to come to rest on it.",
    "Prefetch skips another origin, this page, a URL already fetched, and visitors with Save-Data on. Where the engine ignores <code>rel=\"prefetch\"</code> the script falls back to a low-priority <code>fetch()</code>.",
    "Signal only reports the prediction. The work to start belongs in your <code>sd:predict</code> handler.",
  ],
  related: [
    "setup",
    "overlays",
    "rail",
    "attachments",
  ],
};
