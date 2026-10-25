/** Marks: the spans of a document that a comment, a suggestion, a mention or a detected entity is attached to. */
import { createElement as h } from "react";
import { cx } from "./util.js";

const ELEMENT = { comment: "mark", find: "mark", insert: "ins", delete: "del" };

/**
 * A mark. The element follows the kind (`mark`, `ins`, `del`), a link with
 * `href`, else a `span`. With `onClick` and no `href` it becomes a button
 * (`role="button"`, one tab stop, Enter and Space). `active` is the open
 * comment or the current find or check match, and sets `aria-current`.
 */
export function Mark({ kind, active, resolved, who, href, onClick, onKeyDown, className, style, ...props }) {
  const button = onClick !== undefined && href === undefined;
  return h(href !== undefined ? "a" : (ELEMENT[kind] ?? "span"), {
    className: cx("sd-mark", className),
    "data-mark": kind,
    "data-resolved": resolved ? "" : undefined,
    "aria-current": active ? "true" : undefined,
    style: who ? { "--who": who, ...style } : style,
    href,
    role: button ? "button" : undefined,
    tabIndex: button ? 0 : undefined,
    onClick,
    onKeyDown: (event) => {
      onKeyDown?.(event);
      if (!button || event.defaultPrevented || event.target !== event.currentTarget || (event.key !== "Enter" && event.key !== " ")) return;
      event.preventDefault();
      event.currentTarget.click();
    },
    ...props,
  });
}

/**
 * A square in the margin beside a block, for what is attached to the block as
 * a whole. Its content is `children` (a glyph) or else `count`; `label` is the
 * accessible name ("2 comments") and is required. `active` is the open one
 * (`aria-current`), `resolved` a settled one, and `kind="suggestion"` draws a
 * dashed edge. Put it in a `GutterBlock`, or any element with the class
 * `sd-gutter-block`.
 */
export function GutterMarker({ kind = "comment", count, active, resolved, label, className, type = "button", children, ...props }) {
  return h(
    "button",
    {
      type,
      className: cx("sd-gutter-marker", className),
      "data-kind": kind,
      "data-resolved": resolved ? "" : undefined,
      "aria-current": active ? "true" : undefined,
      "aria-label": label,
      ...props,
    },
    children ?? count,
  );
}

/**
 * A block of a manuscript page that can carry a `GutterMarker`: `as` is the
 * element (default `div`), `marker` the marker's props, and `side="start"`
 * puts it in the leading margin instead of the trailing one.
 */
export function GutterBlock({ as = "div", side, marker, className, children, ...props }) {
  return h(as, { className: cx("sd-gutter-block", className), "data-side": side === "start" ? "start" : undefined, ...props }, children, marker && h(GutterMarker, marker));
}
