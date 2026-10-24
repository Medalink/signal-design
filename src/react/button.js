import { createElement as h } from "react";
import { cx } from "./util.js";

/** The `sd-btn` classes, for a link or any other element that should look like a button. */
export function buttonClass({ variant = "default", size = "md", block = false, className } = {}) {
  return cx("sd-btn", variant !== "default" && `sd-btn-${variant}`, size !== "md" && `sd-btn-${size}`, block && "sd-btn-block", className);
}

export function Button({ variant, size, block, tone, busy, className, type = "button", ...props }) {
  return h("button", {
    type,
    className: buttonClass({ variant, size, block, className }),
    "data-tone": tone,
    "aria-busy": busy || undefined,
    ...props,
  });
}

/** A square icon-only button. `label` is its accessible name. */
export function IconButton({ label, variant, size, tone, className, type = "button", children, ...props }) {
  return h(
    "button",
    {
      type,
      className: cx(buttonClass({ variant, size }), "sd-btn-icon", className),
      "data-tone": tone,
      "aria-label": label,
      ...props,
    },
    children,
  );
}
