// Screenshots of the editor gap fillers on the React editor example: the icon set, tree row actions, resizable panels,
// the hover card host, gutter markers, find and check marks and the weighted bar, then the bottom sheet at phone width.
//   node docs/pr-assets/editor-gaps.mjs [baseUrl]
import { chromium } from "playwright";

const base = (process.argv[2] || "http://localhost:5178/").replace(/\/?$/, "/");
const out = new URL("./", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

const browser = await chromium.launch();
const open = async (file, theme, width, height) => {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.addInitScript((t) => localStorage.setItem("sd-theme", t), theme);
  await page.goto(base + file, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  return page;
};
const shoot = async (page, selector, name, prepare) => {
  const target = page.locator(selector);
  await target.scrollIntoViewIfNeeded();
  if (prepare) await prepare(page);
  await page.waitForTimeout(400);
  const box = await target.boundingBox();
  await page.screenshot({ path: `${out}${name}.png`, clip: { x: box.x, y: box.y, width: box.width, height: Math.min(box.height, 760) } });
};

for (const theme of ["ink", "paper"]) {
  const page = await open("react-editor.html", theme, 1280, 900);
  await shoot(page, "#react-editor-icons", `editor-gaps-icons-1280-${theme}`);
  if (theme === "ink") {
    await shoot(page, "#react-editor-tree-actions", "editor-gaps-tree-actions-1280-ink", async (p) => {
      await p.locator("#react-editor-tree-actions .sd-tree-row").nth(2).hover();
    });
    await shoot(page, "#react-editor-resizable", "editor-gaps-resizable-1280-ink", async (p) => {
      await p.locator("#react-editor-resizable").getByRole("separator", { name: "Resize inspector" }).focus();
    });
    await shoot(page, "#react-editor-hostcard", "editor-gaps-hovercard-host-1280-ink", async (p) => {
      await p.locator('#react-editor-hostcard [data-entity="lisbon"]').hover();
      await p.waitForSelector(".sd-hovercard");
    });
    await shoot(page, "#react-editor-gutter", "editor-gaps-gutter-1280-ink");
    await shoot(page, "#react-editor-marks", "editor-gaps-find-check-marks-1280-ink");
    await shoot(page, "#react-editor-weighted", "editor-gaps-weighted-1280-ink");
  }
  await page.close();
}

const phone = await open("react.html", "ink", 375, 700);
await phone.locator("#react-dialog").getByRole("button", { name: "Bottom sheet", exact: true }).click();
await phone.waitForSelector("dialog.sd-sheet-bottom[open]");
await phone.waitForTimeout(500);
await phone.screenshot({ path: `${out}editor-gaps-bottom-sheet-375-ink.png` });
await phone.close();
await browser.close();
