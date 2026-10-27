/**
 * Popover and menu on the native popover API. React owns `open`; the browser
 * owns the top layer, light dismiss and Escape, and reports them through
 * `beforetoggle`, so the state follows whoever closed it. The trigger links to
 * the panel with `popovertarget`, which makes a click on the trigger toggle
 * the panel instead of dismissing and reopening it. Without a trigger the panel
 * can open at an `anchor` instead, such as the pointer for a context menu.
 */
import { cloneElement, createContext, createElement as h, useCallback, useContext, useEffect, useId, useMemo, useReducer, useRef } from "react";
import { place } from "../js/position.js";
import { cx, mergeRefs, useControllable } from "./util.js";

const PopoverContext = createContext(null);
const usePopover = () => useContext(PopoverContext);

export function Popover({ open, defaultOpen = false, onOpenChange, children }) {
  const [isOpen, setOpen] = useControllable(open, defaultOpen, onOpenChange);
  const id = useId();
  const trigger = useRef(null);
  // What had focus when a panel with no trigger opened, to give focus back to.
  const opener = useRef(null);
  const context = useMemo(() => ({ id, isOpen, setOpen, trigger, opener }), [id, isOpen, setOpen]);
  return h(PopoverContext.Provider, { value: context }, children);
}

/** Wrap the button that opens the panel. */
export function PopoverTrigger({ children, haspopup }) {
  const { id, isOpen, trigger } = usePopover();
  return cloneElement(children, {
    ref: mergeRefs(children.props.ref, trigger),
    popoverTarget: id,
    "aria-expanded": isOpen,
    "aria-controls": id,
    "aria-haspopup": haspopup,
  });
}

/**
 * The panel, placed next to its trigger on `side` and `align` and flipped at
 * the viewport edge. `anchor` places it beside something else instead, and
 * wins over the trigger: a `{ x, y }` point (the panel's corner sits on it, and
 * it still contains the point where it flips or shifts at an edge), a rect, or
 * an element or object with `getBoundingClientRect`. `initialFocus` is a
 * selector for the element to focus on open.
 */
export function PopoverContent({ side = "bottom", align = "start", pad, initialFocus, anchor, className, children, ref, onBeforeToggle, onToggle, ...props }) {
  const { id, isOpen, setOpen, trigger, opener } = usePopover();
  const node = useRef(null);
  const shown = useRef(false);
  const target = useRef(anchor);
  target.current = anchor;
  const [, rerender] = useReducer((n) => n + 1, 0);
  const position = useCallback(() => place(node.current, target.current ?? trigger.current, { side, align }), [trigger, side, align]);

  // Run after every render: a parent that refuses a change gets the DOM put back.
  useEffect(() => {
    if (isOpen && !shown.current) {
      node.current.showPopover();
      // Placed and shown now, not when the toggle event arrives: a pointer released in between would miss it and light dismiss it.
      position();
      node.current.style.visibility = "";
    } else if (!isOpen && shown.current) node.current.hidePopover();
  });

  // A new anchor while open moves the panel, as a second right-click does.
  useEffect(() => {
    if (shown.current) position();
  }, [anchor, position]);

  useEffect(() => {
    if (!isOpen) return;
    addEventListener("scroll", position, { passive: true, capture: true });
    addEventListener("resize", position, { passive: true });
    return () => {
      removeEventListener("scroll", position, { capture: true });
      removeEventListener("resize", position);
    };
  }, [isOpen, position]);

  return h(
    "div",
    {
      ...props,
      id,
      ref: mergeRefs(node, ref),
      popover: "auto",
      className: cx("sd-popover", pad && "sd-popover-pad", className),
      onBeforeToggle: (event) => {
        onBeforeToggle?.(event);
        shown.current = event.newState === "open";
        // Hidden until placed, so it never flashes in the wrong spot.
        if (shown.current) event.currentTarget.style.visibility = "hidden";
        if (shown.current && !trigger.current) opener.current = document.activeElement;
      },
      onToggle: (event) => {
        onToggle?.(event);
        const open = event.newState === "open";
        if (open) {
          position();
          node.current.style.visibility = "";
          if (initialFocus) node.current.querySelector(initialFocus)?.focus();
        }
        setOpen(open);
        rerender();
      },
    },
    children,
  );
}

const ITEM = ':is([role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]):not([aria-disabled="true"]):not(:disabled)';

/** The popover wrapper for a menu: `<Menu><MenuTrigger>…</MenuTrigger><MenuContent>…</MenuContent></Menu>`. */
export const Menu = Popover;

export function MenuTrigger({ children }) {
  return h(PopoverTrigger, { haspopup: "menu" }, children);
}

/** Arrows, Home, End and type-to-jump move focus between the items, like init() does for markup. `typing` is the menu's own type-ahead buffer. */
function onMenuKeyDown(event, typing) {
  const items = [...event.currentTarget.querySelectorAll(ITEM)];
  const at = items.indexOf(document.activeElement);
  let next;
  if (event.key === "ArrowDown") next = items[(at + 1) % items.length];
  else if (event.key === "ArrowUp") next = items[(at - 1 + items.length) % items.length];
  else if (event.key === "Home") next = items[0];
  else if (event.key === "End") next = items[items.length - 1];
  else if (event.key.length === 1 && /\S/.test(event.key) && !event.ctrlKey && !event.metaKey) {
    typing.text = event.timeStamp - typing.at < 600 ? typing.text + event.key.toLowerCase() : event.key.toLowerCase();
    typing.at = event.timeStamp;
    next = [...items.slice(at + 1), ...items.slice(0, at + 1)].find((el) => el.textContent.trim().toLowerCase().startsWith(typing.text));
  }
  if (next) {
    event.preventDefault();
    next.focus();
  }
}

export function MenuContent({ label, className, children, onKeyDown, ...props }) {
  const typing = useRef({ text: "", at: 0 });
  return h(
    PopoverContent,
    { initialFocus: ITEM, className, ...props },
    h(
      "div",
      {
        className: "sd-menu",
        role: "menu",
        "aria-label": label,
        onKeyDown: (event) => {
          onKeyDown?.(event);
          if (!event.defaultPrevented) onMenuKeyDown(event, typing.current);
        },
      },
      children,
    ),
  );
}

/** An item. Choosing it calls `onSelect` and closes the menu unless `onSelect` prevents the default. */
export function MenuItem({ tone, disabled, hint, onSelect, onClick, children, ...props }) {
  const { setOpen, trigger, opener } = usePopover();
  return h(
    "button",
    {
      type: "button",
      role: "menuitem",
      "aria-disabled": disabled || undefined,
      "data-tone": tone,
      ...props,
      onClick: (event) => {
        onClick?.(event);
        if (disabled || event.defaultPrevented) return;
        onSelect?.(event);
        if (event.defaultPrevented) return;
        setOpen(false);
        (trigger.current ?? opener.current)?.focus?.();
      },
    },
    children,
    hint && h("span", { className: "sd-menu-hint" }, hint),
  );
}

/**
 * An item that is on or off. Like init() does, choosing it leaves the menu
 * open so several can be set in a row; `onCheckedChange` hears the next value.
 */
export function MenuItemCheckbox({ checked, onCheckedChange, onSelect, ...props }) {
  return h(MenuItem, {
    role: "menuitemcheckbox",
    "aria-checked": Boolean(checked),
    ...props,
    onSelect: (event) => {
      onSelect?.(event);
      event.preventDefault();
      onCheckedChange?.(!checked);
    },
  });
}

const RadioContext = createContext(null);

/** A set of `MenuItemRadio`s, one of which is checked. `label` is its accessible name. */
export function MenuRadioGroup({ label, value, defaultValue, onValueChange, ...props }) {
  const [current, select] = useControllable(value, defaultValue ?? null, onValueChange);
  const context = useMemo(() => ({ current, select }), [current, select]);
  return h(RadioContext.Provider, { value: context }, h("div", { role: "group", "aria-label": label, ...props }));
}

/** One choice of a `MenuRadioGroup`. Choosing it checks it and closes the menu, unless `onSelect` prevents the default. */
export function MenuItemRadio({ value, onSelect, ...props }) {
  const group = useContext(RadioContext);
  return h(MenuItem, {
    role: "menuitemradio",
    "aria-checked": group.current === value,
    ...props,
    onSelect: (event) => {
      onSelect?.(event);
      group.select(value);
    },
  });
}

export function MenuLabel({ className, ...props }) {
  return h("div", { className: cx("sd-menu-label", className), role: "presentation", ...props });
}

export function MenuSeparator({ className, ...props }) {
  return h("hr", { className: cx("sd-menu-sep", className), ...props });
}
