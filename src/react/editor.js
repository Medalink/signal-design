/** Parts of a writing surface that are not controls: the manuscript page and the status bar segments. */
import { createElement as h } from "react";
import { cx } from "./util.js";

/**
 * The writing surface: a scroller on the canvas holding one page at a reading
 * measure. `className` and `ref` reach the page, `wrapClassName` the scroller.
 * `face="mono"` sets the page in Source Code Pro.
 */
export function Manuscript({ measure, face, wrapClassName, className, style, ...props }) {
  return h(
    "div",
    { className: cx("sd-manuscript", wrapClassName) },
    h("article", {
      className: cx("sd-manuscript-page", className),
      "data-face": face,
      style: measure ? { "--measure": measure, ...style } : style,
      ...props,
    }),
  );
}

/**
 * A fact in the status bar. It is a button when it has `onClick` or `pressed`,
 * a link with `href`, and plain text otherwise. `tone` adds a colored dot
 * before the text; `end` pushes the segment to the far side.
 */
export function StatusSegment({ tone, end, pressed, href, className, children, onClick, disabled, ...props }) {
  const element = href ? "a" : onClick || pressed !== undefined ? "button" : "span";
  if (element === "button") props.disabled = disabled;
  return h(
    element,
    {
      className: cx("sd-statusbar-seg", end && "sd-statusbar-end", className),
      href,
      type: element === "button" ? "button" : undefined,
      "aria-pressed": element === "button" ? pressed : undefined,
      onClick,
      ...props,
    },
    tone && h("span", { className: "sd-dot", "data-tone": tone, "aria-hidden": "true" }),
    children,
  );
}
