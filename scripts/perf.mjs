/**
 * Performance pass over the showcase pages, in a real (headed) Chromium with
 * the GPU on and the CPU slowed down to stand in for a modest laptop.
 *
 *   node scripts/perf.mjs [baseUrl] [--throttle 4] [--pages index,lib-color,chat]
 *
 * Per page it reports:
 *   load     main-thread time until the page settles, and the longest task
 *   idle     main-thread time over 3s of doing nothing (should be near 0)
 *   scroll   frames per second and p95 frame time while wheel-scrolling
 *   theme    time from a theme switch to the next painted frame
 *   heap     JS heap after load
 */
import { chromium } from "playwright";
import { ALL, keyOf } from "../showcase/pages.js";

const args = process.argv.slice(2);
const base = (args.find((a) => a.startsWith("http")) || "http://localhost:5178/").replace(/\/?$/, "/");
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const throttle = Number(opt("throttle", "4"));
const PAGES = Object.fromEntries(ALL.map((p) => [keyOf(p), p.file]));
const only = opt("pages", Object.keys(PAGES).join(",")).split(",");

const browser = await chromium.launch({ headless: false, args: ["--enable-gpu", "--ignore-gpu-blocklist"] });

/** Main-thread time spent while `run` happens, from Chrome's counters. */
async function mainThread(cdp, run) {
  const read = async () => Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map((m) => [m.name, m.value]));
  const a = await read();
  await run();
  const b = await read();
  const d = (k) => (b[k] - a[k]) * 1000;
  return { total: d("TaskDuration"), script: d("ScriptDuration"), layout: d("LayoutDuration"), style: d("RecalcStyleDuration") };
}

const rows = [];
for (const key of only) {
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: throttle });
  await cdp.send("Performance.enable");

  const load = await mainThread(cdp, async () => {
    await page.goto(base + PAGES[key], { waitUntil: "load" });
    await page.waitForTimeout(2500);
  });

  const idle = await mainThread(cdp, () => page.waitForTimeout(3000));

  // Scroll the page's real scroller: the shell content box, else the page.
  const box = await page.evaluate(() => {
    const el = [...document.querySelectorAll(".sd-shell-content, main, body")].find((e) => e.scrollHeight > e.clientHeight + 200) || document.body;
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: Math.min(r.top + 300, innerHeight - 100) };
  });
  await page.mouse.move(box.x, box.y);
  await page.evaluate(() => {
    window.__gaps = [];
    let last = performance.now();
    const tick = (t) => {
      window.__gaps.push(t - last);
      last = t;
      if (!window.__stop) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  for (let i = 0; i < 90; i++) {
    await page.mouse.wheel(0, i < 60 ? 140 : -140);
    await page.waitForTimeout(16);
  }
  const scroll = await page.evaluate(() => {
    window.__stop = true;
    const g = window.__gaps.slice(3).sort((a, b) => a - b);
    const sum = g.reduce((a, b) => a + b, 0);
    return { fps: (g.length / sum) * 1000, p95: g[Math.floor(g.length * 0.95)], max: g.at(-1) };
  });

  const themeWorkM = await mainThread(cdp, async () => {
    await page.evaluate(async () => {
      document.documentElement.dataset.theme = "graphite";
      document.dispatchEvent(new CustomEvent("sd:theme", { detail: { theme: "graphite" } }));
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    });
    await page.waitForTimeout(300);
  });
  const theme = await page.evaluate(async () => {
    const t0 = performance.now();
    document.documentElement.dataset.theme = "paper";
    document.dispatchEvent(new CustomEvent("sd:theme", { detail: { theme: "paper" } }));
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const ms = performance.now() - t0;
    document.documentElement.dataset.theme = "ink";
    document.dispatchEvent(new CustomEvent("sd:theme", { detail: { theme: "ink" } }));
    return ms;
  });

  const { usedSize } = await cdp.send("Runtime.getHeapUsage");
  rows.push({ page: key, load, idle, scroll, theme, themeWork: themeWorkM.total, heap: usedSize / 1e6 });
  await ctx.close();
}
await browser.close();

const f = (n, d = 0) => n.toFixed(d).padStart(6);
console.log(`CPU slowed ${throttle}x. Times in ms of main-thread work.\n`);
console.log("page        load  script  layout  style  idle/3s  scroll-fps  p95   max   theme  themeWork  heap MB");
for (const r of rows) {
  console.log(
    `${r.page.padEnd(9)} ${f(r.load.total)} ${f(r.load.script)} ${f(r.load.layout)} ${f(r.load.style)}  ${f(r.idle.total)}   ${f(r.scroll.fps)}   ${f(r.scroll.p95, 1)} ${f(r.scroll.max)}  ${f(r.theme)}  ${f(r.themeWork)}     ${f(r.heap, 1)}`,
  );
}
