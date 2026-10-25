/**
 * Behavior checks for the editor gap fillers of signal-design/react: the bottom
 * sheet and close label, the scroller ref, find and check marks, and the rest
 * as they land. Called from checkReact in check-react.mjs:
 *   checkReactGaps(page, base) -> { errors, passed }
 */
import { ICON_NAMES } from "../src/js/icons.js";

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
  const natural = await page.evaluate(() => [...document.querySelector("dialog.sd-sheet-bottom").children].reduce((sum, child) => sum + child.getBoundingClientRect().height, 0));
  expect(box.top > 0 && Math.abs(box.height - natural) <= 2 && box.height < box.viewportHeight * 0.4, `the bottom sheet is as tall as its content, got ${box.height} for ${natural} of content in ${box.viewportHeight}`);
  await page.evaluate(() => {
    const filler = document.createElement("div");
    filler.style.height = "3000px";
    document.querySelector("dialog.sd-sheet-bottom .sd-dialog-body").append(filler);
  });
  const capped = await pinned();
  expect(Math.abs(capped.height - capped.viewportHeight * 0.85) <= 2 && await page.evaluate(() => { const d = document.querySelector("dialog.sd-sheet-bottom"); return d.scrollHeight > d.clientHeight; }), `content taller than the screen stops at 85% and scrolls, got ${JSON.stringify(capped)}`);
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

  /* ---- Icons ---- */
  const icons = page.locator("#react-editor-icons");
  const set = icons.locator(".demo-icons li");
  expect(await set.count() === ICON_NAMES.length && await set.locator("svg.sd-icon[aria-hidden='true']").count() === ICON_NAMES.length, `the icon grid draws every icon, decorative, got ${await set.count()} of ${ICON_NAMES.length}`);
  const iconBar = icons.getByRole("toolbar", { name: "Icon toolbar", exact: true });
  const named = await iconBar.getByRole("button").evaluateAll((buttons) => buttons.map((b) => b.getAttribute("aria-label")));
  expect(named.join() === "Undo,Redo,Bold,Italic,Underline,Strikethrough,Comment,Assist,More formatting", `icon-only toolbar buttons are named by their label, got ${named.join()}`);
  expect(await iconBar.locator("svg.sd-icon").count() === named.length && await iconBar.locator("svg.sd-icon:not([aria-hidden='true'])").count() === 0, "an icon in a named button is decorative");
  const glyph = await iconBar.getByRole("button", { name: "Bold", exact: true }).locator("svg").evaluate((svg) => {
    const box = svg.getBoundingClientRect();
    const s = getComputedStyle(svg.querySelector("path"));
    return { width: box.width, height: box.height, cap: s.strokeLinecap, join: s.strokeLinejoin, fill: s.fill, stroke: s.stroke !== "none" };
  });
  expect(glyph.width > 12 && glyph.width === glyph.height && glyph.cap === "square" && glyph.join === "miter" && glyph.fill === "none" && glyph.stroke, `an icon is a square, outlined with square caps, got ${JSON.stringify(glyph)}`);
  await iconBar.getByRole("button", { name: "Italic", exact: true }).focus();
  await page.keyboard.press("Space");
  expect(await iconBar.getByRole("button", { name: "Italic", exact: true }).getAttribute("aria-pressed") === "false", "an icon button still toggles");
  expect(await icons.locator(".sd-icon-text").first().evaluate((el) => el.textContent.trim() === "Not saved" && el.querySelector("svg").getAttribute("aria-hidden") === "true"), "an icon beside text is decorative");

  /* ---- Tree row actions ---- */
  const chapterDemo = page.locator("#react-editor-tree-actions");
  const chapterTree = chapterDemo.getByRole("tree", { name: "Chapters", exact: true });
  const chapterItems = chapterTree.getByRole("treeitem");
  const chapterState = () => chapterDemo.locator("[data-tree-actions-state]").textContent();
  const chapterFocus = () => page.evaluate(() => document.activeElement?.dataset.treeId ?? document.activeElement?.tagName);
  const restore = () => chapterDemo.getByRole("button", { name: "Restore chapters", exact: true }).click();
  expect(await chapterItems.count() === 4 && await chapterItems.evaluateAll((all) => all.slice(0, 3).every((item) => item.getAttribute("aria-keyshortcuts") === "F2 Delete") && !all[3].hasAttribute("aria-keyshortcuts")), "an item with actions lists their keys in aria-keyshortcuts, a disabled one lists none");
  expect(await chapterTree.getByRole("button").count() === 0 && await chapterTree.locator(".sd-tree-actions").evaluateAll((all) => all.length === 3 && all.every((el) => el.getAttribute("aria-hidden") === "true" && [...el.querySelectorAll("button")].every((b) => b.tabIndex === -1))), "the row buttons are hidden from assistive technology and out of the tab order, so a treeitem holds none");
  await chapterItems.first().focus();
  const actionsDisplay = (index) => chapterItems.nth(index).locator(":scope > .sd-tree-row > .sd-tree-actions").evaluate((el) => getComputedStyle(el).display);
  expect(await actionsDisplay(1) === "none" && await actionsDisplay(0) !== "none", "actions show on the selected row and stay hidden on the others");
  await page.keyboard.press("F2");
  expect(await chapterState() === "selected: ch-1 · last action: rename ch-1", `F2 runs Rename on the focused item, got ${await chapterState()}`);
  await page.keyboard.press("Shift+Delete");
  await page.keyboard.press("Control+Delete");
  expect(await chapterState() === "selected: ch-1 · last action: rename ch-1" && await chapterItems.count() === 4, "a key with a modifier runs nothing");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Delete");
  expect(await chapterItems.count() === 3 && await chapterState() === "selected: ch-1 · last action: delete ch-2", `Delete removes the focused item, got ${await chapterState()}`);
  expect(await until(() => document.activeElement?.dataset.treeId === "ch-3", null), `focus goes to the next item when the focused one is removed, got ${await chapterFocus()}`);
  await page.keyboard.press("Delete");
  expect(await until(() => document.activeElement?.dataset.treeId === "ch-1", null), `focus goes to the previous item when the last one that can be removed is, got ${await chapterFocus()}`);
  await page.keyboard.press("Tab");
  await page.keyboard.press("Shift+Tab");
  expect(await chapterFocus() === "ch-1", `the tree is still one tab stop that returns to the item, got ${await chapterFocus()}`);
  await restore();
  expect(await chapterItems.count() === 4, "restoring brings the chapters back");
  const secondRow = chapterItems.nth(1).locator(":scope > .sd-tree-row");
  await secondRow.hover();
  expect(await secondRow.locator(".sd-tree-actions").evaluate((el) => getComputedStyle(el).display) === "flex", "hover shows the row's buttons");
  await secondRow.locator("button[title^='Rename']").click();
  expect(await chapterState() === "selected: ch-1 · last action: rename ch-2", `a click on a row button runs the action without selecting the row, got ${await chapterState()}`);
  expect(await secondRow.locator("button[title^='Delete']").getAttribute("data-tone") === "danger", "a destructive action is toned danger");
  await secondRow.locator("button[title^='Delete']").click();
  expect(await chapterItems.count() === 3 && await chapterState() === "selected: ch-1 · last action: delete ch-2", "a click on Delete removes the item");
  await restore();

  /* ---- Resizable panels ---- */
  const rzDemo = page.locator("#react-editor-resizable");
  const rzHandle = (name) => rzDemo.getByRole("separator", { name: `Resize ${name}`, exact: true });
  const rzState = () => rzDemo.locator("[data-resize-state]").textContent();
  const rzSize = (name) => rzDemo.locator(`#resizable-${name}`).evaluate((el, vertical) => Math.round(vertical ? el.getBoundingClientRect().height : el.getBoundingClientRect().width), name === "dock");
  // The panel and its handle agree on `size`: React commits a pointer move after the mouse call returns, so poll.
  const rzIs = (name, size) => until(({ id, size, vertical }) => {
    const box = document.getElementById(id).getBoundingClientRect();
    const handle = document.querySelector(`#${id} > [role=separator]`);
    return Math.round(vertical ? box.height : box.width) === size && Number(handle.getAttribute("aria-valuenow")) === size;
  }, { id: `resizable-${name}`, size, vertical: name === "dock" });
  const rzDrag = async (name, delta, release = true) => {
    const box = await rzHandle(name).boundingBox();
    const [x, y] = [box.x + box.width / 2, box.y + box.height / 2];
    const vertical = name === "dock";
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(vertical ? x : x + delta / 2, vertical ? y + delta / 2 : y, { steps: 4 });
    await page.mouse.move(vertical ? x : x + delta, vertical ? y + delta : y, { steps: 4 });
    if (release) await page.mouse.up();
  };
  await rzDemo.scrollIntoViewIfNeeded();
  expect(await rzHandle("binder").evaluate((el) => [el.getAttribute("aria-orientation"), el.getAttribute("aria-valuemin"), el.getAttribute("aria-valuemax"), el.getAttribute("aria-valuenow"), el.tabIndex, el.getAttribute("aria-controls")].join()) === "vertical,160,360,200,0,resizable-binder", "the handle is a focusable vertical separator that names its panel and its range");
  expect(await rzHandle("dock").getAttribute("aria-orientation") === "horizontal", "a handle on a top edge is a horizontal separator");
  expect(await rzIs("binder", 200) && await rzIs("inspector", 240) && await rzIs("dock", 96), "each panel starts at its size");
  await rzDrag("binder", 60, false);
  expect(await rzDemo.locator("#resizable-binder").evaluate((el) => "resizing" in el.dataset) && await rzHandle("binder").evaluate((el) => document.activeElement === el), "a drag marks the panel and focuses the handle");
  await page.mouse.up();
  expect(await rzIs("binder", 260) && await rzState() === "binder 260 · inspector 240 · dock 96", `dragging an end handle by 60px grows the panel by 60, got ${await rzSize("binder")}, ${await rzState()}`);
  expect(await until(() => !("resizing" in document.getElementById("resizable-binder").dataset), null), "releasing the pointer ends the drag");
  await rzDrag("binder", 500);
  expect(await rzIs("binder", 360), "a drag stops at maxSize");
  await rzDrag("binder", -500);
  expect(await rzIs("binder", 160), "a drag stops at minSize");
  await rzDrag("inspector", -50);
  expect(await rzIs("inspector", 290), `dragging a start handle toward its neighbor grows the panel, got ${await rzSize("inspector")}`);
  await rzDrag("inspector", 90);
  expect(await rzIs("inspector", 200), "and dragging it away shrinks it");
  await rzDrag("dock", -30);
  expect(await rzIs("dock", 126), `dragging a top handle up grows the dock, got ${await rzSize("dock")}`);
  await rzDrag("dock", 300);
  expect(await rzIs("dock", 64), "and dragging it down stops at minSize");

  await rzHandle("binder").focus();
  await page.keyboard.press("End");
  expect(await rzIs("binder", 360), "End goes to maxSize");
  await page.keyboard.press("Home");
  expect(await rzIs("binder", 160), "Home goes to minSize");
  await page.keyboard.press("ArrowRight");
  expect(await rzIs("binder", 176), "ArrowRight grows an end panel by one step");
  await page.keyboard.press("Shift+ArrowRight");
  expect(await rzIs("binder", 240), "Shift multiplies the step by four");
  await page.keyboard.press("ArrowLeft");
  expect(await rzIs("binder", 224), "ArrowLeft shrinks it, and the panel follows the value");
  await page.keyboard.press("ArrowDown");
  expect(await rzIs("binder", 224), "keys of the other axis do nothing");
  await rzHandle("inspector").focus();
  await page.keyboard.press("ArrowLeft");
  expect(await rzIs("inspector", 216), "ArrowLeft grows a start panel, whose neighbor is on its left");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  expect(await rzIs("inspector", 184), "ArrowRight shrinks it");
  await rzHandle("dock").focus();
  await page.keyboard.press("ArrowUp");
  expect(await rzIs("dock", 80), "ArrowUp grows a top-edge panel");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowLeft");
  expect(await rzIs("dock", 64), "ArrowDown shrinks it and ArrowLeft does nothing");

  await rzHandle("binder").focus();
  await page.keyboard.press("End");
  await rzDemo.locator("#resizable-row").evaluate((el) => el.setAttribute("dir", "rtl"));
  await rzDrag("binder", 40);
  expect(await rzIs("binder", 320), `in right-to-left text an end handle is on the left, so dragging right shrinks it, got ${await rzSize("binder")}`);
  await page.keyboard.press("ArrowRight");
  expect(await rzIs("binder", 304), "and so does ArrowRight");
  await rzDemo.locator("#resizable-row").evaluate((el) => el.removeAttribute("dir"));
  await rzHandle("binder").focus();
  await page.keyboard.press("Home");
  await page.keyboard.press("Shift+ArrowRight");
  await page.keyboard.press("Shift+ArrowRight");
  expect(await rzIs("binder", 288), "the panel can be put back");

  /* ---- Hover card host ---- */
  const hostDemo = page.locator("#react-editor-hostcard");
  const hostCards = page.locator(".sd-hovercard");
  const hostTrigger = (key) => hostDemo.locator(`[data-entity="${key}"]`);
  const hostIs = (text) => until((text) => document.querySelector("#react-editor-hostcard [data-host-state]").textContent === text, text);
  const hostCount = (count) => until((count) => document.querySelectorAll(".sd-hovercard").length === count, count, 3000);
  await hostDemo.scrollIntoViewIfNeeded();
  expect(await hostCards.count() === 0, "a host that was not asked to show renders no card");
  await hostTrigger("lisbon").hover();
  expect(await hostCount(1), "hovering a trigger React did not render shows the card after the owner's delay");
  const placed = await page.evaluate(() => {
    const card = document.querySelector(".sd-hovercard");
    const trigger = document.querySelector('#react-editor-hostcard [data-entity="lisbon"]');
    const anchor = trigger.getBoundingClientRect();
    const box = card.getBoundingClientRect();
    return { gap: box.top - anchor.bottom, shift: box.left - anchor.left, role: card.getAttribute("role"), label: card.getAttribute("aria-label"), described: card.id !== "" && trigger.getAttribute("aria-describedby") === card.id, text: card.textContent };
  });
  expect(placed.gap >= 0 && placed.gap < 16 && Math.abs(placed.shift) <= 2, `the card sits just below its anchor, aligned to its start: ${JSON.stringify(placed)}`);
  expect(placed.role === "tooltip" && placed.label === "Place" && placed.described && /Capital of Portugal/.test(placed.text), `the card has its label and content, and describes the trigger: ${JSON.stringify(placed)}`);
  const onCard = await hostCards.boundingBox();
  await page.mouse.move(onCard.x + onCard.width / 2, onCard.y + onCard.height / 2, { steps: 5 });
  await page.waitForTimeout(450);
  expect(await hostCards.count() === 1, "moving the pointer onto the card keeps it open");
  await page.mouse.move(4, 4, { steps: 3 });
  expect(await hostCount(0) && await hostIs("closed") && await hostTrigger("lisbon").getAttribute("aria-describedby") === null, "leaving the card closes it, and onOpenChange cleans up the trigger");
  await hostTrigger("ines").focus();
  expect(await until(() => document.querySelectorAll(".sd-hovercard").length === 1 && /Translator/.test(document.querySelector(".sd-hovercard").textContent), null), "focus on a trigger opens its card at once");
  await hostTrigger("lisbon").focus();
  expect(await until(() => document.querySelectorAll(".sd-hovercard").length === 1 && /Capital of Portugal/.test(document.querySelector(".sd-hovercard").textContent), null) && await hostIs("open: lisbon"), "showing again replaces the card instead of stacking another");
  await page.keyboard.press("Escape");
  expect(await hostCount(0) && await hostIs("closed"), "Escape closes it at once");
  await hostDemo.getByRole("button", { name: "Preview at a range", exact: true }).click();
  expect(await hostCount(1) && await hostDemo.getByRole("button", { name: "Hide", exact: true }).isVisible(), "show() takes a function that returns a rect");
  await page.evaluate(() => {
    window.rangeAnchor = () => {
      const text = document.querySelector("#react-editor-hostcard [data-range]").firstChild;
      const range = document.createRange();
      range.setStart(text, 2);
      range.setEnd(text, 9);
      const anchor = range.getBoundingClientRect();
      const card = document.querySelector(".sd-hovercard").getBoundingClientRect();
      return { gap: Math.round(anchor.top - card.bottom), center: Math.round(card.left + card.width / 2 - (anchor.left + anchor.width / 2)), top: Math.round(anchor.top) };
    };
  });
  const above = await page.evaluate(() => ({ ...window.rangeAnchor(), label: document.querySelector(".sd-hovercard").getAttribute("aria-label") }));
  expect(above.gap >= 0 && above.gap < 16 && Math.abs(above.center) <= 2 && above.label === "Range preview", `side and align place the card above the middle of the range: ${JSON.stringify(above)}`);
  await page.evaluate(() => {
    let scroller = document.querySelector("#react-editor-hostcard");
    while (scroller && !(scroller.scrollHeight > scroller.clientHeight && /auto|scroll/.test(getComputedStyle(scroller).overflowY))) scroller = scroller.parentElement;
    (scroller ?? document.scrollingElement).scrollBy(0, 40);
  });
  expect(await until((was) => { const now = window.rangeAnchor(); return now.top !== was.top && now.gap === was.gap && now.center === was.center; }, above), `the card follows its anchor when the page scrolls, was ${JSON.stringify(above)}, is ${JSON.stringify(await page.evaluate(() => window.rangeAnchor()))}`);
  await hostDemo.getByRole("button", { name: "Hide", exact: true }).click();
  expect(await hostCount(0), "hide() closes the card after its delay");

  /* ---- Gutter markers ---- */
  const gutter = page.locator("#react-editor-gutter");
  const markers = gutter.locator(".sd-gutter-marker");
  const where = (index) => markers.nth(index).evaluate((marker) => {
    const box = marker.getBoundingClientRect();
    const block = marker.parentElement.getBoundingClientRect();
    const page = marker.closest(".sd-manuscript-page").getBoundingClientRect();
    const s = getComputedStyle(marker);
    return { left: box.left, right: box.right, top: box.top, bottom: box.bottom, width: box.width, blockLeft: block.left, blockRight: block.right, blockTop: block.top, pageLeft: page.left, pageRight: page.right, line: parseFloat(getComputedStyle(marker.parentElement).lineHeight), border: s.borderTopWidth, style: s.borderTopStyle, color: s.color };
  });
  expect(await markers.count() === 4, `four markers, got ${await markers.count()}`);
  const end = await where(0);
  expect(end.left >= end.blockRight - 0.5 && end.right <= end.pageRight + 0.5, `a marker sits in the trailing margin, inside the page: ${JSON.stringify(end)}`);
  expect(end.top >= end.blockTop - 1 && end.bottom <= end.blockTop + end.line + 1, "a marker is level with the first line of its block");
  expect(end.width >= 24, `a marker is at least 24px wide, got ${end.width}`);
  const start = await where(3);
  expect(start.right <= start.blockLeft + 0.5 && start.left >= start.pageLeft - 0.5, `data-side=start puts the marker in the leading margin, inside the page: ${JSON.stringify(start)}`);
  expect(await gutter.getByRole("button", { name: "2 comments", exact: true }).count() === 1 && await gutter.getByRole("button", { name: "1 suggestion", exact: true }).count() === 1, "a marker is a button named by its label");
  const [open0, suggestion, resolved] = [await where(0), await where(1), await where(2)];
  expect(open0.border === "2px" && suggestion.border === "1px" && suggestion.style === "dashed" && open0.style === "solid", `the open marker has a heavier solid edge and a suggestion a dashed one: ${JSON.stringify([open0, suggestion])}`);
  expect(resolved.color !== suggestion.color, "a resolved marker is drawn faint");
  const openThread = () => page.locator("[data-open-thread]").textContent();
  expect(await markers.nth(0).getAttribute("aria-current") === "true" && await openThread() === "open thread: a", "the open marker carries aria-current");
  await markers.nth(1).click();
  expect(await markers.nth(1).getAttribute("aria-current") === "true" && await markers.nth(0).getAttribute("aria-current") === null && await openThread() === "open thread: b", "a click opens another thread and moves aria-current");
  await markers.nth(2).focus();
  await page.keyboard.press("Enter");
  expect(await openThread() === "open thread: c", "Enter on a focused marker opens its thread");
  await markers.nth(3).focus();
  await page.keyboard.press("Space");
  expect(await openThread() === "open thread: d", "Space on a focused marker opens its thread");
  await page.setViewportSize({ width: 375, height: 900 });
  const narrow = await where(0);
  expect(narrow.right <= narrow.pageRight + 1 && narrow.left >= narrow.blockRight - 0.5, `at 375px the marker still sits inside the page margin: ${JSON.stringify(narrow)}`);
  await page.setViewportSize({ width: 1280, height: 900 });

  /* ---- Weighted bar ---- */
  const bar = page.locator("#react-editor-weighted .sd-weighted");
  const shares = () => bar.evaluate((el) => {
    const kids = [...el.children];
    const weights = kids.map((k) => Number(getComputedStyle(k).getPropertyValue("--weight")));
    const total = weights.reduce((a, b) => a + b, 0);
    const room = el.getBoundingClientRect().width - (kids.length - 1) * parseFloat(getComputedStyle(el).columnGap);
    return { states: kids.map((k) => k.dataset.state).join(), off: Math.max(...kids.map((k, i) => Math.abs(k.getBoundingClientRect().width - (room * weights[i]) / total))) };
  });
  const before = await shares();
  expect(before.states === "drafted,drafted,current,planned,open" && before.off <= 1, `with a goal the bar ends in an open segment and sizes by weight, got ${JSON.stringify(before)}`);
  expect(await bar.getAttribute("role") === "img" && /of 80,000 words/.test(await bar.getAttribute("aria-label")), "the bar is an image named with its numbers");
  await page.locator("#react-editor-weighted").getByRole("button", { name: /^Goal/ }).click();
  expect(await until(() => document.querySelector("#react-editor-weighted .sd-weighted").children.length === 4, null), "a goal the segments already reach leaves no open segment");
  const after = await shares();
  expect(after.off <= 1, `the segments still size by weight, got ${JSON.stringify(after)}`);

  expect(browserErrors.length === 0, `console errors: ${browserErrors.join(" | ")}`);
  return { errors, passed };
}
