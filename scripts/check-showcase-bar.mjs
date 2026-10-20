/**
 * Behavior checks for the showcase bar (showcase/viewport.js): where you are
 * on library and example pages, the pages menu, the settings, the width frame
 * and the phone layout. Called from scripts/check.mjs once per engine.
 */
import { ALL } from "../showcase/pages.js";

export async function checkShowcaseBar(browser, base, name) {
  const errors = [];
  let passed = 0;
  const expect = (ok, message) => (ok ? passed++ : errors.push(`${name} bar: ${message}`));
  // One browser context, so what a page remembers reaches the next page, like a visitor moving through the showcase.
  const context = await browser.newContext();
  await context.addInitScript(() => {
    if (localStorage.getItem("sd-theme") === null) localStorage.setItem("sd-theme", "ink");
  });
  const open = async (file, width, height = 800) => {
    const page = await context.newPage();
    await page.setViewportSize({ width, height });
    page.on("pageerror", (e) => errors.push(`${name} bar ${file} ${width}px: ${e.message}`));
    await page.goto(`${base}${file}`, { waitUntil: "networkidle" });
    return page;
  };

  let page = await open("lib-components.html", 1280);
  const bar = await page.evaluate(() => ({
    home: document.querySelector(".vp-home")?.getAttribute("href"),
    here: document.querySelector(".vp-here")?.textContent.trim(),
    mock: document.querySelector(".vp-bar .sd-badge")?.textContent,
    kind: document.querySelector(".vp-bar")?.dataset.kind,
    headerTheme: !!document.querySelector(".hdr-theme"),
    railTools: !!document.querySelector(".sd-rail-tools"),
    asideGlobal: !!document.querySelector("#settings-panel [data-sd-theme], #settings-panel #chart-theme, #settings-panel #scrollbar-mode"),
  }));
  expect(bar.home === "./index.html" && bar.here === "/Components" && !bar.mock && bar.kind === "library", `library bar ${JSON.stringify(bar)}`);
  expect(!bar.headerTheme && !bar.railTools && !bar.asideGlobal, `global settings are only in the bar ${JSON.stringify(bar)}`);
  const covered = await page.evaluate(() =>
    [...document.querySelectorAll(".vp-bar a, .vp-bar button")]
      .filter((el) => el.getClientRects().length)
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)?.closest("a, button") !== el;
      })
      .map((el) => el.textContent.trim() || el.getAttribute("aria-label")),
  );
  expect(!covered.length, `closed panels must not cover bar controls: ${covered.join(", ")}`);

  await page.click('.vp-bar [popovertarget="vp-pages"]');
  const menu = await page.evaluate(() => ({
    open: document.getElementById("vp-pages").matches(":popover-open"),
    items: [...document.querySelectorAll('#vp-pages [role="menuitem"]')].map((a) => a.getAttribute("href")),
    current: document.querySelector('#vp-pages [aria-current="page"]')?.getAttribute("href"),
  }));
  expect(menu.open && menu.items.join() === ALL.map((p) => `./${p.file}`).join() && menu.current === "./lib-components.html", `pages menu ${JSON.stringify(menu)}`);
  await page.keyboard.press("Escape");

  await page.click('.vp-bar [data-sd-theme="paper"]');
  expect((await page.evaluate(() => [document.documentElement.dataset.theme, localStorage.getItem("sd-theme")].join())) === "paper,paper", "the theme seg sets and remembers paper");
  await page.click('.vp-bar [data-sd-theme="ink"]');

  await page.click('.vp-bar [popovertarget="vp-settings"]');
  const sets = await page.evaluate(() => ({
    open: document.getElementById("vp-settings").matches(":popover-open"),
    charts: !!document.getElementById("vp-chart-colors"),
    rain: !!document.querySelector("#vp-settings [data-sd-rain-toggle]"),
    scrollbars: document.documentElement.dataset.sdScrollbars,
  }));
  expect(sets.open && sets.rain && sets.scrollbars === "auto", `settings ${JSON.stringify(sets)}`);
  await page.click('#vp-scrollbars [data-value="always"]');
  expect((await page.evaluate(() => [document.documentElement.dataset.sdScrollbars, localStorage.getItem("sd-scrollbars")].join())) === "always,always", "scrollbars apply and are remembered");
  await page.close();

  page = await open("lib-elements.html", 1280);
  expect((await page.evaluate(() => !document.getElementById("vp-chart-colors"))), "a page with no chart parts has no chart colors setting");
  await page.close();

  page = await open("lib-charts.html", 1280);
  expect((await page.evaluate(() => document.documentElement.dataset.sdScrollbars)) === "always", "the scrollbars choice follows to the next page");
  await page.click('.vp-bar [popovertarget="vp-settings"]');
  await page.click('#vp-chart-colors [data-value="spectrum"]');
  await page.reload({ waitUntil: "networkidle" });
  expect((await page.evaluate(() => [document.documentElement.dataset.chartTheme, localStorage.getItem("sd-chart-theme")].join())) === "spectrum,spectrum", "chart colors apply and are remembered");
  await page.close();

  page = await open("charts.html", 1280);
  expect((await page.evaluate(() => document.querySelector("#chart-theme [aria-pressed=true]")?.dataset.value)) === "spectrum", "the charts example follows the remembered chart colors");
  await page.click('.vp-bar [popovertarget="vp-settings"]');
  await page.click('#vp-chart-colors [data-value="mono"]');
  expect((await page.evaluate(() => document.querySelector("#chart-theme [aria-pressed=true]")?.dataset.value)) === "mono", "the bar's chart colors reach the example's own switch");
  await page.close();

  page = await open("shell.html", 1280);
  const mock = await page.evaluate(() => ({
    kind: document.querySelector(".vp-bar")?.dataset.kind,
    badge: document.querySelector(".vp-bar .sd-badge")?.textContent,
    tone: document.querySelector(".vp-bar .sd-badge")?.hasAttribute("data-tone"),
    here: document.querySelector(".vp-title")?.textContent,
  }));
  expect(mock.kind === "mock" && mock.badge === "Mock" && !mock.tone && mock.here === "App shell", `mock bar ${JSON.stringify(mock)}`);

  // The width frame is modal, so its header carries the theme and the framed page follows it.
  await page.click('.vp-bar [data-vp="1024"]');
  await page.waitForSelector(".vp-dialog[open] iframe[src]");
  await page.frameLocator(".vp-dialog iframe").locator(".sd-shell").waitFor();
  await page.click('.vp-dialog [data-sd-theme="paper"]');
  await page.waitForFunction(() => document.querySelector(".vp-dialog iframe").contentDocument?.documentElement.dataset.theme === "paper");
  const framed = await page.evaluate(() => {
    const doc = document.querySelector(".vp-dialog iframe").contentDocument;
    return { theme: doc.documentElement.dataset.theme, bar: !!doc.querySelector(".vp-bar") };
  });
  expect(framed.theme === "paper" && !framed.bar, `the framed page follows the theme and has no bar ${JSON.stringify(framed)}`);
  await page.keyboard.press("Escape");
  await page.close();

  // The shell fills exactly the window under the bar, and nothing overflows, at every breakpoint.
  for (const [file, width, height] of [["lib-tokens.html", 1280, 800], ["lib-tokens.html", 1024, 768], ["lib-tokens.html", 768, 900], ["lib-tokens.html", 375, 780], ["shell.html", 375, 780], ["chat.html", 768, 900], ["index.html", 375, 780]]) {
    page = await open(file, width, height);
    const m = await page.evaluate(() => {
      const b = document.querySelector(".vp-bar").getBoundingClientRect();
      const s = document.querySelector(".sd-shell")?.getBoundingClientRect();
      const shown = (sel) => !!document.querySelector(sel) && getComputedStyle(document.querySelector(sel)).display !== "none";
      return {
        bar: Math.round(b.height),
        gap: s ? Math.round(s.top - b.bottom) : 0,
        fits: s ? Math.round(s.bottom) <= innerHeight : true,
        scrolls: document.documentElement.scrollHeight - innerHeight,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        widths: shown(".vp-widths"),
        pages: shown(".vp-pages-btn"),
        theme: shown(".vp-theme"),
        settings: shown('.vp-bar [popovertarget="vp-settings"]'),
      };
    });
    const phone = width < 768;
    expect(m.bar === 36 && m.gap === 0 && m.fits && m.scrolls <= 0 && m.overflow <= 0 && m.settings && m.widths === width >= 1024 && m.pages === !phone && m.theme === !phone, `${file} at ${width}px ${JSON.stringify(m)}`);
    await page.close();
  }
  await context.close();
  return { errors, passed };
}
