import { pageOfHash } from "../pages.js";

// Links to the old single page (#tokens, #components-buttons) land on the page that holds them now.
function followOldLink() {
  const target = pageOfHash(location.hash);
  if (target) location.replace(`./${target.file}${location.hash}`);
  return !!target;
}

// The rest loads only when this is the overview, so a redirect leaves nothing in flight.
if (!followOldLink()) {
  // An old link followed while the overview is already open changes only the hash.
  addEventListener("hashchange", followOldLink);
  import("./home-stage.js").then((stage) => stage.mountHome());
}
