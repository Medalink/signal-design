import { mountBar, savedScrollbars } from "./viewport.js";
import { init, rain } from "../src/js/index.js";
import { icon } from "../src/js/icons.js";

mountBar();
document.querySelector("[data-menu-icon]").innerHTML = icon("menu");
for (const slot of document.querySelectorAll("i[data-ic]")) slot.replaceWith(...new DOMParser().parseFromString(icon(slot.dataset.ic), "text/html").body.children);
init({ scrollbars: savedScrollbars() });

// The hero rain moves for a few seconds on arrival (a state change: the page
// just loaded), then settles to its still frame.
rain.busy(true);
setTimeout(() => rain.busy(false), 5000);
