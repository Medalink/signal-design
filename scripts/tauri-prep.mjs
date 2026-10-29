// Copy the prebuilt bundle and the shell example into examples/tauri/web/.
import { cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const web = new URL("examples/tauri/web/", root);
mkdirSync(web, { recursive: true });
cpSync(new URL("dist/", root), new URL("dist/", web), { recursive: true });
cpSync(new URL("src/js/", root), new URL("js/", web), { recursive: true });

// The chat example (custom title bar), pointed at the prebuilt CSS instead of the Vite build.
const page = readFileSync(new URL("showcase/chat.html", root), "utf8")
  .replace('<link rel="stylesheet" href="./app.css">', '<link rel="stylesheet" href="./dist/signal.css">')
  .replace('<script type="module" src="./chat.js"></script>', '<script type="module">import { init } from "./js/index.js"; import { icon } from "./js/icons.js"; for (const slot of document.querySelectorAll("[data-ic]")) { slot.insertAdjacentHTML("afterend", icon(slot.dataset.ic)); slot.nextElementSibling.classList.add(...slot.classList); slot.remove(); } init();</script>');
writeFileSync(new URL("index.html", web), page);
console.log("examples/tauri/web ready");
