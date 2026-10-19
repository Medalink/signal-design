/**
 * Builds dist/signal.css with a version banner.
 *
 *   pnpm build:css
 *
 * Runs the Tailwind CLI, stamps the package version into the first line
 * (so vendored copies can be identified, e.g. in a WebView shell), and
 * copies the fonts next to it.
 */
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, cpSync } from "node:fs";

const root = new URL("..", import.meta.url);
const { version } = JSON.parse(readFileSync(new URL("package.json", root), "utf8"));
const banner = `/*! signal-design v${version} */\n`;

const run = spawnSync("pnpm exec tailwindcss -i src/standalone.css -o dist/signal.css --minify", { cwd: root, stdio: "inherit", shell: true });
if (run.status !== 0) process.exit(run.status ?? 1);

const out = new URL("dist/signal.css", root);
const css = readFileSync(out, "utf8");
writeFileSync(out, css.startsWith("/*! signal-design") ? css.replace(/^\/\*! signal-design[^\n]*\n/, banner) : banner + css);
cpSync(new URL("src/fonts", root), new URL("dist/fonts", root), { recursive: true });
console.log(`dist/signal.css stamped: ${banner.trim()}`);
