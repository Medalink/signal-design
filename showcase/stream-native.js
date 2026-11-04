// Native text: with ?native, stream.html keeps every replaceable string in its
// layout but hidden, so OBS Text sources can sit on top and be edited in OBS.
// stream.js marks the strings.

// field → where its text is in a scene. "wrap" hides the element's own text
// and keeps its chrome (the live square, the timer); "self" hides the element.
export const NATIVE = {
  kicker: [".sd-scene-kicker:not(:has([data-sd-timer]))", "wrap"],
  away: [".sd-scene-kicker:has([data-sd-timer])", "wrap"],
  title: [".sd-scene-title", "wrap"],
  line: [".sd-scene-line", "wrap"],
  follow: ['[data-sd-latest="follow"]', "self"],
  sub: ['[data-sd-latest="sub"]', "self"],
  name: [".sd-cam-tag > span:first-child", "self"],
  goallabel: [".sd-scene-goal-head > span", "self"],
  socials: [".sd-scene-bar-end", "self"],
};

const CHROME = ".sd-live, [data-sd-timer]";

export function markNative(scene) {
  for (const [field, [selector, how]] of Object.entries(NATIVE)) {
    for (const el of scene.querySelectorAll(selector)) {
      if (how === "self") {
        el.dataset.native = field;
        continue;
      }
      const nodes = [...el.childNodes].filter((n) => !(n.nodeType === 1 && n.matches(CHROME)));
      while (nodes.length && nodes.at(-1).nodeType === 3 && !nodes.at(-1).data.trim()) nodes.pop();
      while (nodes.length && nodes[0].nodeType === 3 && !nodes[0].data.trim()) nodes.shift();
      if (!nodes.length) continue;
      const span = document.createElement("span");
      span.dataset.native = field;
      nodes[0].before(span);
      span.append(...nodes);
    }
  }
}
