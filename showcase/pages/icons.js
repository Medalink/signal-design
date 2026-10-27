import { ICON_NAMES, icon } from "../../src/js/icons.js";
import { mountLibrary } from "../library.js";

mountLibrary();

document.getElementById("icon-set").innerHTML = ICON_NAMES.map((name) => `<li>${icon(name)}<code>${name}</code></li>`).join("");
