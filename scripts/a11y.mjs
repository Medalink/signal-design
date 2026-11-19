/**
 * Accessibility audit of the showcase pages with axe-core (WCAG 2.2 A and
 * AA rules), in every theme, at desktop and phone width.
 *
 *   node scripts/a11y.mjs [baseUrl] [--pages index,lib-color,chat] [--json]
 *
 * Exits non-zero when any violation is found. A page whose audit met a network
 * change (a failed request or console error, see scripts/transient.mjs) is
 * audited again while that keeps happening, up to TRANSIENT_ATTEMPTS; a hit
 * on the last one makes the page a `page-load` violation, never audited
 * half-loaded.
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { chromium } from "playwright";
import { ALL, keyOf } from "../showcase/pages.js";
import { TRANSIENT_ATTEMPTS, transient, watchTransient } from "./transient.mjs";

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

/**
 * One audit of one page. It watches the page from before `goto` until axe has
 * run, and returns what a network change or refused connection killed on the
 * way in `met`: a page that lost a stylesheet or script is not the real page,
 * so its violations are not returned.
 */
async function auditOnce(browser, key, theme, width) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  const watch = watchTransient(page);
  try {
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
    return { met: watch.met, violations: result.violations };
  } catch (error) {
    // A navigation the network change killed throws; anything else is a real error.
    if (!watch.met.length && !transient.test(error.message)) throw error;
    return { met: [...watch.met, error.message.split("\n")[0]], violations: [] };
  } finally {
    watch.stop();
    await page.close().catch(() => {});
  }
}

/** Audits a page, and again while a network change hits the audit, up to TRANSIENT_ATTEMPTS; a hit on the last one fails the page. */
async function audit(browser, key, theme, width) {
  const where = `${theme}@${width}`;
  let run = await auditOnce(browser, key, theme, width);
  for (let attempt = 1; run.met.length && attempt < TRANSIENT_ATTEMPTS; attempt++) {
    console.log(`::warning::${key} ${where}: ${run.met[0]}; auditing again`);
    run = await auditOnce(browser, key, theme, width);
  }
  if (run.met.length) {
    const k = `${key} · page-load · ${run.met[0]}`;
    if (!found.has(k)) found.set(k, { page: key, rule: "page-load", impact: "critical", help: "the page could not be loaded to audit", target: run.met[0], html: "", where: [], summary: "a network change hit every audit" });
    found.get(k).where.push(where);
    return;
  }
  for (const v of run.violations) {
    for (const n of v.nodes) {
      const k = `${key} · ${v.id} · ${n.target.join(" ")}`;
      if (!found.has(k)) found.set(k, { page: key, rule: v.id, impact: v.impact, help: v.help, target: n.target.join(" "), html: n.html.slice(0, 140), where: [], summary: n.failureSummary?.split("\n").slice(1, 3).join(" ") });
      found.get(k).where.push(where);
    }
  }
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
