// Shoots the PR image for the sidebar resize handle on showcase/shell.html:
// the handle focused from the keyboard, then mid-drag at 420px, in ink and paper.
//   node docs/pr-assets/sidebar-resize.mjs http://localhost:5178/
import { readFileSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const base = process.argv[2] || "http://localhost:5178/";
const out = fileURLToPath(new URL(".", import.meta.url));
const browser = await chromium.launch();
const shots = [];
for (const theme of ["ink", "paper"]) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  await page.addInitScript((t) => { localStorage.clear(); localStorage.setItem("sd-theme", t); }, theme);
  await page.goto(`${base}shell.html`);
  const handle = page.locator('#section-sidebar > [data-sd-shell="resize"]');
  await page.waitForTimeout(500);
  await page.keyboard.press("Shift");
  await handle.focus();
  await page.waitForTimeout(300);
  const focused = `${out}/resize-${theme}-focus.png`;
  await page.screenshot({ path: focused, clip: { x: 0, y: 0, width: 760, height: 420 } });
  const box = await handle.boundingBox();
  await page.mouse.move(box.x + box.width / 2, 300);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 132, 300, { steps: 6 });
  await page.waitForTimeout(300);
  const dragging = `${out}/resize-${theme}-drag.png`;
  await page.screenshot({ path: dragging, clip: { x: 0, y: 0, width: 760, height: 420 } });
  const now = await handle.getAttribute("aria-valuenow");
  await page.mouse.up();
  shots.push([`${theme}: handle focused, aria-valuenow 288`, focused], [`${theme}: mid-drag, aria-valuenow ${now}`, dragging]);
  await page.close();
}
const page = await browser.newPage({ viewport: { width: 1580, height: 1000 } });
const img = (f) => `data:image/png;base64,${readFileSync(f).toString("base64")}`;
await page.setContent(`<body style="margin:0;padding:16px;background:#777;color:#fff;font:14px system-ui;display:grid;grid-template-columns:repeat(2,max-content);gap:16px">
${shots.map(([cap, f]) => `<figure style="margin:0"><figcaption style="padding:0 0 8px">${cap}</figcaption><img src="${img(f)}" style="display:block"></figure>`).join("")}</body>`);
await page.screenshot({ path: `${out}/sidebar-resize.png`, fullPage: true });
await browser.close();
for (const [, f] of shots) rmSync(f);
console.log("wrote docs/pr-assets/sidebar-resize.png");
