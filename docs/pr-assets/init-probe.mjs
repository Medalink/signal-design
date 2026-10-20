// Lists every attribute init() writes, and every node it adds, on markup that
// carries no data-sd-* attribute, at 1440px and at a tablet width of 900px.
// The README "Framework-owned state" list comes from this output.
//   node docs/pr-assets/init-probe.mjs http://localhost:5178/
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
const base = (process.argv[2] || "http://localhost:5178/").replace(/\/?$/, "/");
const api = `/@fs/${fileURLToPath(new URL("../../src/js/index.js", import.meta.url)).replaceAll(String.fromCharCode(92), "/")}`;
const html = `<!doctype html><html lang="en" data-theme="ink"><head><link rel="stylesheet" href="/app.css"></head><body>
<div class="sd-shell" id="shell" data-aside="open">
  <nav class="sd-rail"><div class="sd-rail-list"><a class="sd-rail-item" id="rail-a" href="#" aria-current="true"><span>A</span></a><a class="sd-rail-item" id="rail-b" href="#"><span>B</span></a></div></nav>
  <aside class="sd-sidebar"><div class="sd-sidebar-head"><button id="collapse" aria-expanded="true" aria-label="Hide">x</button></div><nav class="sd-sidebar-body"><a class="sd-sidebar-link" id="link" href="#" aria-current="page">Link</a></nav></aside>
  <main class="sd-shell-main"><div class="sd-shell-content">
    <div role="tablist" id="tablist"><button role="tab" id="tab1" aria-selected="false" aria-controls="p1">One</button><button role="tab" id="tab2" aria-selected="true" aria-controls="p2">Two</button></div>
    <div role="tabpanel" id="p1" hidden>1</div><div role="tabpanel" id="p2">2</div>
    <div class="sd-seg" id="seg"><button id="seg1" aria-pressed="true">a</button><button id="seg2" aria-pressed="false">b</button></div>
    <button id="toggle" aria-expanded="false" aria-controls="exp">More</button><div class="sd-expand" id="exp"><div>x</div></div>
    <div class="sd-reactions"><button id="react" aria-pressed="false">+1 <b>1</b></button></div>
    <div class="sd-poll"><button class="sd-poll-option" id="poll" aria-pressed="false">x</button></div>
    <button id="pop-btn" popovertarget="pop">Menu</button><div popover id="pop" class="sd-popover"><div class="sd-menu" role="menu"><button role="menuitem" id="mi">Item</button></div></div>
    <div class="sd-table-wrap" id="tw"><table class="sd-table"><tr><td>x</td></tr></table></div>
    <div class="sd-code"><pre id="pre"><code>x</code></pre></div>
    <div class="sd-empty" id="empty">Nothing</div>
    <textarea id="ta" rows="1"></textarea>
  </div></main>
  <aside class="sd-shell-aside" id="aside">aside</aside>
  <footer class="sd-statusbar sd-shell-status" id="status">s</footer>
</div>
<script type="module">
window.__log = [];
const name = (n) => n.id ? "#" + n.id : (n.className && typeof n.className === "string" ? "." + n.className.split(" ")[0] : n.tagName.toLowerCase());
new MutationObserver((ms) => { for (const m of ms) if (m.type === "attributes") window.__log.push({ step: window.__step, el: name(m.target), attr: m.attributeName, from: m.oldValue, to: m.target.getAttribute(m.attributeName) }); else if (m.addedNodes.length) window.__log.push({ step: window.__step, el: name(m.target), added: [...m.addedNodes].map((n) => n.nodeName).join(",") }); })
  .observe(document.documentElement, { subtree: true, attributes: true, attributeOldValue: true, childList: true });
window.__step = "init()";
const { init } = await import("${api}");
init();
window.__ready = true;
</script></body></html>`;
const browser = await chromium.launch();
const out = {};
for (const width of [1440, 900]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.route(`${base}probe.html`, (r) => r.fulfill({ contentType: "text/html", body: html }));
  await page.goto(`${base}probe.html`);
  await page.waitForFunction(() => window.__ready);
  await page.waitForTimeout(400);
  const step = async (label, fn) => { await page.evaluate((l) => (window.__step = l), label); await fn(); await page.waitForTimeout(250); };
  await step("click tab1", () => page.$eval("#tab1", (e) => (e.focus(), e.click())));
  await step("ArrowRight on tablist", () => page.keyboard.press("ArrowRight"));
  await step("click seg2", () => page.$eval("#seg2", (e) => (e.focus(), e.click())));
  await step("click toggle", () => page.$eval("#toggle", (e) => (e.focus(), e.click())));
  await step("click reaction", () => page.$eval("#react", (e) => (e.focus(), e.click())));
  await step("click poll", () => page.$eval("#poll", (e) => (e.focus(), e.click())));
  await step("click collapse", () => page.$eval("#collapse", (e) => (e.focus(), e.click())));
  await step("open popover + click item", async () => { await page.$eval("#pop-btn", (e) => (e.focus(), e.click())); await page.$eval("#mi", (e) => (e.focus(), e.click())); });
  await step("Escape on body", () => page.keyboard.press("Escape"));
  await step("scroll table", () => page.evaluate(() => document.getElementById("tw").dispatchEvent(new Event("scroll"))));
  out[width] = await page.evaluate(() => window.__log.filter((e) => !/^(style)$/.test(e.attr ?? "")));
  out[`${width}-style`] = await page.evaluate(() => window.__log.filter((e) => e.attr === "style").map((e) => `${e.step} ${e.el}`));
  await page.close();
}
await browser.close();
writeFileSync(fileURLToPath(new URL("./init-probe.json", import.meta.url)), `${JSON.stringify(out, null, 1)}\n`);
for (const [k, v] of Object.entries(out)) console.log(`${k}: ${v.length} entries`);
