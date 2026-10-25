/**
 * An icon of the Signal set (`signal-design/js/icons`) as an inline SVG. It is
 * decorative until it has a `label`, which makes it an image with that name;
 * an icon-only button names itself with its own `label` and keeps the icon
 * decorative.
 */
import { createElement as h } from "react";
import { ICONS } from "../js/icons.js";
import { cx } from "./util.js";

export function Icon({ name, label, className, ...props }) {
  const d = ICONS[name];
  if (d === undefined) throw new RangeError(`Unknown icon "${name}"`);
  return h(
    "svg",
    {
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 1.5,
      strokeLinecap: "square",
      strokeLinejoin: "miter",
      focusable: "false",
      role: label === undefined ? undefined : "img",
      "aria-label": label,
      "aria-hidden": label === undefined ? "true" : undefined,
      "data-icon": name,
      className: cx("sd-icon", className),
      ...props,
    },
    h("path", { d }),
  );
}
