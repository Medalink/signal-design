/**
 * Structure checks for the showcase pages: every library page carries the
 * shared chrome and says where it is, its sidebar lists only its own blocks,
 * Ctrl K belongs to exactly one palette, Chart.js loads only where charts
 * are, and old single-page links land on the page that holds them now.
 * Called from scripts/check.mjs.
 */
import { existsSync, readFileSync } from "node:fs";
import { ICONS } from "../showcase/layout-plugin.js";
import { ALL, EXAMPLES, LIBRARY, keyOf, pageOfHash, scriptOf } from "../showcase/pages.js";

const showcase = new URL("../showcase/", import.meta.url);

/** Every registry entry has the files, rail icon and sections it names. Static; returns the problems. */
export function checkShowcaseRegistry() {
  const problems = [];
  const has = (path) => existsSync(new URL(path, showcase));
  for (const page of ALL) {
    if (!has(page.file)) {
      problems.push(`${page.file} is in showcase/pages.js but the file does not exist`);
      continue;
    }
    const html = readFileSync(new URL(page.file, showcase), "utf8");
    if (EXAMPLES.includes(page)) {
      // An example page carries its own script tag and its own key.
      const script = html.match(/<script type="module" src="\.\/([^"]+)"/)?.[1];
      if (!script || !has(script)) problems.push(`${page.file} loads ${script ?? "no module"}, which does not exist`);
      if (!html.includes(`<html lang="en" data-theme="ink" data-page="${keyOf(page)}">`)) problems.push(`${page.file} must carry data-page="${keyOf(page)}" on <html>`);
      continue;
    }
    const script = scriptOf(page);
    if (script && !has(script)) problems.push(`${page.file}: showcase/${script} does not exist (add it, or set \`script: false\` in the registry)`);
    if (page.icon && !ICONS.includes(`id="i-${page.icon}"`)) problems.push(`${page.file}: rail icon "${page.icon}" has no symbol in ICONS in showcase/layout-plugin.js`);
    for (const section of page.sections ?? []) if (!html.includes(`id="${section}"`)) problems.push(`${page.file}: no element with id="${section}", the section the registry lists`);
  }
  return problems;
}

/** Runs on a library page already loaded at 1280px in ink. */
export async function checkShowcasePages(page, where, fail, library) {
  const chrome = await page.evaluate(() => ({
    current: [...document.querySelectorAll('.sd-rail-item[aria-current="page"]')].map((a) => a.getAttribute("href")),
    blocks: document.querySelectorAll(".demo-block").length,
    links: document.querySelectorAll(".sd-sidebar-link[data-block]").length,
    h1: document.querySelectorAll(".demo-intro > h1").length,
    sectionH1: document.querySelectorAll(".demo-section > h1, .demo-wrap > h1").length,
    skip: document.querySelector("body > .sd-skip")?.getAttribute("href"),
    main: document.getElementById("main")?.getAttribute("tabindex"),
    chart: performance.getEntriesByType("resource").some((e) => /\/charts\/|chart[._]+js/.test(e.name)),
  }));
  if (chrome.current.join() !== `./${library.file}`) fail(where, `rail marks ${JSON.stringify(chrome.current)} as current, want ./${library.file}`);
  if (!chrome.blocks || chrome.links !== chrome.blocks) fail(where, `sidebar lists ${chrome.links} links for ${chrome.blocks} blocks`);
  if (chrome.h1 !== 1 || chrome.sectionH1 !== 0) fail(where, `page has ${chrome.h1} intro h1 and ${chrome.sectionH1} stray h1, want 1 and 0`);
  if (chrome.skip !== "#main" || chrome.main !== "-1") fail(where, `skip link ${chrome.skip}, main tabindex ${chrome.main}`);
  if (chrome.chart !== (library.id === "charts")) fail(where, chrome.chart ? "Chart.js loaded on a page without charts" : "Chart.js did not load on the charts page");

  // Ctrl K opens this page's own palette if it has one, else the chrome's page palette.
  const own = await page.evaluate(() => !!document.querySelector("dialog[data-sd-palette]:not(#nav-palette)"));
  await page.locator(".demo-section h2").first().click();
  await page.keyboard.press("Control+k");
  const open = await page.evaluate(() => [...document.querySelectorAll("dialog[data-sd-palette]")].filter((d) => d.open).map((d) => d.id));
  const want = own ? "demo-palette" : "nav-palette";
  if (open.join() !== want) fail(where, `Ctrl K opened ${JSON.stringify(open)}, want ${want}`);
  if (!own) {
    const options = await page.evaluate(() => [...document.querySelectorAll('#nav-palette [role="option"]')].filter((o) => o.href).map((o) => o.getAttribute("href")));
    const want = ALL.map((p) => `./${p.file}`);
    if (options.join() !== want.join()) fail(where, `nav palette lists ${options.join(" ")}, want the registry pages`);
  }
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => ![...document.querySelectorAll("dialog[data-sd-palette]")].some((d) => d.open), null, { timeout: 1000 }).catch(() => {});
}

/** Old links to the single components page, followed from the overview. */
export async function checkHashRedirects(page, base) {
  const errors = [];
  let passed = 0;
  for (const hash of ["#tokens", "#elements-headings", "#components-buttons", "#conversation-messages", "#inputs-more", "#charts", "#effects-digital-rain", "#js-countdown"]) {
    await page.goto(`${base}${ALL[0].file}${hash}`);
    await page.waitForURL((url) => url.pathname.endsWith(".html") && !url.pathname.endsWith(ALL[0].file));
    const want = `${pageOfHash(hash).file}${hash}`;
    const got = new URL(page.url()).pathname.split("/").pop() + new URL(page.url()).hash;
    // Block ids are assigned by the page script after load, so check the scroll landed too.
    await page.waitForLoadState("networkidle");
    const inView = await page.evaluate((id) => {
      const el = document.getElementById(id);
      const box = document.querySelector(".sd-shell-content").getBoundingClientRect();
      const r = el?.getBoundingClientRect();
      return !!r && r.top < box.bottom && r.bottom > box.top;
    }, hash.slice(1));
    if (got === want && inView) passed++;
    else errors.push(`${hash} went to ${got}, want ${want}; target in view: ${inView}`);
  }
  // An old link followed on an overview that is already open changes only the hash.
  await page.goto(`${base}${ALL[0].file}`, { waitUntil: "networkidle" });
  await page.evaluate(() => (location.hash = "#components-buttons"));
  const open = pageOfHash("#components-buttons").file;
  if (await page.waitForURL((url) => url.pathname.endsWith(open), { timeout: 3000 }).then(() => true, () => false)) passed++;
  else errors.push(`#components-buttons set on the open overview stayed on ${new URL(page.url()).pathname}, want ${open}`);
  await page.goto(`${base}${ALL[0].file}#top`);
  await page.waitForLoadState("networkidle");
  if (new URL(page.url()).pathname.endsWith(ALL[0].file)) passed++;
  else errors.push("#top left the overview");
  return { errors, passed, pages: LIBRARY.length };
}
