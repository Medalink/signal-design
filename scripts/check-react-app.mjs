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

  expect(browserErrors.length === 0, `console errors: ${browserErrors.join(" | ")}`);
  return { errors, passed };
}
