// Compares every avatar and corner count on the showcase pages between this
// branch and a base checkout, in Chromium, in every theme. Each cut-out
// (presence square border, offline fill, corner-count outline, stack gap)
// must match the background it sits on, and existing sizes must not move.
//   node docs/pr-assets/avatar-ring.mjs http://localhost:5178/ http://localhost:5179/
// The first URL serves this branch, the second the base commit.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const [branch = "http://localhost:5178/", base] = process.argv.slice(2);
const out = fileURLToPath(new URL(".", import.meta.url));
const pages = ["index.html", "shell.html", "chat.html", "form.html", "landing.html", "charts.html"];
const themes = ["ink", "graphite", "paper"];
const started = Date.now();

function collect() {
  const painted = (el) => {
    for (let n = el.parentElement; n; n = n.parentElement) {
      const c = getComputedStyle(n).backgroundColor;
      if (c !== "rgba(0, 0, 0, 0)" && c !== "transparent") return c;
    }
    return getComputedStyle(document.documentElement).backgroundColor;
  };
  const visible = (el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden";
  const rows = [];
  const seen = new Map();
  const all = [...document.querySelectorAll(".sd-avatar, .sd-badge-count[data-corner]")];
  all.forEach((el) => {
    // Key by demo block and position in it, so a block added on the branch does not shift the rest.
    const block = el.closest(".demo-block")?.querySelector("h3")?.textContent.trim() ?? "page";
    const n = (seen.get(block) ?? 0) + 1;
    seen.set(block, n);
    const i = `${block} #${n}`;
    if (!visible(el)) return;
    const cs = getComputedStyle(el);
    const after = getComputedStyle(el, "::after");
    const row = { i, kind: el.classList.contains("sd-avatar") ? "avatar" : "count", text: el.textContent.trim().slice(0, 4), width: cs.width, height: cs.height, fontSize: cs.fontSize, under: painted(el) };
    if (el.matches(".sd-avatar[data-status]")) {
      row.status = el.dataset.status;
      row.dot = after.width;
      row.cut = after.borderTopColor;
      if (el.dataset.status === "offline") row.fill = after.backgroundColor;
    }
    if (el.matches(".sd-badge-count[data-corner]")) row.cut = cs.outlineColor;
    if (el.matches(".sd-avatar-stack > .sd-avatar")) { row.cut = cs.outlineColor; row.under = painted(el.parentElement); }
    rows.push(row);
  });
  return rows;
}

async function sweep(url) {
  const browser = await chromium.launch();
  const result = {};
  for (const theme of themes) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.addInitScript((t) => localStorage.setItem("sd-theme", t), theme);
    for (const p of pages) {
      await page.goto(url + p);
      // Measure settled colors, not a background mid-transition.
      await page.addStyleTag({ content: "*, *::before, *::after { transition: none !important; }" });
      await page.waitForTimeout(400);
      result[`${theme} ${p}`] = await page.evaluate(collect);
    }
    await page.close();
  }
  await browser.close();
  return result;
}

async function hovered(url) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(url);
  await page.addStyleTag({ content: "*, *::before, *::after { transition: none !important; }" });
  const row = page.locator("a.sd-item[data-unread]", { has: page.locator('.sd-avatar[data-status="away"]') }).first();
  await row.hover();
  const r = await row.evaluate((el) => ({ row: getComputedStyle(el).backgroundColor, cut: getComputedStyle(el.querySelector(".sd-avatar"), "::after").borderTopColor }));
  await browser.close();
  return r;
}

const now = await sweep(branch);
const then = base ? await sweep(base) : null;
const checks = [];
const check = (name, ok, detail) => { checks.push({ name, ok, detail }); console.log(`${ok ? "ok  " : "FAIL"} ${name}${ok ? "" : " " + JSON.stringify(detail)}`); };

let cuts = 0;
const mismatched = [];
for (const [where, rows] of Object.entries(now)) {
  for (const r of rows.filter((r) => r.cut)) {
    cuts++;
    if (r.cut !== r.under || (r.fill && r.fill !== r.under)) mismatched.push({ where, ...r });
  }
}
check(`branch: ${cuts} cut-outs match the background under them`, mismatched.length === 0, mismatched);
const hover = await hovered(branch);
check("branch: a hovered row's presence ring turns raised with the row", hover.row === hover.cut, hover);

if (then) {
  let before = 0;
  const wrongBefore = [];
  for (const [where, rows] of Object.entries(then)) for (const r of rows.filter((r) => r.cut)) { before++; if (r.cut !== r.under) wrongBefore.push(`${where} #${r.i} ${r.kind} ${r.text}`); }
  check(`base: ${before - wrongBefore.length} of ${before} cut-outs matched (recorded, not a gate)`, true, wrongBefore);
  const moved = [];
  for (const [where, rows] of Object.entries(then)) {
    const next = new Map(now[where].map((r) => [r.i, r]));
    for (const r of rows) {
      const n = next.get(r.i);
      if (!n) { moved.push({ where, i: r.i, missing: true }); continue; }
      for (const k of ["width", "height", "fontSize", "dot"]) if (r[k] !== n[k]) moved.push({ where, i: r.i, k, from: r[k], to: n[k] });
    }
  }
  check("avatar and count sizes, initials and presence squares are unchanged from base", moved.length === 0, moved);
  writeFileSync(`${out}/avatar-ring-evidence.json`, JSON.stringify({ branch, base, wallMs: Date.now() - started, checks, wrongBefore }, null, 2) + "\n");
}
// The PR image: the new block in ink and paper, then the current row from
// "Items, presence, counts" on base and on this branch, at 4x.
if (then) {
  const browser = await chromium.launch();
  const shots = {};
  for (const theme of ["ink", "paper"]) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
    await page.addInitScript((t) => localStorage.setItem("sd-theme", t), theme);
    await page.goto(branch);
    await page.addStyleTag({ content: "*, *::before, *::after { transition: none !important; }" });
    const block = page.locator(".demo-block", { has: page.locator("h3", { hasText: "Avatar sizes and presence" }) });
    await block.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    shots[theme] = (await block.screenshot()).toString("base64");
    await page.close();
  }
  for (const [label, url] of [["base", base], ["branch", branch]]) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 4 });
    await page.addInitScript(() => localStorage.setItem("sd-theme", "ink"));
    await page.goto(url);
    await page.addStyleTag({ content: "*, *::before, *::after { transition: none !important; }" });
    const row = page.locator('.demo-block a.sd-item[aria-current]', { has: page.locator('.sd-avatar[data-status="online"]') }).first();
    await row.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    shots[label] = (await row.screenshot()).toString("base64");
    await page.close();
  }
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  const crop = (src, cap) => `<figure style="margin:0"><figcaption style="padding:0 0 8px;width:300px">${cap}</figcaption><div style="width:300px;overflow:hidden"><img src="data:image/png;base64,${src}" style="display:block;max-width:none"></div></figure>`;
  const fig = (src, cap, w) => `<figure style="margin:0"><figcaption style="padding:0 0 8px">${cap}</figcaption><img src="data:image/png;base64,${src}" style="display:block;${w ? `width:${w}px` : ""}"></figure>`;
  await page.setContent(`<body style="margin:0;padding:16px;background:#777;color:#fff;font:14px system-ui;display:grid;gap:16px;width:max-content">
    ${fig(shots.ink, "ink: Avatar sizes and presence (showcase index.html, 2x)", 1100)}
    ${fig(shots.paper, "paper: the same block", 1100)}
    <div style="display:flex;gap:24px">${crop(shots.base, "main: current row, ink, 4x. The ring is surface on a raised row")}${crop(shots.branch, "this branch: the ring is the row's raised grey")}</div></body>`);
  await page.screenshot({ path: `${out}/avatar-ring.png`, fullPage: true });
  await browser.close();
}
console.log(`${checks.filter((c) => c.ok).length}/${checks.length} checks passed in ${Date.now() - started}ms`);
process.exit(checks.every((c) => c.ok) ? 0 : 1);
