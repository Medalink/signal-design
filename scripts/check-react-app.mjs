/**
 * Behavior checks for what a React app needs beyond the components: the
 * scrollbars without init(), a menu at a point, overlays above a modal dialog,
 * tooltip timing, bare switches and dialogs without a header. Called from
 * checkReact in check-react.mjs:
 *   checkReactApp(page, base) -> { errors, passed }
 */
import { fileURLToPath } from "node:url";

const apiPath = fileURLToPath(new URL("../src/js/index.js", import.meta.url)).replace(/\\/g, "/");

export async function checkReactApp(page, base) {
  const errors = [];
  let passed = 0;
  const expect = (ok, message) => (ok ? passed++ : errors.push(message));
  const browserErrors = [];
  page.on("console", (m) => m.type() === "error" && browserErrors.push(m.text()));
  page.on("pageerror", (e) => browserErrors.push(e.message));
  const until = (fn, arg, timeout = 2000) => page.waitForFunction(fn, arg, { timeout }).then(() => true, () => false);

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`${base}react.html`);
  await page.waitForSelector("#react-buttons");

  /* ---- Scrollbars without init() ---- */
  const bars = await page.evaluate(async (api) => {
    const { initScrollbars } = await import(api);
    const listeners = [];
    const add = document.addEventListener;
    document.addEventListener = function (type, ...rest) {
      if (type === "scroll") listeners.push(type);
      return add.call(this, type, ...rest);
    };
    const root = document.documentElement;
    const before = root.hasAttribute("data-sd-scrollbars");
    initScrollbars();
    initScrollbars();
    const auto = root.dataset.sdScrollbars;
    initScrollbars("always");
    const mode = root.dataset.sdScrollbars;
    initScrollbars("auto");
    document.addEventListener = add;
    return { before, auto, mode, listeners: listeners.length };
  }, `${base}@fs/${apiPath}`);
  expect(!bars.before && bars.auto === "auto" && bars.mode === "always", `initScrollbars sets the mode on <html>, got ${JSON.stringify(bars)}`);
  expect(bars.listeners === 1, `initScrollbars listens for scrolling once however often it is called, got ${bars.listeners} listeners`);
  await page.evaluate(() => {
    const box = document.createElement("div");
    box.id = "scroll-probe";
    box.style.cssText = "position:fixed;top:0;left:0;width:120px;height:80px;overflow:auto";
    box.innerHTML = '<div style="height:600px"></div>';
    document.body.append(box);
    box.scrollTop = 40;
  });
  expect(await until(() => document.getElementById("scroll-probe").hasAttribute("data-sd-scrolling"), null), "a scroller carries data-sd-scrolling while it scrolls, with no init()");
  expect(await until(() => document.documentElement.hasAttribute("data-sd-scrolling-page"), null), "<html> carries data-sd-scrolling-page while anything scrolls");
  expect(await until(() => !document.getElementById("scroll-probe").hasAttribute("data-sd-scrolling"), null, 5000), "data-sd-scrolling clears once the scroller has been still for 2s");
  await page.evaluate(() => document.getElementById("scroll-probe").remove());

  /* ---- Menu at a point ---- */
  const placed = await page.evaluate(async (api) => {
    const { place } = await import(api);
    const box = document.createElement("div");
    box.style.cssText = "position:fixed;width:100px;height:50px";
    document.body.append(box);
    const at = (anchor, options) => {
      place(box, anchor, options);
      return [box.style.left, box.style.top];
    };
    let threw = "";
    try {
      place(box, null);
      place(null, { x: 1, y: 2 });
    } catch (error) {
      threw = error.message;
    }
    const out = {
      threw,
      point: at({ x: 300, y: 200 }),
      rect: at({ left: 100, top: 100, right: 140, bottom: 120 }),
      virtual: at({ getBoundingClientRect: () => ({ left: 100, top: 100, right: 140, bottom: 120 }) }),
      pointOffset: at({ x: 300, y: 200 }, { offset: 10 }),
      above: at({ x: 300, y: innerHeight - 5 }),
    };
    box.remove();
    return out;
  }, `${base}@fs/${apiPath}`);
  expect(!placed.threw, `place ignores a missing anchor or element, got: ${placed.threw}`);
  expect(placed.point.join() === "300px,200px", `a point is the corner of the placed element, got ${placed.point}`);
  expect(placed.rect.join() === "100px,126px" && placed.virtual.join() === placed.rect.join(), `a rect and an object with getBoundingClientRect place alike, got ${placed.rect} and ${placed.virtual}`);
  expect(placed.pointOffset.join() === "300px,210px", `an explicit offset applies to a point, got ${placed.pointOffset}`);
  expect(parseInt(placed.above[1]) + 50 <= 900, `near the bottom edge the element flips above the point, got ${placed.above}`);

  const card = page.locator("#react-context-menu article");
  const menuBox = () => page.evaluate(() => {
    const pop = document.querySelector('#react-context-menu ~ * [role=menu], [role=menu][aria-label="Message actions"]')?.parentElement;
    const r = pop?.getBoundingClientRect();
    return { open: Boolean(pop?.matches(":popover-open")), left: r?.left, top: r?.top, right: r?.right, bottom: r?.bottom };
  });
  const menuOpenAt = (on) => until((on) => document.querySelector('[role=menu][aria-label="Message actions"]').parentElement.matches(":popover-open") === on, on);
  const focused = () => page.evaluate(() => document.activeElement?.textContent ?? "");
  await card.scrollIntoViewIfNeeded();
  const cardBox = await card.boundingBox();
  const aim = { x: cardBox.x + 40, y: cardBox.y + 20 };
  expect(await page.locator("#react-context-menu").getByRole("button").count() === 0, "the context menu block has no trigger button");
  await page.mouse.click(aim.x, aim.y, { button: "right" });
  expect(await menuOpenAt(true), "a right-click opens the menu with no trigger");
  // The panel slides in over 120ms, so wait for it to settle on the pointer.
  const settled = await until(([x, y]) => {
    const r = document.querySelector('[role=menu][aria-label="Message actions"]').parentElement.getBoundingClientRect();
    return Math.abs(r.left - x) <= 1 && Math.abs(r.top - y) <= 1;
  }, [aim.x, aim.y]);
  expect(settled, `the menu's corner sits on the pointer, wanted ${JSON.stringify(aim)}, got ${JSON.stringify(await menuBox())}`);
  expect(await until(() => document.activeElement?.textContent.startsWith("Reply"), null), `the first item has focus, got ${await focused()}`);
  await page.keyboard.press("ArrowDown");
  expect((await focused()).startsWith("Copy text"), `ArrowDown moves to the next item, got ${await focused()}`);
  await page.keyboard.press("End");
  expect((await focused()).startsWith("Delete"), `End jumps to the last item, got ${await focused()}`);
  const further = { x: cardBox.x + cardBox.width - 12, y: cardBox.y + 12 };
  await page.mouse.click(further.x, further.y, { button: "right" });
  expect(await until((x) => Math.abs(document.querySelector('[role=menu][aria-label="Message actions"]').parentElement.getBoundingClientRect().left - x) <= 1, further.x), "a second right-click moves the open menu to the new pointer");
  expect((await menuBox()).open, "the menu stays open after the second right-click");
  await page.keyboard.press("Escape");
  expect(await menuOpenAt(false), "Escape closes the menu");
  expect(await until(() => document.activeElement === document.querySelector("#react-context-menu article"), null), "Escape returns focus to what had it when the menu opened");

  await page.mouse.click(aim.x, aim.y, { button: "right" });
  expect(await until(() => document.activeElement?.textContent.startsWith("Reply"), null), `the reopened menu focuses its first item, got ${await focused()} with ${JSON.stringify(await menuBox())}`);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  const chose = await page.locator("[data-context-picked]").textContent();
  expect(await menuOpenAt(false) && chose === "chose: copy", `choosing an item runs onSelect and closes the menu, got ${chose}`);
  expect(await until(() => document.activeElement === document.querySelector("#react-context-menu article"), null), "choosing an item returns focus to what had it when the menu opened");

  await page.mouse.click(aim.x, aim.y, { button: "right" });
  await until(() => document.activeElement?.textContent.startsWith("Reply"), null);
  await page.locator("#react-context-menu h2").click();
  expect(await menuOpenAt(false), "a click outside closes the menu");

  const corner = await page.evaluate(async () => {
    const x = innerWidth - 10;
    const y = innerHeight - 10;
    document.querySelector("#react-context-menu article").dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: x, clientY: y }));
    await new Promise((resolve) => {
      const wait = () => (document.querySelector('[role=menu][aria-label="Message actions"]').parentElement.matches(":popover-open") ? resolve() : requestAnimationFrame(wait));
      wait();
    });
    const r = document.querySelector('[role=menu][aria-label="Message actions"]').parentElement.getBoundingClientRect();
    return { x, y, left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: innerWidth, height: innerHeight };
  });
  expect(corner.bottom <= corner.y + 1 && corner.top >= 8 - 1, `at the bottom edge the menu opens above the point, got ${JSON.stringify(corner)}`);
  expect(corner.right <= corner.width - 8 + 1 && corner.left >= 8 - 1, `at the right edge the menu shifts inside the viewport, got ${JSON.stringify(corner)}`);
  await page.keyboard.press("Escape");
  await menuOpenAt(false);

  expect(browserErrors.length === 0, `console errors: ${browserErrors.join(" | ")}`);
  return { errors, passed };
}
