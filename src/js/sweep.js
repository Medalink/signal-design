/**
 * Hover shimmer that plays through. A text link, or anything with
 * data-sd-sweep="hold", gets data-sd-sweeping on pointerover, and the CSS
 * runs the sweep while it is set, so leaving early or brushing past still
 * shows the whole sweep. The attribute clears when the sweep ends.
 * data-sd-sweep="hover" opts a link out. init() calls initSweep(); call it
 * yourself on pages that skip init(), such as React ones.
 */
const LINK = 'a:not([class], [role]):not(:where(.sd-nav, .sd-tabs, .sd-breadcrumb, .sd-sidenav, .sd-pagination, .sd-menu) *), .sd-btn-link';
const HOLD = `:is(${LINK}):not([data-sd-sweep]), [data-sd-sweep="hold"]`;
let still;

function onOver(event) {
  if (still.matches || !(event.target instanceof Element)) return;
  const el = event.target.closest(HOLD);
  // A move onto the link's own child is not a new hover; the sweep would not restart to clear the mark.
  if (el && !el.contains(event.relatedTarget) && !el.hasAttribute("data-sd-sweeping")) el.setAttribute("data-sd-sweeping", "");
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
