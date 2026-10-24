/**
 * Command palette on the native <dialog>. React owns whether it is open and
 * what has been typed. The items are passed in and filtered here by default;
 * for results from a server give `filter={false}`, follow `onQueryChange` and
 * pass the items you got back. Focus stays in the search box and the
 * highlighted option is named by `aria-activedescendant`. The query is
 * cleared whenever the palette closes. The box is a text input, not a search
 * input, so that Escape always closes the palette instead of first clearing it.
 */
import { createElement as h, useId } from "react";
import { Dialog } from "./dialog.js";
import { Options, optionId, useHighlight, useMatches, useScrollToActive } from "./listbox.js";
import { cx, useControllable } from "./util.js";

export function CommandPalette({
  items,
  open,
  defaultOpen = false,
  onOpenChange,
  query,
  defaultQuery = "",
  onQueryChange,
  onSelect,
  filter,
  busy,
  emptyText = "No matches",
  label = "Search",
  placeholder,
  listLabel = "Results",
  foot,
  className,
  ...props
}) {
  const base = useId();
  const [isOpen, setOpen] = useControllable(open, defaultOpen, onOpenChange);
  const [text, setText] = useControllable(query, defaultQuery, onQueryChange);
  const matches = useMatches(items, text, filter);
  const { active, setActive, move } = useHighlight(matches);
  const activeId = isOpen && active ? optionId(base, matches, active) : undefined;
  useScrollToActive(activeId, isOpen);

  const changeOpen = (next) => {
    if (!next) {
      setText("");
      setActive(null);
    }
    setOpen(next);
  };
  const pick = (item, event) => {
    onSelect?.(item, event);
    changeOpen(false);
  };

  return h(
    Dialog,
    { ...props, open: isOpen, onOpenChange: changeOpen, className: cx("sd-command", className), "aria-label": label, "aria-labelledby": undefined },
    h("input", {
      type: "text",
      enterKeyHint: "go",
      role: "combobox",
      autoComplete: "off",
      "aria-label": label,
      "aria-expanded": true,
      "aria-controls": `${base}-list`,
      "aria-autocomplete": "list",
      "aria-activedescendant": activeId,
      placeholder,
      value: text,
      onChange: (event) => {
        setText(event.target.value);
        setActive(null);
      },
      onKeyDown: (event) => {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          move(event.key === "ArrowDown" ? 1 : -1);
        } else if (event.key === "Enter" && activeId) {
          event.preventDefault();
          document.getElementById(activeId).click();
        }
      },
    }),
    h(
      "div",
      {
        id: `${base}-list`,
        role: "listbox",
        "aria-label": listLabel,
        "aria-busy": busy || undefined,
        className: "sd-menu sd-command-list",
        // A press on the list must not take focus from the search box.
        onMouseDown: (event) => event.preventDefault(),
      },
      isOpen && h(Options, { base, matches, active, emptyText, busy, onPick: pick, onActive: setActive }),
    ),
    foot && h("p", { className: "sd-command-foot" }, foot),
  );
}
