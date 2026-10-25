/**
 * Hover card rendered by React: a preview beside its trigger that opens on
 * hover (after a short delay) or keyboard focus and closes on leave, blur or
 * Escape. The pointer can move onto the card without closing it. Like the
 * tooltip it is a portal on <body> that exists only while open, so server
 * output has none. It is a preview: it is not in the tab order, so what it
 * shows must be reachable elsewhere too.
 *
 * `HoverCard` wraps one React trigger. `HoverCardHost` is for a trigger React
 * does not render, such as a ProseMirror decoration: the code that owns the
 * trigger calls `show(anchor, content)` and `hide()` on a ref.
 */
import { Fragment, cloneElement, createElement as h, useCallback, useEffect, useId, useImperativeHandle, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { place } from "../js/position.js";
import { cx, mergeRefs, useControllable, useIsomorphicLayoutEffect } from "./util.js";

const rectOf = (rect) => ({ left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.right - rect.left, height: rect.bottom - rect.top });

/** What a card can sit beside: an element, anything with `getBoundingClientRect`, a plain rect, or a function that returns one. */
function anchorOf(anchor) {
  if (typeof anchor === "function") return { getBoundingClientRect: () => rectOf(anchor()) };
  if (typeof anchor.getBoundingClientRect === "function") return anchor;
  return { getBoundingClientRect: () => rectOf(anchor) };
}

/** The card: a portal placed beside `anchor.current`, kept there while the page scrolls or resizes, closed by Escape through `onEscape`. */
function Card({ id, anchor, side, align, label, className, content, onEscape, onPointerEnter, onPointerLeave, ref }) {
  const node = useRef(null);

  useIsomorphicLayoutEffect(() => {
    const position = () => anchor.current && anchor.current.isConnected !== false && place(node.current, anchor.current, { side, align });
    position();
    addEventListener("scroll", position, { passive: true, capture: true });
    addEventListener("resize", position, { passive: true });
    return () => {
      removeEventListener("scroll", position, { capture: true });
      removeEventListener("resize", position);
    };
  }, [anchor, side, align, content]);

  // A layout effect, so the listener exists in the same commit that shows the card.
  useIsomorphicLayoutEffect(() => {
    const onKey = (event) => event.key === "Escape" && onEscape();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onEscape]);

  return createPortal(
    h("div", { id, ref: mergeRefs(node, ref), role: "tooltip", "aria-label": label, className: cx("sd-hovercard", className), onPointerEnter, onPointerLeave }, content),
    document.body,
  );
}

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
      h(Card, {
        id,
        ref: card,
        anchor,
        side,
        align,
        label,
        className,
        content,
        onEscape: () => {
          cancel();
          setOpen(false);
        },
        onPointerEnter: cancel,
        onPointerLeave: () => later(false, closeDelay),
      }),
  );
}

/**
 * The card for a trigger React does not render. Render it once and keep a ref:
 * `ref.current.show(anchor, content)` opens it at once beside `anchor` (an
 * element, a rect such as ProseMirror's `coordsAtPos`, or a function that
 * returns one) and `ref.current.hide()` closes it after `closeDelay`, unless
 * the pointer has moved onto the card. `hide({ immediate: true })` and Escape
 * close it now. The owner of the trigger decides when to call them, so the
 * delay before opening is the owner's. `onOpenChange` hears when the card
 * really opens and closes (after a delay, on Escape, or when the pointer leaves
 * it), which is when the owner clears its hover state and the trigger's
 * `aria-describedby`, set to `ref.current.id` while the card is open.
 */
export function HoverCardHost({ closeDelay = 150, className, onOpenChange, ref }) {
  const id = useId();
  const [shown, setShown] = useState(null);
  const current = useRef(null);
  const anchor = useRef(null);
  const timer = useRef(0);
  const delay = useRef(closeDelay);
  delay.current = closeDelay;
  const listener = useRef(onOpenChange);
  listener.current = onOpenChange;
  const was = useRef(false);
  const isOpen = shown !== null;
  useEffect(() => {
    if (was.current === isOpen) return;
    was.current = isOpen;
    listener.current?.(isOpen);
  }, [isOpen]);

  const cancel = () => clearTimeout(timer.current);
  useEffect(() => cancel, []);
  const close = useCallback(() => {
    clearTimeout(timer.current);
    current.current = null;
    setShown(null);
  }, []);
  const show = useCallback((target, content, { side = "bottom", align = "start", label = "Preview" } = {}) => {
    clearTimeout(timer.current);
    anchor.current = anchorOf(target);
    current.current = { content, side, align, label };
    setShown(current.current);
  }, []);
  const hide = useCallback(
    ({ immediate = false } = {}) => {
      clearTimeout(timer.current);
      if (immediate) close();
      else timer.current = setTimeout(close, delay.current);
    },
    [close],
  );
  useImperativeHandle(
    ref,
    () => ({
      id,
      show,
      hide,
      get open() {
        return current.current !== null;
      },
    }),
    [id, show, hide],
  );

  if (shown === null || typeof document === "undefined") return null;
  return h(Card, {
    id,
    anchor,
    side: shown.side,
    align: shown.align,
    label: shown.label,
    className,
    content: shown.content,
    onEscape: close,
    onPointerEnter: cancel,
    onPointerLeave: () => hide(),
  });
}
