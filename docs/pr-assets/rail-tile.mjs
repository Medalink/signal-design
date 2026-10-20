// Measures the compact rail tile in Chromium and WebKit and shoots the PR screenshot.
//   node docs/pr-assets/rail-tile.mjs http://localhost:5178/
import { writeFileSync, readFileSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import * as pw from "playwright";
const base = process.argv[2] || "http://localhost:5178/";
const out = fileURLToPath(new URL(".", import.meta.url));
const started = Date.now();
const results = { base, checks: [], engines: {} };
const check = (name, ok, detail) => { results.checks.push({ name, ok, detail }); console.log(`${ok ? "ok  " : "FAIL"} ${name} ${JSON.stringify(detail)}`); };

async function measure(page) {
  return page.evaluate(() => {
    const nav = document.querySelector('nav[aria-label="Places"]');
    const list = nav.querySelector(".sd-rail-list");
    const rail = nav.getBoundingClientRect();
    const tiles = [...nav.querySelectorAll(".sd-rail-tile")].map((t) => {
      const r = t.getBoundingClientRect();
      const edge = getComputedStyle(t, "::before");
      const badge = t.querySelector(".sd-badge-count");
      const b = badge?.getBoundingClientRect();
      return {
        label: t.getAttribute("aria-label"),
        width: r.width, height: r.height,
        leftGap: +(r.left - rail.left).toFixed(2), rightGap: +(rail.right - 1 - r.right).toFixed(2),
        edgeLeft: +(r.left + t.clientLeft + parseFloat(edge.left) - rail.left).toFixed(2),
        edgeHeight: parseFloat(edge.height), edgeWidth: parseFloat(edge.width),
        badge: b ? { top: +(b.top - list.getBoundingClientRect().top).toFixed(2), right: +(rail.right - b.right).toFixed(2) } : null,
        borderStyle: getComputedStyle(t).borderTopStyle,
        borderColor: getComputedStyle(t).borderTopColor,
      };
    });
    return { railWidth: rail.width, listScroll: [list.scrollWidth, list.clientWidth], tiles };
  });
}

for (const [name, engine] of Object.entries({ chromium: pw.chromium, webkit: pw.webkit })) {
  const browser = await engine.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  await page.addInitScript(() => localStorage.setItem("sd-theme", "ink"));
  await page.goto(base);
  await page.waitForSelector('nav[aria-label="Places"] .sd-rail-tile');
  const at72 = await measure(page);
  await page.evaluate(() => document.querySelector('nav[aria-label="Places"]').style.setProperty("--shell-rail", "6rem"));
  const at96 = await measure(page);
  results.engines[name] = { at72, at96 };
  for (const [w, m] of [["72", at72], ["96", at96]]) {
    check(`${name} ${w}px rail: every edge starts at the rail's left edge`, m.tiles.every((t) => Math.abs(t.edgeLeft) <= 0.5), m.tiles.map((t) => t.edgeLeft));
    check(`${name} ${w}px rail: tiles are 48px squares, centered within 1px`, m.tiles.every((t) => t.width === 48 && t.height === 48 && Math.abs(t.leftGap - t.rightGap) <= 1), m.tiles.map((t) => [t.leftGap, t.rightGap]));
    check(`${name} ${w}px rail: list has no hidden horizontal overflow`, m.listScroll[0] === m.listScroll[1], m.listScroll);
  }
  const t = Object.fromEntries(at72.tiles.map((x) => [x.label, x]));
  check(`${name} edge heights: current 40, unread 10, idle 0`, t["Design"].edgeHeight === 40 && t["Release notes, unread"].edgeHeight === 10 && t["Weekend"].edgeHeight === 0, [t["Design"].edgeHeight, t["Release notes, unread"].edgeHeight, t["Weekend"].edgeHeight]);
  check(`${name} first badge clears the list's top`, t["Direct messages, 2 unread"].badge.top >= 0, t["Direct messages, 2 unread"].badge);
  check(`${name} pending tile is dashed`, t["Joining Hiking"].borderStyle === "dashed", t["Joining Hiking"].borderStyle);
  await page.evaluate(() => document.querySelector('nav[aria-label="Places"]').style.setProperty("--shell-rail", "4.5rem"));
  // Keyboard focus reaches a tile and draws the focus outline.
  await page.focus('nav[aria-label="Places"] a[aria-label="Operations, 3 unread"]');
  await page.keyboard.press("Tab");
  const focus = await page.evaluate(() => { const a = document.activeElement; return { tile: a.classList.contains("sd-rail-tile"), label: a.getAttribute("aria-label"), outline: getComputedStyle(a).outlineStyle, width: getComputedStyle(a).outlineWidth }; });
  // WebKit skips links on Tab by default (Safari's "Press Tab to highlight each item" is off), so it lands on the next button tile.
  const expected = name === "webkit" ? "Add a group" : "Book club, 1 mention";
  check(`${name} Tab moves focus to the next tile with a visible outline`, focus.tile && focus.label === expected && focus.outline === "solid", focus);
  if (name === "chromium") {
    for (const theme of ["ink", "paper"]) {
      await page.evaluate((t) => (document.documentElement.dataset.theme = t), theme);
      await page.waitForTimeout(300);
      const box = page.locator('nav[aria-label="Places"]');
      await box.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await box.screenshot({ path: `${out}/rail-tile-${theme}.png` });
    }
  }
  await browser.close();
}

// Compose the two theme shots side by side into one PNG.
const browser = await pw.chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1, viewport: { width: 400, height: 1200 } });
const img = (t) => `data:image/png;base64,${readFileSync(`${out}/rail-tile-${t}.png`).toString("base64")}`;
await page.setContent(`<body style="margin:0;background:#777;display:flex;gap:16px;padding:16px;font:14px system-ui;color:#fff">
${["ink", "paper"].map((t) => `<figure style="margin:0"><figcaption style="padding:0 0 8px;width:170px">${t}: showcase index.html, 72px rail at 2x</figcaption><img src="${img(t)}" style="display:block"></figure>`).join("")}</body>`);
await page.screenshot({ path: `${out}/rail-tile.png`, fullPage: true });
await browser.close();
for (const t of ["ink", "paper"]) rmSync(`${out}/rail-tile-${t}.png`);
results.wallMs = Date.now() - started;
writeFileSync(`${out}/rail-tile-evidence.json`, JSON.stringify(results, null, 2) + "\n");
const failed = results.checks.filter((c) => !c.ok).length;
console.log(`${results.checks.length - failed}/${results.checks.length} checks passed in ${results.wallMs}ms`);
process.exit(failed ? 1 : 0);
