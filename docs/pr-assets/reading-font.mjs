// Screenshots of the reading face: the manuscript page in Literata and, for comparison, in Source Code Pro, and the reading card on the tokens page.
//   node docs/pr-assets/reading-font.mjs [baseUrl]
import { chromium } from "playwright";

const base = (process.argv[2] || "http://localhost:5178/").replace(/\/?$/, "/");
const out = new URL("./", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

const browser = await chromium.launch();
const shoot = async (file, theme, selector, name, prepare) => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.addInitScript((t) => localStorage.setItem("sd-theme", t), theme);
  await page.goto(base + file, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  if (prepare) await page.evaluate(prepare);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  await page.locator(selector).screenshot({ path: `${out}${name}.png` });
  await page.close();
};

const manuscript = "#react-editor-chrome";
await shoot("react-editor.html", "ink", manuscript, "reading-font-manuscript-1280-ink");
await shoot("react-editor.html", "paper", manuscript, "reading-font-manuscript-1280-paper");
await shoot("react-editor.html", "ink", manuscript, "reading-font-manuscript-mono-1280-ink", () => {
  document.querySelector("#react-editor-chrome .sd-manuscript-page").dataset.face = "mono";
});
await shoot("lib-tokens.html", "ink", "#tokens-reading", "reading-font-tokens-1280-ink");
await browser.close();
