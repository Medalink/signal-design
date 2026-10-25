/**
 * Builds dist/signal.css and dist/signal-core.css with a version banner.
 *
 *   pnpm build:css
 *
 * Runs the Tailwind CLI, stamps the package version into the first line
 * (so vendored copies can be identified, e.g. in a WebView shell), and
 * copies the fonts next to it. signal-core.css has no @font-face; link the
 * dist/font-<family>.css of each face you use.
 */
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, cpSync, readdirSync } from "node:fs";

const root = new URL("..", import.meta.url);
const { version } = JSON.parse(readFileSync(new URL("package.json", root), "utf8"));
const banner = `/*! signal-design v${version} */\n`;

for (const [input, name] of [["standalone", "signal"], ["standalone-core", "signal-core"]]) {
  const run = spawnSync(`pnpm exec tailwindcss -i src/${input}.css -o dist/${name}.css --minify`, { cwd: root, stdio: "inherit", shell: true });
  if (run.status !== 0) process.exit(run.status ?? 1);

  const out = new URL(`dist/${name}.css`, root);
  const css = readFileSync(out, "utf8");
  writeFileSync(out, css.startsWith("/*! signal-design") ? css.replace(/^\/\*! signal-design[^\n]*\n/, banner) : banner + css);
}
cpSync(new URL("src/fonts", root), new URL("dist/fonts", root), { recursive: true });
for (const file of readdirSync(new URL("src", root)).filter((name) => /^font-.+\.css$/.test(name))) cpSync(new URL(`src/${file}`, root), new URL(`dist/${file}`, root));
console.log(`dist/signal.css and dist/signal-core.css stamped: ${banner.trim()}`);
