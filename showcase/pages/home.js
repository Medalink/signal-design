import { pageOfHash } from "../pages.js";
import { mountLibrary } from "../library.js";

// Links to the old single page (#tokens, #components-buttons) land on the page that holds them now.
const target = pageOfHash(location.hash);
if (target) location.replace(`./${target.file}${location.hash}`);
else mountLibrary();
