// Copy the prebuilt bundle and the shell example into examples/tauri/web/.
import { cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const web = new URL("examples/tauri/web/", root);
mkdirSync(web, { recursive: true });
cpSync(new URL("dist/", root), new URL("dist/", web), { recursive: true });
cpSync(new URL("src/js/", root), new URL("js/", web), { recursive: true });

// The shell example, pointed at the prebuilt CSS instead of the Vite build.
const page = readFileSync(new URL("showcase/shell.html", root), "utf8")
  .replace('<link rel="stylesheet" href="./app.css">', '<link rel="stylesheet" href="./dist/signal.css">')
  .replace('<script type="module" src="./shell.js"></script>', '<script type="module">import { init } from "./js/index.js"; init();</script>');
writeFileSync(new URL("index.html", web), page);
console.log("examples/tauri/web ready");
