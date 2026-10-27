/**
 * Accessibility audit of the showcase pages with axe-core (WCAG 2.2 A and
 * AA rules), in every theme, at desktop and phone width.
 *
 *   node scripts/a11y.mjs [baseUrl] [--pages index,lib-color,chat] [--json]
 *
 * Exits non-zero when any violation is found.
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { chromium } from "playwright";
import { ALL, keyOf } from "../showcase/pages.js";

const require = createRequire(import.meta.url);
const axeSource = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const args = process.argv.slice(2);
const base = (args.find((a) => a.startsWith("http")) || "http://localhost:5178/").replace(/\/?$/, "/");
const i = args.indexOf("--pages");
const PAGES = Object.fromEntries(ALL.map((p) => [keyOf(p), p.file]));
const only = (i >= 0 ? args[i + 1] : Object.keys(PAGES).join(",")).split(",");
const themes = ["ink", "graphite", "paper"];
const widths = [1280, 390];

// Settled means loaded, fonts in, and every finite animation (entrances,
// fades) finished, so axe never measures contrast mid-fade.
async function settle(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const finite = document.getAnimations().filter((a) => a.effect?.getComputedTiming().endTime !== Infinity);
    await Promise.race([Promise.all(finite.map((a) => a.finished.catch(() => {}))), new Promise((resolve) => setTimeout(resolve, 3000))]);
  });
}

async function audit(browser, key, theme, width) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.addInitScript((t) => localStorage.setItem("sd-theme", t), theme);
  await page.goto(base + PAGES[key], { waitUntil: "load" });
  await settle(page);
  // Render every section: content-visibility skips off-screen ones, which
  // makes axe think their controls are covered.
  await page.addStyleTag({ content: "*{content-visibility:visible!important}" });
  await settle(page);
  await page.addScriptTag({ content: axeSource });
  const result = await page.evaluate(async () =>
    window.axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"] },
      resultTypes: ["violations"],
    }),
  );
  for (const v of result.violations) {
    for (const n of v.nodes) {
      const k = `${key} · ${v.id} · ${n.target.join(" ")}`;
      if (!found.has(k)) found.set(k, { page: key, rule: v.id, impact: v.impact, help: v.help, target: n.target.join(" "), html: n.html.slice(0, 140), where: [], summary: n.failureSummary?.split("\n").slice(1, 3).join(" ") });
      found.get(k).where.push(`${theme}@${width}`);
    }
  }
  await page.close();
}

const browser = await chromium.launch();
const found = new Map();
const queue = only.flatMap((key) => themes.flatMap((theme) => widths.map((width) => [key, theme, width])));
// Pages are independent and take no input, so a few run at once.
await Promise.all(Array.from({ length: 4 }, async () => {
  while (queue.length) await audit(browser, ...queue.shift());
}));
await browser.close();

const list = [...found.values()];
if (args.includes("--json")) console.log(JSON.stringify(list, null, 1));
else {
  const byRule = {};
  for (const f of list) (byRule[`${f.page} ${f.rule} (${f.impact})`] ||= []).push(f);
  for (const [rule, items] of Object.entries(byRule)) {
    console.log(`\n${rule}: ${items[0].help} — ${items.length} element(s)`);
    for (const f of items.slice(0, 6)) console.log(`   ${f.target}  [${f.where.length === themes.length * widths.length ? "all" : f.where.join(",")}]  ${f.summary || ""}`.slice(0, 260));
  }
  console.log(`\n${list.length} violation node(s)`);
}
process.exit(list.length ? 1 : 0);
