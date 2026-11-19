/**
 * Keyboard access to the wall's sideways-scrolling tiles. A tile whose part is
 * wider than the tile scrolls, and a keyboard has to be able to reach that.
 * The part can grow after the tile has its size (a font loads, a table
 * mounts), so the part is watched too and the check runs again when fonts are
 * ready. Kept apart from the wall's other code so the home page entry runs it
 * as soon as it loads, before the rest of the page's script is fetched.
 */
const SCROLLERS = ".wall-tile-body, .wall-tile .sd-table-wrap";

export function markScrollers() {
  for (const el of document.querySelectorAll(SCROLLERS)) {
    if (el.scrollWidth > el.clientWidth) {
      if (el.tabIndex < 0) (el.tabIndex = 0), (el.dataset.wallScroll = "");
    } else if ("wallScroll" in el.dataset) (el.removeAttribute("tabindex"), delete el.dataset.wallScroll);
  }
}

export function mountScrollers() {
  const watch = new ResizeObserver(markScrollers);
  for (const el of document.querySelectorAll(SCROLLERS)) {
    watch.observe(el);
    for (const child of el.children) watch.observe(child);
  }
  markScrollers();
  document.fonts?.ready.then(markScrollers);
}
