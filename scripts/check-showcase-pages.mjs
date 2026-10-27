/**
 * Structure checks for the showcase pages: every library page carries the
 * shared chrome and says where it is in the rail, the sidebar and the
 * crumbs, Ctrl K belongs to exactly one palette, Chart.js loads only where
 * charts are, and old links land on the page that holds them now.
 * Called from scripts/check.mjs.
 */
import { existsSync, readFileSync } from "node:fs";
import { ICONS, scriptOf } from "../showcase/layout-plugin.js";
import { MOVED } from "../showcase/moved.js";
import { ALL, EXAMPLES, LIBRARY, SECTIONS, keyOf } from "../showcase/pages.js";

const showcase = new URL("../showcase/", import.meta.url);

/** Every registry entry has its file and script, every section its rail icon, and every old anchor a page. Static; returns the problems. */
export function checkShowcaseRegistry() {
  const problems = [];
  const has = (path) => existsSync(new URL(path, showcase));
  for (const section of SECTIONS) {
    if (!ICONS.includes(`id="i-${section.icon}"`)) problems.push(`section ${section.id}: rail icon "${section.icon}" has no symbol in ICONS in showcase/layout-plugin.js`);
    for (const group of section.groups) if (!group.pages.length) problems.push(`section ${section.id}: group "${group.title}" has no pages`);
  }
  const ids = LIBRARY.map((p) => p.id);
  for (const id of ids.filter((id, i) => ids.indexOf(id) !== i)) problems.push(`page id "${id}" is in showcase/pages.js twice`);
  for (const [from, to] of Object.entries(MOVED)) if (!ids.includes(to)) problems.push(`showcase/moved.js sends #${from} to "${to}", which is not a page`);
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
    if (!has(scriptOf(page))) problems.push(`${page.file}: showcase/${scriptOf(page)} does not exist`);
    if (LIBRARY.includes(page) && html.includes('class="demo-section"')) problems.push(`${page.file} holds a .demo-section; the layout adds it, so the file holds only its intro and blocks`);
  }
  return problems;
}

/** Runs on a library page already loaded at 1280px in ink. */
export async function checkShowcasePages(page, where, fail, library) {
  const chrome = await page.evaluate(() => ({
    rail: [...document.querySelectorAll(".sd-rail-item[aria-current]")].map((a) => a.dataset.sdSection),
    panels: [...document.querySelectorAll("#library-sidebar .sd-sidebar-panel:not([hidden])")].map((p) => p.dataset.section),
    sidebar: [...document.querySelectorAll('#library-sidebar .sd-sidebar-link[aria-current="page"]')].map((a) => a.getAttribute("href")),
    crumbs: [...document.querySelectorAll(".sd-shell-header .sd-breadcrumb > li")].map((li) => li.textContent.trim()).filter(Boolean),
    h1: document.querySelectorAll(".demo-intro > .demo-title > h1").length,
    // Blocks may show an h1 as a demo; only one outside them is a second page title.
    strayH1: [...document.querySelectorAll("h1")].filter((h) => !h.closest(".demo-block, .demo-title")).length,
    skip: document.querySelector("body > .sd-skip")?.getAttribute("href"),
    main: document.getElementById("main")?.getAttribute("tabindex"),
    chart: performance.getEntriesByType("resource").some((e) => /\/charts\/|chart[._]+js/.test(e.name)),
  }));
  const { section, group } = library;
  if (chrome.rail.join() !== section.id) fail(where, `rail marks ${JSON.stringify(chrome.rail)} as current, want ${section.id}`);
  if (chrome.panels.join() !== section.id) fail(where, `sidebar shows ${JSON.stringify(chrome.panels)}, want the ${section.id} panel`);
  if (chrome.sidebar.join() !== `./${library.file}`) fail(where, `sidebar marks ${JSON.stringify(chrome.sidebar)} as current, want ./${library.file}`);
  const crumbs = `${section.title} / ${group.title} / ${library.title}`;
  if (chrome.crumbs.join(" / ") !== crumbs) fail(where, `crumbs read ${chrome.crumbs.join(" / ")}, want ${crumbs}`);
  if (chrome.h1 !== 1 || chrome.strayH1 !== 0) fail(where, `page has ${chrome.h1} title h1 and ${chrome.strayH1} stray h1, want 1 and 0`);
  if (chrome.skip !== "#main" || chrome.main !== "-1") fail(where, `skip link ${chrome.skip}, main tabindex ${chrome.main}`);
  if (chrome.chart !== (library.id === "charts")) fail(where, chrome.chart ? "Chart.js loaded on a page without charts" : "Chart.js did not load on the charts page");

  // Ctrl K opens this page's own palette if it has one, else the chrome's page palette.
  const own = await page.evaluate(() => !!document.querySelector("dialog[data-sd-palette]:not(#nav-palette)"));
  await page.locator(".demo-intro h1").click();
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

/** Rail sections on a library page at 1280px: pinned, a section opens its first page; collapsed, it peeks its pages in place. */
export async function checkRailSections(page, base) {
  const errors = [];
  await page.goto(`${base}${LIBRARY[0].file}`, { waitUntil: "networkidle" });
  const target = SECTIONS[2];
  await page.click(`.sd-rail-item[data-sd-section="${target.id}"]`);
  const first = target.groups[0].pages[0].file;
  if (!(await page.waitForURL((url) => url.pathname.endsWith(first), { timeout: 3000 }).then(() => true, () => false)))
    errors.push(`pinned: ${target.id} went to ${new URL(page.url()).pathname}, want ${first}`);
  await page.waitForLoadState("networkidle");
  await page.keyboard.press("[");
  await page.waitForFunction(() => document.querySelector(".sd-shell").dataset.sidebar === "collapsed", null, { timeout: 2000 }).catch(() => {});
  const other = SECTIONS[0];
  await page.click(`.sd-rail-item[data-sd-section="${other.id}"]`);
  const state = await page
    .waitForFunction(
      (id) => {
        const shell = document.querySelector(".sd-shell");
        return "peek" in shell.dataset && document.querySelector(`.sd-sidebar-panel[data-section="${id}"]:not([hidden])`);
      },
      other.id,
      { timeout: 2000 },
    )
    .then(() => true, () => false);
  if (!state) errors.push(`collapsed: ${other.id} did not peek its pages`);
  if (!new URL(page.url()).pathname.endsWith(first)) errors.push(`collapsed: ${other.id} navigated to ${new URL(page.url()).pathname}`);
  // Leave the sidebar pinned for the pages checked after this.
  await page.keyboard.press("Escape");
  await page.keyboard.press("[");
  await page.evaluate(() => localStorage.removeItem("sd-shell-sidebar"));
  return errors;
}

/** Old links to the single components page and the section pages, followed from the overview. */
export async function checkHashRedirects(page, base) {
  const errors = [];
  let passed = 0;
  // An old section with no anchor of its own now lands on the top of its page.
  const cases = [
    ["#tokens", "lib-color.html"],
    ["#elements-headings", "lib-elements.html#elements-headings"],
    ["#components-buttons", "lib-buttons.html#components-buttons"],
    ["#conversation-messages", "lib-messages.html#conversation-messages"],
    ["#inputs-more", "lib-pickers.html"],
    ["#charts", "lib-charts.html#charts"],
    ["#effects-digital-rain", "lib-rain.html#effects-digital-rain"],
    ["#js-countdown", "lib-countdown.html#js-countdown"],
  ];
  for (const [hash, want] of cases) {
    await page.goto(`${base}${ALL[0].file}${hash}`);
    await page.waitForURL((url) => url.pathname.endsWith(".html") && !url.pathname.endsWith(ALL[0].file));
    await page.waitForLoadState("networkidle");
    const url = new URL(page.url());
    const got = url.pathname.split("/").pop() + url.hash;
    const inView = await page.evaluate((id) => {
      const box = document.querySelector(".sd-shell-content");
      if (!id) return box.scrollTop === 0;
      const r = document.getElementById(id)?.getBoundingClientRect();
      const b = box.getBoundingClientRect();
      return !!r && r.top < b.bottom && r.bottom > b.top;
    }, want.split("#")[1] ?? "");
    if (got === want && inView) passed++;
    else errors.push(`${hash} went to ${got}, want ${want}; target in view: ${inView}`);
  }
  // An old link followed on an overview that is already open changes only the hash.
  await page.goto(`${base}${ALL[0].file}`, { waitUntil: "networkidle" });
  await page.evaluate(() => (location.hash = "#components-buttons"));
  if (await page.waitForURL((url) => url.pathname.endsWith("lib-buttons.html"), { timeout: 3000 }).then(() => true, () => false)) passed++;
  else errors.push(`#components-buttons set on the open overview stayed on ${new URL(page.url()).pathname}, want lib-buttons.html`);
  await page.goto(`${base}${ALL[0].file}#top`);
  await page.waitForLoadState("networkidle");
  if (new URL(page.url()).pathname.endsWith(ALL[0].file)) passed++;
  else errors.push("#top left the overview");
  return { errors, passed, pages: LIBRARY.length };
}
