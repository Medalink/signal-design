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

const rootPath = fileURLToPath(new URL("..", import.meta.url));

export function checkReactTypes() {
  const directory = mkdtempSync(join(rootPath, ".react-types-"));
  const fixture = join(directory, "consumer.tsx");
  writeFileSync(
    fixture,
    `import { useState } from "react";
import { AppShell, Button, Dialog, DialogHeader, Field, IconButton, Input, MenuItem, RailItem, Tab, TabList, TabPanel, Tabs, TableHeader, useToast, buttonClass, type ButtonProps } from "signal-design/react";

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
      {/* @ts-expect-error variant must be one of the button variants */}
      <Button variant="huge" />
      {/* @ts-expect-error an icon button needs its accessible name */}
      <IconButton />
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
            h(sd.TabPanel, { value: "one" }, "p1"), h(sd.TabPanel, { value: "two" }, "p2")))),
      h(sd.ShellDock, null, "dock"),
      h(sd.ShellAside, null, "aside"),
      h(sd.Statusbar, null, "s")));
  const html = renderToString(tree);
  for (const [needle, what] of [
    ['class="sd-shell"', "the shell"],
    ['aria-current="true"', "the current rail section"],
    ['aria-selected="true"', "the selected tab or row"],
    ['aria-invalid="true"', "the invalid control"],
    ['role="switch"', "the switch"],
    ["99+", "the capped count"],
  ]) assert.ok(html.includes(needle), `server output is missing ${what}`);
  assert.ok(!html.includes("sd-tooltip"), "a closed tooltip rendered on the server");
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

  expect(browserErrors.length === 0, `console errors: ${browserErrors.join(" | ")}`);
  return { errors, passed };
}
