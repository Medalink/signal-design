/**
 * Builds dist/signal.js: a single-file ESM bundle of signal-design/js.
 *
 *   pnpm build:js
 *
 * Same exports as src/js/index.js, minified, stamped with the package
 * version — so an app (e.g. a WebView shell vendoring dist/) can ship one
 * JS file next to dist/signal.css. The charts entry is not bundled: it is
 * an optional module whose Chart.js peer stays external.
 */
import { build } from "esbuild";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = new URL("..", import.meta.url);
const { version } = JSON.parse(readFileSync(new URL("package.json", root), "utf8"));

await build({
  entryPoints: [fileURLToPath(new URL("src/js/index.js", root))],
  bundle: true,
  format: "esm",
  minify: true,
  outfile: fileURLToPath(new URL("dist/signal.js", root)),
  banner: { js: `/*! signal-design v${version} */\n` },
  logLevel: "info",
});
