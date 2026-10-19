import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import ts from "typescript";
import { chromium, webkit } from "playwright";

const rootPath = fileURLToPath(new URL("../", import.meta.url));
const served = (base, path) => `${base.replace(/\/?$/, "/")}@fs/${fileURLToPath(new URL(path, import.meta.url)).replace(/\\/g, "/")}`;
const settle = (page) => page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));

export function checkLivingTableTypes() {
  const directory = mkdtempSync(join(rootPath, ".living-types-"));
  const fixture = join(directory, "consumer.mts");
  writeFileSync(fixture, `import { mountLivingTable, type LivingTableMount, type LivingTableState } from "signal-design/js";
const root = document.createElement("div");
const table: LivingTableMount = mountLivingTable(root);
table.toggle("review"); table.toggle("review", false);
table.resize({ width: 480 }); table.resize({ width: null });
table.refresh(); table.dispose();
// @ts-expect-error Width must be a number or null.
table.resize({ width: "480" });
// @ts-expect-error There is no height resize API.
table.resize({ width: 480, height: 100 });
root.addEventListener("sd:living-table", (event) => {
  const state: LivingTableState = event.detail;
  const width: number = state.width;
  const ids: string[] = state.collapsed;
  console.log(width, ids);
  // @ts-expect-error State has no row renderer.
  console.log(event.detail.rows);
});
document.addEventListener("sd:living-table", (event) => {
  const state: LivingTableState = event.detail;
  console.log(state.width);
});
`);
  try {
    const program = ts.createProgram([fixture], {
      strict: true, noEmit: true, target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext,
      lib: ["lib.es2022.d.ts", "lib.dom.d.ts"],
    });
    const diagnostics = ts.getPreEmitDiagnostics(program);
    assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCanonicalFileName: (file) => file, getCurrentDirectory: () => directory, getNewLine: () => "\n",
    }));
    return 1;
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

export async function checkLivingTable(page, base, engine) {
  const errors = [];
  const browserErrors = [];
  const onError = (error) => browserErrors.push(error.message);
  page.on("pageerror", onError);
  let passed = 0;
  const run = async (name, check) => {
    try { await check(); passed++; }
    catch (error) { errors.push(`${engine} ${name}: ${error.message}`); }
  };
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(base);
  await page.waitForSelector("#living-table-demo[data-mounted]");
  await page.evaluate(() => {
    window.livingWindowErrors = [];
    window.livingWindowErrorHandler = (event) => livingWindowErrors.push(event.message);
    addEventListener("error", livingWindowErrorHandler);
  });
  await run("copyable initial HTML and JS", async () => {
    const snippet = await page.locator("#components-living-tables .demo-code pre").allTextContents();
    assert.equal(snippet.length, 2);
    assert.match(snippet[0], /data-sd-living-resize="" hidden=""/);
    assert.match(snippet[0], /disabled="" aria-expanded="true"/);
    assert.doesNotMatch(snippet[0], /data-mounted|--sd-living-/);
    assert.match(snippet[1], /import \{ mountLivingTable \} from "signal-design\/js"/);
    assert.match(snippet[1], /mountLivingTable\(root\)/);
  });
  await run("pasted example width controls", async () => {
    const snippet = await page.locator("#components-living-tables .demo-code pre").allTextContents();
    const frameElement = await page.evaluateHandle(({ html, js, api, css }) => {
      const frame = document.createElement("iframe");
      frame.style.cssText = "position:fixed;inset:0;width:1000px;height:900px;z-index:99999";
      frame.srcdoc = `<!doctype html><html lang="en"><head><link rel="stylesheet" href="${css}"></head><body>${html}<script type="module">${js.replace('"signal-design/js"', JSON.stringify(api))}\nwindow.copiedLivingTable = table;<\/script></body></html>`;
      document.body.append(frame);
      return frame;
    }, { html: snippet[0], js: snippet[1], api: served(base, "../src/js/index.js"), css: served(base, "../dist/signal.css") });
    const frame = await frameElement.asElement().contentFrame();
    try {
      await frame.waitForSelector("#living-table-demo[data-mounted]");
      for (const [label, width] of [["Compact", 360], ["Comfortable", 640]]) {
        await frame.getByRole("button", { name: label, exact: true }).click();
        assert.equal(await frame.locator("#living-table-demo").evaluate((root) => root.getBoundingClientRect().width), width);
      }
      await frame.getByRole("button", { name: "Fill space", exact: true }).click();
      assert.equal(await frame.locator("#living-table-demo").evaluate((root) => root.getBoundingClientRect().width > 640), true);
    } finally {
      await frame.evaluate(() => window.copiedLivingTable?.dispose());
      await frameElement.evaluate((element) => element.remove());
      await frameElement.dispose();
    }
  });
  await page.evaluate(async (url) => {
    const api = await import(url);
    const source = document.querySelector("#components-living-tables .demo-code pre").textContent;
    const template = document.createElement("template");
    template.innerHTML = source;
    const root = template.content.querySelector("[data-sd-living-table]");
    root.id = "living-check";
    root.querySelector(".sd-table-wrap").id = "living-check-content";
    root.querySelector("[data-sd-living-resize]").setAttribute("aria-controls", "living-check-content");
    const host = document.createElement("div");
    host.style.cssText = "position:fixed;inset:0 auto auto 0;width:1000px;max-width:100vw;max-height:100vh;overflow:clip;z-index:9999;background:var(--sd-canvas)";
    host.append(root);
    document.body.append(host);
    root.style.setProperty("width", "91%", "important");
    root.querySelector("tbody tr:nth-child(2) td:nth-child(4)").dataset.label = "Assigned to";
    const snapshot = (node) => node.nodeType === Node.ELEMENT_NODE ? {
      tag: node.tagName,
      attributes: [...node.attributes].filter((a) => a.name !== "style" || node.style.length).map((a) => [a.name, a.value]).sort(([a], [b]) => a.localeCompare(b)),
      children: [...node.childNodes].map(snapshot),
    } : node.textContent;
    window.livingCheck = { api, root, host, original: root.outerHTML, snapshot, before: JSON.stringify(snapshot(root)), events: [] };
    root.addEventListener("sd:living-table", (event) => window.livingCheck.events.push(event.detail));
  }, served(base, "../src/js/index.js"));

  const evaluate = (fn, argument) => page.evaluate(fn, argument);
  const resize = async (width) => {
    await evaluate((width) => livingCheck.mount.resize({ width }), width);
    await settle(page);
  };
  const grip = page.locator("#living-check > [data-sd-living-resize]");
  await run("static fallback", async () => {
    assert.deepEqual(await evaluate(() => {
      const r = livingCheck.root;
      return [getComputedStyle(r.querySelector("table")).display, r.querySelector("[data-sd-living-resize]").hidden,
        [...r.querySelectorAll(".sd-living-table-group button")].every((b) => b.disabled), [...r.querySelectorAll("tbody tr")].every((row) => !row.hidden)];
    }), ["table", true, true, true]);
  });
  await evaluate(() => {
    const c = livingCheck;
    c.nodes = [...c.root.querySelectorAll("tbody tr:not(.sd-living-table-group) > *")];
    c.text = c.nodes.map((cell) => cell.textContent);
    c.mount = c.api.mountLivingTable(c.root);
  });
  await settle(page);
  await run("mount emits no committed change", async () => {
    assert.equal(await evaluate(() => livingCheck.events.length), 0);
  });
  await run("duplicate mount rejection", async () => {
    assert.equal(await evaluate(() => { try { livingCheck.api.mountLivingTable(livingCheck.root); return false; } catch { return true; } }), true);
  });
  for (const width of [960, 640, 360]) await run(`${width}px geometry and same cells`, async () => {
    await evaluate(() => livingCheck.nodes[0].querySelector("a").focus());
    await resize(width);
    const result = await evaluate((width) => {
      const c = livingCheck;
      const row = c.nodes.slice(0, 5).map((cell) => cell.getBoundingClientRect());
      const bounds = c.root.getBoundingClientRect();
      return {
        same: c.nodes.every((cell, i) => cell === c.root.querySelectorAll("tbody tr:not(.sd-living-table-group) > *")[i] && cell.textContent === c.text[i]),
        focus: document.activeElement === c.nodes[0].querySelector("a"),
        inside: row.every((cell) => cell.left >= bounds.left && cell.right <= bounds.right && cell.width > 20),
        folded: width > 768 ? row.every((cell) => Math.abs(cell.top - row[0].top) < 1) :
          width > 512 ? row[3].top >= row[0].bottom && row[4].top >= row[0].bottom : row.slice(1).every((cell) => cell.top >= row[0].bottom),
        label: getComputedStyle(c.nodes[3], "::before").content,
        headers: c.root.querySelectorAll('thead th[role="columnheader"]').length,
      };
    }, width);
    assert.equal(result.same && result.focus && result.inside && result.folded, true, JSON.stringify(result));
    assert.equal(result.headers, 5);
    if (width <= 768) assert.match(result.label, /Assigned to/);
  });
  await run("800px headers fit beside the grip and long headings wrap", async () => {
    await resize(800);
    const inspect = () => {
      const { root } = livingCheck;
      const grip = root.querySelector("[data-sd-living-resize]").getBoundingClientRect();
      const headers = [...root.querySelectorAll("thead th")].map((cell) => {
        const range = document.createRange();
        range.selectNodeContents(cell);
        const box = cell.getBoundingClientRect();
        const rects = [...range.getClientRects()];
        const style = getComputedStyle(cell);
        const contentWidth = box.width - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
        // Widest word at its unbroken width, via canvas metrics with the cell's
        // own font, so a wrap is judged against the font actually rendering:
        // a header may span lines only when its longest word cannot fit.
        const canvas = document.createElement("canvas").getContext("2d");
        const spacing = style.letterSpacing === "normal" ? 0 : parseFloat(style.letterSpacing);
        let widest = 0;
        for (const node of cell.childNodes) {
          if (node.nodeType !== Node.TEXT_NODE) continue;
          for (const match of node.textContent.matchAll(/\S+/g)) {
            let word = match[0];
            if (style.textTransform === "uppercase") word = word.toUpperCase();
            else if (style.textTransform === "capitalize") word = word[0].toUpperCase() + word.slice(1);
            canvas.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
            widest = Math.max(widest, canvas.measureText(word).width + spacing * word.length);
          }
        }
        return {
          lines: new Set(rects.map((rect) => rect.top)).size,
          forced: widest > contentWidth + 1,
          inside: rects.every((rect) => rect.left >= box.left && rect.right <= box.right),
          outsideGrip: box.right <= grip.left + 1,
        };
      });
      return { headers, overflow: root.scrollWidth > root.clientWidth };
    };
    const normal = await evaluate(inspect);
    assert.equal(normal.headers.every((header) => (header.lines === 1 || header.forced) && header.inside && header.outsideGrip) && !normal.overflow, true, JSON.stringify(normal));
    const original = await evaluate(() => {
      const header = livingCheck.root.querySelectorAll("thead th")[2];
      const text = header.textContent;
      header.textContent = "ArbitraryUnbrokenReferenceHeading".repeat(4);
      return text;
    });
    try {
      const long = await evaluate(inspect);
      assert.equal(long.headers[2].lines > 1 && long.headers.every((header) => header.inside && header.outsideGrip) && !long.overflow, true, JSON.stringify(long));
    } finally {
      await evaluate((text) => { livingCheck.root.querySelectorAll("thead th")[2].textContent = text; }, original);
    }
  });
  await run("long code references remain inside folded cells", async () => {
    const original = await evaluate(() => {
      const code = livingCheck.nodes[2].querySelector("code");
      const value = code.textContent;
      code.textContent = "7b14dfb9c8f14ad8a2df676bc13e71f0f613f47d";
      return value;
    });
    try {
      for (const width of [360, 640]) {
        await resize(width);
        assert.equal(await evaluate(() => {
          const { root, nodes } = livingCheck;
          const code = nodes[2].querySelector("code").getBoundingClientRect();
          const cell = nodes[2].getBoundingClientRect();
          const wrap = root.querySelector(".sd-table-wrap");
          return wrap.scrollWidth <= wrap.clientWidth + 1 && code.right <= cell.right + 1;
        }), true);
      }
    } finally {
      await evaluate((value) => { livingCheck.nodes[2].querySelector("code").textContent = value; }, original);
    }
  });
  await run("refresh labels follow header names and preserve overrides", async () => {
    const result = await evaluate(() => {
      const c = livingCheck;
      const header = c.root.querySelectorAll("thead th")[3];
      const original = header.textContent;
      try {
        header.textContent = "Assigned team";
        c.mount.refresh();
        const updated = c.nodes[8].dataset.label;
        const authored = c.nodes[3].dataset.label;
        c.nodes[8].dataset.label = "Responsible team";
        header.textContent = "Squad";
        c.mount.refresh();
        return { updated, authored, override: c.nodes[8].dataset.label, renamed: c.nodes[13].dataset.label };
      } finally {
        header.textContent = original;
        c.mount.refresh();
      }
    });
    assert.deepEqual(result, { updated: "Assigned team", authored: "Assigned to", override: "Responsible team", renamed: "Squad" });
  });
  await run("equivalent replacement headers refresh", async () => {
    assert.equal(await evaluate(() => {
      const c = livingCheck;
      const template = document.createElement("template");
      template.innerHTML = c.original;
      c.root.querySelector("thead").innerHTML = template.content.querySelector("thead").innerHTML;
      c.mount.refresh();
      return c.root.querySelectorAll('thead th[role="columnheader"]').length === 5;
    }), true);
  });
  await run("last-column links remain clickable beside the grip", async () => {
    await resize(960);
    const original = await evaluate(() => {
      const c = livingCheck;
      const cell = c.nodes[4];
      const value = cell.innerHTML;
      const link = document.createElement("a");
      link.id = "living-last-column-link";
      link.href = "#details";
      link.textContent = "Details";
      link.style.cssText = "display:block;text-align:end";
      c.clickedLastColumn = false;
      link.addEventListener("click", (event) => { event.preventDefault(); c.clickedLastColumn = true; });
      cell.replaceChildren(link);
      return value;
    });
    try {
      const box = await page.locator("#living-last-column-link").boundingBox();
      await page.mouse.click(box.x + box.width - 2, box.y + box.height / 2);
      assert.equal(await evaluate(() => livingCheck.clickedLastColumn), true);
    } finally {
      await evaluate((html) => { livingCheck.nodes[4].innerHTML = html; }, original);
    }
  });
  await run("group keyboard, independence, and focus recovery", async () => {
    const button = page.locator('#living-check tbody[data-id="review"] button');
    await button.focus();
    await page.keyboard.press("Enter");
    assert.equal(await button.getAttribute("aria-expanded"), "false");
    assert.equal(await page.locator('#living-check tbody[data-id="review"] a').isVisible(), false);
    assert.equal(await page.locator('#living-check tbody[data-id="progress"] button').getAttribute("aria-expanded"), "true");
    await page.keyboard.press("Space");
    assert.equal(await button.getAttribute("aria-expanded"), "true");
    await evaluate(() => { livingCheck.nodes[0].querySelector("a").focus(); livingCheck.mount.toggle("review", false); });
    assert.equal(await button.evaluate((b) => document.activeElement === b), true);
    await page.keyboard.press("Tab");
    assert.equal(await page.locator('#living-check tbody[data-id="progress"] button').evaluate((b) => document.activeElement === b), true);
    await button.click();
    assert.equal(await button.getAttribute("aria-expanded"), "true");
  });
  await run("committed and nonredundant events", async () => {
    await resize(640);
    const result = await evaluate(() => {
      const c = livingCheck;
      c.events.length = 0;
      c.mount.toggle("review", true); c.mount.resize({ width: 640 }); c.mount.refresh();
      const unchanged = c.events.length;
      c.mount.toggle("review", false); c.mount.toggle("review", false);
      const committed = c.events.slice();
      c.mount.toggle("review", true);
      return { unchanged, committed };
    });
    assert.equal(result.unchanged, 0);
    assert.deepEqual(result.committed, [{ width: 640, collapsed: ["review"] }]);
  });
  await run("keyboard resize and ARIA", async () => {
    await grip.focus();
    for (const [key, width] of [["ArrowLeft", 624], ["Shift+ArrowRight", 688], ["Home", 320], ["End", 1000]]) {
      await page.keyboard.press(key);
      assert.equal(Number(await grip.getAttribute("aria-valuenow")), width);
      assert.equal(await evaluate(() => livingCheck.root.getBoundingClientRect().width), width);
    }
  });
  await run("real pointer capture and one commit", async () => {
    await resize(640);
    const box = await grip.boundingBox();
    await evaluate(() => { livingCheck.events.length = 0; });
    await page.mouse.move(box.x + 12, box.y + 80);
    await page.mouse.down();
    await page.mouse.move(box.x - 88, box.y + 80, { steps: 4 });
    assert.equal(await evaluate(() => livingCheck.root.getBoundingClientRect().width), 540);
    assert.equal(await evaluate(() => livingCheck.events.length), 0);
    await page.mouse.up();
    assert.deepEqual(await evaluate(() => livingCheck.events), [{ width: 540, collapsed: [] }]);
  });
  await run("Escape cancels drag", async () => {
    const box = await grip.boundingBox();
    await evaluate(() => { livingCheck.events.length = 0; });
    await page.mouse.move(box.x + 12, box.y + 80); await page.mouse.down();
    await page.mouse.move(box.x - 40, box.y + 80);
    await page.keyboard.press("Escape"); await page.mouse.up();
    assert.equal(await evaluate(() => livingCheck.root.getBoundingClientRect().width), 540);
    assert.equal(await evaluate(() => livingCheck.events.length), 0);
  });
  for (const type of ["pointercancel", "lostpointercapture"]) await run(`${type} cleanup`, async () => {
    const box = await grip.boundingBox();
    await page.mouse.move(box.x + 12, box.y + 80); await page.mouse.down();
    await page.mouse.move(box.x - 40, box.y + 80);
    await grip.evaluate((el, type) => {
      if (type === "lostpointercapture") el.releasePointerCapture(1);
      else el.dispatchEvent(new PointerEvent(type, { pointerId: 1 }));
    }, type);
    await page.mouse.move(box.x - 60, box.y + 80);
    await page.mouse.up();
    assert.equal(await evaluate(() => livingCheck.root.getBoundingClientRect().width), 540);
    assert.equal(await evaluate(() => getComputedStyle(livingCheck.root).userSelect === "none"), false);
  });
  if (engine === "chromium") await run("real touch resize", async () => {
    await resize(640);
    const box = await grip.boundingBox();
    const session = await page.context().newCDPSession(page);
    try {
      const point = { x: box.x + 12, y: box.y + 80 };
      await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [point] });
      await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ ...point, x: point.x - 80 }] });
      await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      assert.equal(Number(await grip.getAttribute("aria-valuenow")), 560);
      assert.equal(await evaluate(() => document.documentElement.style.userSelect || document.body.style.userSelect), "");
    } finally { await session.detach(); }
  });
  await run("parent shrink, regrowth, hidden and fluid bounds", async () => {
    await resize(700);
    for (const width of [240, 800, 0, 1000]) {
      await evaluate((width) => { livingCheck.host.style.width = `${width}px`; }, width);
      await settle(page);
      assert.equal(Number(await grip.getAttribute("aria-valuemax")), width);
      assert.equal(Number(await grip.getAttribute("aria-valuemin")), Math.min(320, width));
      assert.equal(Number(await grip.getAttribute("aria-valuenow")), Math.min(700, width));
    }
    await evaluate(() => { livingCheck.host.style.display = "none"; }); await settle(page);
    assert.equal(Number(await grip.getAttribute("aria-valuemax")), 0);
    assert.equal(Number(await grip.getAttribute("aria-valuenow")), 0);
    await evaluate(() => { livingCheck.host.style.display = "block"; }); await settle(page);
    await resize(null);
    assert.equal(Number(await grip.getAttribute("aria-valuenow")), 1000);
  });
  await run("RTL trailing grip and keyboard", async () => {
    await evaluate(() => { livingCheck.root.dir = "rtl"; }); await resize(640);
    await grip.focus(); await page.keyboard.press("ArrowLeft");
    assert.equal(Number(await grip.getAttribute("aria-valuenow")), 656);
    const box = await grip.boundingBox();
    assert.equal(Math.round(box.x), Math.round(await evaluate(() => livingCheck.root.getBoundingClientRect().left)));
    await page.mouse.move(box.x + 12, box.y + 80); await page.mouse.down();
    await page.mouse.move(box.x - 38, box.y + 80); await page.mouse.up();
    assert.equal(Number(await grip.getAttribute("aria-valuenow")), 706);
    await evaluate(() => livingCheck.root.removeAttribute("dir"));
  });
  await run("parent width changes with natural content height", async () => {
    await resize(700);
    await evaluate(() => { livingCheck.host.style.maxHeight = "none"; livingCheck.host.style.width = "240px"; });
    await settle(page);
    await evaluate(() => { livingCheck.host.style.width = "1000px"; });
    await settle(page);
    assert.equal(Number(await grip.getAttribute("aria-valuenow")), 700);
    await evaluate(() => { livingCheck.host.style.maxHeight = "100vh"; });
  });
  await run("refresh counts, labels, and removed-node restoration", async () => {
    const result = await evaluate(() => {
      const c = livingCheck;
      const body = c.root.querySelector('tbody[data-id="planned"]');
      const row = body.rows[1].cloneNode(true);
      for (const cell of row.cells) { cell.removeAttribute("style"); cell.removeAttribute("role"); cell.removeAttribute("data-label"); cell.removeAttribute("data-fold"); }
      row.cells[0].textContent = "Audit token contrast";
      const original = JSON.stringify(c.snapshot(row));
      body.append(row); c.mount.refresh();
      const count = body.querySelector(".sd-living-table-count").textContent;
      const label = row.cells[3].dataset.label;
      row.remove(); c.mount.refresh();
      const restored = JSON.stringify(c.snapshot(row));
      return { count, label, restored: restored === original, after: body.querySelector(".sd-living-table-count").textContent };
    });
    assert.deepEqual(result, { count: "2", label: "Owner", restored: true, after: "1" });
  });
  await run("multiple independent mounts and group refresh", async () => {
    assert.equal(await evaluate(() => {
      const c = livingCheck;
      const second = document.createElement("div"); second.innerHTML = c.original;
      const root = second.firstElementChild; root.id = "living-second";
      root.querySelector(".sd-table-wrap").id = "living-second-content";
      c.host.append(root);
      const mount = c.api.mountLivingTable(root);
      const group = root.querySelector("tbody").cloneNode(true); group.dataset.id = "new-group";
      root.querySelector("table").append(group); mount.refresh(); mount.toggle("new-group", false);
      mount.toggle("review", false);
      const independent = c.root.querySelector('tbody[data-id="review"] button').getAttribute("aria-expanded") === "true" && group.rows[1].hidden && group.querySelector(".sd-living-table-count").textContent === "2";
      mount.dispose(); root.remove(); return independent;
    }), true);
  });
  await run("invalid DOM rejected before mutation", async () => {
    assert.equal(await evaluate(() => {
      const c = livingCheck; const template = document.createElement("div"); template.innerHTML = c.original;
      const root = template.firstElementChild;
      root.querySelectorAll("tbody")[1].dataset.id = "review";
      const before = root.outerHTML;
      try { c.api.mountLivingTable(root); return false; } catch { return root.outerHTML === before; }
    }), true);
  });
  await run("reduced motion", async () => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    assert.equal(await evaluate(() => parseFloat(getComputedStyle(livingCheck.root.querySelector("tbody tr:nth-child(2)")).transitionDuration) <= 0.00001), true);
    await resize(360); await evaluate(() => { livingCheck.mount.toggle("review", false); livingCheck.mount.toggle("review", true); });
    await page.emulateMedia({ reducedMotion: "no-preference" });
  });
  await run("phone width without overflow", async () => {
    await page.setViewportSize({ width: 375, height: 900 }); await resize(null);
    assert.equal(await evaluate(() => document.documentElement.scrollWidth <= innerWidth && livingCheck.root.scrollWidth <= livingCheck.root.clientWidth), true);
    await page.setViewportSize({ width: 1280, height: 900 });
  });
  await run("reassigned parents restore requested width and ARIA bounds", async () => {
    await resize(640);
    try {
      await evaluate(() => livingCheck.root.remove());
      await settle(page);
      await evaluate(() => {
        const c = livingCheck;
        c.nextHost = document.createElement("div");
        c.nextHost.style.cssText = "position:fixed;inset:0 auto auto 0;width:400px";
        document.body.append(c.nextHost);
        c.nextHost.append(c.root);
      });
      await settle(page);
      assert.equal(Number(await grip.getAttribute("aria-valuenow")), 400);
      await evaluate(() => { livingCheck.nextHost.style.width = "900px"; });
      await settle(page);
      assert.deepEqual(await evaluate(() => {
        const c = livingCheck;
        const grip = c.root.querySelector("[data-sd-living-resize]");
        return { width: c.root.getBoundingClientRect().width, min: Number(grip.getAttribute("aria-valuemin")), max: Number(grip.getAttribute("aria-valuemax")), now: Number(grip.getAttribute("aria-valuenow")) };
      }), { width: 640, min: 320, max: 900, now: 640 });
    } finally {
      await evaluate(() => {
        livingCheck.host.append(livingCheck.root);
        livingCheck.nextHost?.remove();
        delete livingCheck.nextHost;
      });
      await settle(page);
    }
  });
  await run("detached toggle and refresh publish only the resumed committed state", async () => {
    await resize(640);
    try {
      await evaluate(() => {
        const c = livingCheck;
        c.events.length = 0;
        c.root.remove();
        c.mount.toggle("review", false);
        c.mount.refresh();
      });
      await settle(page);
      assert.deepEqual(await evaluate(() => livingCheck.events), []);
      await evaluate(() => livingCheck.host.append(livingCheck.root));
      await settle(page);
      assert.equal(await evaluate(() => livingCheck.root.getBoundingClientRect().width), 640);
      assert.deepEqual(await evaluate(() => livingCheck.events), [{ width: 640, collapsed: ["review"] }]);
      await evaluate(() => livingCheck.mount.refresh());
      assert.equal(await evaluate(() => livingCheck.events.length), 1);
    } finally {
      await evaluate(() => { livingCheck.host.append(livingCheck.root); livingCheck.mount.toggle("review", true); });
      await settle(page);
    }
  });
  await run("refresh observes equal-size parent moves and destination growth", async () => {
    await evaluate(() => {
      const c = livingCheck;
      const template = document.createElement("template");
      template.innerHTML = c.original;
      c.neutralRoot = template.content.firstElementChild;
      c.neutralRoot.style.height = "700px";
      c.neutralHosts = [document.createElement("div"), document.createElement("div")];
      for (const host of c.neutralHosts) {
        host.style.cssText = "position:fixed;inset:0 auto auto 0;width:400px;height:700px";
        document.body.append(host);
      }
      c.neutralHosts[0].append(c.neutralRoot);
      c.neutralMount = c.api.mountLivingTable(c.neutralRoot);
      c.neutralMount.resize({ width: 640 });
    });
    try {
      await settle(page);
      await evaluate(() => {
        const c = livingCheck;
        c.neutralHosts[1].append(c.neutralRoot);
        c.neutralMount.refresh();
      });
      await settle(page);
      await evaluate(() => { livingCheck.neutralHosts[1].style.width = "900px"; });
      await settle(page);
      assert.deepEqual(await evaluate(() => {
        const root = livingCheck.neutralRoot;
        return { width: root.getBoundingClientRect().width, max: Number(root.querySelector("[data-sd-living-resize]").getAttribute("aria-valuemax")) };
      }), { width: 640, max: 900 });
    } finally {
      await evaluate(() => {
        const c = livingCheck;
        c.neutralMount.dispose();
        c.neutralHosts.forEach((host) => host.remove());
        delete c.neutralRoot; delete c.neutralMount; delete c.neutralHosts;
      });
    }
  });
  for (const action of ["toggle and refresh", "toggle", "refresh", "resize"]) await run(`same-frame detached ${action} publishes one committed state`, async () => {
    await evaluate((action) => {
      const c = livingCheck;
      const template = document.createElement("template");
      template.innerHTML = c.original;
      c.neutralRoot = template.content.firstElementChild;
      c.neutralRoot.style.height = "700px";
      c.neutralHost = document.createElement("div");
      c.neutralHost.style.cssText = "position:fixed;inset:0 auto auto 0;width:640px;height:700px";
      c.neutralHost.append(c.neutralRoot);
      document.body.append(c.neutralHost);
      c.neutralEvents = [];
      c.neutralRoot.addEventListener("sd:living-table", (event) => c.neutralEvents.push(event.detail));
      c.neutralMount = c.api.mountLivingTable(c.neutralRoot);
      c.neutralMount.resize({ width: action === "resize" ? 480 : 640 });
    }, action);
    try {
      await settle(page);
      await evaluate((action) => {
        const c = livingCheck;
        c.neutralEvents.length = 0;
        c.neutralRoot.remove();
        if (action === "resize") c.neutralMount.resize({ width: 640 });
        else if (action === "refresh") {
          c.neutralRoot.querySelector('tbody[data-id="review"] button').setAttribute("aria-expanded", "false");
          c.neutralMount.refresh();
        } else {
          c.neutralMount.toggle("review", false);
          if (action === "toggle and refresh") c.neutralMount.refresh();
        }
        c.neutralHost.append(c.neutralRoot);
      }, action);
      await settle(page);
      assert.deepEqual(await evaluate(() => livingCheck.neutralEvents), [{ width: 640, collapsed: action === "resize" ? [] : ["review"] }]);
      await evaluate(() => livingCheck.neutralMount.refresh());
      await settle(page);
      assert.equal(await evaluate(() => livingCheck.neutralEvents.length), 1);
    } finally {
      await evaluate(() => {
        const c = livingCheck;
        c.neutralMount.dispose(); c.neutralHost.remove();
        delete c.neutralRoot; delete c.neutralMount; delete c.neutralHost; delete c.neutralEvents;
      });
    }
  });
  await run("detached roots tolerate delayed cleanup", async () => {
    try {
      await evaluate(() => livingCheck.root.remove());
      await settle(page);
      await evaluate(() => livingCheck.mount.resize({ width: 640 }));
    } finally {
      await evaluate(() => livingCheck.host.append(livingCheck.root));
      await settle(page);
    }
  });
  await run("dispose during capture restores exact DOM and remounts", async () => {
    await resize(640);
    const box = await grip.boundingBox();
    await page.mouse.move(box.x + 12, box.y + 80); await page.mouse.down();
    const result = await evaluate(() => {
      const c = livingCheck; c.mount.toggle("review", false); c.mount.dispose(); c.mount.dispose();
      c.mount.resize({ width: 400 }); c.mount.toggle("review"); c.mount.refresh();
      const restored = JSON.stringify(c.snapshot(c.root)) === c.before;
      c.mount = c.api.mountLivingTable(c.root); c.mount.toggle("review", false);
      const collapsed = c.root.querySelector('tbody[data-id="review"] tr:nth-child(2)').hidden;
      c.mount.dispose();
      const after = JSON.stringify(c.snapshot(c.root));
      return { restored, collapsed, after: after === c.before };
    });
    await page.mouse.up();
    assert.deepEqual(result, { restored: true, collapsed: true, after: true });
  });
  await run("standalone bundle API", async () => {
    assert.equal(await evaluate(async (url) => {
      const { mountLivingTable } = await import(url);
      const c = livingCheck; const mount = mountLivingTable(c.root);
      mount.resize({ width: 420 }); mount.toggle("shipped", false);
      const works = c.root.getBoundingClientRect().width === 420 && c.root.querySelector('tbody[data-id="shipped"] tr:nth-child(2)').hidden;
      mount.dispose(); return works && JSON.stringify(c.snapshot(c.root)) === c.before;
    }, served(base, "../dist/signal.js")), true);
  });
  await settle(page);
  await run("no browser errors", async () => assert.deepEqual([...browserErrors, ...await evaluate(() => livingWindowErrors)], []));
  page.off("pageerror", onError);
  await evaluate(() => {
    livingCheck.host.remove(); delete window.livingCheck;
    removeEventListener("error", livingWindowErrorHandler);
    delete window.livingWindowErrors; delete window.livingWindowErrorHandler;
  });
  return { passed, errors };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const started = performance.now();
  const base = process.argv[2] || "http://127.0.0.1:5191/";
  let passed = checkLivingTableTypes();
  let failed = 0;
  console.log("ok   living table types 1 strict consumer compilation");
  for (const [name, engine] of Object.entries({ chromium, webkit })) {
    const browser = await engine.launch();
    try {
      const page = await browser.newPage();
      const result = await checkLivingTable(page, base, name);
      passed += result.passed; failed += result.errors.length;
      for (const error of result.errors) console.error(`FAIL ${error}`);
      console.log(`${name}: ${result.passed} passed, ${result.errors.length} failed`);
    } finally { await browser.close(); }
  }
  console.log(`Living tables: ${passed} passed, ${failed} failed in ${((performance.now() - started) / 1000).toFixed(2)}s`);
  process.exitCode = failed ? 1 : 0;
}
