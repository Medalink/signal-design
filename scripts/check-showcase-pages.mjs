/**
 * Structure checks for the showcase pages: every library page carries the
 * shared chrome and says where it is, its sidebar lists only its own blocks,
 * Ctrl K belongs to exactly one palette, Chart.js loads only where charts
 * are, and old single-page links land on the page that holds them now.
 * Called from scripts/check.mjs.
 */
import { ALL, LIBRARY, pageOfHash } from "../showcase/pages.js";

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
    if (got === want) passed++;
    else errors.push(`${hash} went to ${got}, want ${want}`);
  }
  await page.goto(`${base}${ALL[0].file}#top`);
  await page.waitForLoadState("networkidle");
  if (new URL(page.url()).pathname.endsWith(ALL[0].file)) passed++;
  else errors.push("#top left the overview");
  return { errors, passed, pages: LIBRARY.length };
}
