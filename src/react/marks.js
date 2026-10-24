/** Marks: the spans of a document that a comment, a suggestion, a mention or a detected entity is attached to. */
import { createElement as h } from "react";
import { cx } from "./util.js";

const ELEMENT = { comment: "mark", insert: "ins", delete: "del" };

/**
 * A mark. The element follows the kind (`mark`, `ins`, `del`), a link with
 * `href`, else a `span`. With `onClick` and no `href` it becomes a button
 * (`role="button"`, one tab stop, Enter and Space). `active` is the open
 * comment and sets `aria-current`.
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
