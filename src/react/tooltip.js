/**
 * Tooltip rendered by React: shown on hover and keyboard focus, hidden on
 * leave, blur or Escape. It is a portal on <body>, so no clipping ancestor
 * can cut it off, and it exists only while visible, so server output has none.
 */
import { Fragment, cloneElement, createElement as h, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { place } from "../js/position.js";
import { mergeRefs } from "./util.js";

export function Tooltip({ content, side = "top", children }) {
  const [visible, setVisible] = useState(false);
  const id = useId();
  const anchor = useRef(null);
  const tip = useRef(null);
  const props = children.props;

  useLayoutEffect(() => {
    if (visible) place(tip.current, anchor.current, { side, align: "center" });
  }, [visible, side, content]);

  const on = (name, show) => (event) => {
    props[name]?.(event);
    setVisible(show);
  };
  const trigger = cloneElement(children, {
    ref: mergeRefs(props.ref, anchor),
    "aria-describedby": visible ? id : props["aria-describedby"],
    onPointerEnter: on("onPointerEnter", true),
    onPointerLeave: on("onPointerLeave", false),
    onFocus: on("onFocus", true),
    onBlur: on("onBlur", false),
    onKeyDown: (event) => {
      props.onKeyDown?.(event);
      if (event.key === "Escape") setVisible(false);
    },
  });
  return h(
    Fragment,
    null,
    trigger,
    visible && createPortal(h("div", { id, ref: tip, className: "sd-tooltip", role: "tooltip" }, content), document.body),
  );
}
