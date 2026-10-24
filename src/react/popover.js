/**
 * Popover and menu on the native popover API. React owns `open`; the browser
 * owns the top layer, light dismiss and Escape, and reports them through
 * `beforetoggle`, so the state follows whoever closed it. The trigger links to
 * the panel with `popovertarget`, which makes a click on the trigger toggle
 * the panel instead of dismissing and reopening it.
 */
import { cloneElement, createContext, createElement as h, useContext, useEffect, useId, useMemo, useReducer, useRef } from "react";
import { place } from "../js/position.js";
import { cx, mergeRefs, useControllable } from "./util.js";

const PopoverContext = createContext(null);
const usePopover = () => useContext(PopoverContext);

export function Popover({ open, defaultOpen = false, onOpenChange, children }) {
  const [isOpen, setOpen] = useControllable(open, defaultOpen, onOpenChange);
  const id = useId();
  const trigger = useRef(null);
  const context = useMemo(() => ({ id, isOpen, setOpen, trigger }), [id, isOpen, setOpen]);
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
 * the viewport edge. `initialFocus` is a selector for the element to focus on open.
 */
export function PopoverContent({ side = "bottom", align = "start", pad, initialFocus, className, children, ref, onBeforeToggle, onToggle, ...props }) {
  const { id, isOpen, setOpen, trigger } = usePopover();
  const node = useRef(null);
  const shown = useRef(false);
  const [, rerender] = useReducer((n) => n + 1, 0);
  const position = () => place(node.current, trigger.current, { side, align });

  // Run after every render: a parent that refuses a change gets the DOM put back.
  useEffect(() => {
    if (isOpen && !shown.current) node.current.showPopover();
    else if (!isOpen && shown.current) node.current.hidePopover();
  });

  useEffect(() => {
    if (!isOpen) return;
    addEventListener("scroll", position, { passive: true, capture: true });
    addEventListener("resize", position, { passive: true });
    return () => {
      removeEventListener("scroll", position, { capture: true });
      removeEventListener("resize", position);
    };
  });

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

const ITEM = '[role="menuitem"]:not([aria-disabled="true"]):not(:disabled)';

/** The popover wrapper for a menu: `<Menu><MenuTrigger>…</MenuTrigger><MenuContent>…</MenuContent></Menu>`. */
export const Menu = Popover;

export function MenuTrigger({ children }) {
  return h(PopoverTrigger, { haspopup: "menu" }, children);
}

let typed = "";
let typedAt = 0;

/** Arrows, Home, End and type-to-jump move focus between the items, like init() does for markup. */
function onMenuKeyDown(event) {
  const items = [...event.currentTarget.querySelectorAll(ITEM)];
  const at = items.indexOf(document.activeElement);
  let next;
  if (event.key === "ArrowDown") next = items[(at + 1) % items.length];
  else if (event.key === "ArrowUp") next = items[(at - 1 + items.length) % items.length];
  else if (event.key === "Home") next = items[0];
  else if (event.key === "End") next = items[items.length - 1];
  else if (event.key.length === 1 && /\S/.test(event.key) && !event.ctrlKey && !event.metaKey) {
    typed = event.timeStamp - typedAt < 600 ? typed + event.key.toLowerCase() : event.key.toLowerCase();
    typedAt = event.timeStamp;
    next = [...items.slice(at + 1), ...items.slice(0, at + 1)].find((el) => el.textContent.trim().toLowerCase().startsWith(typed));
  }
  if (next) {
    event.preventDefault();
    next.focus();
  }
}

export function MenuContent({ label, className, children, onKeyDown, ...props }) {
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
          if (!event.defaultPrevented) onMenuKeyDown(event);
        },
      },
      children,
    ),
  );
}

/** An item. Choosing it calls `onSelect` and closes the menu unless `onSelect` prevents the default. */
export function MenuItem({ tone, disabled, hint, onSelect, onClick, children, ...props }) {
  const { setOpen, trigger } = usePopover();
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
        trigger.current?.focus();
      },
    },
    children,
    hint && h("span", { className: "sd-menu-hint" }, hint),
  );
}

export function MenuLabel({ className, ...props }) {
  return h("div", { className: cx("sd-menu-label", className), role: "presentation", ...props });
}

export function MenuSeparator({ className, ...props }) {
  return h("hr", { className: cx("sd-menu-sep", className), ...props });
}
