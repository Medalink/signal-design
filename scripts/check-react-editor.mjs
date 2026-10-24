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

  expect(browserErrors.length === 0, `console errors on the editor page: ${browserErrors.join(" | ")}`);
  return { errors, passed };
}
