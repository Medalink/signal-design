/**
 * Behavior checks for the editor gap fillers of signal-design/react: the bottom
 * sheet and close label, the scroller ref, find and check marks, and the rest
 * as they land. Called from checkReact in check-react.mjs:
 *   checkReactGaps(page, base) -> { errors, passed }
 */
export async function checkReactGaps(page, base) {
  const errors = [];
  let passed = 0;
  const expect = (ok, message) => (ok ? passed++ : errors.push(message));
  const browserErrors = [];
  page.on("console", (m) => m.type() === "error" && browserErrors.push(m.text()));
  page.on("pageerror", (e) => browserErrors.push(e.message));
  const until = (fn, arg, timeout = 2000) => page.waitForFunction(fn, arg, { timeout }).then(() => true, () => false);

  /* ---- Bottom sheet and close label ---- */
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`${base}react.html`);
  await page.waitForSelector("#react-dialog");
  const opener = (label) => page.locator("#react-dialog").getByRole("button", { name: label, exact: true });
  const bottom = page.locator("dialog.sd-sheet-bottom");
  // From the keyboard: WebKit does not focus a button on click, so only a focused opener can get focus back.
  await opener("Bottom sheet").focus();
  await page.keyboard.press("Enter");
  expect(await until(() => document.querySelector("dialog.sd-sheet-bottom")?.open === true, null), "the bottom sheet opens");
  const pinned = () => page.evaluate(() => {
    const r = document.querySelector("dialog.sd-sheet-bottom").getBoundingClientRect();
    return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, height: r.height, width: r.width, viewportWidth: innerWidth, viewportHeight: innerHeight };
  });
  expect(await until(() => { const r = document.querySelector("dialog.sd-sheet-bottom").getBoundingClientRect(); return Math.abs(r.bottom - innerHeight) <= 1 && Math.abs(r.width - innerWidth) <= 1; }, null), `the bottom sheet is pinned to the bottom edge and spans the width, got ${JSON.stringify(await pinned())}`);
  const box = await pinned();
  expect(box.top > 0 && box.height <= box.viewportHeight * 0.85 + 1, `the bottom sheet is as tall as its content, under 85% of the screen, got ${JSON.stringify(box)}`);
  expect(await page.evaluate(() => document.querySelector("dialog.sd-sheet-bottom").contains(document.activeElement)), "focus moves into the bottom sheet");
  expect(await bottom.getByRole("button", { name: "Close inspector", exact: true }).count() === 1 && await bottom.getByRole("button", { name: "Close", exact: true }).count() === 0, "the sheet's close button takes the name from closeLabel");
  await page.keyboard.press("Escape");
  expect(await until(() => document.querySelector("dialog.sd-sheet-bottom").open === false, null), "Escape closes the bottom sheet");
  expect(await until(() => document.activeElement?.textContent === "Bottom sheet", null), `focus returns to the button that opened the bottom sheet, got ${await page.evaluate(() => document.activeElement?.textContent)}`);

  await opener("Bottom sheet").click();
  await page.locator("dialog.sd-sheet-bottom").getByRole("button", { name: "Close inspector", exact: true }).click();
  expect(await until(() => document.querySelector("dialog.sd-sheet-bottom").open === false, null), "the renamed close button still closes the sheet");

  await opener("Sheet").click();
  const side = page.locator("dialog.sd-sheet:not(.sd-sheet-bottom)");
  expect(await until(() => document.querySelector("dialog.sd-sheet:not(.sd-sheet-bottom)")?.open === true, null) && await side.getByRole("button", { name: "Close", exact: true }).count() === 1, "a header without closeLabel keeps the name Close");
  await page.keyboard.press("Escape");
  await until(() => document.querySelector("dialog.sd-sheet:not(.sd-sheet-bottom)").open === false, null);

  await page.setViewportSize({ width: 375, height: 700 });
  await opener("Bottom sheet").click();
  expect(await until(() => { const r = document.querySelector("dialog.sd-sheet-bottom").getBoundingClientRect(); return document.querySelector("dialog.sd-sheet-bottom").open && Math.abs(r.width - 375) <= 1 && Math.abs(r.bottom - innerHeight) <= 1; }, null), "the bottom sheet fills a phone width and sits on the bottom edge");
  await page.keyboard.press("Escape");
  await until(() => document.querySelector("dialog.sd-sheet-bottom").open === false, null);
  await page.setViewportSize({ width: 1280, height: 900 });

  /* ---- Scroller ref and find and check marks ---- */
  await page.goto(`${base}react-editor.html`);
  await page.waitForSelector("#react-editor-chrome .sd-toolbar");
  await page.locator("#react-editor-chrome").getByRole("button", { name: "Jump to end", exact: true }).click();
  expect(await until(() => { const s = document.querySelector("#react-editor-chrome .sd-manuscript"); return s.scrollTop > 0 && s.scrollTop + s.clientHeight >= s.scrollHeight - 1; }, null), "wrapRef is the scroller element, so scrolling it scrolls the manuscript");

  const marks = page.locator("#react-editor-marks .sd-manuscript-page");
  const finds = marks.locator('mark[data-mark="find"]');
  const checks = marks.locator('span[data-mark="check"]');
  expect(await finds.count() === 2 && await checks.count() === 2, `find marks are <mark> and check marks are <span>, got ${await finds.count()} and ${await checks.count()}`);
  const look = (locator) => locator.evaluate((el) => {
    const s = getComputedStyle(el);
    return { current: el.getAttribute("aria-current"), outline: s.outlineStyle, line: s.textDecorationLine, style: s.textDecorationStyle, thickness: s.textDecorationThickness, fill: s.backgroundColor };
  });
  const first = await look(finds.nth(0));
  const second = await look(finds.nth(1));
  expect(first.current === "true" && second.current === null, `the current find match carries aria-current, got ${first.current} and ${second.current}`);
  expect(first.outline !== second.outline && first.thickness !== second.thickness && first.fill !== second.fill, `the current find match differs by outline, line weight and fill, not by color alone: ${JSON.stringify([first, second])}`);
  expect(second.line === "none" && first.line.includes("underline"), `a find match has no underline until it is current, got ${second.line} and ${first.line}`);
  await finds.nth(1).click();
  expect(await finds.nth(1).getAttribute("aria-current") === "true" && await finds.nth(0).getAttribute("aria-current") === null, "choosing another match moves the current one");
  const flagged = await look(checks.nth(0));
  const plain = await look(checks.nth(1));
  expect(flagged.current === "true" && plain.current === null && plain.style === "dashed" && flagged.style === "solid", `a check match is dashed and the current one is solid, got ${JSON.stringify([flagged, plain])}`);
  expect(flagged.outline !== plain.outline && flagged.thickness !== plain.thickness, "the current check match differs by outline and line weight");
  await checks.nth(1).focus();
  await page.keyboard.press("Enter");
  expect(await checks.nth(1).getAttribute("aria-current") === "true", "a match is a button: Enter makes it current");

  expect(browserErrors.length === 0, `console errors: ${browserErrors.join(" | ")}`);
  return { errors, passed };
}
