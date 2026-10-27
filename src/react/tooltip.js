/**
 * Tooltip rendered by React: shown on hover and keyboard focus, hidden on
 * leave, blur or Escape. It is a portal on <body>, so no clipping ancestor
 * can cut it off, and it exists only while visible, so server output has none.
 * It is a manual popover, so it paints above a modal dialog. `delay` holds
 * back the pointer only; keyboard focus (`:focus-visible`) shows it at once.
 * A mouse press that focuses the trigger is still the pointer's hover, so it
 * keeps waiting for the delay.
 */
import { Fragment, cloneElement, createElement as h, useEffect, useId, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { place } from "../js/position.js";
import { cx, mergeRefs, showManual, useControllable } from "./util.js";

export function Tooltip({ content, side = "top", delay = 0, className, onOpenChange, children }) {
  const [visible, setVisible] = useControllable(undefined, false, onOpenChange);
  const id = useId();
  const anchor = useRef(null);
  const tip = useRef(null);
  const wait = useRef(0);
  const props = children.props;

  useLayoutEffect(() => {
    if (!visible) return;
    showManual(tip.current);
    place(tip.current, anchor.current, { side, align: "center" });
  }, [visible, side, content]);
  useEffect(() => () => clearTimeout(wait.current), []);

  const on = (name, show, hold = 0) => (event) => {
    props[name]?.(event);
    clearTimeout(wait.current);
    if (show && hold > 0) wait.current = setTimeout(() => setVisible(true), hold);
    else setVisible(show);
  };
  const trigger = cloneElement(children, {
    ref: mergeRefs(props.ref, anchor),
    "aria-describedby": visible ? id : props["aria-describedby"],
    onPointerEnter: on("onPointerEnter", true, delay),
    onPointerLeave: on("onPointerLeave", false),
    onFocus: (event) => {
      props.onFocus?.(event);
      // The target, not the trigger: a wrapper around the focusable element is never itself focus-visible.
      if (!event.target.matches(":focus-visible")) return;
      clearTimeout(wait.current);
      setVisible(true);
    },
    onBlur: on("onBlur", false),
    onKeyDown: (event) => {
      props.onKeyDown?.(event);
      if (event.key !== "Escape") return;
      clearTimeout(wait.current);
      setVisible(false);
    },
  });
  return h(
    Fragment,
    null,
    trigger,
    visible && createPortal(h("div", { id, ref: tip, className: cx("sd-tooltip", className), popover: "manual", role: "tooltip" }, content), document.body),
  );
}
