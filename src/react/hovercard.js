/**
 * Hover card rendered by React: a preview beside its trigger that opens on
 * hover (after a short delay) or keyboard focus and closes on leave, blur or
 * Escape. The pointer can move onto the card without closing it. Like the
 * tooltip it is a portal on <body> that exists only while open, so server
 * output has none. It is a preview: it is not in the tab order, so what it
 * shows must be reachable elsewhere too.
 */
import { Fragment, cloneElement, createElement as h, useEffect, useId, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { place } from "../js/position.js";
import { cx, mergeRefs, useControllable } from "./util.js";

export function HoverCard({ content, label = "Preview", side = "bottom", align = "start", open, defaultOpen = false, onOpenChange, openDelay = 300, closeDelay = 150, className, children }) {
  const [isOpen, setOpen] = useControllable(open, defaultOpen, onOpenChange);
  const id = useId();
  const anchor = useRef(null);
  const card = useRef(null);
  const timer = useRef(0);
  const props = children.props;

  const cancel = () => clearTimeout(timer.current);
  const later = (next, delay) => {
    cancel();
    timer.current = setTimeout(() => setOpen(next), delay);
  };
  useEffect(() => cancel, []);

  useLayoutEffect(() => {
    if (isOpen) place(card.current, anchor.current, { side, align });
  }, [isOpen, side, align, content]);

  // A layout effect, so the listener exists in the same commit that shows the card.
  useLayoutEffect(() => {
    if (!isOpen) return;
    const onKey = (event) => {
      if (event.key !== "Escape") return;
      cancel();
      if (card.current?.contains(document.activeElement)) anchor.current.focus();
      setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, setOpen]);

  const on = (name, run) => (event) => {
    props[name]?.(event);
    run(event);
  };
  const mouse = (event) => event.pointerType !== "touch";
  const trigger = cloneElement(children, {
    ref: mergeRefs(props.ref, anchor),
    "aria-describedby": isOpen ? id : props["aria-describedby"],
    onPointerEnter: on("onPointerEnter", (event) => mouse(event) && later(true, openDelay)),
    onPointerLeave: on("onPointerLeave", (event) => mouse(event) && later(false, closeDelay)),
    onFocus: on("onFocus", () => {
      cancel();
      setOpen(true);
    }),
    onBlur: on("onBlur", (event) => !card.current?.contains(event.relatedTarget) && later(false, closeDelay)),
  });
  return h(
    Fragment,
    null,
    trigger,
    isOpen &&
      typeof document !== "undefined" &&
      createPortal(
        h("div", { id, ref: card, role: "dialog", "aria-label": label, className: cx("sd-hovercard", className), onPointerEnter: cancel, onPointerLeave: () => later(false, closeDelay) }, content),
        document.body,
      ),
  );
}
