// Shoots the Art ornaments block of the Effects page, headless, in ink and paper.
//   node docs/pr-assets/ornament-art.mjs http://localhost:5178/
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const base = (process.argv[2] || "http://localhost:5178/").replace(/\/?$/, "/");
const out = fileURLToPath(new URL(".", import.meta.url));
const shots = [
  { theme: "ink", width: 1280 },
  { theme: "paper", width: 1280 },
  { theme: "ink", width: 375 },
];

const browser = await chromium.launch();
for (const { theme, width } of shots) {
  const page = await browser.newPage({ viewport: { width, height: 2800 }, deviceScaleFactor: 2 });
  await page.addInitScript((t) => localStorage.setItem("sd-theme", t), theme);
  await page.goto(`${base}lib-effects.html`);
  await page.waitForLoadState("networkidle");
  const block = page.locator(".demo-block", { has: page.locator("#art-contours") });
  await block.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => ["contours", "lattice", "waveform", "dashed", "book", "stack"].every((id) => document.getElementById(`art-${id}`).style.backgroundImage.startsWith("url(")), null, { timeout: 5000 });
  const theming = await page.evaluate(() => document.documentElement.dataset.theme);
  if (theming !== theme) throw new Error(`wanted ${theme}, the page is ${theming}`);
  // The viewport is taller than the block, so the shell's fixed bars stay clear of it.
  await block.evaluate((el) => el.scrollIntoView({ block: "center" }));
  await page.waitForTimeout(300);
  const file = `${out}ornament-art-${width}-${theme}.png`;
  await page.screenshot({ path: file, clip: await block.boundingBox() });
  console.log("wrote", file);
  await page.close();
}
await browser.close();
