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
  await page.waitForFunction(() => document.getElementById("vp-pages").matches(":popover-open"), null, { timeout: 2000 });
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
  await page.waitForFunction(() => document.getElementById("vp-settings").matches(":popover-open"), null, { timeout: 2000 });
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
  await page.waitForFunction(() => document.getElementById("vp-settings").matches(":popover-open"), null, { timeout: 2000 });
  await page.click('#vp-chart-colors [data-value="spectrum"]');
  await page.reload({ waitUntil: "networkidle" });
  expect((await page.evaluate(() => [document.documentElement.dataset.chartTheme, localStorage.getItem("sd-chart-theme")].join())) === "spectrum,spectrum", "chart colors apply and are remembered");
  await page.close();

  page = await open("charts.html", 1280);
  expect((await page.evaluate(() => document.querySelector("#chart-theme [aria-pressed=true]")?.dataset.value)) === "spectrum", "the charts example follows the remembered chart colors");
  await page.click('.vp-bar [popovertarget="vp-settings"]');
  await page.waitForFunction(() => document.getElementById("vp-settings").matches(":popover-open"), null, { timeout: 2000 });
  await page.click('#vp-chart-colors [data-value="mono"]');
  expect((await page.evaluate(() => document.querySelector("#chart-theme [aria-pressed=true]")?.dataset.value)) === "mono", "the bar's chart colors reach the example's own switch");
  await page.keyboard.press("Escape");
  await page.click('#chart-theme [data-value="spectrum"]');
  const both = await page.evaluate(() => ({
    bar: document.querySelector("#vp-chart-colors [aria-pressed=true]")?.dataset.value,
    own: document.querySelector("#chart-theme [aria-pressed=true]")?.dataset.value,
    root: document.documentElement.dataset.chartTheme,
    figure: document.querySelector("#core").dataset.chartTheme,
    stored: localStorage.getItem("sd-chart-theme"),
  }));
  expect(Object.values(both).every((v) => v === "spectrum"), `the example's switch reaches the bar, the page and storage ${JSON.stringify(both)}`);

  // Chart colors chosen in the width frame reach the page that opened it, and the other way round.
  await page.click('.vp-bar [data-vp="1024"]');
  await page.waitForSelector(".vp-dialog[open] iframe[src]");
  await page.frameLocator(".vp-dialog iframe").locator("#chart-theme").waitFor();
  const colors = () =>
    page.evaluate(() => {
      const read = (doc) => [doc.documentElement.dataset.chartTheme, doc.querySelector("#core").dataset.chartTheme, doc.querySelector("#chart-theme [aria-pressed=true]")?.dataset.value, doc.querySelector("#vp-chart-colors [aria-pressed=true]")?.dataset.value ?? doc.querySelector("#chart-theme [aria-pressed=true]")?.dataset.value];
      return { page: read(document), frame: read(document.querySelector(".vp-dialog iframe").contentDocument) };
    });
  const reaches = (want) => page.waitForFunction((v) => [document, document.querySelector(".vp-dialog iframe").contentDocument].every((doc) => doc.documentElement.dataset.chartTheme === v && doc.querySelector("#core").dataset.chartTheme === v && doc.querySelector("#chart-theme [aria-pressed=true]")?.dataset.value === v), want, { timeout: 2000 }).catch(() => {});
  await page.frameLocator(".vp-dialog iframe").locator('#chart-theme [data-value="mono"]').click();
  await reaches("mono");
  const fromFrame = await colors();
  expect(Object.values(fromFrame).flat().every((v) => v === "mono") && (await page.evaluate(() => document.querySelector("#vp-chart-colors [aria-pressed=true]")?.dataset.value)) === "mono", `chart colors chosen in the frame reach the page's switch, figures and bar ${JSON.stringify(fromFrame)}`);
  await page.evaluate(() => document.querySelector('#vp-chart-colors [data-value="spectrum"]').click());
  await reaches("spectrum");
  const fromPage = await colors();
  expect(Object.values(fromPage).flat().every((v) => v === "spectrum"), `chart colors chosen on the page reach the frame ${JSON.stringify(fromPage)}`);
  await page.evaluate(() => {
    for (const v of ["mono", "spectrum", "mono"]) document.querySelector(`#vp-chart-colors [data-value="${v}"]`).click();
  });
  await reaches("mono");
  await page.waitForTimeout(300);
  const queued = await colors();
  expect(Object.values(queued).flat().every((v) => v === "mono"), `three chart color changes queued in one tick settle on the last ${JSON.stringify(queued)}`);
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

  // A theme changed inside the frame reaches the page that framed it, once.
  const frame = page.frames().find((f) => f.url().includes("frame"));
  await page.frameLocator(".vp-dialog iframe").locator("#main").focus();
  await page.evaluate(() => {
    window.sdThemeEvents = 0;
    document.addEventListener("sd:theme", () => window.sdThemeEvents++);
  });
  await page.keyboard.press("Shift+T");
  await page.waitForFunction(() => document.documentElement.dataset.theme === "auto", null, { timeout: 2000 }).catch(() => {});
  await page.waitForTimeout(300);
  const back = await page.evaluate(() => ({
    theme: document.documentElement.dataset.theme,
    bar: document.querySelector('.vp-bar [data-sd-theme][aria-pressed="true"]')?.dataset.sdTheme,
    header: document.querySelector('.vp-dialog [data-sd-theme][aria-pressed="true"]')?.dataset.sdTheme,
    events: window.sdThemeEvents,
  }));
  expect(back.theme === "auto" && back.bar === "auto" && back.header === "auto" && back.events === 1, `a theme changed in the frame reaches the page once ${JSON.stringify(back)}`);

  // Two changes queued in one tick settle on the last one, and the sides do not echo each other while stale messages are in flight.
  const countEvents = () => {
    if (window.sdThemeCount === undefined) document.addEventListener("sd:theme", () => window.sdThemeCount++);
    window.sdThemeCount = 0;
  };
  const themes = () => page.evaluate(() => [document.documentElement.dataset.theme, document.querySelector(".vp-dialog iframe").contentDocument.documentElement.dataset.theme]);
  for (const [from, queue] of [
    ["page", () => { for (const t of ["paper", "auto"]) document.querySelector(`.vp-dialog [data-sd-theme="${t}"]`).click(); }],
    ["frame", () => { for (let i = 0; i < 2; i++) document.querySelector("[data-sd-theme-cycle]").click(); }],
  ]) {
    await page.evaluate(countEvents);
    await frame.evaluate(countEvents);
    const [before] = await themes();
    const last = from === "page" ? "auto" : ["ink", "graphite", "paper", "auto"][(["ink", "graphite", "paper", "auto"].indexOf(before) + 2) % 4];
    await (from === "page" ? page : frame).evaluate(queue);
    await page.waitForFunction((want) => [document.documentElement, document.querySelector(".vp-dialog iframe").contentDocument.documentElement].every((el) => el.dataset.theme === want), last, { timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(300);
    const settled = {
      themes: await themes(),
      events: [await page.evaluate(() => window.sdThemeCount), await frame.evaluate(() => window.sdThemeCount)],
    };
    expect(settled.themes.every((t) => t === last) && settled.events.every((n) => n <= 4), `two theme changes queued from the ${from} settle on ${last} without echoing ${JSON.stringify(settled)}`);
  }

  // Esc that dismisses a tooltip, or ends an IME composition, is not a request to close the frame.
  await page.frameLocator(".vp-dialog iframe").locator("#main").focus();
  await page.frameLocator(".vp-dialog iframe").locator("[data-sd-tip]").first().hover();
  await frame.waitForSelector('[role="tooltip"]', { timeout: 2000 });
  await page.keyboard.press("Escape");
  await frame.waitForFunction(() => !document.querySelector('[role="tooltip"]'), null, { timeout: 2000 });
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => document.querySelector(".vp-dialog").open), "Esc that hides a tooltip in the frame leaves the frame open");
  // A pointer left over the trigger shows the tooltip again whenever the layout under it changes.
  await page.mouse.move(5, 5);
  await frame.evaluate(() => document.activeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", isComposing: true, bubbles: true })));
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => document.querySelector(".vp-dialog").open), "Esc during an IME composition in the frame leaves the frame open");

  // Esc inside the frame closes the dialog, unless a palette in the frame takes it first.
  await page.frameLocator(".vp-dialog iframe").locator("#main").focus();
  await page.keyboard.press("Control+k");
  await frame.waitForFunction(() => [...document.querySelectorAll("dialog")].some((d) => d.open), null, { timeout: 2000 });
  await page.keyboard.press("Escape");
  await frame.waitForFunction(() => ![...document.querySelectorAll("dialog")].some((d) => d.open), null, { timeout: 2000 });
  expect(await page.evaluate(() => document.querySelector(".vp-dialog").open), "Esc closes a palette in the frame, not the frame");
  await page.frameLocator(".vp-dialog iframe").locator("#main").focus();
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => !document.querySelector(".vp-dialog").open, null, { timeout: 2000 }).catch(() => {});
  expect(await page.evaluate(() => !document.querySelector(".vp-dialog").open), "Esc inside the frame closes it");
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
        // Every library page is reachable from the rail without scrolling it, at 768px tall and up.
        // The 16px of spare height absorbs other platforms' font metrics (CI runs on Linux fallbacks).
        rail: (() => {
          const list = document.querySelector(".sd-rail-list");
          if (!list || !list.getClientRects().length) return true;
          const items = [...list.children];
          const used = items.at(-1).getBoundingClientRect().bottom - items[0].getBoundingClientRect().top;
          return list.scrollHeight <= list.clientHeight + 1 && list.clientHeight - used >= 16;
        })(),
      };
    });
    const phone = width < 768;
    expect(m.bar === 36 && m.gap === 0 && m.fits && m.scrolls <= 0 && m.overflow <= 0 && m.rail && m.settings && m.widths === width >= 1024 && m.pages === !phone && m.theme === !phone, `${file} at ${width}px ${JSON.stringify(m)}`);
    await page.close();
  }
  await context.close();
  return { errors, passed };
}
