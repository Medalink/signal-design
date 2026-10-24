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

  /* ---- Document tree ---- */
  const tree = page.locator("#react-editor-tree [role=tree]");
  const item = (id) => page.locator(`#react-editor-tree [data-tree-id="${id}"]`);
  const row = (id) => item(id).locator("> .sd-tree-row");
  const focusedId = () => page.evaluate(() => document.activeElement?.dataset?.treeId ?? "");
  const order = () => page.evaluate(() => [...document.querySelectorAll("#react-editor-tree [role=treeitem]")].map((li) => li.dataset.treeId).join());
  const treeState = () => page.locator("#react-editor-tree [data-tree-state]").textContent();
  const treeStops = () => page.evaluate(() => [...document.querySelectorAll("#react-editor-tree [role=treeitem]")].filter((li) => li.tabIndex === 0).map((li) => li.dataset.treeId).join());
  expect(await tree.getAttribute("aria-label") === "Manuscript" && await tree.getAttribute("tabindex") === "0", "the tree is named and is its own tab stop until an item has had focus");
  expect(await order() === "part-1,ch-1,ch-2,ch-3,part-2,notes", `a collapsed branch renders none of its children, got ${await order()}`);
  expect(await item("part-1").getAttribute("aria-expanded") === "true" && await item("part-2").getAttribute("aria-expanded") === "false" && await item("notes").getAttribute("aria-expanded") === null, "a branch reports aria-expanded and a leaf does not");
  expect(await item("part-1").getAttribute("aria-level") === "1" && await item("ch-1").getAttribute("aria-level") === "2", "aria-level follows the nesting");
  expect(await item("ch-1").getAttribute("aria-selected") === "true" && await page.locator("#react-editor-tree [aria-selected=true]").count() === 1, "exactly one item is selected");
  await page.locator("#react-editor-marks .sd-mark", { hasText: "Lisbon" }).focus();
  for (let i = 0; i < 6 && !(await tree.evaluate((el) => el.contains(document.activeElement))); i++) await page.keyboard.press("Tab");
  expect(await focusedId() === "ch-1", `Tab into the tree lands on the selected item, got ${await focusedId()}`);
  expect(await treeStops() === "ch-1" && await tree.getAttribute("tabindex") === "-1", `exactly one item is a tab stop once one has focus, got ${await treeStops()}`);
  await page.keyboard.press("ArrowDown");
  expect(await focusedId() === "ch-2", `ArrowDown moves to the next visible item, got ${await focusedId()}`);
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowUp");
  expect(await focusedId() === "part-1", `ArrowUp moves to the one before, got ${await focusedId()}`);
  await page.keyboard.press("ArrowUp");
  expect(await focusedId() === "part-1", "ArrowUp on the first item stays on it");
  await page.keyboard.press("End");
  expect(await focusedId() === "notes", `End jumps to the last visible item, got ${await focusedId()}`);
  await page.keyboard.press("ArrowDown");
  expect(await focusedId() === "notes", "ArrowDown on the last item stays on it");
  await page.keyboard.press("Home");
  expect(await focusedId() === "part-1", `Home jumps to the first item, got ${await focusedId()}`);
  await page.keyboard.press("ArrowLeft");
  expect(await item("part-1").getAttribute("aria-expanded") === "false" && await order() === "part-1,part-2,notes" && await focusedId() === "part-1", "ArrowLeft on an open branch closes it and keeps focus");
  await page.keyboard.press("ArrowLeft");
  expect(await focusedId() === "part-1", "ArrowLeft on a closed top level branch stays put");
  await page.keyboard.press("ArrowRight");
  expect(await item("part-1").getAttribute("aria-expanded") === "true" && await focusedId() === "part-1" && await order() === "part-1,ch-1,ch-2,ch-3,part-2,notes", "ArrowRight on a closed branch opens it and keeps focus");
  await page.keyboard.press("ArrowRight");
  expect(await focusedId() === "ch-1", `ArrowRight on an open branch moves to its first child, got ${await focusedId()}`);
  await page.keyboard.press("ArrowRight");
  expect(await focusedId() === "ch-1", "ArrowRight on a leaf does nothing");
  await page.keyboard.press("ArrowLeft");
  expect(await focusedId() === "part-1", `ArrowLeft on a child moves to its parent, got ${await focusedId()}`);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  expect((await treeState()).startsWith("selected: ch-2") && await item("ch-2").getAttribute("aria-selected") === "true" && await item("ch-1").getAttribute("aria-selected") === "false", "Enter selects the focused item and releases the one before");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Space");
  expect((await treeState()).startsWith("selected: part-2") && await order() === "part-1,ch-1,ch-2,ch-3,part-2,ch-4,ch-5,notes", `Space selects, and ArrowRight opened Part two, got ${await order()}`);
  await page.keyboard.press("Tab");
  expect(!(await tree.evaluate((el) => el.contains(document.activeElement))), "Tab leaves the tree instead of visiting every item");
  await page.keyboard.press("Shift+Tab");
  expect(await focusedId() === "part-2", `Shift+Tab returns to the last focused item, got ${await focusedId()}`);

  await row("part-2").locator(".sd-tree-toggle").click();
  expect(await item("part-2").getAttribute("aria-expanded") === "false" && (await treeState()).startsWith("selected: part-2"), "a click on the chevron closes the branch without selecting another item");
  await row("ch-3").click();
  expect((await treeState()).startsWith("selected: ch-3"), "a click on a row selects it");

  await item("ch-3").focus();
  await page.keyboard.press("Alt+ArrowUp");
  expect(await order() === "part-1,ch-1,ch-3,ch-2,part-2,notes" && (await treeState()).endsWith("moved: ch-3 before ch-2"), `Alt+ArrowUp reports a move before the sibling above and the app reorders, got ${await order()} / ${await treeState()}`);
  expect(await until(() => document.activeElement?.dataset?.treeId === "ch-3", null), "the moved item keeps focus");
  await page.keyboard.press("Alt+ArrowDown");
  await page.keyboard.press("Alt+ArrowDown");
  expect(await order() === "part-1,ch-1,ch-2,ch-3,part-2,notes" && (await treeState()).endsWith("moved: ch-3 after ch-2"), `Alt+ArrowDown steps back, and stops at the last sibling, got ${await order()} / ${await treeState()}`);
  expect(await focusedId() === "ch-3", "the item keeps focus through two moves");

  expect(await row("notes").getAttribute("draggable") === "true", "items are draggable when the tree has onMove");
  const fire = (type, id, fraction) => page.evaluate(([kind, to, at]) => {
    const target = document.querySelector(`#react-editor-tree [data-tree-id="${to}"] > .sd-tree-row`);
    const box = target.getBoundingClientRect();
    window.__dt ||= new DataTransfer();
    const event = new DragEvent(kind, { bubbles: true, cancelable: true, dataTransfer: window.__dt, clientX: box.left + 20, clientY: box.top + box.height * at });
    target.dispatchEvent(event);
    return event.defaultPrevented;
  }, [type, id, fraction]);
  const dropMark = () => page.evaluate(() => [...document.querySelectorAll("#react-editor-tree [data-drop]")].map((el) => `${el.parentElement.dataset.treeId}:${el.dataset.drop}`).join());
  const dropIs = (want) => until((want) => document.querySelector("#react-editor-tree [data-drop]")?.dataset.drop === want, want);
  await fire("dragstart", "notes", 0.5);
  expect(await until(() => document.querySelector("#react-editor-tree [data-dragging]")?.parentElement.dataset.treeId === "notes", null), "dragstart marks the dragged row");
  expect(await fire("dragover", "part-2", 0.1) && await dropIs("before"), `dragging over the top of a row marks a drop before it, got ${await dropMark()}`);
  await fire("dragover", "part-2", 0.9);
  expect(await dropIs("after"), `dragging over the bottom marks a drop after it, got ${await dropMark()}`);
  await fire("dragover", "part-2", 0.5);
  expect(await dropIs("inside"), `dragging over the middle marks a drop inside it, got ${await dropMark()}`);
  await fire("dragover", "part-2", 0.1);
  await dropIs("before");
  await fire("drop", "part-2", 0.1);
  expect(await until(() => document.querySelector("[data-tree-state]").textContent.endsWith("moved: notes before part-2"), null) && await order() === "part-1,ch-1,ch-2,ch-3,notes,part-2", `a drop reports the move and the app reorders, got ${await order()} / ${await treeState()}`);
  await fire("dragend", "notes", 0.5);
  expect(await until(() => !document.querySelector("#react-editor-tree [data-dragging], #react-editor-tree [data-drop]"), null), "dragend clears the drag marks");
  await fire("dragstart", "part-1", 0.5);
  await fire("dragover", "ch-2", 0.5);
  await new Promise((resolve) => setTimeout(resolve, 150));
  expect(await dropMark() === "", "a branch cannot be dropped onto its own child");
  await fire("dragover", "part-1", 0.5);
  await new Promise((resolve) => setTimeout(resolve, 150));
  expect(await dropMark() === "", "an item cannot be dropped onto itself");
  await fire("dragend", "part-1", 0.5);

  /* ---- Combobox ---- */
  const choices = page.locator("#react-editor-choices");
  const people = choices.getByRole("combobox", { name: "Editor" });
  const chapters = choices.getByRole("combobox", { name: "Jump to a chapter" });
  const optionsOf = (list) => list.evaluate((el) => [...document.getElementById(el.getAttribute("aria-controls")).querySelectorAll("[role=option]")].map((o) => o.textContent));
  const activeOption = (list) => list.evaluate((el) => document.getElementById(el.getAttribute("aria-activedescendant") ?? "")?.textContent ?? "");
  const expanded = (list) => list.getAttribute("aria-expanded");
  const choiceState = () => choices.locator("[data-choice-state]").textContent();
  expect(await people.inputValue() === "Sam Reyes" && await expanded(people) === "false", "a combobox starts closed and shows the chosen item's label");
  expect(await people.getAttribute("aria-autocomplete") === "list" && await people.getAttribute("aria-controls") !== null, "the combobox names its listbox");
  await people.focus();
  await page.keyboard.press("ArrowDown");
  expect(await expanded(people) === "true" && (await optionsOf(people)).length === 5, `ArrowDown opens the list with every item, got ${(await optionsOf(people)).join()}`);
  expect(await activeOption(people) === "Jane Okafor", `the first item that is enabled is highlighted, got ${await activeOption(people)}`);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  expect(await activeOption(people) === "Omar Haddad", `ArrowDown walks the list, got ${await activeOption(people)}`);
  await page.keyboard.press("ArrowDown");
  expect(await activeOption(people) === "Jane Okafor", `ArrowDown skips the disabled last item and wraps, got ${await activeOption(people)}`);
  await page.keyboard.press("ArrowUp");
  expect(await activeOption(people) === "Omar Haddad", `ArrowUp wraps to the last enabled item, got ${await activeOption(people)}`);
  await page.keyboard.press("Escape");
  expect(await expanded(people) === "false" && await people.inputValue() === "Sam Reyes", "Escape closes the list and keeps the chosen item");
  await people.fill("");
  await page.keyboard.type("ines");
  expect((await optionsOf(people)).join() === "Ines Duarte" && await expanded(people) === "true", `typing filters the list on the label, got ${(await optionsOf(people)).join()}`);
  await people.fill("proof");
  expect((await optionsOf(people)).join() === "Wren Calloway", "typing filters on keywords too");
  await people.fill("zzz");
  expect((await optionsOf(people)).length === 0 && await choices.locator("[role=listbox]:not([hidden])", { hasText: "No matches" }).count() === 1, "a list with no match says so");
  await people.fill("OKA");
  expect((await optionsOf(people)).join() === "Jane Okafor", `the filter is not case sensitive, got ${(await optionsOf(people)).join()}`);
  await page.keyboard.press("Enter");
  expect(await expanded(people) === "false" && await people.inputValue() === "Jane Okafor" && (await choiceState()).startsWith("editor: jane"), `Enter chooses the highlighted item, closes the list and fills the box, got ${await people.inputValue()} / ${await choiceState()}`);
  await people.click();
  expect(await expanded(people) === "true" && (await optionsOf(people)).length === 5, "opening again lists every item, not only the match for the text in the box");
  expect(await choices.locator("[role=option][data-chosen]").textContent() === "Jane Okafor", "the chosen item is marked in the list");
  await choices.getByRole("option", { name: "Omar Haddad" }).click();
  expect(await people.inputValue() === "Omar Haddad" && (await choiceState()).startsWith("editor: omar") && await expanded(people) === "false", "a click on an option chooses it without the box losing focus first");
  await people.fill("ines");
  await page.keyboard.press("Tab");
  expect(await expanded(people) === "false" && await people.inputValue() === "Omar Haddad" && (await choiceState()).startsWith("editor: omar"), "leaving the box with unchosen text puts the chosen label back");
  expect((await optionsOf(people)).length === 0, "a closed list renders no options");

  /* ---- Combobox, items passed in ---- */
  await chapters.click();
  expect(await expanded(chapters) === "true" && await choices.locator("[role=listbox]:not([hidden])", { hasText: "Start typing" }).count() === 1, "with no items the list shows the app's empty text");
  await page.keyboard.type("the");
  expect(await until(() => document.querySelector("#react-editor-choices [aria-busy=true]") !== null, null) , "the list is aria-busy while the app fetches");
  expect(await until(() => [...document.querySelectorAll("#react-editor-choices [role=option]")].map((o) => o.textContent).join() === "The harbour,The long way round,The ferry", null, 3000), `the items the app passes back are listed, got ${(await optionsOf(chapters)).join()}`);
  await page.keyboard.type("y");
  expect(await until(() => document.querySelector("#react-editor-choices [role=listbox]:not([hidden])")?.textContent.includes("No chapter"), null, 3000), "an unmatched query shows the app's empty text");
  await page.keyboard.press("Escape");

  /* ---- Command palette ---- */
  const palette = page.locator("dialog.sd-command");
  const search = palette.getByRole("combobox", { name: "Search" });
  const paletteOptions = () => palette.evaluate((el) => [...el.querySelectorAll("[role=option]")].map((o) => o.textContent));
  const paletteActive = () => search.evaluate((el) => document.getElementById(el.getAttribute("aria-activedescendant") ?? "")?.textContent ?? "");
  const paletteOpen = () => palette.evaluate((el) => el.open);
  const paletteGone = () => until(() => !document.querySelector("dialog.sd-command").open, null);
  const opener = choices.getByRole("button", { name: "Open palette" });
  expect(!(await paletteOpen()) && (await paletteOptions()).length === 0, "a closed palette renders no options");
  await opener.focus();
  await page.keyboard.press("Enter");
  expect(await until(() => document.querySelector("dialog.sd-command")?.open, null) && await search.evaluate((el) => document.activeElement === el), "the palette opens a modal dialog with focus in the search box");
  expect((await paletteOptions()).length === 6 && await palette.locator("[role=presentation]", { hasText: "Documents" }).count() === 1, "every item is listed under its group");
  expect((await paletteActive()).startsWith("The harbour"), `the first item is highlighted, got ${await paletteActive()}`);
  await page.keyboard.type("exp");
  expect((await paletteOptions()).join() === "Export as PDF" && (await paletteActive()) === "Export as PDF", `typing filters the list and highlights the first match, got ${(await paletteOptions()).join()}`);
  await search.fill("down");
  expect((await paletteOptions()).join() === "Export as PDF", "the filter matches keywords");
  await search.fill("");
  await page.keyboard.press("ArrowUp");
  expect((await paletteActive()).startsWith("Export"), `ArrowUp from the first item wraps past the disabled last one, got ${await paletteActive()}`);
  await search.fill("lisb");
  await page.keyboard.press("Enter");
  expect(await paletteGone() && (await choiceState()).endsWith("ran: open-ch-4"), `Enter on the highlighted item runs it and closes the palette, got ${await choiceState()}`);
  expect(await opener.evaluate((el) => document.activeElement === el), "closing returns focus to the button that opened the palette");
  await opener.click();
  await until(() => document.querySelector("dialog.sd-command")?.open, null);
  expect(await search.inputValue() === "" && (await paletteOptions()).length === 6, "the palette opens empty and unfiltered again");
  await search.fill("lis");
  await page.keyboard.press("Escape");
  expect(await paletteGone(), "Escape closes the palette");
  await opener.click();
  await until(() => document.querySelector("dialog.sd-command")?.open, null);
  expect(await search.inputValue() === "", "the query is cleared when the palette closes");
  await palette.getByRole("option", { name: /Toggle focus mode/ }).hover();
  expect(await until(() => document.getElementById(document.querySelector("dialog.sd-command input").getAttribute("aria-activedescendant") ?? "")?.textContent.startsWith("Toggle focus mode"), null), "the pointer highlights the option under it");
  await palette.getByRole("option", { name: /Toggle focus mode/ }).click();
  expect(await paletteGone() && (await choiceState()).endsWith("ran: focus"), "a click on an option runs it and closes the palette");
  await opener.click();
  await until(() => document.querySelector("dialog.sd-command")?.open, null);
  await palette.getByRole("option", { name: /Notes/ }).click();
  expect(await paletteGone() && (await choiceState()).endsWith("ran: open-notes") && !page.url().includes("choices"), "a link option can have its navigation prevented by onSelect");
  await opener.click();
  await until(() => document.querySelector("dialog.sd-command")?.open, null);
  await palette.getByRole("option", { name: /Delete chapter/ }).click({ force: true });
  expect(await paletteOpen(), "a disabled option does nothing");
  await page.keyboard.press("Escape");
  await paletteGone();

  expect(browserErrors.length === 0, `console errors on the editor page: ${browserErrors.join(" | ")}`);
  return { errors, passed };
}
