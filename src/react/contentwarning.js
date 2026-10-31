/** Content warning: media kept behind a solid cover until the reader opens it (`sd-cw`). */
import { createElement as h, useId } from "react";
import { cx, useControllable } from "./util.js";

/**
 * `open` / `defaultOpen` / `onOpenChange` drive it and the toggle's
 * `aria-expanded` is the state. Closed, the children (an `sd-shot` or an
 * `sd-file`) are hidden from sight, tab order and assistive tech; the cover
 * shows `label` (the chip, such as "CW · spiders") and the toggle. Open, the
 * cover is a strip above them. `showLabel` and `hideLabel` are the toggle's
 * two names, so a translated app passes both.
 */
export function ContentWarning({ label, open, defaultOpen = false, onOpenChange, showLabel = "Show", hideLabel = "Hide", className, children, ...props }) {
  const [shown, setShown] = useControllable(open, defaultOpen, onOpenChange);
  const id = useId();
  return h(
    "div",
    { className: cx("sd-cw", className), ...props },
    h("div", { className: "sd-cw-media", id: `${id}-media` }, children),
    h(
      "div",
      { className: "sd-cw-cover" },
      h("span", { className: "sd-badge", id: `${id}-warning` }, label),
      h(
        "button",
        {
          type: "button",
          className: "sd-btn sd-btn-sm sd-cw-toggle",
          "aria-expanded": shown,
          "aria-controls": `${id}-media`,
          "aria-describedby": `${id}-warning`,
          onClick: () => setShown(!shown),
        },
        h("span", { className: "sd-cw-show" }, showLabel),
        h("span", { className: "sd-cw-hide" }, hideLabel),
      ),
    ),
  );
}
