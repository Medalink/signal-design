import { pageOfHash } from "../pages.js";
import { mountLibrary } from "../library.js";

// Links to the old single page (#tokens, #components-buttons) land on the page that holds them now.
function followOldLink() {
  const target = pageOfHash(location.hash);
  if (target) location.replace(`./${target.file}${location.hash}`);
  return !!target;
}

if (!followOldLink()) {
  mountLibrary();
  // An old link followed while the overview is already open changes only the hash.
  addEventListener("hashchange", followOldLink);
}
