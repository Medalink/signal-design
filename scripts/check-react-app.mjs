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

  const partial = await page.evaluate(async (api) => {
    const { place } = await import(api);
    // A fresh element each time: the browser ignores "NaNpx", so a reused one would keep the last case's value.
    const where = (anchor, options) => {
      const box = document.createElement("div");
      box.style.cssText = "position:fixed;width:100px;height:50px";
      document.body.append(box);
      place(box, anchor, options);
      const out = `${box.style.left},${box.style.top}`;
      box.remove();
      return out;
    };
    const differ = [];
    for (const options of [{ side: "bottom", align: "center" }, { side: "bottom", align: "end" }, { side: "top", align: "end" }, { side: "right", align: "center" }, { side: "left", align: "center" }, { side: "right", align: "end" }]) {
      const whole = where({ left: 200, top: 300, right: 200, bottom: 300 }, options);
      const half = where({ left: 200, top: 300 }, options);
      if (half !== whole) differ.push(`${JSON.stringify(options)}: ${half} for ${whole}`);
    }
    return differ;
  }, `${base}@fs/${apiPath}`);
  expect(partial.length === 0, `a rect with only left and top places like a rect of no size there, differing: ${partial.join("; ")}`);

  const contained = await page.evaluate(async (api) => {
    const { place } = await import(api);
    const box = document.createElement("div");
    box.style.cssText = "position:fixed;width:192px;height:132px";
    document.body.append(box);
    const outside = [];
    const points = [[400, 300], [400, innerHeight - 100], [400, innerHeight - 5], [innerWidth - 4, 300], [innerWidth - 4, innerHeight - 5], [3, 300], [3, 3]];
    for (const [x, y] of points) {
      for (const side of ["bottom", "top", "left", "right"]) {
        for (const align of ["start", "center", "end"]) {
          place(box, { x, y }, { side, align });
          const r = box.getBoundingClientRect();
          if (!(r.left <= x && x < r.right && r.top <= y && y < r.bottom)) outside.push(`${x},${y} ${side}/${align} got ${r.left},${r.top}`);
        }
      }
    }
    box.remove();
    return outside;
  }, `${base}@fs/${apiPath}`);
  expect(contained.length === 0, `the placed element contains its point on every side and align, even flipped or shifted at an edge; outside: ${contained.join("; ")}`);

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

  const cornerAt = await page.evaluate(() => {
    const x = innerWidth - 10;
    const y = innerHeight - 10;
    document.querySelector("#react-context-menu article").dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: x, clientY: y }));
    return { x, y, width: innerWidth, height: innerHeight };
  });
  expect(await menuOpenAt(true), `the menu opens at the bottom right corner, got ${JSON.stringify(await menuBox())}`);
  await until(() => document.querySelector('[role=menu][aria-label="Message actions"]').parentElement.getAnimations().length === 0, null);
  const corner = { ...cornerAt, ...(await menuBox()) };
  expect(corner.top < corner.y && corner.bottom >= corner.y && corner.bottom <= corner.y + 6 && corner.top >= 8 - 1, `at the bottom edge the menu opens above the point and overlaps it by a few pixels, got ${JSON.stringify(corner)}`);
  expect(corner.right <= corner.width - 8 + 1 && corner.left >= 8 - 1, `at the right edge the menu shifts inside the viewport, got ${JSON.stringify(corner)}`);
  await page.keyboard.press("Escape");
  await menuOpenAt(false);

  // WKWebView and WebKitGTK fire contextmenu on mousedown, so the button is released at the point the menu opened on.
  // The menu must still contain that point after it flips above it or shifts off an edge, or the release light dismisses it.
  await page.evaluate(() => {
    const cover = document.createElement("div");
    cover.id = "pointerdown-cover";
    cover.style.cssText = "position:fixed;inset:0;z-index:2147483647";
    cover.addEventListener("pointerdown", (event) => {
      document.querySelector("#react-context-menu article").dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: event.clientX, clientY: event.clientY }));
    });
    document.body.append(cover);
  });
  try {
    for (const [label, x, y] of [["below the point", 400, 300], ["flipped above the point", 400, 800], ["flipped at the bottom edge", 400, 895], ["shifted at the right edge", 1276, 300], ["shifted and flipped at the bottom right corner", 1276, 895]]) {
      await page.mouse.move(x, y);
      await page.mouse.down();
      const pressed = await menuOpenAt(true);
      const shown = await menuBox();
      await page.mouse.up();
      // A negative assertion: light dismiss runs on the release, and a menu that stays open has nothing to wait for.
      await new Promise((resolve) => setTimeout(resolve, 250));
      expect(pressed, `a menu opens on pointerdown ${label}`);
      expect((await menuBox()).open, `a menu opened on pointerdown ${label} stays open when the button is released at ${x},${y}, it spanned ${JSON.stringify(shown)}`);
      await page.keyboard.press("Escape");
      await menuOpenAt(false);
    }
  } finally {
    await page.evaluate(() => document.getElementById("pointerdown-cover")?.remove());
  }

  /* ---- Toast and tooltip above a modal dialog ---- */
  const over = page.locator("#react-above-dialog");
  const dialog = over.locator("dialog");
  const toaster = ".sd-toaster";
  const clipOf = (box, dx = 0, dy = 0, size) => ({ x: Math.floor(box.x) + dx, y: Math.floor(box.y) + dy, width: size ?? Math.ceil(box.width), height: size ?? Math.ceil(box.height) });
  // A toast sits under the dialog's translucent backdrop when it is not on top, so ask what colour the pixel is.
  const toastPixel = async () => {
    const box = await page.locator(`${toaster} .sd-toast`).last().boundingBox();
    const png = await page.screenshot({ clip: clipOf(box, 6, 6, 1), animations: "disabled" });
    return page.evaluate(async (b64) => {
      const img = new Image();
      img.src = `data:image/png;base64,${b64}`;
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      return Array.from(ctx.getImageData(0, 0, 1, 1).data).slice(0, 3);
    }, png.toString("base64"));
  };
  const toastColor = () => page.locator(`${toaster} .sd-toast`).last().evaluate((el) => getComputedStyle(el).backgroundColor.match(/\d+/g).slice(0, 3).map(Number));
  // The dialog panel is opaque, so a tooltip it covers changes no pixel when hidden.
  const tipPaints = async () => {
    const tip = page.locator("body > [role=tooltip]");
    const clip = clipOf(await tip.boundingBox());
    const shown = await page.screenshot({ clip, animations: "disabled" });
    await tip.evaluate((el) => (el.style.visibility = "hidden"));
    const hidden = await page.screenshot({ clip, animations: "disabled" });
    await tip.evaluate((el) => (el.style.visibility = ""));
    return !shown.equals(hidden);
  };
  const toastCount = () => page.locator(`${toaster} .sd-toast`).count();
  const archive = dialog.getByRole("button", { name: "Archive", exact: true });
  // The page behind a modal is inert and the toaster is part of it, so a toast above a modal is painted but never hit.
  const lastToastCenter = async () => {
    const box = await page.locator(`${toaster} .sd-toast`).last().boundingBox();
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  };
  const hitAt = ({ x, y }) => page.evaluate(([px, py]) => {
    const el = document.elementFromPoint(px, py);
    return { tag: el?.tagName, inToaster: Boolean(el?.closest(".sd-toaster")) };
  }, [x, y]);

  await over.getByRole("button", { name: "Open dialog" }).click();
  expect(await until(() => document.querySelector("#react-above-dialog dialog:modal") !== null, null), "the dialog opens as a modal");
  await archive.click();
  expect(await until((sel) => document.querySelector(sel + " .sd-toast"), toaster), "a toast shows while the dialog is open");
  expect(await until((sel) => document.querySelector(sel + " .sd-toast").getAnimations().length === 0, toaster), "the toast finishes its rise-in");
  const first = await page.locator(`${toaster} .sd-toast`).first().elementHandle();
  await archive.click();
  expect(await until((sel) => document.querySelectorAll(sel + " .sd-toast").length === 2, toaster), "a second toast joins the first");
  expect(await first.evaluate((el) => el.getAnimations().length === 0), "lifting the toaster above the dialog does not replay a toast already on screen");
  const live = await page.locator(toaster).evaluate((el) => {
    const style = getComputedStyle(el);
    return {
      open: el.matches(":popover-open"),
      popover: el.getAttribute("popover"),
      role: el.getAttribute("role"),
      live: el.getAttribute("aria-live"),
      padding: style.padding,
      margin: style.margin,
      border: style.borderTopWidth,
      background: style.backgroundColor,
      overflow: style.overflow,
    };
  });
  expect(live.open && live.popover === "manual", `the toaster is a manual popover and open, got ${JSON.stringify(live)}`);
  expect(live.role === "status" && live.live === "polite", `the toaster is still a polite live region, got ${live.role} and ${live.live}`);
  expect(live.padding === "0px" && live.margin === "0px" && live.border === "0px" && live.background === "rgba(0, 0, 0, 0)" && live.overflow === "visible", `the toaster has no browser popover box, got ${JSON.stringify(live)}`);
  const want = await toastColor();
  const got = await toastPixel();
  expect(got.every((c, i) => Math.abs(c - want[i]) <= 2), `a toast paints above the open dialog's backdrop, wanted ${want} at its corner, got ${got}`);
  const hit = await hitAt(await lastToastCenter());
  expect(hit.tag === "DIALOG" && !hit.inToaster, `a pointer over a toast above a modal reaches the dialog, not the toast, got ${JSON.stringify(hit)}`);

  const edge = async () => page.locator(`${toaster} .sd-toast`).last().evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { left: r.left, right: innerWidth - r.right, bottom: innerHeight - r.bottom };
  });
  const wide = await edge();
  expect(Math.abs(wide.right - 24) <= 1 && Math.abs(wide.bottom - 24) <= 1, `on a wide screen the toast sits 24px from the corner, got ${JSON.stringify(wide)}`);
  await page.setViewportSize({ width: 375, height: 700 });
  await until(() => innerWidth === 375, null);
  const narrow = await edge();
  expect(Math.abs(narrow.left - 16) <= 1 && Math.abs(narrow.right - 16) <= 1 && Math.abs(narrow.bottom - 16) <= 1, `on a phone the toast spans the width 16px from the edges, got ${JSON.stringify(narrow)}`);
  await page.setViewportSize({ width: 1280, height: 900 });
  await until(() => innerWidth === 1280, null);

  const hint = dialog.getByRole("button", { name: "What does archive do?" });
  await hint.hover();
  expect(await until(() => document.querySelector("body > [role=tooltip]")?.matches(":popover-open"), null), "the tooltip opens as a popover while the dialog is open");
  expect(await tipPaints(), "a tooltip paints above the open dialog");
  const hinted = await hint.boundingBox();
  const tip = await page.locator("body > [role=tooltip]").evaluate((el, a) => {
    const t = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return { gap: a.y - t.bottom, off: t.left + t.width / 2 - (a.x + a.width / 2), margin: s.margin, overflow: s.overflow, padding: s.padding, border: s.borderTopWidth, position: s.position };
  }, hinted);
  expect(tip.gap >= 0 && tip.gap <= 10 && Math.abs(tip.off) <= 1, `the tooltip sits above its trigger, centered, got ${JSON.stringify(tip)}`);
  expect(tip.margin === "0px" && tip.overflow === "visible" && tip.padding === "4px 8px" && tip.border === "1px" && tip.position === "fixed", `the tooltip keeps its own box, got ${JSON.stringify(tip)}`);
  await page.keyboard.press("Escape");
  expect(await until(() => !document.querySelector("body > [role=tooltip]"), null), "Escape hides the tooltip");

  await page.keyboard.press("Escape");
  expect(await until(() => document.querySelector("#react-above-dialog dialog:modal") === null, null), "Escape closes the dialog");
  expect(await toastCount() === 2, "the toasts outlive the dialog");

  // A click on a toast above a centered dialog lands on the dialog outside its box, which is its backdrop.
  await over.getByRole("button", { name: "Open dialog" }).click();
  await archive.click();
  expect(await until((sel) => document.querySelectorAll(sel + " .sd-toast").length === 3 && document.querySelectorAll(sel + " .sd-toast")[2].getAnimations().length === 0, toaster), "a toast shows over the reopened dialog");
  const aimed = await lastToastCenter();
  await page.mouse.click(aimed.x, aimed.y);
  expect(await until(() => document.querySelector("#react-above-dialog dialog:modal") === null, null), "a click on a toast above a centered dialog closes the dialog through its backdrop");
  expect(await toastCount() === 3, "that click leaves the toasts alone");
  await over.getByRole("button", { name: "Clear toasts" }).click();
  expect(await until((sel) => !document.querySelector(sel + " .sd-toast"), toaster), "the toasts can be cleared once the dialog is closed");
  expect(await page.locator(toaster).evaluate((el) => el.matches(":popover-open")), "the toaster stays open with no toast in it");

  // A sheet ignores the click, and a toast's action works once the sheet is closed.
  const sheetOpen = () => page.evaluate(() => document.querySelector("dialog.sd-sheet:not(.sd-sheet-bottom)").open);
  await page.locator("#react-dialog").getByRole("button", { name: "Sheet", exact: true }).click();
  expect(await until(() => document.querySelector("dialog.sd-sheet:not(.sd-sheet-bottom)")?.open === true, null), "a sheet opens");
  // The toast buttons are inert behind the sheet, so call the click the way a script would.
  await page.evaluate(() => [...document.querySelectorAll("#react-toast button")].find((button) => button.textContent === "Toast with undo").click());
  expect(await until((sel) => document.querySelector(sel + " .sd-toast")?.getAnimations().length === 0, toaster), "a toast with an action shows above the sheet");
  const overSheet = await lastToastCenter();
  const sheetHit = await hitAt(overSheet);
  expect(sheetHit.tag === "DIALOG" && !sheetHit.inToaster, `a pointer over a toast above a sheet reaches the sheet, not the toast, got ${JSON.stringify(sheetHit)}`);
  await page.mouse.click(overSheet.x, overSheet.y);
  // A negative assertion: a click that closed the sheet would have done so by now.
  await new Promise((resolve) => setTimeout(resolve, 250));
  expect(await sheetOpen() && await toastCount() === 1, "a click on a toast above a sheet does nothing, not even to the toast");
  await page.keyboard.press("Escape");
  expect(await until(() => !document.querySelector("dialog.sd-sheet:not(.sd-sheet-bottom)").open, null), "Escape closes the sheet");
  await page.locator(toaster).getByRole("button", { name: "Undo" }).click();
  // The pointer rests where the toast was, and hovering the Restored toast that Undo shows would hold it on screen.
  await page.mouse.move(2, 2);
  expect(await until((sel) => !document.querySelector(sel + " .sd-toast"), toaster, 6000), "an action on a toast works once the modal is closed, and its own toast goes");

  // Only a modal dialog covers the toaster. Lifting it for any open dialog hides and shows it, and moves focus.
  await page.evaluate(() => {
    const plain = document.createElement("dialog");
    plain.id = "plain-dialog";
    plain.textContent = "Not modal";
    document.body.append(plain);
    plain.show();
    window.__toggles = [];
    document.querySelector(".sd-toaster").addEventListener("beforetoggle", (event) => window.__toggles.push(event.newState));
  });
  await page.locator("#react-toast").getByRole("button", { name: "Quick toast" }).click();
  expect(await until((sel) => document.querySelector(sel + " .sd-toast"), toaster), "a toast shows while a dialog that is not modal is open");
  expect(await page.evaluate(() => window.__toggles.length) === 0, `a toast beside a dialog that is not modal leaves the toaster alone, it toggled ${await page.evaluate(() => window.__toggles.join())}`);
  expect(await until((sel) => !document.querySelector(sel + " .sd-toast"), toaster, 5000), "the quick toast goes");
  await page.evaluate(() => document.getElementById("plain-dialog").remove());

  /* ---- Tooltip delay, className and onOpenChange ---- */
  const delayed = page.locator("#react-tooltip").getByRole("button", { name: "Delayed tip" });
  const delayedTip = page.locator("body > [role=tooltip]");
  const tipState = () => page.locator("#react-tooltip [data-tip-open]").textContent();
  await page.evaluate(() => {
    window.__tipsSeen = 0;
    new MutationObserver((records) => records.forEach((r) => r.addedNodes.forEach((n) => n.getAttribute?.("role") === "tooltip" && window.__tipsSeen++))).observe(document.body, { childList: true });
  });
  await delayed.scrollIntoViewIfNeeded();
  await delayed.hover();
  await page.mouse.move(2, 2);
  await new Promise((resolve) => setTimeout(resolve, 900));
  expect(await page.evaluate(() => window.__tipsSeen) === 0 && await tipState() === "delayed tip: hidden", "leaving before the delay is up shows no tooltip and reports nothing");
  const started = Date.now();
  await delayed.hover();
  expect(await until(() => document.querySelector("body > [role=tooltip]"), null, 4000), "resting on the trigger shows the tooltip after the delay");
  expect(Date.now() - started >= 600, `the tooltip waited for its 600ms delay, showed after ${Date.now() - started}ms`);
  expect(await delayedTip.textContent() === "Resolved in 12 ms" && await delayedTip.evaluate((el) => el.classList.contains("sd-tooltip") && el.classList.contains("sd-num")), "className is added to the tip beside sd-tooltip");
  expect(await tipState() === "delayed tip: shown", "onOpenChange reports the tip opening");
  await page.mouse.move(2, 2);
  expect(await until(() => !document.querySelector("body > [role=tooltip]"), null), "leaving hides the delayed tooltip at once");
  expect(await until(() => document.querySelector("#react-tooltip [data-tip-open]").textContent === "delayed tip: hidden", null), "onOpenChange reports the tip closing");
  await delayed.focus();
  expect(await until(() => document.querySelector("body > [role=tooltip]"), null, 450), "keyboard focus shows the tooltip without the delay");
  await page.keyboard.press("Escape");
  expect(await until(() => !document.querySelector("body > [role=tooltip]") && document.querySelector("#react-tooltip [data-tip-open]").textContent === "delayed tip: hidden", null), "Escape hides the tooltip and reports it");
  await delayed.blur();

  /* ---- Switch and Checkbox with no text ---- */
  const bare = page.locator("#react-forms [data-bare]");
  const mute = bare.getByRole("switch", { name: "Mute channel" });
  const row = bare.getByRole("checkbox", { name: "Select row" });
  const pinned = bare.getByRole("checkbox", { name: "Pinned" });
  expect(await mute.count() === 1 && await row.count() === 1 && await pinned.count() === 1, "aria-label and aria-labelledby name a switch or checkbox with no label");
  expect(await bare.locator("label.sd-check").count() === 3 && await bare.locator(".sd-check-text").count() === 0, "a control with no label renders no text span");
  expect(await row.isChecked() && !await mute.isChecked(), "defaultChecked reaches a bare checkbox");
  await mute.click();
  expect(await mute.isChecked(), "clicking a bare switch turns it on");
  await mute.press("Space");
  expect(!await mute.isChecked(), "Space turns a focused bare switch off");
  // In a block parent, as in a table cell, the label React renders for a bare control is as wide as the control and no wider.
  // Hand-written labels keep their width, whatever they hold, so markup that was full width before stays so.
  const widths = await page.evaluate(() => {
    const box = document.createElement("div");
    box.style.width = "400px";
    box.innerHTML = '<label class="sd-check"><input type="checkbox"><span class="sd-check-text">Text</span></label><label class="sd-check"><input type="checkbox"> Plain text</label><label class="sd-check"><input type="checkbox"><span>Own span</span></label><label class="sd-check"><input type="checkbox" aria-label="Pick"></label>';
    box.prepend(document.querySelector("#react-forms [data-bare] label.sd-check").cloneNode(true));
    document.body.append(box);
    const [bare, text, plain, own, nameless] = [...box.children].map((el) => el.getBoundingClientRect().width);
    box.remove();
    return { bare, text, plain, own, nameless };
  });
  expect(widths.bare < 40, `the click target of a bare React control is the control alone, got ${JSON.stringify(widths)}`);
  expect(widths.text === 400 && widths.plain === 400 && widths.own === 400 && widths.nameless === 400, `a hand-written label fills its parent, with a text span or without, got ${JSON.stringify(widths)}`);
  expect(await page.locator("#react-forms .sd-check-text").count() >= 3, "a control with a label still renders its text");

  /* ---- Dialog without a header, and unmountOnClose ---- */
  const naming = await page.evaluate(() => {
    const dialog = document.querySelector("#react-dialog dialog:has(textarea)");
    return { target: document.getElementById(dialog.getAttribute("aria-labelledby") ?? "")?.tagName, text: document.getElementById(dialog.getAttribute("aria-labelledby") ?? "")?.textContent, kept: dialog.querySelector("textarea") !== null, open: dialog.open };
  });
  expect(naming.target === "SPAN" && naming.text?.startsWith("Request changes"), `a dialog with a header is still named by it, got ${JSON.stringify(naming)}`);
  expect(!naming.open && naming.kept, "a closed dialog keeps its children by default");

  const bareBox = page.locator("#react-bare-dialog dialog").first();
  const bareName = () => bareBox.evaluate((el) => ({ label: el.getAttribute("aria-label"), by: el.getAttribute("aria-labelledby") }));
  expect(await bareBox.evaluate((el) => el.children.length) === 0, "a closed dialog that unmounts on close has no children");
  await page.locator("#react-bare-dialog").getByRole("button", { name: "Open bare dialog" }).click();
  expect(await until(() => document.querySelector("#react-bare-dialog dialog").open, null), "the dialog without a header opens");
  expect(await page.getByRole("dialog", { name: "Quick note" }).count() === 1, "aria-label names a dialog that has no header");
  expect(JSON.stringify(await bareName()) === JSON.stringify({ label: "Quick note", by: null }), `there is no aria-labelledby pointing at nothing, got ${JSON.stringify(await bareName())}`);
  const counter = bareBox.getByRole("button", { name: /^Clicked/ });
  await counter.click();
  await counter.click();
  expect(await counter.textContent() === "Clicked 2", "the children of an open dialog work");
  const fade = await page.evaluate(async () => {
    const dialog = document.querySelector("#react-bare-dialog dialog");
    dialog.close();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    return { kept: dialog.children.length > 0, fading: dialog.getAnimations().length > 0 };
  });
  expect(fade.kept || !fade.fading, `the children stay while the dialog fades out, got ${JSON.stringify(fade)}`);
  expect(await until(() => document.querySelector("#react-bare-dialog dialog").children.length === 0, null), "the children unmount once the dialog has faded out");
  await page.locator("#react-bare-dialog").getByRole("button", { name: "Open bare dialog" }).click();
  expect(await until(() => document.querySelector("#react-bare-dialog dialog").open, null), "the dialog opens again");
  expect(await bareBox.getByRole("button", { name: /^Clicked/ }).textContent() === "Clicked 0", "reopening mounts fresh children");
  expect(await until(() => document.activeElement?.closest("#react-bare-dialog dialog") !== null, null), "focus moves into the reopened dialog");
  await bareBox.getByRole("button", { name: "Done" }).click();
  expect(await until(() => !document.querySelector("#react-bare-dialog dialog").open && document.querySelector("#react-bare-dialog dialog").children.length === 0, null), "a close button closes it and the children go");

  await page.locator("#react-bare-dialog").getByRole("button", { name: "Open labeled dialog" }).click();
  const labeled = page.getByRole("dialog", { name: "Named by label" });
  expect(await labeled.count() === 1 && await labeled.getAttribute("aria-labelledby") === null, "an aria-label on a dialog with a header wins over the header");
  await page.keyboard.press("Escape");
  expect(await until(() => !document.querySelector("#react-bare-dialog dialog:modal"), null), "Escape closes the labeled dialog");

  expect(browserErrors.length === 0, `console errors: ${browserErrors.join(" | ")}`);
  return { errors, passed };
}
