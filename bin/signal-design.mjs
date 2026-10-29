#!/usr/bin/env node
/**
 * signal-design command line.
 *
 *   npx signal-design check <url> [more urls] [--a11y] [--widths 1280,768,375] [--theme ink]
 *
 * Loads each URL in Chromium and fails (exit 1) on what Signal does not allow:
 * rounded corners, blurred shadows, horizontal overflow, fonts
 * that did not load, and console errors. --a11y adds an axe-core audit
 * (WCAG 2.2 A/AA). Needs playwright in your project (and axe-core for --a11y):
 *
 *   pnpm add -D playwright axe-core && npx playwright install chromium
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { sweep, fontFaces, overflow } from "./rules.mjs";

const USAGE = `Usage: signal-design check <url> [url…] [--a11y] [--widths 1280,768,375] [--theme ink|graphite|paper]

Checks a page against Signal's rules: square corners, no blurred shadows,
no horizontal overflow, Source Code Pro loaded, no console errors.
--a11y also runs axe-core (WCAG 2.2 A/AA).`;

const args = process.argv.slice(2);
const [command, ...rest] = args;
if (command !== "check" || rest.includes("--help") || !rest.some((a) => /^https?:|^file:/.test(a))) {
  console.log(USAGE);
  process.exit(command === "check" || command === "--help" || !command ? 0 : 1);
}

const flag = (name) => {
  const i = rest.indexOf(`--${name}`);
  return i >= 0 ? rest[i + 1] : undefined;
};
const urls = rest.filter((a) => /^https?:|^file:/.test(a));
const widths = (flag("widths") || "1280,768,375").split(",").map(Number);
const theme = flag("theme");
const a11y = rest.includes("--a11y");

const require = createRequire(`${process.cwd()}/`);
let chromium;
try {
  const mod = await import(pathToFileURL(require.resolve("playwright")).href);
  chromium = mod.chromium ?? mod.default?.chromium;
  if (!chromium) throw new Error("no chromium export");
} catch {
  console.error("signal-design check needs Playwright in this project:\n  pnpm add -D playwright && npx playwright install chromium");
  process.exit(2);
}
let axeSource = null;
if (a11y) {
  try {
    axeSource = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
  } catch {
    console.error("--a11y needs axe-core in this project:\n  pnpm add -D axe-core");
    process.exit(2);
  }
}

const browser = await chromium.launch();
let problems = 0;
const report = (where, msg) => {
  problems++;
  console.log(`FAIL ${where}: ${msg}`);
};

for (const url of urls) {
  for (const width of widths) {
    const where = `${url} @${width}px`;
    const before = problems;
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(e.message));
    if (theme) await page.addInitScript((t) => localStorage.setItem("sd-theme", t), theme);
    await page.goto(url, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    // Render content the browser is skipping, so every part gets checked.
    await page.addStyleTag({ content: "*{content-visibility:visible!important}" });
    await page.waitForTimeout(200);

    for (const e of errors) report(where, `console error: ${e}`);
    const faces = await page.evaluate(fontFaces);
    if (faces.length && faces.some((f) => !f.endsWith("loaded"))) report(where, `font not loaded: ${faces.join(" ")}`);
    if (!faces.length) report(where, "Source Code Pro is not loaded (is signal-design's CSS on the page?)");
    for (const b of (await page.evaluate(sweep)).slice(0, 20)) report(where, b);
    const over = await page.evaluate(overflow);
    if (over.px > 0) report(where, `horizontal overflow ${over.px}px: ${over.culprits.join(" | ")}`);

    if (axeSource && width === widths[0]) {
      await page.addScriptTag({ content: axeSource });
      const result = await page.evaluate(() =>
        window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] }),
      );
      for (const v of result.violations) {
        for (const n of v.nodes.slice(0, 5)) report(where, `a11y ${v.id} (${v.impact}): ${v.help} at ${n.target.join(" ")}`);
      }
    }
    await page.close();
    if (problems === before) console.log(`ok   ${where}`);
  }
}
await browser.close();
console.log(problems ? `\n${problems} problem(s)` : "\nAll Signal checks passed.");
process.exit(problems ? 1 : 0);
