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
 * One tip is open at a time on the page, and the pointer moving to another
 * trigger while one is open, or within a moment of one closing, skips that
 * trigger's `delay`. `closeDelay` keeps a tip up after the pointer leaves, and
 * lets the pointer move onto the tip.
 */
import { Fragment, cloneElement, createElement as h, useEffect, useId, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { place } from "../js/position.js";
import { cx, mergeRefs, showManual, useControllable } from "./util.js";

/** How long after a tip closes, in milliseconds, a different trigger the pointer reaches shows at once. */
const WARM = 300;

/** The tip showing now, and which one the pointer left last and when. Touched in handlers and effects only, so the server never sees it. */
const shared = { tip: null, left: -Infinity, from: null };

/** Whether `mine` is a different trigger from the one that is open or just closed, so it need not wait. */
const warm = (mine) => (shared.tip !== null && shared.tip !== mine) || (shared.from !== mine && performance.now() - shared.left < WARM);

export function Tooltip({ content, side = "top", delay = 0, closeDelay = 0, className, onOpenChange, children }) {
  const [visible, setVisible] = useControllable(undefined, false, onOpenChange);
  const id = useId();
  const anchor = useRef(null);
  const tip = useRef(null);
  const wait = useRef(0);
  const linger = useRef(0);
  const me = useRef(null);
  const props = children.props;
  const hoverable = closeDelay > 0;

  const stop = () => {
    clearTimeout(wait.current);
    clearTimeout(linger.current);
    wait.current = 0;
    linger.current = 0;
  };
  me.current ??= { close: () => (stop(), setVisible(false)) };
  const shown = () => shared.tip === me.current;

  useLayoutEffect(() => {
    if (!visible) return;
    showManual(tip.current);
    place(tip.current, anchor.current, { side, align: "center" });
  }, [visible, side, content]);
  // Showing takes the page's one tip from whichever had it.
  useLayoutEffect(() => {
    if (!visible) return;
    const mine = me.current;
    if (shared.tip && shared.tip !== mine) shared.tip.close();
    shared.tip = mine;
    return () => {
      if (shared.tip === mine) shared.tip = null;
    };
  }, [visible]);
  useEffect(() => stop, []);

  const show = (hold = 0) => {
    stop();
    if (hold <= 0) return setVisible(true);
    wait.current = setTimeout(() => {
      wait.current = 0;
      setVisible(true);
    }, hold);
  };
  // The pointer left: after `closeDelay` the tip goes, and the next trigger is warm for a moment.
  const leave = () => {
    clearTimeout(wait.current);
    wait.current = 0;
    if (!shown()) return;
    clearTimeout(linger.current);
    const close = () => {
      linger.current = 0;
      shared.left = performance.now();
      shared.from = me.current;
      setVisible(false);
    };
    if (closeDelay > 0) linger.current = setTimeout(close, closeDelay);
    else close();
  };
  // Escape, blur or a press elsewhere: gone at once, and the next trigger is cold.
  const dismiss = () => {
    const was = shown();
    stop();
    setVisible(false);
    if (was) shared.left = -Infinity;
  };
  // A lifted finger sends no leave to hide it and may never focus the trigger, so a press elsewhere dismisses a tap's tip.
  useEffect(() => {
    if (!visible) return;
    const away = (event) => anchor.current?.contains(event.target) || tip.current?.contains(event.target) || dismiss();
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [visible, setVisible]);

  const on = (name, run) => (event) => {
    props[name]?.(event);
    run(event);
  };
  const trigger = cloneElement(children, {
    ref: mergeRefs(props.ref, anchor),
    "aria-describedby": visible ? id : props["aria-describedby"],
    onPointerEnter: on("onPointerEnter", (event) => {
      // Coming back to a tip that is lingering keeps it.
      clearTimeout(linger.current);
      linger.current = 0;
      if (shown()) return;
      show(event.pointerType !== "touch" && warm(me.current) ? 0 : delay);
    }),
    // A tap shows the tip as the finger lifts, which also ends a delay still running.
    onPointerUp: on("onPointerUp", (event) => event.pointerType !== "mouse" && show()),
    // A touch pointer leaves right after it lifts, which must not hide what the tap showed. Scrolling cancels it instead.
    onPointerLeave: on("onPointerLeave", (event) => event.pointerType !== "touch" && leave()),
    onPointerCancel: on("onPointerCancel", dismiss),
    onFocus: on("onFocus", () => wait.current || show()),
    onBlur: on("onBlur", dismiss),
    onKeyDown: on("onKeyDown", (event) => event.key === "Escape" && dismiss()),
  });
  return h(
    Fragment,
    null,
    trigger,
    visible &&
      createPortal(
        h(
          "div",
          {
            id,
            ref: tip,
            className: cx("sd-tooltip", className),
            popover: "manual",
            role: "tooltip",
            "data-hoverable": hoverable ? "" : undefined,
            // The pointer moving from the trigger onto the tip cancels the close; leaving the tip starts it again.
            onPointerEnter: hoverable ? () => (clearTimeout(linger.current), (linger.current = 0)) : undefined,
            onPointerLeave: hoverable ? leave : undefined,
          },
          content,
        ),
        document.body,
      ),
  );
}
