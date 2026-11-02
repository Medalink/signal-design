/**
 * Hover shimmer that plays through. Whatever started a sweep on pointerover
 * (or carries data-sd-sweep="hold") gets data-sd-sweeping, and the CSS runs
 * the sweep while it is set, so leaving early or brushing past still shows
 * the whole sweep. The attribute clears when the sweep ends.
 * data-sd-sweep="hover" opts an element out. init() calls initSweep(); call
 * it yourself on pages that skip init(), such as React ones.
 */
let still;

const isSweep = (a) => a.animationName === "sd-sweep-progress";

// The CSS decides what shimmers: find the hovered element whose sweep is running.
function sweeping(node) {
  for (let n = node; n && n !== document.body; n = n.parentElement) {
    if (n.getAnimations().some(isSweep)) return n;
  }
  return null;
}

function onOver(event) {
  if (still.matches || !(event.target instanceof Element)) return;
  const el = event.target.closest('[data-sd-sweep="hold"]') ?? sweeping(event.target);
  // A move onto the element's own child is not a new hover; the sweep would not restart to clear the mark.
  if (!el || el.contains(event.relatedTarget) || el.hasAttribute("data-sd-sweeping")) return;
  if (el.getAttribute("data-sd-sweep") !== "hover") el.setAttribute("data-sd-sweeping", "");
}

function onEnd(event) {
  if (event.animationName === "sd-sweep-progress") event.target.removeAttribute("data-sd-sweeping");
}

let started = false;

export function initSweep() {
  if (started || typeof document === "undefined") return;
  started = true;
  still = matchMedia("(prefers-reduced-motion: reduce), (forced-colors: active)");
  document.addEventListener("pointerover", onOver, { passive: true });
  document.addEventListener("animationend", onEnd);
  document.addEventListener("animationcancel", onEnd);
}
