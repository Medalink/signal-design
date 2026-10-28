/**
 * The words the React components write, by default and when a prop replaces
 * them. Server-rendered in plain Node, so it needs no browser. Called from
 * checkReactSsr in check-react.mjs:
 *   checkReactLabels() -> number of assertions
 */
import assert from "node:assert/strict";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as sd from "../src/react/index.js";

export function checkReactLabels() {
  let count = 0;
  const has = (html, needle, message) => (assert.ok(html.includes(needle), `${message}\n${html}`), count++);
  const lacks = (html, needle, message) => (assert.ok(!html.includes(needle), `${message}\n${html}`), count++);
  const render = (element) => renderToStaticMarkup(element);

  // ShellToggle: the sidebar button's name follows the state; a prop renames each state.
  const toggle = (sidebar, props) => render(h(sd.AppShell, { defaultSidebar: sidebar }, h(sd.ShellToggle, { target: "sidebar", ...props }, "x")));
  has(toggle("pinned"), 'aria-label="Collapse sidebar"', "the open sidebar's toggle lost its default name");
  has(toggle("collapsed"), 'aria-label="Pin sidebar open"', "the collapsed sidebar's toggle lost its default name");
  const named = { pinLabel: "Seitenleiste anheften", collapseLabel: "Seitenleiste einklappen" };
  has(toggle("pinned", named), 'aria-label="Seitenleiste einklappen"', "collapseLabel did not rename the open sidebar's toggle");
  has(toggle("collapsed", named), 'aria-label="Seitenleiste anheften"', "pinLabel did not rename the collapsed sidebar's toggle");
  lacks(toggle("pinned", named), "pinlabel", "pinLabel reached the DOM");
  lacks(toggle("pinned", named), "collapselabel", "collapseLabel reached the DOM");
  has(toggle("pinned", { "aria-label": "Mine" }), 'aria-label="Mine"', "an aria-label passed to ShellToggle stopped winning");

  // The Loading row of a combobox and of a command palette.
  const combobox = (props) => render(h(sd.Combobox, { items: [], defaultOpen: true, busy: true, ...props }));
  has(combobox(), ">Loading</p>", "a busy combobox lost its default Loading row");
  has(combobox({ busyText: "Lädt" }), ">Lädt</p>", "busyText did not replace the combobox's Loading row");
  has(combobox({ busy: false, emptyText: "Keine Treffer" }), ">Keine Treffer</p>", "emptyText stopped replacing the combobox's empty row");
  const palette = (props) => render(h(sd.CommandPalette, { items: [], defaultOpen: true, busy: true, ...props }));
  has(palette(), ">Loading</p>", "a busy command palette lost its default Loading row");
  has(palette({ busyText: "Lädt" }), ">Lädt</p>", "busyText did not replace the palette's Loading row");
  has(palette({ busy: false }), ">No matches</p>", "the palette's default empty row changed");
  has(palette({ label: "Suchen", listLabel: "Ergebnisse" }), 'aria-label="Ergebnisse"', "listLabel stopped renaming the palette's list");
  lacks(palette({ busyText: "Lädt" }), "busytext", "busyText reached the DOM");

  // A tree action's tooltip.
  const tree = (action) => render(h(sd.Tree, { label: "Outline" }, h(sd.TreeItem, { id: "a", label: "A", actions: [{ key: "F2", icon: "e", onSelect() {}, ...action }] })));
  has(tree({ label: "Rename" }), 'title="Rename (F2)"', "a tree action's tooltip is no longer label and key");
  has(tree({ label: "Rename", title: "Umbenennen (F2)" }), 'title="Umbenennen (F2)"', "TreeAction.title did not replace the tooltip");

  // Props that were already there keep their English defaults.
  has(render(h(sd.Dialog, { defaultOpen: true }, h(sd.DialogHeader, null, "T"))), 'aria-label="Close"', "the dialog's close button lost its default name");
  has(render(h(sd.Dialog, { defaultOpen: true }, h(sd.DialogHeader, { closeLabel: "Schließen" }, "T"))), 'aria-label="Schließen"', "closeLabel did not rename the close button");
  has(render(h(sd.ResizablePanel, { size: 200 }, "p")), 'aria-label="Resize"', "the resize handle lost its default name");
  has(render(h(sd.ResizablePanel, { size: 200, label: "Größe ändern" }, "p")), 'aria-label="Größe ändern"', "label did not rename the resize handle");
  has(render(h(sd.Toolbar, { label: "t" }, h(sd.ToolbarMore, null, "m"))), 'aria-label="More"', "ToolbarMore lost its default name");
  has(render(h(sd.Toolbar, { label: "t" }, h(sd.ToolbarMore, { label: "Mehr" }, "m"))), 'aria-label="Mehr"', "ToolbarMore label did not rename the trigger");
  has(render(h(sd.Combobox, { items: [], defaultOpen: true })), 'aria-label="Suggestions"', "the combobox list lost its default name");
  return count;
}
