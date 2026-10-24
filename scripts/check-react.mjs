/**
 * Checks for signal-design/react. Called from scripts/check.mjs:
 *   checkReactTypes()  a strict consumer compilation through the package export map
 *   checkReactSsr()    every export rendered to a string in plain Node, no DOM
 *   checkReact()       dialog, menu, tabs, toast, tooltip, fields and table in a real browser
 */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import ts from "typescript";
import { checkReactEditor } from "./check-react-editor.mjs";

const rootPath = fileURLToPath(new URL("..", import.meta.url));

export function checkReactTypes() {
  const directory = mkdtempSync(join(rootPath, ".react-types-"));
  const fixture = join(directory, "consumer.tsx");
  writeFileSync(
    fixture,
    `import { useState } from "react";
import { AppShell, Button, Dialog, DialogHeader, Field, IconButton, Input, MenuItem, HoverCard, Manuscript, Mark, RailItem, StatusSegment, Tab, TabList, TabPanel, Tabs, TableHeader, Toolbar, ToolbarButton, ToolbarMore, Combobox, CommandPalette, MenuItemCheckbox, MenuItemRadio, MenuRadioGroup, Radio, RadioGroup, Segment, SegmentedControl, Tree, TreeItem, type ListItem, type TreeMove, useToast, buttonClass, type ButtonProps } from "signal-design/react";

export function Consumer() {
  const [open, setOpen] = useState(false);
  const toast = useToast();
  const props: ButtonProps = { variant: "primary", tone: "danger", busy: true, onClick: (event) => event.currentTarget.blur() };
  toast("Saved", { tone: "success", action: { label: "Undo", onClick: () => {} } });
  const dismiss: () => void = toast("Quick", { timeout: 300 });
  dismiss();
  return (
    <AppShell defaultSection="projects" onSidebarChange={(sidebar) => console.log(sidebar === "collapsed")}>
      <Button {...props} ref={(node: HTMLButtonElement | null) => node?.focus()}>Go</Button>
      <a className={buttonClass({ variant: "ghost", size: "sm" })} href="/">Link</a>
      <IconButton label="Settings" size="sm" />
      <Field label="Name" error="Required"><Input value="" onChange={(event) => console.log(event.target.value)} /></Field>
      <Dialog open={open} onOpenChange={setOpen} size="sm" ref={(node: HTMLDialogElement | null) => node?.close()}>
        <DialogHeader closeButton={false}>Title</DialogHeader>
      </Dialog>
      <Tabs defaultValue="a"><TabList label="Tabs"><Tab value="a">A</Tab></TabList><TabPanel value="a">A</TabPanel></Tabs>
      <Tabs value="a" onValueChange={(value) => console.log(value.length)}><TabList label="Tabs" /></Tabs>
      <TableHeader sort="ascending" onSort={(event) => event.currentTarget.focus()}>Team</TableHeader>
      <MenuItem tone="danger" onSelect={(event) => event.preventDefault()}>Delete</MenuItem>
      <RailItem section="projects" href="#" unread>Projects</RailItem>
      <Toolbar label="Formatting"><ToolbarButton label="Bold" pressed={open} onPressedChange={setOpen} /><ToolbarMore><MenuItem>Clear</MenuItem></ToolbarMore></Toolbar>
      <Manuscript measure="30rem" face="mono" ref={(node: HTMLElement | null) => node?.focus()} />
      <HoverCard content="Preview" openDelay={0}><Mark kind="entity" tabIndex={0} who="var(--sd-success)" /></HoverCard>
      <Tree label="Outline" selected="a" onSelectedChange={(id) => id.length} defaultExpanded={["a"]} onMove={(move: TreeMove) => move.position.length}><TreeItem id="a" label="A" meta={1}><TreeItem id="b" label="B" disabled /></TreeItem></Tree>
      <RadioGroup label="Cycle" value="m" onValueChange={(value) => value.length}><Radio value="m" label="Monthly" description="Billed monthly" /></RadioGroup>
      <SegmentedControl label="View" defaultValue="a" inline wrap size="sm"><Segment value="a">A</Segment></SegmentedControl>
      <MenuRadioGroup label="Spacing" defaultValue="a"><MenuItemRadio value="a" onSelect={(event) => event.preventDefault()}>A</MenuItemRadio></MenuRadioGroup>
      <MenuItemCheckbox checked onCheckedChange={(checked) => console.log(checked)}>Words</MenuItemCheckbox>
      <Combobox items={[{ value: "a", label: "A", group: "G", hint: "h" } satisfies ListItem]} value="a" onValueChange={(value) => value.length} filter={(item, query) => item.label.startsWith(query)} name="who" placeholder="Pick" />
      <CommandPalette items={[{ value: "go", label: "Go", href: "/go" }]} open={open} onOpenChange={setOpen} onSelect={(item, event) => { event.preventDefault(); console.log(item.value); }} onQueryChange={(query) => query.length} />
      <Mark kind="comment" active onClick={(event) => event.currentTarget.focus()}>Comment</Mark>
      <StatusSegment tone="success" pressed onClick={(event) => event.currentTarget.blur()}>Saved</StatusSegment>
      {/* @ts-expect-error variant must be one of the button variants */}
      <Button variant="huge" />
      {/* @ts-expect-error an icon button needs its accessible name */}
      <IconButton />
      {/* @ts-expect-error a radio group needs its accessible name */}
      <RadioGroup />
      {/* @ts-expect-error a checkbox item needs its state */}
      <MenuItemCheckbox>Words</MenuItemCheckbox>
      {/* @ts-expect-error a combobox needs items */}
      <Combobox />
      {/* @ts-expect-error a list item needs a label */}
      <Combobox items={[{ value: "a" }]} />
      {/* @ts-expect-error a tree needs its accessible name */}
      <Tree />
      {/* @ts-expect-error a tree item needs an id */}
      <TreeItem label="A" />
      {/* @ts-expect-error a mark needs a kind */}
      <Mark />
      {/* @ts-expect-error the kind must be one of the mark kinds */}
      <Mark kind="highlight" />
      {/* @ts-expect-error a toolbar needs its accessible name */}
      <Toolbar />
      {/* @ts-expect-error a pressed toolbar button needs onPressedChange */}
      <ToolbarButton label="Bold" pressed />
      {/* @ts-expect-error a controlled Tabs needs onValueChange */}
      <Tabs value="a"><TabList label="Tabs" /></Tabs>
      {/* @ts-expect-error a Tabs with neither value nor defaultValue has no selected tab */}
      <Tabs><TabList label="Tabs" /></Tabs>
    </AppShell>
  );
}
// @ts-expect-error the tone is not a Signal role
useToast()("Saved", { tone: "loud" });
`,
  );
  try {
    const program = ts.createProgram([fixture], {
      strict: true,
      noEmit: true,
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.NodeNext,
      moduleResolution: ts.ModuleResolutionKind.NodeNext,
      jsx: ts.JsxEmit.ReactJSX,
      lib: ["lib.es2022.d.ts", "lib.dom.d.ts"],
    });
    const diagnostics = ts.getPreEmitDiagnostics(program);
    assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCanonicalFileName: (file) => file,
      getCurrentDirectory: () => directory,
      getNewLine: () => "\n",
    }));
    return 1;
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

export async function checkReactSsr() {
  assert.equal(typeof document, "undefined", "the SSR check must run without a DOM");
  const { renderToString } = await import("react-dom/server");
  const all = await import("../src/react/index.js");
  const used = new Set();
  const sd = new Proxy(all, { get: (target, name) => (used.add(name), target[name]) });
  const tree = h(sd.ToastProvider, null,
    h(sd.AppShell, { defaultSection: "a" },
      h(sd.ShellTopbar, null, "top"),
      h(sd.Rail, null, h(sd.RailHome, { href: "/" }, "home"), h(sd.RailList, null,
        h(sd.RailItem, { section: "a" }, "A"),
        h(sd.RailSeparator),
        h(sd.RailTile, { href: "/x", unread: true }, "X", h(sd.CountBadge, { value: 120, corner: true, label: "unread" }))),
      h(sd.RailTools, null, h(sd.ShellToggle, { target: "drawer", "aria-label": "Menu" }, "m"))),
      h(sd.Sidebar, null, h(sd.SidebarPanel, { section: "a" },
        h(sd.SidebarHead, null, h(sd.SidebarTitle, null, "T"), h(sd.ShellToggle, { target: "sidebar" }, "«")),
        h(sd.SidebarBody, null, h(sd.SidebarGroup, { title: "G" }, h(sd.SidebarLink, { href: "/", current: true }, "L"))))),
      h(sd.ShellMain, null,
        h(sd.ShellHeader, null, "h"), h(sd.ShellBar, null, "b"),
        h(sd.ShellContent, null,
          h(sd.Button, { variant: "primary" }, "Go"),
          h(sd.IconButton, { label: "x" }, "x"),
          h(sd.Field, { label: "Name", hint: "hint", error: "bad" }, h(sd.Input)),
          h(sd.Field, { label: "Bio" }, h(sd.Textarea)),
          h(sd.Field, { label: "Pick" }, h(sd.Select, null, h("option", null, "a"))),
          h(sd.Checkbox, { label: "c", description: "d" }),
          h(sd.Switch, { label: "s" }),
          h(sd.Badge, { tone: "success" }, "ok"),
          h(sd.Avatar, { name: "Ada Lovelace" }),
          h(sd.AvatarStack, null, h(sd.Avatar, { name: "B C", src: "/a.png" })),
          h(sd.Card, { tone: "danger" }, h(sd.CardHeader, null, "h"), h(sd.CardBody, null, "b"), h(sd.CardFooter, null, "f")),
          h(sd.Panel, { width: "wide" }, h(sd.PanelTitle, null, "t"), h(sd.PanelDescription, null, "d")),
          h(sd.EmptyState, { title: "None", action: h(sd.Button, null, "Add") }, "Nothing"),
          h(sd.Table, { hover: true },
            h(sd.TableCaption, null, "c"),
            h(sd.TableHead, null, h(sd.TableRow, null, h(sd.TableHeader, { sort: "ascending", onSort() {} }, "A"))),
            h(sd.TableBody, null, h(sd.TableRow, { selected: true }, h(sd.TableCell, { numeric: true }, "1"))),
            h(sd.TableFoot, null, h(sd.TableRow, null, h(sd.TableCell, null, "f")))),
          h(sd.Dialog, { open: false, onOpenChange() {}, trigger: h(sd.Button, null, "open") },
            h(sd.DialogHeader, null, "T"), h(sd.DialogBody, null, "b"),
            h(sd.DialogFooter, null, h(sd.DialogClose, null, h(sd.Button, null, "x")))),
          h(sd.Sheet, { defaultOpen: false }, h(sd.DialogHeader, null, "S")),
          h(sd.Popover, null, h(sd.PopoverTrigger, null, h(sd.Button, null, "p")), h(sd.PopoverContent, { pad: true }, "pop")),
          h(sd.Menu, null,
            h(sd.MenuTrigger, null, h(sd.Button, null, "m")),
            h(sd.MenuContent, { label: "M" }, h(sd.MenuLabel, null, "L"), h(sd.MenuItem, { hint: "o" }, "Open"), h(sd.MenuSeparator), h(sd.MenuItem, { tone: "danger", disabled: true }, "Del"))),
          h(sd.Tooltip, { content: "tip" }, h(sd.Button, null, "t")),
          h(sd.Tabs, { defaultValue: "one" },
            h(sd.TabList, { label: "L" }, h(sd.Tab, { value: "one" }, "1"), h(sd.Tab, { value: "two" }, "2")),
            h(sd.TabPanel, { value: "one" }, "p1"), h(sd.TabPanel, { value: "two" }, "p2")),
          h(sd.Toolbar, { label: "Formatting" },
            h(sd.ToolbarGroup, { label: "Text" }, h(sd.ToolbarButton, { label: "Bold", pressed: true, onPressedChange() {} }, "B")),
            h(sd.ToolbarSeparator),
            h(sd.ToolbarButton, null, "Heading"),
            h(sd.ToolbarMore, null, h(sd.MenuItem, null, "Clear"))),
          h(sd.Manuscript, { measure: "30rem", face: "mono" }, h("p", null, "Text", h(sd.Mark, { kind: "comment", active: true, onClick() {} }, "c"), h(sd.Mark, { kind: "insert" }, "i"), h(sd.HoverCard, { content: "card", defaultOpen: true }, h(sd.Mark, { kind: "entity", tabIndex: 0 }, "e")))),
          h(sd.RadioGroup, { label: "Cycle", defaultValue: "m", name: "cycle" }, h(sd.Radio, { value: "m", label: "Monthly", description: "d" }), h(sd.Radio, { value: "y", label: "Yearly", disabled: true })),
          h(sd.SegmentedControl, { label: "View", defaultValue: "a", inline: true }, h(sd.Segment, { value: "a" }, "A"), h(sd.Segment, { value: "b" }, "B")),
          h(sd.Menu, null, h(sd.MenuTrigger, null, h(sd.Button, null, "v")),
            h(sd.MenuContent, { label: "View" }, h(sd.MenuItemCheckbox, { checked: true }, "Words"),
              h(sd.MenuRadioGroup, { label: "Spacing", defaultValue: "a" }, h(sd.MenuItemRadio, { value: "a" }, "A"), h(sd.MenuItemRadio, { value: "b" }, "B")))),
          h(sd.Field, { label: "Who" }, h(sd.Combobox, { items: [{ value: "a", label: "Ada", group: "G" }, { value: "b", label: "Bo", disabled: true }], defaultValue: "a", name: "who", placeholder: "Pick" })),
          h(sd.CommandPalette, { items: [{ value: "go", label: "Go", hint: "g" }], foot: "Esc" }),
          h(sd.Tree, { label: "Outline", defaultSelected: "b", defaultExpanded: ["a"], onMove() {} },
            h(sd.TreeItem, { id: "a", label: "A", meta: 2 }, h(sd.TreeItem, { id: "b", label: "B" }), h(sd.TreeItem, { id: "c", label: "C", disabled: true }))))),
      h(sd.ShellDock, null, "dock"),
      h(sd.ShellAside, null, "aside"),
      h(sd.Statusbar, null, h(sd.StatusSegment, null, "1 word"), h(sd.StatusSegment, { pressed: false, onClick() {} }, "Focus"), h(sd.StatusSegment, { end: true, tone: "success" }, "Saved"))));
  const html = renderToString(tree);
  for (const [needle, what] of [
    ['class="sd-shell"', "the shell"],
    ['role="tree"', "the tree"],
    ['role="combobox"', "the combobox"],
    ['role="radiogroup"', "the radio group"],
    ['role="menuitemcheckbox" aria-checked="true"', "the checked menu checkbox"],
    ['role="menuitemradio" aria-checked="true"', "the checked menu radio"],
    ['name="who" value="a"', "the combobox's hidden value"],
    ['aria-level="2"', "a nested tree item"],
    ['aria-current="true"', "the current rail section"],
    ['aria-selected="true"', "the selected tab or row"],
    ['aria-invalid="true"', "the invalid control"],
    ['role="switch"', "the switch"],
    ["99+", "the capped count"],
  ]) assert.ok(html.includes(needle), `server output is missing ${what}`);
  assert.ok(!html.includes("sd-tooltip"), "a closed tooltip rendered on the server");
  assert.ok(!html.includes("sd-hovercard"), "an open hover card rendered on the server");
  const names = Object.keys(all).filter((name) => /^[A-Z]/.test(name));
  const missed = names.filter((name) => !used.has(name));
  assert.deepEqual(missed, [], `exports the server render never touched: ${missed.join(", ")}`);
  return names.length;
}

export async function checkReact(page, base) {
  const errors = [];
  let passed = 0;
  const expect = (ok, message) => (ok ? passed++ : errors.push(message));
  const browserErrors = [];
  page.on("console", (m) => m.type() === "error" && browserErrors.push(m.text()));
  page.on("pageerror", (e) => browserErrors.push(e.message));
  const until = (fn, arg, timeout = 2000) => page.waitForFunction(fn, arg, { timeout }).then(() => true, () => false);
  const active = () => page.evaluate(() => document.activeElement?.textContent ?? "");
  const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`${base}react.html`);
  await page.waitForSelector("#react-buttons");
  expect(await page.evaluate(() => !document.documentElement.hasAttribute("data-sd-scrollbars")), "the page ran init(), so the bindings were not tested alone");

  /* ---- Fields ---- */
  const name = page.locator("#react-forms input").first();
  const err = () => page.locator("#react-forms .sd-field-error");
  expect(await err().count() === 1 && await name.getAttribute("aria-invalid") === "true", "an empty required name shows its error and aria-invalid");
  expect(await name.evaluate((el) => document.getElementById(el.getAttribute("aria-describedby"))?.className) === "sd-field-error", "aria-describedby points at the error");
  await page.locator("#react-forms label.sd-field-label", { hasText: /^Name/ }).click();
  expect(await name.evaluate((el) => document.activeElement === el), "clicking the label focuses the control");
  await name.fill("Jane");
  expect(await err().count() === 0 && await name.getAttribute("aria-invalid") === null, "typing a name clears the error and aria-invalid");
  expect(await name.evaluate((el) => document.getElementById(el.getAttribute("aria-describedby"))?.className) === "sd-field-hint", "aria-describedby falls back to the hint");
  const sw = page.locator('#react-forms input[role="switch"]').first();
  await sw.check();
  expect(await page.locator("#react-forms .sd-check-desc", { hasText: /^On$/ }).count() === 1, "the switch's state reached React");

  /* ---- Table ---- */
  const firstTeam = () => page.locator("#react-table tbody tr:first-child td:first-child").textContent();
  const items = page.locator("#react-table th", { hasText: "Items" });
  expect(await page.locator("#react-table th", { hasText: "Team" }).getAttribute("aria-sort") === "ascending" && await firstTeam() === "Design", "the table starts sorted by team");
  await items.click();
  expect(await items.getAttribute("aria-sort") === "ascending" && await firstTeam() === "Sales", "a header click sorts ascending");
  await items.focus();
  await page.keyboard.press("Enter");
  expect(await items.getAttribute("aria-sort") === "descending" && await firstTeam() === "Design", "Enter on a header sorts descending");
  await page.locator("#react-table tbody tr", { hasText: "Platform" }).click();
  expect(await page.locator("#react-table tr[aria-selected='true']").textContent().then((t) => t.includes("Platform")), "a row click selects the row");

  /* ---- Dialog ---- */
  const dialogOf = (text) => page.locator("dialog", { hasText: text });
  const isOpen = (locator) => locator.evaluate((d) => d.open);
  const closed = (locator) => locator.evaluate((d) => new Promise((resolve) => { const t = setInterval(() => { if (!d.open) { clearInterval(t); resolve(true); } }, 20); setTimeout(() => { clearInterval(t); resolve(false); }, 2000); }));
  const opener = (label) => page.locator("#react-dialog").getByRole("button", { name: label, exact: true });
  const main = dialogOf("Request changes on ACME-421?");
  // Opened from the keyboard: WebKit does not focus a button on click, so only a focused opener can get focus back.
  await opener("Dialog").focus();
  await page.keyboard.press("Enter");
  expect(await until(() => document.querySelector("dialog[open]"), null), "the Dialog button opens the dialog");
  expect(await main.evaluate((d) => d.contains(document.activeElement)), "focus moves into the dialog");
  expect(await main.evaluate((d) => d.matches(":modal")), "the dialog is modal");
  let escaped = [];
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press("Tab");
    escaped.push(await main.evaluate((d) => (document.activeElement === document.body || d.contains(document.activeElement) ? "" : document.activeElement.outerHTML.slice(0, 60))));
  }
  expect(escaped.every((where) => !where), `Tab left the dialog: ${escaped.filter(Boolean).join(" | ")}`);
  await page.keyboard.press("Escape");
  expect(await closed(main), "Escape closes the dialog");
  expect(await until(() => document.activeElement?.textContent === "Dialog", null), "closing returns focus to the button that opened it");
  await opener("Dialog").click();
  expect(await until(() => document.querySelector("dialog[open]"), null), "the dialog reopens after Escape, so React saw it close");
  await page.mouse.click(4, 4);
  expect(await closed(main), "a click on the backdrop closes the dialog");
  await opener("Dialog").click();
  await until(() => document.querySelector("dialog[open]"), null);
  await main.getByRole("button", { name: "Request changes" }).click();
  expect(await closed(main) && await page.locator("[data-result]").textContent() === "result: sent", "a button in the dialog closes it through React state");
  await opener("Uncontrolled dialog").click();
  const loose = dialogOf("Discard draft?");
  expect(await until(() => [...document.querySelectorAll("dialog")].some((d) => d.open && d.textContent.includes("Discard")), null), "a trigger opens an uncontrolled dialog");
  await loose.getByRole("button", { name: "Keep" }).click();
  expect(await closed(loose), "DialogClose closes an uncontrolled dialog");
  await opener("Uncontrolled dialog").click();
  expect(await until(() => [...document.querySelectorAll("dialog")].some((d) => d.open && d.textContent.includes("Discard")), null), "an uncontrolled dialog opens again");
  await page.keyboard.press("Escape");
  await closed(loose);
  const fixed = dialogOf("Escape and the backdrop leave it open.");
  await opener("Static dialog").click();
  await until(() => [...document.querySelectorAll("dialog")].some((d) => d.open && d.textContent.includes("Static")), null);
  await page.keyboard.press("Escape");
  await pause(200);
  await page.mouse.click(4, 4);
  await pause(200);
  expect(await isOpen(fixed), "a static dialog ignores Escape and the backdrop");
  await fixed.getByRole("button", { name: "Done" }).click();
  expect(await closed(fixed), "a static dialog still closes from its own button");
  const guarded = dialogOf("Closing is refused until you discard them.");
  await opener("Guarded dialog").click();
  await until(() => [...document.querySelectorAll("dialog")].some((d) => d.open && d.textContent.includes("refused")), null);
  await page.keyboard.press("Escape");
  expect(await until(() => document.querySelector("[data-blocked]").textContent === "blocked: 1", null), "the parent hears Escape on a guarded dialog");
  expect(await until(() => [...document.querySelectorAll("dialog")].some((d) => d.open && d.textContent.includes("refused")), null), "a parent that refuses a close gets the dialog reopened");
  await page.keyboard.press("Escape");
  expect(await until(() => document.querySelector("[data-blocked]").textContent === "blocked: 2", null) && await isOpen(guarded), "the dialog stays reopenable after a refused close");
  await guarded.getByRole("button", { name: "Discard changes" }).click();
  expect(await closed(guarded), "the parent can still close it");
  const sheet = dialogOf("These settings apply to this item only.");
  await opener("Sheet").click();
  await until(() => [...document.querySelectorAll("dialog")].some((d) => d.open && d.classList.contains("sd-sheet")), null);
  const pinned = await until(() => { const r = document.querySelector("dialog.sd-sheet[open]")?.getBoundingClientRect(); return r && Math.abs(r.right - innerWidth) <= 1 && r.height >= innerHeight - 1; }, null);
  expect(pinned, `the sheet is pinned to the right edge, got ${JSON.stringify(await sheet.boundingBox())}`);
  await page.keyboard.press("Escape");
  expect(await closed(sheet), "Escape closes the sheet");

  /* ---- Menu and popover ---- */
  const trigger = page.locator("#react-menu").getByRole("button", { name: "Save for later" });
  const menu = page.locator("#react-menu [role=menu]");
  const menuOpen = () => page.evaluate(() => document.querySelector("#react-menu [role=menu]").parentElement.matches(":popover-open"));
  const shown = (on) => until((on) => [...document.querySelectorAll("#react-menu button")].find((b) => b.getAttribute("aria-haspopup") === "menu")?.getAttribute("aria-expanded") === String(on) && document.querySelector("#react-menu [role=menu]").parentElement.matches(":popover-open") === on, on);
  const gone = () => shown(false);
  await trigger.click();
  expect(await shown(true), "the trigger opens the menu");
  expect(await trigger.getAttribute("aria-expanded") === "true" && await trigger.getAttribute("aria-haspopup") === "menu", "the trigger reports the open menu");
  expect((await active()).startsWith("Later today"), `the first item has focus on open, got ${await active()}`);
  const place = await page.evaluate(() => {
    const pop = document.querySelector("#react-menu [role=menu]").parentElement.getBoundingClientRect();
    const trig = [...document.querySelectorAll("#react-menu button")].find((b) => b.textContent === "Save for later").getBoundingClientRect();
    return { below: Math.round(pop.top - trig.bottom), above: Math.round(trig.top - pop.bottom), dx: Math.round(pop.left - trig.left) };
  });
  // The trigger may sit near the bottom of the viewport, where the menu flips above it.
  expect((place.below >= 0 && place.below <= 12 || place.above >= 0 && place.above <= 12) && Math.abs(place.dx) <= 2, `the menu sits next to its trigger, got ${JSON.stringify(place)}`);
  const key = async (name, want, why) => {
    await page.keyboard.press(name);
    const got = await active();
    expect(got.startsWith(want), `${why}: wanted ${want}, got ${got}`);
  };
  await key("ArrowDown", "Tomorrow", "ArrowDown moves one item");
  await key("ArrowDown", "Monday", "ArrowDown moves one item again");
  await key("ArrowDown", "Delete", "ArrowDown skips the disabled item");
  await key("ArrowDown", "Later today", "ArrowDown wraps to the first item");
  await key("ArrowUp", "Delete", "ArrowUp wraps to the last item");
  await key("Home", "Later today", "Home jumps to the first item");
  await key("End", "Delete", "End jumps to the last item");
  await key("m", "Monday", "typing jumps to an item by its first letter");
  await pause(700);
  await key("t", "Tomorrow", "typing again after a pause starts over");
  await page.keyboard.press("Enter");
  expect(await gone(), "Enter on an item closes the menu");
  expect(await page.locator("[data-picked]").textContent() === "picked: tomorrow", "the chosen item reached onSelect");
  expect(await trigger.evaluate((b) => document.activeElement === b) && await trigger.getAttribute("aria-expanded") === "false", "choosing an item returns focus to the trigger");
  await trigger.click();
  await shown(true);
  await page.keyboard.press("Escape");
  expect(await gone() && await trigger.getAttribute("aria-expanded") === "false", "Escape closes the menu and the trigger follows");
  await trigger.click();
  await shown(true);
  await trigger.click();
  await gone();
  await pause(250);
  expect(!(await menuOpen()), "a click on the open trigger closes the menu and it stays closed");
  await trigger.click();
  await shown(true);
  await page.locator("#react-menu h2").click();
  expect(await gone() && await trigger.getAttribute("aria-expanded") === "false", "a click outside closes the menu");
  await trigger.click();
  await shown(true);
  await menu.getByRole("menuitem", { name: /Custom/ }).click({ force: true });
  expect(await menuOpen(), "a disabled item does not close the menu");
  await page.keyboard.press("Escape");
  await gone();
  const why = page.locator("#react-menu").getByRole("button", { name: "Why flagged" });
  await why.click();
  expect(await until(() => document.querySelector("#react-menu").textContent.includes("popover: open"), null), "React sees a popover open");
  await page.keyboard.press("Escape");
  expect(await until(() => document.querySelector("#react-menu").textContent.includes("popover: closed"), null), "React sees Escape close the popover");

  /* ---- Tabs ---- */
  const tab = (label) => page.locator("#react-tabs").getByRole("tab", { name: label });
  const selectedTab = () => page.locator("#react-tabs [data-tab]").textContent();
  const visiblePanels = () => page.locator("#react-tabs [role=tabpanel]:not([hidden])").count();
  expect(await tab("Overview").getAttribute("aria-selected") === "true" && await visiblePanels() === 1, "the first tab starts selected with one panel shown");
  await tab("Checks").click();
  expect(await selectedTab() === "selected: checks" && await tab("Checks").getAttribute("tabindex") === "0" && await tab("Overview").getAttribute("tabindex") === "-1", "a click selects a tab and moves the tab stop");
  await tab("Overview").click();
  await tab("Overview").focus();
  const arrow = async (name, want) => {
    await page.keyboard.press(name);
    const state = await page.evaluate(() => ({ focused: document.activeElement.textContent, picked: document.querySelector("#react-tabs [data-tab]").textContent, panel: document.querySelector("#react-tabs [role=tabpanel]:not([hidden])")?.getAttribute("aria-labelledby") === document.activeElement.id }));
    expect(state.focused === want && state.picked === `selected: ${want.toLowerCase()}` && state.panel, `${name} should focus and select ${want}, got ${JSON.stringify(state)}`);
  };
  await arrow("ArrowRight", "Checks");
  await arrow("ArrowRight", "Activity");
  await arrow("ArrowRight", "Overview");
  await arrow("ArrowLeft", "Activity");
  await arrow("Home", "Overview");
  await arrow("End", "Activity");
  expect(await tab("Archived").isDisabled() && await visiblePanels() === 1, "a disabled tab is skipped and one panel stays shown");

  /* ---- Tooltip ---- */
  const tipTarget = page.locator("#react-tooltip").getByRole("button", { name: "Hover or focus me" });
  const tip = page.locator("body > [role=tooltip]");
  await tipTarget.hover();
  expect(await until(() => document.querySelector("body > [role=tooltip]")?.textContent === "Approve (a)", null), "hover shows the tooltip");
  const tipState = await page.evaluate(() => {
    const t = document.querySelector("body > [role=tooltip]");
    const b = [...document.querySelectorAll("#react-tooltip button")].find((el) => el.textContent === "Hover or focus me");
    return { described: b.getAttribute("aria-describedby") === t.id, above: t.getBoundingClientRect().bottom <= b.getBoundingClientRect().top };
  });
  expect(tipState.described && tipState.above, `the tooltip describes its target and sits above it, got ${JSON.stringify(tipState)}`);
  await page.mouse.move(2, 2);
  expect(await until(() => !document.querySelector("body > [role=tooltip]"), null), "leaving hides the tooltip");
  await tipTarget.focus();
  expect(await tip.count() === 1, "keyboard focus shows the tooltip");
  await page.keyboard.press("Escape");
  expect(await until(() => !document.querySelector("body > [role=tooltip]"), null), "Escape hides the tooltip");

  /* ---- Toast ---- */
  const toastButton = (label) => page.locator("#react-toast").getByRole("button", { name: label, exact: true });
  const toasts = (text) => page.locator(".sd-toaster[role=status] .sd-toast", { hasText: text });
  await toastButton("Toast: success").click();
  expect(await toasts("Approved ACME-421").count() === 1 && await toasts("Approved").getAttribute("data-tone") === "success", "a toast appears in the live region with its tone");
  await page.evaluate(() => {
    window.__leaving = [];
    new MutationObserver((records) => records.forEach((r) => r.target.dataset.leaving !== undefined && window.__leaving.push(r.target.textContent))).observe(document.querySelector(".sd-toaster"), { subtree: true, attributes: true, attributeFilter: ["data-leaving"] });
  });
  await toastButton("Quick toast").click();
  await toasts("Quick").hover();
  await pause(1600);
  expect(await toasts("Quick").count() === 1, "hovering a toast holds it past its timeout");
  await page.mouse.move(2, 2);
  expect(await until(() => ![...document.querySelectorAll(".sd-toast")].some((t) => t.textContent === "Quick"), null, 3000), "a toast leaves after its timeout once the pointer is gone");
  expect(await page.evaluate(() => window.__leaving.includes("Quick")), "a toast fades with data-leaving before it is removed");
  await toastButton("Toast with undo").click();
  await pause(600);
  expect(await toasts("Archived").count() === 1, "a toast with timeout 0 stays");
  await toasts("Archived").getByRole("button", { name: "Undo" }).click();
  await page.mouse.move(2, 2);
  expect(await until(() => ![...document.querySelectorAll(".sd-toast")].some((t) => t.textContent.startsWith("Archived")), null) && await toasts("Restored").count() === 1, "a toast action runs and dismisses its toast");
  expect(await until(() => !document.querySelector(".sd-toast"), null, 6000), "every toast is removed in the end");

  /* ---- App shell ---- */
  await page.goto(base + "react-shell.html");
  await page.waitForSelector("#shell");
  expect(await page.evaluate(() => !document.documentElement.hasAttribute("data-sd-scrollbars")), "the shell page ran init()");
  const shell = () => page.evaluate(() => ({
    ...document.getElementById("shell").dataset,
    inert: document.getElementById("main").inert,
    section: document.querySelector("#shell-rail [aria-current='true']")?.textContent,
    panels: [...document.querySelectorAll(".sd-sidebar-panel")].filter((p) => !p.hidden).map((p) => p.dataset.section).join(),
  }));
  const rail = (label) => page.locator("#shell-rail").getByText(label, { exact: true });
  const isState = async (want, why) => {
    const got = await shell();
    expect(Object.entries(want).every(([k, v]) => got[k] === v), `${why}: wanted ${JSON.stringify(want)}, got ${JSON.stringify(got)}`);
  };
  await isState({ sidebar: undefined, aside: undefined, section: "Projects", panels: "projects" }, "the shell starts pinned on Projects");
  await rail("History").click();
  await isState({ section: "History", panels: "history", peek: undefined }, "a rail item shows its sidebar panel");
  await rail("Projects").click();
  const collapse = page.locator("#shell-sidebar [data-section=projects] button[aria-expanded]");
  await collapse.click();
  await isState({ sidebar: "collapsed" }, "the collapse button collapses the sidebar");
  expect(await page.locator("#shell button.sd-shell-pin").getAttribute("aria-label") === "Pin sidebar open" && await page.locator("#shell button.sd-shell-pin").getAttribute("aria-expanded") === "false", "the pin button says the sidebar is collapsed");
  await rail("Settings").click();
  await isState({ sidebar: "collapsed", peek: "", panels: "settings" }, "a rail item peeks the collapsed sidebar over the page");
  await page.keyboard.press("Escape");
  await isState({ sidebar: "collapsed", peek: undefined }, "Escape closes the peek");
  await rail("Settings").click();
  await page.locator("#shell-sidebar [data-section=settings]").getByText("General", { exact: true }).click();
  await isState({ peek: undefined, sidebar: "collapsed" }, "choosing a link closes the peek");
  await page.locator("#shell button.sd-shell-pin").click();
  await isState({ sidebar: undefined, peek: undefined }, "the pin button pins the sidebar again");
  expect(await page.locator("#shell-sidebar [data-section=settings] a[aria-current=page]").textContent() === "General", "the chosen link is the current page");
  const group = page.locator("#shell-sidebar [data-section=settings] details").first();
  await group.locator("summary").click();
  expect(await group.evaluate((d) => !d.open), "a sidebar group closes from its summary");
  await group.locator("summary").click();
  expect(await group.evaluate((d) => d.open), "a sidebar group opens again");

  const details = page.locator("#shell").getByRole("button", { name: "Details", exact: true });
  await details.click();
  await isState({ aside: "open" }, "the Details button opens the right panel");
  expect(await details.getAttribute("aria-expanded") === "true", "the Details button reports it open");
  await page.keyboard.press("Escape");
  await isState({ aside: "open" }, "Escape leaves a docked right panel open");
  await page.locator("#detail-panel").getByRole("button", { name: "Close details" }).click();
  await isState({ aside: undefined }, "the close button closes the right panel");

  await page.setViewportSize({ width: 1024, height: 800 });
  await details.click();
  await isState({ aside: "open" }, "the right panel opens at 1024px");
  await page.keyboard.press("Escape");
  await isState({ aside: undefined }, "Escape closes a right panel that floats over the page");

  await page.setViewportSize({ width: 375, height: 800 });
  const burger = page.locator("#shell").getByRole("button", { name: "Open navigation" });
  await burger.click();
  await isState({ drawer: "", inert: true }, "the menu button opens the drawer and makes the page inert");
  expect(await until(() => document.activeElement?.closest(".sd-rail-item") !== null, null), "focus moves to the current rail item in the drawer");
  await page.keyboard.press("Escape");
  await isState({ drawer: undefined, inert: false }, "Escape closes the drawer and the page is live again");
  await burger.click();
  await page.locator("#shell-sidebar [data-section=settings]").getByText("Members", { exact: true }).click();
  await isState({ drawer: undefined, inert: false }, "choosing a link closes the drawer");
  await burger.click();
  await page.locator(".sd-shell-scrim").click({ position: { x: 360, y: 400 } });
  await isState({ drawer: undefined }, "a click on the scrim closes the drawer");
  await page.setViewportSize({ width: 1280, height: 900 });

  await page.locator("#shell").getByRole("button", { name: "Account" }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  expect(await page.locator(".sd-toaster .sd-toast", { hasText: "Signed out" }).count() === 1, "a menu item in the header runs its action");

  expect(browserErrors.length === 0, `console errors: ${browserErrors.join(" | ")}`);
  const editor = await checkReactEditor(page, base);
  errors.push(...editor.errors);
  return { errors, passed: passed + editor.passed };
}
