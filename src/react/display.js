/** Static parts: badges, avatars, cards, panels, empty states and tables. State is props; there is no behavior. */
import { createElement as h } from "react";
import { cx } from "./util.js";

export function Badge({ tone, solid, className, ...props }) {
  return h("span", { className: cx("sd-badge", solid && "sd-badge-solid", className), "data-tone": tone, ...props });
}

/** A solid number. With `label` it reads as "label: value"; `corner` pins it to the corner of a positioned parent. */
export function CountBadge({ value, max = 99, label, tone, corner, hideZero, className, ...props }) {
  if (hideZero && value === 0) return null;
  return h(
    "span",
    {
      className: cx("sd-badge-count", className),
      "data-tone": tone,
      "data-corner": corner ? "" : undefined,
      "aria-label": label ? `${label}: ${value}` : undefined,
      ...props,
    },
    value > max ? `${max}+` : value,
  );
}

const initials = (name) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

/** A square avatar: the picture when there is `src`, else the initials of `name`. */
export function Avatar({ name, src, size, tone, status, className, ...props }) {
  return h(
    "span",
    { role: "img", "aria-label": name, className: cx("sd-avatar", size && `sd-avatar-${size}`, className), "data-tone": tone, "data-status": status, ...props },
    src ? h("img", { src, alt: "" }) : initials(name),
  );
}

export function AvatarStack({ className, ...props }) {
  return h("span", { role: "group", className: cx("sd-avatar-stack", className), ...props });
}

/** A card. With `href` the whole card is a link. */
export function Card({ tone, href, className, ...props }) {
  return h(href ? "a" : "article", { href, className: cx("sd-card", className), "data-tone": tone, ...props });
}
export function CardHeader({ className, ...props }) {
  return h("header", { className: cx("sd-card-head", className), ...props });
}
export function CardBody({ className, ...props }) {
  return h("div", { className: cx("sd-card-body", className), ...props });
}
export function CardFooter({ className, ...props }) {
  return h("footer", { className: cx("sd-card-foot", className), ...props });
}

/** A settings group. `width` caps it: "wide" at 1024px, "fluid" not at all, else 560px. */
export function Panel({ width, className, ...props }) {
  return h("section", { className: cx("sd-panel", width === "wide" && "sd-panel-wide", width === "fluid" && "sd-panel-fluid", className), ...props });
}
export function PanelTitle({ className, ...props }) {
  return h("h3", { className: cx("sd-panel-title", className), ...props });
}
export function PanelDescription({ className, ...props }) {
  return h("p", { className: cx("sd-panel-desc", className), ...props });
}

/** The empty state. `data-sd-ornaments="none"` keeps init() from adding DOM React does not know about. */
export function EmptyState({ title, action, children, className, ...props }) {
  return h(
    "div",
    { className: cx("sd-empty", className), "data-sd-ornaments": "none", ...props },
    h("span", { className: "sd-dot", "data-shape": "hollow" }),
    title && h("p", { className: "sd-empty-title" }, title),
    children && h("p", null, children),
    action,
  );
}

/** A table in its scroll wrapper. `ref` and extra props reach the table. */
export function Table({ compact, hover, className, wrapClassName, ...props }) {
  return h(
    "div",
    { className: cx("sd-table-wrap", wrapClassName) },
    h("table", { className: cx("sd-table", compact && "sd-table-compact", hover && "sd-table-hover", className), ...props }),
  );
}
export const TableCaption = (props) => h("caption", props);
export const TableHead = (props) => h("thead", props);
export const TableBody = (props) => h("tbody", props);
export const TableFoot = (props) => h("tfoot", props);

export function TableRow({ selected, ...props }) {
  return h("tr", { "aria-selected": selected || undefined, ...props });
}

/**
 * A column header. `sortable` marks it clickable; `sort` ("ascending" or
 * "descending") draws the arrow and `onSort` is called on click, Enter or Space.
 */
export function TableHeader({ sortable, sort, onSort, numeric, className, onClick, onKeyDown, ...props }) {
  const sorts = sortable || sort !== undefined || onSort !== undefined;
  return h("th", {
    scope: "col",
    className: cx(numeric && "sd-num", className),
    "data-sort": sorts ? "" : undefined,
    "aria-sort": sorts ? (sort ?? "none") : undefined,
    tabIndex: onSort ? 0 : undefined,
    onClick: (event) => {
      onClick?.(event);
      onSort?.(event);
    },
    onKeyDown: (event) => {
      onKeyDown?.(event);
      if (onSort && !event.defaultPrevented && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        onSort(event);
      }
    },
    ...props,
  });
}

export function TableCell({ numeric, className, ...props }) {
  return h("td", { className: cx(numeric && "sd-num", className), ...props });
}

/**
 * A bar of segments sized by weight, toward a goal (drafted, current and
 * planned work, say). A segment's size is its share of the weights, so the
 * unit does not matter. With `goal`, whatever is left to reach it is a
 * trailing open segment; past the goal there is none. `label` is the bar's
 * accessible name and should say the numbers, since the segments are not read.
 */
export function WeightedBar({ label, segments, goal, className, ...props }) {
  const rest = goal === undefined ? 0 : goal - segments.reduce((sum, segment) => sum + segment.weight, 0);
  return h(
    "div",
    { role: "img", "aria-label": label, className: cx("sd-weighted", className), ...props },
    segments.map((segment, i) => h("i", { key: segment.key ?? i, "data-state": segment.state, title: segment.label, style: { "--weight": segment.weight } })),
    rest > 0 && h("i", { "data-state": "open", style: { "--weight": rest } }),
  );
}
