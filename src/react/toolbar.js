/**
 * Toolbar for a document surface. One tab stop for the whole row, arrows, Home
 * and End between its buttons, `aria-pressed` on the toggles. A row wider than
 * its container scrolls inside itself; `ToolbarMore` is the explicit overflow
 * menu for the actions you choose to fold away.
 */
import { createElement as h } from "react";
import { buttonClass } from "./button.js";
import { Menu, MenuContent, MenuTrigger } from "./popover.js";
import { RovingProvider, useRoving, useRovingItem } from "./roving.js";
import { chain, cx } from "./util.js";

const KEYS = { ArrowRight: 1, ArrowLeft: -1, Home: "first", End: "last" };

export function Toolbar({ label, className, onFocus, onKeyDown, ref, ...props }) {
  const roving = useRoving(KEYS);
  return h(
    RovingProvider,
    { value: roving.context },
    h("div", {
      role: "toolbar",
      "aria-label": label,
      "aria-orientation": "horizontal",
      className: cx("sd-toolbar", className),
      ...props,
      ref: roving.props.ref,
      tabIndex: roving.props.tabIndex,
      onFocus: (event) => {
        onFocus?.(event);
        roving.props.onFocus(event);
      },
      onKeyDown: (event) => {
        onKeyDown?.(event);
        if (!event.defaultPrevented) roving.props.onKeyDown(event);
      },
    }),
  );
}

export function ToolbarGroup({ label, className, ...props }) {
  return h("div", { role: "group", "aria-label": label, className: cx("sd-toolbar-group", className), ...props });
}

export function ToolbarSeparator({ className, ...props }) {
  return h("span", { role: "separator", "aria-orientation": "vertical", className: cx("sd-toolbar-sep", className), ...props });
}

/**
 * A button in the row. With `label` it is a square icon button named by the
 * label; without it, a text button. `pressed` makes it a toggle and
 * `onPressedChange` hears the next value.
 */
export function ToolbarButton({ label, pressed, onPressedChange, variant = "ghost", className, onClick, type = "button", ...props }) {
  const item = useRovingItem();
  return h("button", {
    type,
    "aria-label": label,
    "aria-pressed": pressed,
    className: cx(buttonClass({ variant, size: "sm" }), "sd-toolbar-btn", label && "sd-btn-icon", className),
    ...item,
    ...props,
    onClick: chain(onClick, () => pressed !== undefined && onPressedChange?.(!pressed)),
  });
}

/** The overflow menu: a trigger in the row and the actions you folded away, as `MenuItem`s. */
export function ToolbarMore({ label = "More", icon = "…", open, defaultOpen, onOpenChange, children }) {
  return h(
    Menu,
    { open, defaultOpen, onOpenChange },
    h(MenuTrigger, null, h(ToolbarButton, { label }, icon)),
    h(MenuContent, { label }, children),
  );
}
