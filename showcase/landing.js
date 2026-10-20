import { mountBar } from "./viewport.js";
import { init, rain } from "../src/js/index.js";

mountBar();
init();

// The hero rain moves for a few seconds on arrival (a state change: the page
// just loaded), then settles to its still frame.
rain.busy(true);
setTimeout(() => rain.busy(false), 5000);
