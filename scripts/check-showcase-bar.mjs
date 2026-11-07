/**
 * Behavior checks for the showcase's bars: the doc topbar on library pages and
 * the overview (one bar, one Theme popover, one Ctrl K palette, phone fit) and
 * the showcase bar on example pages (showcase/viewport.js: the pages menu, the
 * settings, the width frame and the phone layout). Called from scripts/check.mjs
 * once per engine.
 */
import { ALL } from "../showcase/pages.js";
import { gotoSettled, settle } from "./settle.mjs";

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
    await gotoSettled(page, `${base}${file}`);
    return page;
  };

  // A library page has one bar, the doc topbar. The showcase bar mounts on example pages only.
  const panelOpen = async (page) => {
    if (await page.evaluate(() => document.getElementById("doc-appearance").matches(":popover-open"))) return;
    await page.click(".doc-topbar-appearance");
    await page.waitForFunction(() => document.getElementById("doc-appearance").matches(":popover-open"), null, { timeout: 2000 });
  };
  let page = await open("lib-buttons.html", 1280);
  const lib = await page.evaluate(() => ({
    bars: document.querySelectorAll(".vp-bar").length,
    flag: document.documentElement.classList.contains("has-vp-bar"),
    topbars: document.querySelectorAll(".doc-topbar").length,
    here: document.querySelector(".doc-crumbs")?.textContent.replace(/\s+/g, " ").trim(),
    cycle: document.querySelectorAll("[data-sd-theme-cycle]:not(dialog *)").length,
    hints: [...document.querySelectorAll("kbd")].filter((k) => k.getClientRects().length && !k.closest(".demo-block, .doc-canvas") && /\bK\b/.test(k.textContent)).length,
    nav: [...document.querySelectorAll(".doc-topbar-nav a")].map((a) => a.getAttribute("href")).join(),
    headerTheme: !!document.querySelector(".hdr-theme"),
    railTools: !!document.querySelector(".sd-rail-tools"),
    asideGlobal: !!document.querySelector("#settings-panel [data-sd-theme], #settings-panel #chart-theme, #settings-panel #scrollbar-mode"),
  }));
  expect(!lib.bars && !lib.flag && lib.topbars === 1 && lib.cycle === 0 && lib.hints === 1, `a library page has one topbar and no showcase bar ${JSON.stringify(lib)}`);
  expect(lib.nav === "./index.html#home-components,./index.html#home-examples,./lib-rules.html,./lib-setup.html", `topbar links ${lib.nav}`);
  expect(!lib.headerTheme && !lib.railTools && !lib.asideGlobal, `global settings are only in the topbar popover ${JSON.stringify(lib)}`);
  const covered = await page.evaluate(() =>
    [...document.querySelectorAll(".doc-topbar a, .doc-topbar button")]
      .filter((el) => el.getClientRects().length)
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)?.closest("a, button") !== el;
      })
      .map((el) => el.textContent.trim() || el.getAttribute("aria-label")),
  );
  expect(!covered.length, `closed panels must not cover topbar controls: ${covered.join(", ")}`);

  await panelOpen(page);
  const panel = await page.evaluate(() => ({
    groups: [...document.querySelectorAll("#doc-appearance .sd-field")].map((f) => f.querySelector(".sd-field-label")?.textContent).join(),
    themes: [...document.querySelectorAll("#doc-appearance [data-sd-theme]")].map((b) => b.dataset.sdTheme).join(),
    fonts: [...document.querySelectorAll("#doc-appearance [data-sd-font]")].map((b) => b.dataset.sdFont).join(),
    pressed: document.querySelector("#doc-appearance [data-sd-theme][aria-pressed=true]")?.dataset.sdTheme,
    font: document.querySelector("#doc-appearance [data-sd-font][aria-pressed=true]")?.dataset.sdFont,
    charts: !!document.getElementById("set-chart-colors"),
    scrollbars: document.documentElement.dataset.sdScrollbars,
  }));
  expect(panel.groups === "Theme,Text font,Scrollbars" && panel.themes === "ink,graphite,paper,auto" && panel.fonts === "system,leon-sans,source-code-pro" && panel.pressed === "ink" && panel.font === "system" && !panel.charts && panel.scrollbars === "auto", `appearance popover ${JSON.stringify(panel)}`);
  await page.click('#doc-appearance [data-sd-theme="paper"]');
  expect((await page.evaluate(() => [document.documentElement.dataset.theme, localStorage.getItem("sd-theme"), document.querySelector("#doc-appearance [data-sd-theme][aria-pressed=true]")?.dataset.sdTheme].join())) === "paper,paper,paper", "the theme seg sets, remembers and shows paper");
  await page.click('#doc-appearance [data-sd-theme="ink"]');
  await page.click('#doc-appearance [data-sd-font="leon-sans"]');
  await page.waitForFunction(() => document.documentElement.dataset.font === "leon-sans", null, { timeout: 3000 }).catch(() => {});
  expect((await page.evaluate(() => [document.documentElement.dataset.font, document.querySelector("#doc-appearance [data-sd-font][aria-pressed=true]")?.dataset.sdFont].join())) === "leon-sans,leon-sans", "the font seg sets and shows leon sans");
  await page.click('#doc-appearance [data-sd-font="system"]');
  await page.keyboard.press("Escape");
  await page.keyboard.press("Shift+T");
  expect((await page.evaluate(() => [document.documentElement.dataset.theme, document.querySelector("#doc-appearance [data-sd-theme][aria-pressed=true]")?.dataset.sdTheme].join())) === "graphite,graphite", "Shift+T steps the theme and the seg follows");
  await page.keyboard.press("Shift+T");
  await page.keyboard.press("Shift+T");
  await page.keyboard.press("Shift+T");

  await panelOpen(page);
  await page.click('#set-scrollbars [data-value="always"]');
  expect((await page.evaluate(() => [document.documentElement.dataset.sdScrollbars, localStorage.getItem("sd-scrollbars")].join())) === "always,always", "scrollbars apply and are remembered");
  await page.keyboard.press("Escape");

  // Ctrl K is the one search: it opens the page palette.
  await page.locator(".demo-intro h1").click();
  await page.keyboard.press("Control+k");
  expect(await page.evaluate(() => [...document.querySelectorAll("dialog[data-sd-palette]")].filter((d) => d.open).map((d) => d.id).join() === "nav-palette" && document.activeElement?.closest("#nav-palette") !== null), "Ctrl K opens the page palette and focuses it");
  await page.keyboard.press("Escape");
  await page.click(".doc-topbar-search");
  expect(await page.evaluate(() => document.getElementById("nav-palette").open), "the topbar Search button opens the page palette");
  await page.keyboard.press("Escape");
  await page.close();

  page = await open("lib-elements.html", 1280);
  expect((await page.evaluate(() => !document.getElementById("set-chart-colors"))), "a page with no chart parts has no chart colors setting");
  await page.close();

  page = await open("lib-charts.html", 1280);
  expect((await page.evaluate(() => document.documentElement.dataset.sdScrollbars)) === "always", "the scrollbars choice follows to the next page");
  await panelOpen(page);
  await page.click('#set-chart-colors [data-value="spectrum"]');
  await page.reload({ waitUntil: "load" });
  await settle(page);
  expect((await page.evaluate(() => [document.documentElement.dataset.chartTheme, localStorage.getItem("sd-chart-theme")].join())) === "spectrum,spectrum", "chart colors apply and are remembered");
  await page.close();

  page = await open("charts.html", 1280);
  expect((await page.evaluate(() => [document.documentElement.dataset.chartTheme, document.querySelector("#cpu").dataset.chartTheme].join())) === "spectrum,spectrum", "the charts example follows the remembered chart colors");
  const setColors = async (value) => {
    await page.click('.vp-bar [popovertarget="vp-settings"]');
    await page.waitForFunction(() => document.getElementById("vp-settings").matches(":popover-open"), null, { timeout: 2000 });
    await page.click(`#set-chart-colors [data-value="${value}"]`);
    await page.keyboard.press("Escape");
  };
  await setColors("mono");
  const mono = await page.evaluate(() => ({
    bar: document.querySelector("#set-chart-colors [aria-pressed=true]")?.dataset.value,
    root: document.documentElement.dataset.chartTheme,
    figures: [...document.querySelectorAll(".sd-chart")].map((f) => f.dataset.chartTheme).join(),
    stored: localStorage.getItem("sd-chart-theme"),
  }));
  expect(mono.bar === "mono" && mono.root === "mono" && mono.figures === "mono,mono" && mono.stored === "mono", `the bar's chart colors reach the example's charts and storage ${JSON.stringify(mono)}`);

  // Chart colors chosen on the page reach the frame that shows it at a set width.
  await page.click('.vp-bar [data-vp="1024"]');
  await page.waitForSelector(".vp-dialog[open] iframe[src]");
  await page.frameLocator(".vp-dialog iframe").locator("#cpu").waitFor();
  const colors = () =>
    page.evaluate(() => {
      const read = (doc) => [doc.documentElement.dataset.chartTheme, doc.querySelector("#cpu").dataset.chartTheme, doc.querySelector("#memory").dataset.chartTheme];
      return { page: read(document), frame: read(document.querySelector(".vp-dialog iframe").contentDocument) };
    });
  const reaches = (want) => page.waitForFunction((v) => [document, document.querySelector(".vp-dialog iframe").contentDocument].every((doc) => doc.documentElement.dataset.chartTheme === v && doc.querySelector("#cpu").dataset.chartTheme === v), want, { timeout: 2000 }).catch(() => {});
  await page.evaluate(() => document.querySelector('#set-chart-colors [data-value="spectrum"]').click());
  await reaches("spectrum");
  const fromPage = await colors();
  expect(Object.values(fromPage).flat().every((v) => v === "spectrum"), `chart colors chosen on the page reach the frame ${JSON.stringify(fromPage)}`);
  await page.evaluate(() => {
    for (const v of ["mono", "spectrum", "mono"]) document.querySelector(`#set-chart-colors [data-value="${v}"]`).click();
  });
  await reaches("mono");
  await page.waitForTimeout(300);
  const queued = await colors();
  expect(Object.values(queued).flat().every((v) => v === "mono"), `three chart color changes queued in one tick settle on the last ${JSON.stringify(queued)}`);
  await page.close();

  page = await open("shell.html", 1280);
  const mock = await page.evaluate(() => ({
    home: document.querySelector(".vp-home")?.getAttribute("href"),
    docTopbar: !!document.querySelector(".doc-topbar"),
    kind: document.querySelector(".vp-bar")?.dataset.kind,
    badge: document.querySelector(".vp-bar .sd-badge")?.textContent,
    tone: document.querySelector(".vp-bar .sd-badge")?.hasAttribute("data-tone"),
    here: document.querySelector(".vp-title")?.textContent,
  }));
  expect(mock.home === "./index.html" && !mock.docTopbar && mock.kind === "mock" && mock.badge === "Mock" && !mock.tone && mock.here === "App shell", `mock bar ${JSON.stringify(mock)}`);
  const barCovered = await page.evaluate(() =>
    [...document.querySelectorAll(".vp-bar a, .vp-bar button")]
      .filter((el) => el.getClientRects().length)
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)?.closest("a, button") !== el;
      })
      .map((el) => el.textContent.trim() || el.getAttribute("aria-label")),
  );
  expect(!barCovered.length, `closed panels must not cover bar controls: ${barCovered.join(", ")}`);
  await page.click('.vp-bar [popovertarget="vp-pages"]');
  await page.waitForFunction(() => document.getElementById("vp-pages").matches(":popover-open"), null, { timeout: 2000 });
  const pagesMenu = await page.evaluate(() => ({
    items: [...document.querySelectorAll('#vp-pages [role="menuitem"]')].map((a) => a.getAttribute("href")),
    current: document.querySelector('#vp-pages [aria-current="page"]')?.getAttribute("href"),
  }));
  expect(pagesMenu.items.join() === ALL.map((p) => `./${p.file}`).join() && pagesMenu.current === "./shell.html", `pages menu ${JSON.stringify(pagesMenu)}`);
  await page.keyboard.press("Escape");
  // The bar holds no theme seg of its own: theme lives in its settings, so a mock app's own theme button is the only one in view.
  expect(!(await page.evaluate(() => document.querySelector(".vp-bar > :not([popover]) [data-sd-theme], .vp-bar > [data-sd-theme]"))), "the example bar shows no theme seg of its own");
  // The rain toggle appears where the page has a rain canvas; the doc pages above have none.
  await page.click('.vp-bar [popovertarget="vp-settings"]');
  await page.waitForFunction(() => document.getElementById("vp-settings").matches(":popover-open"), null, { timeout: 2000 });
  await page.click('#vp-settings [data-sd-theme="paper"]');
  expect((await page.evaluate(() => [document.documentElement.dataset.theme, localStorage.getItem("sd-theme")].join())) === "paper,paper", "the bar's settings theme seg sets and remembers paper");
  await page.click('#vp-settings [data-sd-theme="ink"]');
  const barPanel = await page.evaluate(() => ({
    rain: !!document.querySelector("#vp-settings [data-sd-rain-toggle]"),
    fonts: document.querySelectorAll("#vp-settings [data-sd-font]").length,
    themes: document.querySelectorAll("#vp-settings [data-sd-theme]").length,
  }));
  expect(barPanel.rain && barPanel.fonts === 3 && barPanel.themes === 4, `the example bar's settings come from the shared builder ${JSON.stringify(barPanel)}`);
  await page.keyboard.press("Escape");

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
    ["frame", () => { for (let i = 0; i < 2; i++) document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "T", shiftKey: true, bubbles: true })); }],
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

  // Esc inside the frame closes the dialog, unless a dialog in the frame takes it first.
  await page.frameLocator(".vp-dialog iframe").locator("#main").focus();
  await frame.evaluate(() => document.getElementById("confirm-remove").showModal());
  await frame.waitForFunction(() => [...document.querySelectorAll("dialog")].some((d) => d.open), null, { timeout: 2000 });
  await page.keyboard.press("Escape");
  await frame.waitForFunction(() => ![...document.querySelectorAll("dialog")].some((d) => d.open), null, { timeout: 2000 });
  expect(await page.evaluate(() => document.querySelector(".vp-dialog").open), "Esc closes a dialog in the frame, not the frame");
  await page.frameLocator(".vp-dialog iframe").locator("#main").focus();
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => !document.querySelector(".vp-dialog").open, null, { timeout: 2000 }).catch(() => {});
  expect(await page.evaluate(() => !document.querySelector(".vp-dialog").open), "Esc inside the frame closes it");
  await page.close();

  // Library pages and the overview: one 64px topbar, nothing above it, no overflow, 40px touch targets on phones, and the appearance popover fits the screen.
  for (const [file, width, height] of [["lib-color.html", 1280, 800], ["lib-color.html", 1024, 768], ["lib-color.html", 768, 900], ["lib-color.html", 375, 780], ["lib-color.html", 320, 700], ["index.html", 1280, 800], ["index.html", 375, 780], ["index.html", 320, 700]]) {
    page = await open(file, width, height);
    await page.click(".doc-topbar-appearance");
    await page.waitForFunction(() => document.getElementById("doc-appearance").matches(":popover-open"), null, { timeout: 2000 });
    await page.waitForTimeout(200); // the popover places itself after it opens
    const m = await page.evaluate(() => {
      const t = document.querySelector(".doc-topbar").getBoundingClientRect();
      const p = document.getElementById("doc-appearance").getBoundingClientRect();
      const small = (sel) => [...document.querySelectorAll(sel)].filter((el) => el.getClientRects().length).filter((el) => el.getBoundingClientRect().height < 40).map((el) => el.textContent.trim() || el.getAttribute("aria-label"));
      return {
        bars: document.querySelectorAll(".vp-bar").length,
        top: Math.round(t.top),
        height: Math.round(t.height),
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        menu: !!document.querySelector(".doc-menu-btn"),
        panelFits: p.left >= 0 && p.right <= innerWidth && p.top >= 0 && p.bottom <= innerHeight,
        small: small(".doc-topbar a, .doc-topbar button, #doc-appearance button"),
        search: !!document.querySelector('.doc-topbar-search[data-sd-open="nav-palette"]'),
      };
    });
    const phone = width < 768;
    expect(!m.bars && m.top === 0 && m.height === 64 && m.overflow <= 0 && m.menu === file.startsWith("lib-") && m.panelFits && m.search && (!phone || !m.small.length), `${file} at ${width}px ${JSON.stringify(m)}`);
    await page.close();
  }

  // The shell fills exactly the window under the bar, and nothing overflows, at every breakpoint.
  for (const [file, width, height] of [["shell.html", 1280, 800], ["shell.html", 1024, 768], ["shell.html", 375, 780], ["chat.html", 768, 900]]) {
    page = await open(file, width, height);
    const m = await page.evaluate(() => {
      const b = document.querySelector(".vp-bar").getBoundingClientRect();
      const shell = document.querySelector(".sd-shell");
      const s = shell?.getBoundingClientRect();
      const shown = (sel) => !!document.querySelector(sel) && getComputedStyle(document.querySelector(sel)).display !== "none";
      return {
        bar: Math.round(b.height),
        shell: !!shell,
        gap: s ? Math.round(s.top - b.bottom) : 0,
        fits: s ? Math.round(s.bottom) <= innerHeight : true,
        scrolls: document.documentElement.scrollHeight - innerHeight,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        widths: shown(".vp-widths"),
        pages: shown(".vp-pages-btn"),
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
    expect(m.bar === 36 && m.gap === 0 && m.fits && m.scrolls <= 0 && m.overflow <= 0 && m.rail && m.settings && m.widths === width >= 1024 && m.pages === !phone, `${file} at ${width}px ${JSON.stringify(m)}`);
    await page.close();
  }
  await context.close();
  return { errors, passed };
}
