/**
 * A panel of one size that the layout around it gives way to, with a handle on
 * the edge that faces its neighbor: the window splitter of the ARIA practices,
 * a focusable `separator` whose `aria-valuenow` is the size in pixels. React
 * owns the size; the pointer drags it and the arrow keys step it, and both
 * only ever call `onSizeChange`. The children sit in a body that scrolls, so
 * the handle stays on the edge when they are taller than the panel. A body
 * with nothing focusable in it needs `bodyProps={{ tabIndex: 0 }}` for the
 * keyboard to scroll it.
 * `sd-sidebar-resize` is the same handle for the sidebar of the App Shell.
 */
import { createElement as h, useId, useRef, useState } from "react";
import { cx, useControllable } from "./util.js";

export function ResizablePanel({ edge = "end", size, defaultSize = 288, onSizeChange, minSize = 160, maxSize = 640, label = "Resize", step = 16, bodyProps, id, className, style, children, ...props }) {
  const [value, setSize] = useControllable(size, defaultSize, onSizeChange);
  const generated = useId();
  const panelId = id ?? generated;
  const [dragging, setDragging] = useState(false);
  const drag = useRef(null);
  const vertical = edge === "start" || edge === "end";
  const max = Math.max(minSize, maxSize);
  const clamp = (pixels) => Math.min(max, Math.max(minSize, Math.round(pixels)));
  const now = clamp(value);
  // Which way along the axis grows the panel: away from the neighbor, which is the other side of the handle.
  const growth = (handle) => (edge === "end" || edge === "bottom" ? 1 : -1) * (vertical && getComputedStyle(handle).direction === "rtl" ? -1 : 1);

  const keyDown = (event) => {
    const toward = vertical ? { ArrowRight: 1, ArrowLeft: -1 } : { ArrowDown: 1, ArrowUp: -1 };
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    let next;
    if (event.key === "Home") next = minSize;
    else if (event.key === "End") next = max;
    else if (toward[event.key] !== undefined) next = now + toward[event.key] * growth(event.currentTarget) * step * (event.shiftKey ? 4 : 1);
    if (next === undefined) return;
    event.preventDefault();
    setSize(clamp(next));
  };

  return h(
    "div",
    {
      ...props,
      id: panelId,
      className: cx("sd-resizable", className),
      "data-edge": edge,
      "data-resizing": dragging ? "" : undefined,
      style: { "--size": `${now}px`, ...style },
    },
    h("div", { ...bodyProps, className: cx("sd-resizable-body", bodyProps?.className) }, children),
    h("div", {
      role: "separator",
      tabIndex: 0,
      className: "sd-resize-handle",
      "aria-orientation": vertical ? "vertical" : "horizontal",
      "aria-label": label,
      "aria-controls": panelId,
      "aria-valuemin": minSize,
      "aria-valuemax": max,
      "aria-valuenow": now,
      onKeyDown: keyDown,
      onPointerDown: (event) => {
        if (event.button !== 0 || drag.current) return;
        event.preventDefault();
        event.currentTarget.focus({ preventScroll: true });
        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = { pointer: event.pointerId, from: vertical ? event.clientX : event.clientY, size: now, growth: growth(event.currentTarget) };
        setDragging(true);
      },
      onPointerMove: (event) => {
        const start = drag.current;
        if (start === null || event.pointerId !== start.pointer) return;
        setSize(clamp(start.size + ((vertical ? event.clientX : event.clientY) - start.from) * start.growth));
      },
      onLostPointerCapture: () => {
        drag.current = null;
        setDragging(false);
      },
    }),
  );
}
