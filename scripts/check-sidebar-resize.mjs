/**
 * Behavior checks for the sidebar resize handle (data-sd-shell="resize") on
 * showcase/shell.html and the standalone demo on the components page.
 * Called from scripts/check.mjs once per engine.
 */
const KEY = "sd-shell-sidebar-width:section-sidebar";
const HANDLE = '#section-sidebar > [data-sd-shell="resize"]';

export async function checkSidebarResize(page, base, apiUrl) {
  const errors = [];
  let passed = 0;
  const expect = (ok, message) => (ok ? passed++ : errors.push(message));
  const state = () => page.evaluate(({ HANDLE, KEY }) => {
    const shell = document.querySelector(".sd-shell");
    const sidebar = document.getElementById("section-sidebar");
    const handle = document.querySelector(HANDLE);
    const main = shell.querySelector(".sd-shell-main").getBoundingClientRect();
    return {
      width: Math.round(sidebar.getBoundingClientRect().width),
      now: Number(handle.getAttribute("aria-valuenow")),
      mainLeft: Math.round(main.left),
      sidebarRight: Math.round(sidebar.getBoundingClientRect().right),
      stored: localStorage.getItem(KEY),
      resizing: "resizing" in shell.dataset,
      shown: handle.getClientRects().length > 0,
      events: window.__widths ?? [],
    };
  }, { HANDLE, KEY });
  const drag = async (dx, { release = true } = {}) => {
    const box = await page.locator(HANDLE).boundingBox();
    const x = box.x + box.width / 2;
    const y = box.y + 200;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + dx / 2, y, { steps: 4 });
    await page.mouse.move(x + dx, y, { steps: 4 });
    if (release) await page.mouse.up();
  };

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`${base}shell.html`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector(HANDLE);
  await page.evaluate(() => {
    window.__widths = [];
    document.addEventListener("sd:shell", (e) => window.__widths.push(e.detail.width));
  });

  let s = await state();
  expect(s.shown && s.width === 288 && s.now === 288, `starts at 288px with aria-valuenow 288, got ${JSON.stringify(s)}`);

  await drag(100, { release: false });
  s = await state();
  expect(s.width === 388 && s.now === 388 && s.resizing && s.stored === null && s.events.length === 0, `mid-drag width 388, data-resizing, nothing stored or emitted yet, got ${JSON.stringify(s)}`);
  await page.mouse.up();
  s = await state();
  expect(s.width === 388 && s.stored === "388" && !s.resizing && s.events.join() === "388", `drag commits 388 once, got ${JSON.stringify(s)}`);
  expect(s.mainLeft >= s.sidebarRight, `the shell grid track follows the sidebar (main at ${s.mainLeft}, sidebar ends at ${s.sidebarRight})`);

  await drag(1000);
  s = await state();
  expect(s.width === 480 && s.now === 480, `drag clamps at aria-valuemax 480, got ${s.width}`);
  await drag(-1000);
  s = await state();
  expect(s.width === 224 && s.stored === "224", `drag clamps at aria-valuemin 224, got ${s.width}`);

  await drag(150, { release: false });
  await page.keyboard.press("Escape");
  await page.mouse.up();
  s = await state();
  expect(s.width === 224 && s.now === 224 && s.stored === "224" && !s.resizing, `Escape cancels a drag back to 224, got ${JSON.stringify(s)}`);

  await page.focus(HANDLE);
  await page.keyboard.press("ArrowRight");
  expect((await state()).width === 240, "ArrowRight widens by 16px");
  await page.keyboard.press("Shift+ArrowRight");
  expect((await state()).width === 304, "Shift+ArrowRight widens by 64px");
  await page.keyboard.press("ArrowLeft");
  expect((await state()).width === 288, "ArrowLeft narrows by 16px");
  await page.keyboard.press("End");
  expect((await state()).width === 480, "End jumps to aria-valuemax");
  await page.keyboard.press("Home");
  s = await state();
  expect(s.width === 224 && s.stored === "224", `Home jumps to aria-valuemin and is stored, got ${JSON.stringify(s)}`);

  await page.keyboard.press("End");
  await page.reload();
  await page.waitForSelector(HANDLE);
  s = await state();
  expect(s.width === 480 && s.now === 480, `a reload restores the stored 480px, got ${JSON.stringify(s)}`);

  await page.evaluate(async (url) => (await import(url)).setSidebarWidth(document.querySelector(".sd-shell"), null), apiUrl);
  s = await state();
  expect(s.width === 288 && s.now === 288 && s.stored === null, `setSidebarWidth(shell, null) returns to 288 and forgets, got ${JSON.stringify(s)}`);

  await page.evaluate(() => (document.documentElement.dir = "rtl"));
  await page.focus(HANDLE);
  await page.keyboard.press("ArrowLeft");
  expect((await state()).width === 304, "in RTL, ArrowLeft widens the sidebar");
  await drag(-50);
  expect((await state()).width === 354, "in RTL, dragging left widens the sidebar");
  await page.evaluate(() => document.documentElement.removeAttribute("dir"));

  await page.evaluate((sel) => document.querySelector(sel).removeAttribute("data-sd-shell"), HANDLE);
  const before = (await page.locator("#section-sidebar").boundingBox()).width;
  const box = await page.locator("#section-sidebar > .sd-sidebar-resize").boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + 200);
  await page.mouse.down();
  await page.mouse.move(box.x + 80, box.y + 200, { steps: 4 });
  await page.mouse.up();
  const after = (await page.locator("#section-sidebar").boundingBox()).width;
  expect(before === after, `without data-sd-shell the handle is only the look (width ${before} -> ${after})`);

  await page.goto(`${base}shell.html`);
  await page.waitForSelector(HANDLE);
  await page.evaluate(async (url) => (await import(url)).setSidebar(document.querySelector(".sd-shell"), "collapsed"), apiUrl);
  expect(!(await state()).shown, "a collapsed sidebar shows no handle");
  await page.evaluate(async (url) => {
    const api = await import(url);
    api.selectSection(document.querySelector(".sd-shell"), "projects");
  }, apiUrl);
  expect(await page.evaluate((sel) => "peek" in document.querySelector(".sd-shell").dataset && document.querySelector(sel).getClientRects().length === 0, HANDLE), "a peeking sidebar shows no handle");
  await page.evaluate(async (url) => (await import(url)).setSidebar(document.querySelector(".sd-shell"), "pinned"), apiUrl);
  await page.setViewportSize({ width: 375, height: 800 });
  expect(!(await state()).shown, "phones show no handle");
  await page.setViewportSize({ width: 1280, height: 900 });

  // The standalone demo resizes its own sidebar and leaves the page shell alone.
  await page.goto(base);
  const demo = '#demo-resize-sidebar > [data-sd-shell="resize"]';
  await page.locator(demo).scrollIntoViewIfNeeded();
  const pageShell = await page.evaluate(() => document.getElementById("library-sidebar").getBoundingClientRect().width);
  await page.focus(demo);
  await page.keyboard.press("End");
  const result = await page.evaluate(() => ({
    demo: Math.round(document.getElementById("demo-resize-sidebar").getBoundingClientRect().width),
    page: document.getElementById("library-sidebar").getBoundingClientRect().width,
    key: localStorage.getItem("sd-shell-sidebar-width:demo-resize-sidebar"),
  }));
  expect(result.demo === 360 && result.page === pageShell && result.key === "360", `the demo sidebar resizes alone under its own key, got ${JSON.stringify(result)}`);

  // An authored inline width (the demo's 15rem) survives a cancelled drag and null.
  const demoWidth = () => page.evaluate(() => ({
    width: Math.round(document.getElementById("demo-resize-sidebar").getBoundingClientRect().width),
    now: document.querySelector("#demo-resize-sidebar > .sd-sidebar-resize").getAttribute("aria-valuenow"),
    inline: document.getElementById("demo-resize-sidebar").style.getPropertyValue("--shell-sidebar"),
    key: localStorage.getItem("sd-shell-sidebar-width:demo-resize-sidebar"),
  }));
  await page.evaluate(async (url) => (await import(url)).setSidebarWidth(document.getElementById("demo-resize-sidebar"), null), apiUrl);
  let d = await demoWidth();
  expect(d.width === 240 && d.now === "240" && d.inline === "15rem" && d.key === null, `setSidebarWidth(sidebar, null) returns to the authored 15rem and forgets, got ${JSON.stringify(d)}`);
  const demoBox = await page.locator(demo).boundingBox();
  await page.mouse.move(demoBox.x + demoBox.width / 2, demoBox.y + 60);
  await page.mouse.down();
  await page.mouse.move(demoBox.x + 60, demoBox.y + 60, { steps: 4 });
  await page.keyboard.press("Escape");
  await page.mouse.up();
  d = await demoWidth();
  expect(d.width === 240 && d.inline === "15rem" && d.key === null, `Escape mid-drag returns the demo to its authored 15rem, got ${JSON.stringify(d)}`);

  // The page shell's collapse and peek state do not reach a sidebar nested in its content.
  await page.evaluate(async (url) => (await import(url)).setSidebar(document.querySelector(".sd-shell"), "collapsed"), apiUrl);
  d = await page.evaluate(() => {
    const el = document.getElementById("demo-resize-sidebar");
    return { shown: el.getClientRects().length > 0, position: getComputedStyle(el).position };
  });
  expect(d.shown && d.position === "relative", `a nested demo sidebar ignores the page shell's collapsed state, got ${JSON.stringify(d)}`);
  await page.evaluate(async (url) => (await import(url)).setSidebar(document.querySelector(".sd-shell"), "pinned"), apiUrl);
  await page.evaluate(() => localStorage.clear());

  return { errors, passed };
}
