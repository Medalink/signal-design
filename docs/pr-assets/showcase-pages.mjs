// Screenshots of a library page and an example (mock) page at 1280 and 375 in ink and paper.
//   node docs/pr-assets/showcase-pages.mjs [baseUrl]
import { chromium } from "playwright";

const base = (process.argv[2] || "http://localhost:5178/").replace(/\/?$/, "/");
const out = new URL("./", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const pages = { library: "lib-tokens.html", mock: "shell.html" };

const browser = await chromium.launch();
for (const [kind, file] of Object.entries(pages)) {
  for (const width of [1280, 375]) {
    for (const theme of ["ink", "paper"]) {
      const page = await browser.newPage({ viewport: { width, height: width === 1280 ? 800 : 780 } });
      await page.addInitScript((t) => localStorage.setItem("sd-theme", t), theme);
      await page.goto(base + file, { waitUntil: "networkidle" });
      await page.waitForTimeout(400);
      await page.screenshot({ path: `${out}showcase-${kind}-${width}-${theme}.png` });
      await page.close();
    }
  }
}
await browser.close();
