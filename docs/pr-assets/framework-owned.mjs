// Drives the "Framework-owned state" block on the components page in Chromium
// and WebKit, checks that only the page's code writes its attributes, and
// shoots the PR image in ink and paper.
//   node docs/pr-assets/framework-owned.mjs http://localhost:5178/
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium, webkit } from "playwright";

const base = process.argv[2] || "http://localhost:5178/";
const out = fileURLToPath(new URL(".", import.meta.url));
const started = Date.now();
const checks = [];
const check = (name, ok, detail) => { checks.push({ name, ok, detail }); console.log(`${ok ? "ok  " : "FAIL"} ${name}${ok ? "" : " " + JSON.stringify(detail)}`); };
const read = (page) => page.evaluate(() => ({
  view: [...document.querySelectorAll("#owned-view > button")].map((b) => `${b.dataset.value}=${b.getAttribute("aria-pressed")}`).join(" "),
  expanded: document.getElementById("owned-toggle").getAttribute("aria-expanded"),
  open: document.getElementById("owned-details").hasAttribute("data-open"),
  panelHeight: Math.round(document.getElementById("owned-details").getBoundingClientRect().height),
  liked: document.getElementById("owned-reaction").getAttribute("aria-pressed"),
  count: document.querySelector("#owned-reaction b").textContent,
  sdAttributes: [...document.querySelectorAll("#js-framework-owned .demo-head ~ :not(.demo-code) *")].flatMap((el) => [...el.attributes].map((a) => a.name)).filter((n) => n.startsWith("data-sd-")),
}));

const shots = [];
for (const [name, engine] of Object.entries({ chromium, webkit })) {
  const browser = await engine.launch();
  for (const theme of name === "chromium" ? ["ink", "paper"] : ["ink"]) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
    await page.addInitScript((t) => localStorage.setItem("sd-theme", t), theme);
    await page.goto(base);
    await page.addStyleTag({ content: "*, *::before, *::after { transition: none !important; }" });
    const block = page.locator("#js-framework-owned");
    await block.scrollIntoViewIfNeeded();
    const before = await read(page);
    check(`${name} ${theme}: starts as the page rendered it`, before.view === "list=true board=false" && before.expanded === "false" && !before.open && before.liked === "false" && before.count === "2", before);
    check(`${name} ${theme}: the block's markup carries no data-sd-* attribute`, before.sdAttributes.length === 0, before.sdAttributes);
    await page.click('#owned-view > [data-value="board"]');
    await page.click("#owned-toggle");
    await page.click("#owned-reaction");
    await page.waitForTimeout(200);
    const after = await read(page);
    check(`${name} ${theme}: one click each flips the page-owned state once`, after.view === "list=false board=true" && after.expanded === "true" && after.open && after.panelHeight > 0 && after.liked === "true" && after.count === "3", after);
    if (name === "chromium") {
      const file = `${out}/owned-${theme}.png`;
      await block.screenshot({ path: file });
      shots.push([theme, file]);
    }
    await page.close();
  }
  await browser.close();
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
await page.setContent(`<body style="margin:0;padding:16px;background:#777;color:#fff;font:14px system-ui;display:grid;gap:16px;width:max-content">
${shots.map(([t, f]) => `<figure style="margin:0"><figcaption style="padding:0 0 8px">${t}: Framework-owned state after clicking board, Details and the reaction (showcase index.html, 2x)</figcaption><img src="data:image/png;base64,${readFileSync(f).toString("base64")}" style="display:block;width:1100px"></figure>`).join("")}</body>`);
await page.screenshot({ path: `${out}/framework-owned.png`, fullPage: true });
await browser.close();
for (const [, f] of shots) rmSync(f);
writeFileSync(`${out}/framework-owned-evidence.json`, JSON.stringify({ base, wallMs: Date.now() - started, checks }, null, 2) + "\n");
console.log(`${checks.filter((c) => c.ok).length}/${checks.length} checks passed in ${Date.now() - started}ms`);
process.exit(checks.every((c) => c.ok) ? 0 : 1);
