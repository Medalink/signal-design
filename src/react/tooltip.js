/**
 * Tooltip rendered by React: shown on hover, focus and a touch tap, hidden on
 * leave, blur or Escape. It is a portal on <body>, so no clipping ancestor
 * can cut it off, and it exists only while visible, so server output has none.
 * It is a manual popover, so it paints above a modal dialog. `delay` holds
 * back the pointer only. Focus shows the tip at once unless the delay the
 * pointer started on this trigger is still running, which then decides: a
 * mouse press that focuses the trigger, or the input a click focuses, is part
 * of the hover and waits it out. A touch tap shows the tip when the finger
 * lifts, whatever the delay, and it stays until the trigger blurs or a press
 * lands elsewhere.
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
  // A lifted finger sends no leave to hide it and may never focus the trigger, so a press elsewhere dismisses a tap's tip.
  useEffect(() => {
    if (!visible) return;
    const away = (event) => anchor.current?.contains(event.target) || setVisible(false);
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [visible, setVisible]);

  const stop = () => {
    clearTimeout(wait.current);
    wait.current = 0;
  };
  const show = (hold = 0) => {
    stop();
    if (hold <= 0) return setVisible(true);
    wait.current = setTimeout(() => {
      wait.current = 0;
      setVisible(true);
    }, hold);
  };
  const hide = () => {
    stop();
    setVisible(false);
  };
  const on = (name, run) => (event) => {
    props[name]?.(event);
    run(event);
  };
  const trigger = cloneElement(children, {
    ref: mergeRefs(props.ref, anchor),
    "aria-describedby": visible ? id : props["aria-describedby"],
    onPointerEnter: on("onPointerEnter", () => show(delay)),
    // A tap shows the tip as the finger lifts, which also ends a delay still running.
    onPointerUp: on("onPointerUp", (event) => event.pointerType !== "mouse" && show()),
    // A touch pointer leaves right after it lifts, which must not hide what the tap showed. Scrolling cancels it instead.
    onPointerLeave: on("onPointerLeave", (event) => event.pointerType !== "touch" && hide()),
    onPointerCancel: on("onPointerCancel", hide),
    onFocus: on("onFocus", () => wait.current || show()),
    onBlur: on("onBlur", hide),
    onKeyDown: on("onKeyDown", (event) => event.key === "Escape" && hide()),
  });
  return h(
    Fragment,
    null,
    trigger,
    visible && createPortal(h("div", { id, ref: tip, className: cx("sd-tooltip", className), popover: "manual", role: "tooltip" }, content), document.body),
  );
}
