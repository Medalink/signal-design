/**
 * A searchable select. React owns the chosen `value`, the text in the box and
 * whether the list is open. The items are passed in and filtered here by
 * default; for results from a server give `filter={false}`, follow
 * `onInputValueChange` and pass the items you got back. Focus stays in the
 * input and the highlighted option is named by `aria-activedescendant`.
 */
import { createElement as h, useEffect, useId, useState } from "react";
import { useControl } from "./form.js";
import { Options, optionId, useHighlight, useMatches, useScrollToActive } from "./listbox.js";
import { cx, useControllable } from "./util.js";

export function Combobox({
  items,
  value,
  defaultValue = null,
  onValueChange,
  inputValue,
  defaultInputValue,
  onInputValueChange,
  open,
  defaultOpen = false,
  onOpenChange,
  filter,
  busy,
  emptyText = "No matches",
  listLabel = "Suggestions",
  name,
  className,
  onChange,
  onKeyDown,
  onBlur,
  onClick,
  ...props
}) {
  const base = useId();
  const [chosen, choose] = useControllable(value, defaultValue, onValueChange);
  const chosenLabel = items.find((item) => item.value === chosen)?.label ?? "";
  const [text, setText] = useControllable(inputValue, defaultInputValue ?? chosenLabel, onInputValueChange);
  const [isOpen, setOpen] = useControllable(open, defaultOpen, onOpenChange);
  const [typed, setTyped] = useState(false);
  const matches = useMatches(items, typed ? text : "", filter);
  const { active, setActive, move } = useHighlight(matches);
  const activeId = isOpen && active ? optionId(base, matches, active) : undefined;
  useScrollToActive(activeId);

  // A value chosen from outside shows its label, unless the app owns the text.
  useEffect(() => {
    if (!typed && inputValue === undefined) setText(chosenLabel);
  }, [chosenLabel]);

  const pick = (item) => {
    choose(item.value);
    setText(item.label);
    setTyped(false);
    setOpen(false);
  };
  const control = useControl({ ...props, onChange, onKeyDown, onBlur, onClick });

  return h(
    "div",
    { className: cx("sd-combobox", className) },
    h("input", {
      type: "text",
      autoComplete: "off",
      ...control,
      role: "combobox",
      "aria-expanded": isOpen,
      "aria-controls": `${base}-list`,
      "aria-autocomplete": "list",
      "aria-activedescendant": activeId,
      value: text,
      onChange: (event) => {
        onChange?.(event);
        setText(event.target.value);
        setTyped(true);
        setActive(null);
        setOpen(true);
      },
      onClick: (event) => {
        onClick?.(event);
        setOpen(true);
      },
      onKeyDown: (event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) return;
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          if (isOpen) move(event.key === "ArrowDown" ? 1 : -1);
          else setOpen(true);
        } else if (event.key === "Enter" && isOpen) {
          event.preventDefault();
          if (active) pick(active);
        } else if (event.key === "Escape" && isOpen) {
          event.preventDefault();
          setOpen(false);
        }
      },
      onBlur: (event) => {
        onBlur?.(event);
        setOpen(false);
        if (typed && inputValue === undefined) setText(chosenLabel);
        setTyped(false);
      },
    }),
    name && h("input", { type: "hidden", name, value: chosen ?? "" }),
    h(
      "div",
      {
        id: `${base}-list`,
        role: "listbox",
        "aria-label": listLabel,
        "aria-busy": busy || undefined,
        className: "sd-menu sd-combobox-list",
        hidden: !isOpen,
        // A press on the list must not take focus from the input, or the blur would close it first.
        onMouseDown: (event) => event.preventDefault(),
      },
      isOpen && h(Options, { base, matches, active, chosen, emptyText, busy, onPick: pick, onActive: setActive }),
    ),
  );
}
