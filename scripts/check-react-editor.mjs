/**
 * Behavior checks for the editor parts of signal-design/react, on
 * showcase/react-editor.html. Called from checkReact in check-react.mjs:
 *   checkReactEditor(page, base) -> { errors, passed }
 */
export async function checkReactEditor(page, base) {
  const errors = [];
  let passed = 0;
  const expect = (ok, message) => (ok ? passed++ : errors.push(message));
  const browserErrors = [];
  page.on("console", (m) => m.type() === "error" && browserErrors.push(m.text()));
  page.on("pageerror", (e) => browserErrors.push(e.message));
  const until = (fn, arg, timeout = 2000) => page.waitForFunction(fn, arg, { timeout }).then(() => true, () => false);
  const label = () => page.evaluate(() => document.activeElement?.getAttribute("aria-label") || document.activeElement?.textContent || "");

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`${base}react-editor.html`);
  await page.waitForSelector("#react-editor-chrome .sd-toolbar");
  expect(await page.evaluate(() => !document.documentElement.hasAttribute("data-sd-scrollbars")), "the editor page ran init(), so the bindings were not tested alone");

  /* ---- Toolbar ---- */
  const toolbar = page.locator("#react-editor-chrome [role=toolbar]");
  const button = (name) => toolbar.getByRole("button", { name, exact: true });
  const pressed = (name) => button(name).getAttribute("aria-pressed");
  const stops = () => toolbar.evaluate((el) => [...el.querySelectorAll("[data-roving]")].filter((b) => b.tabIndex === 0).map((b) => b.getAttribute("aria-label") || b.textContent));
  expect(await toolbar.getAttribute("aria-label") === "Formatting" && await toolbar.getAttribute("tabindex") === "0", "the toolbar is named and is its own tab stop until a button has had focus");
  await page.evaluate(() => document.querySelector(".sd-skip").focus());
  for (let i = 0; i < 30 && !(await toolbar.evaluate((el) => el.contains(document.activeElement))); i++) await page.keyboard.press("Tab");
  expect(await label() === "Bold", `Tab into the toolbar lands on the first button, got ${await label()}`);
  expect((await stops()).join() === "Bold" && await toolbar.getAttribute("tabindex") === "-1", `exactly one button is a tab stop once one has focus, got ${(await stops()).join()}`);
  await page.keyboard.press("ArrowRight");
  expect(await label() === "Italic" && (await stops()).join() === "Italic", `ArrowRight moves focus and the tab stop, got ${await label()}`);
  await page.keyboard.press("End");
  expect(await label() === "More formatting", `End jumps to the last button, got ${await label()}`);
  await page.keyboard.press("ArrowRight");
  expect(await label() === "Bold", `ArrowRight wraps to the first button, got ${await label()}`);
  await page.keyboard.press("ArrowLeft");
  expect(await label() === "More formatting", `ArrowLeft wraps to the last button, got ${await label()}`);
  await page.keyboard.press("ArrowLeft");
  expect(await label() === "Undo", `ArrowLeft skips the disabled Redo, got ${await label()}`);
  await page.keyboard.press("Home");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Tab");
  expect(!(await toolbar.evaluate((el) => el.contains(document.activeElement))), "Tab leaves the toolbar instead of visiting every button");
  await page.keyboard.press("Shift+Tab");
  expect(await label() === "Italic", `Shift+Tab returns to the last focused button, got ${await label()}`);

  expect(await pressed("Italic") === "true" && await pressed("Bold") === "false", "the toggles start in their state");
  await page.keyboard.press("Space");
  expect(await pressed("Italic") === "false", "Space on a focused toggle turns it off");
  await page.keyboard.press("Enter");
  expect(await pressed("Italic") === "true", "Enter on a focused toggle turns it on again");
  await button("Bold").click();
  expect(await pressed("Bold") === "true" && await pressed("Underline") === "false", "a click presses a toggle and leaves the others");
  await button("Heading 1").click();
  expect(await pressed("Heading 1") === "true" && await pressed("Text") === "false", "a block button presses itself and releases the one before it");
  expect(await button("Redo").isDisabled(), "a disabled button stays disabled");

  const more = button("More formatting");
  await more.focus();
  await page.keyboard.press("Enter");
  expect(await until(() => document.activeElement?.getAttribute("role") === "menuitem", null), "the overflow button opens its menu with focus on the first item");
  await page.keyboard.press("ArrowDown");
  expect(await label() === "Insert footnote", `arrows move inside the menu, not along the toolbar, got ${await label()}`);
  await page.keyboard.press("Escape");
  expect(await until(() => document.activeElement?.getAttribute("aria-label") === "More formatting", null), "Escape closes the overflow menu and returns focus to its button");

  /* ---- Status bar and manuscript ---- */
  const focusSegment = page.locator("#react-editor-chrome .sd-statusbar button", { hasText: "Focus mode" });
  expect(await focusSegment.getAttribute("aria-pressed") === "false", "a status segment with a handler is a toggle button");
  await focusSegment.click();
  expect(await focusSegment.getAttribute("aria-pressed") === "true", "a click presses the status segment");
  expect(await page.locator("#react-editor-chrome .sd-statusbar span.sd-statusbar-seg").count() === 3, "a segment without a handler is plain text");
  const page1 = await page.evaluate(() => {
    const r = document.querySelector("#react-editor-chrome .sd-manuscript-page").getBoundingClientRect();
    const scroller = document.querySelector("#react-editor-chrome .sd-manuscript");
    return { width: Math.round(r.width), centered: Math.abs(r.left - scroller.getBoundingClientRect().left - (scroller.clientWidth - r.width) / 2) < 2 };
  });
  expect(page1.width === 608 && page1.centered, `the page keeps its 38rem measure and sits centered, got ${JSON.stringify(page1)}`);

  await page.setViewportSize({ width: 375, height: 800 });
  const phone = await page.evaluate(() => {
    const bar = document.querySelector("#react-editor-chrome .sd-toolbar");
    const r = document.querySelector("#react-editor-chrome .sd-manuscript-page").getBoundingClientRect();
    return { scrolls: bar.scrollWidth > bar.clientWidth, page: Math.round(r.right), doc: document.documentElement.scrollWidth, view: innerWidth };
  });
  expect(phone.scrolls && phone.page <= phone.view && phone.doc <= phone.view, `on a phone the toolbar scrolls inside itself and the page shrinks to fit, got ${JSON.stringify(phone)}`);
  await page.setViewportSize({ width: 1280, height: 900 });

  /* ---- Marks ---- */
  const marks = page.locator("#react-editor-marks");
  const mark = (text) => marks.locator(".sd-mark", { hasText: text });
  const openComment = () => marks.locator("[data-open-comment]").textContent();
  const style = (locator, property) => locator.evaluate((el, name) => getComputedStyle(el)[name], property);
  expect(await mark("harbour").getAttribute("aria-current") === "true" && await mark("Boats").getAttribute("aria-current") === null, "the open comment is the only mark with aria-current");
  expect(await mark("harbour").evaluate((el) => el.tagName) === "MARK" && await mark("forty").evaluate((el) => el.tagName) === "DEL" && await mark("once more").evaluate((el) => el.tagName) === "INS", "the element follows the kind");
  expect(await style(mark("forty"), "textDecorationLine") === "line-through" && await style(mark("once more"), "textDecorationLine") === "underline", "a deletion is struck through and an insertion underlined");
  expect(await style(mark("Lisbon"), "textDecorationStyle") === "dotted" && await style(mark("gull"), "textDecorationStyle") === "dotted", "an entity and a resolved comment are dotted");
  const hues = await page.evaluate(() => {
    const color = (text) => getComputedStyle([...document.querySelectorAll("#react-editor-marks .sd-mark")].find((m) => m.textContent.includes(text))).textDecorationColor;
    return { insert: color("once more"), remove: color("forty"), comment: color("Boats"), open: color("harbour") };
  });
  expect(new Set(Object.values(hues)).size === 4, `insert, delete, comment and open comment each have their own underline color, got ${JSON.stringify(hues)}`);
  await mark("Boats").click();
  expect(await openComment() === "open comment: c2" && await mark("Boats").getAttribute("aria-current") === "true" && await mark("harbour").getAttribute("aria-current") === null, "a click on a comment mark opens it and closes the other");
  await mark("harbour").focus();
  await page.keyboard.press("Enter");
  expect(await openComment() === "open comment: c1", "Enter on a focused comment mark opens it");
  await mark("Boats").focus();
  await page.keyboard.press("Space");
  expect(await openComment() === "open comment: c2", "Space on a focused comment mark opens it");
  expect(await mark("@Jane").getAttribute("href") === "#marks" && await mark("@Jane").evaluate((el) => getComputedStyle(el).color !== getComputedStyle(el.closest("p")).color), "a mention is a link in the person's color");

  /* ---- Hover card ---- */
  const card = page.locator("body > .sd-hovercard");
  const entity = mark("Lisbon");
  const cardOpen = () => until(() => document.querySelector("body > .sd-hovercard")?.textContent.includes("Capital of Portugal"), null, 3000);
  const cardGone = () => until(() => !document.querySelector("body > .sd-hovercard"), null, 3000);
  const settle = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  expect(await card.count() === 0, "no hover card is in the document until one opens");
  await entity.hover();
  expect(await cardOpen(), "hovering the mark opens its card");
  const where = await page.evaluate(() => {
    const c = document.querySelector("body > .sd-hovercard").getBoundingClientRect();
    const t = [...document.querySelectorAll("#react-editor-marks .sd-mark")].find((m) => m.textContent === "Lisbon");
    const r = t.getBoundingClientRect();
    return { below: Math.round(c.top - r.bottom), above: Math.round(r.top - c.bottom), described: t.getAttribute("aria-describedby") === document.querySelector("body > .sd-hovercard").id, inView: c.left >= 0 && c.right <= innerWidth };
  });
  expect(where.described && where.inView && (where.below >= 0 && where.below <= 12 || where.above >= 0 && where.above <= 12), `the card sits next to its mark and describes it, got ${JSON.stringify(where)}`);
  const box = await card.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 4 });
  await settle(500);
  expect(await card.count() === 1, "the card stays open while the pointer is on it");
  await page.mouse.move(2, 2);
  expect(await cardGone(), "leaving the mark and the card closes it");
  await entity.hover();
  await cardOpen();
  await page.keyboard.press("Escape");
  expect(await cardGone(), "Escape closes a card opened by hover");
  await page.mouse.move(2, 2);
  await mark("Boats").focus();
  await entity.focus();
  expect(await cardOpen(), "keyboard focus opens the card at once");
  await page.keyboard.press("Escape");
  expect(await cardGone() && await entity.evaluate((el) => document.activeElement === el), "Escape closes a card opened by focus and keeps focus on the mark");
  await entity.focus();
  await cardOpen();
  await mark("harbour").focus();
  expect(await cardGone(), "moving focus away closes the card");

  expect(browserErrors.length === 0, `console errors on the editor page: ${browserErrors.join(" | ")}`);
  return { errors, passed };
}
