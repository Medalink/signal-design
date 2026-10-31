/** Static parts: badges, avatars, cards, panels, empty states and tables. State is props; there is no behavior. */
import { createElement as h, useId } from "react";
import { Icon } from "./icons.js";
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

/**
 * A group chat's avatar: the first four `members` as a two-by-two square, one
 * letter or picture each. `size` is the avatar's. The grid is one picture named
 * by `label` (default: the members' names); the cells are decoration.
 */
export function AvatarGrid({ members, label, size, className, ...props }) {
  const shown = members.slice(0, 4);
  return h(
    "span",
    { role: "img", "aria-label": label ?? shown.map(({ name }) => name).join(", "), className: cx("sd-avatar-grid", size && `sd-avatar-${size}`, className), ...props },
    shown.map(({ name, src, tone }, index) =>
      h("span", { key: index, className: "sd-avatar", "data-tone": tone, "aria-hidden": true }, src ? h("img", { src, alt: "" }) : initials(name).charAt(0)),
    ),
  );
}

/**
 * The summary under a root message: up to three participants' avatars, `label`
 * ("4 replies", translated by the app) and the `time` of the last reply
 * (`dateTime` is its machine form). A button that opens the thread panel:
 * `open` is `aria-expanded` and `controls` the panel's id. The avatars are
 * decoration; `label` and `time` name the button.
 */
export function ThreadChip({ participants = [], label, time, dateTime, open, controls, type = "button", className, ...props }) {
  return h(
    "button",
    { type, className: cx("sd-thread-chip", className), "aria-expanded": open, "aria-controls": controls, ...props },
    participants.length > 0 &&
      h(
        "span",
        { className: "sd-avatar-stack", "aria-hidden": true },
        participants.slice(0, 3).map(({ name, ...avatar }) => h(Avatar, { key: name, name, ...avatar })),
      ),
    h("b", null, label),
    time !== undefined && h("time", { dateTime }, time),
  );
}

/**
 * An event posted in a conversation (`sd-event-card`). `answers` are the
 * choices in order; `answer` is the viewer's `value` among them and draws as
 * pressed, in success, with a check. Pressing the chosen one again sends the
 * same value. The words are props, so the app translates them. `going` are the
 * avatars of who is coming (decoration: `count` carries the meaning). The
 * calendar action is a link with `calendarHref`, else a button.
 */
export function EventCard({ label, title, when, where, going = [], count, answers, answer, onAnswerChange, answerLabel, calendarLabel, calendarHref, onCalendar, className, ...props }) {
  const titleId = useId();
  const action = calendarHref === undefined ? { type: "button" } : { href: calendarHref };
  return h(
    "article",
    { className: cx("sd-event-card", className), "aria-labelledby": titleId, ...props },
    h("div", { className: "sd-event-card-head" }, h(Icon, { name: "calendar" }), label),
    h("h3", { className: "sd-event-card-title", id: titleId }, title),
    when !== undefined && h("p", { className: "sd-event-card-line" }, h(Icon, { name: "calendar" }), when),
    where !== undefined && h("p", { className: "sd-event-card-line" }, h(Icon, { name: "place" }), where),
    h(
      "div",
      { className: "sd-event-card-who" },
      going.length > 0 &&
        h("span", { className: "sd-avatar-stack", "aria-hidden": true }, going.slice(0, 4).map(({ name, ...avatar }) => h(Avatar, { key: name, name, size: "sm", ...avatar }))),
      h("span", { className: "sd-event-card-count" }, count),
    ),
    h(
      "div",
      { className: "sd-event-card-rsvp", role: "group", "aria-label": answerLabel },
      answers.map(({ value, label: text }) =>
        h(
          "button",
          { key: value, type: "button", className: "sd-btn sd-btn-sm", "aria-pressed": answer === value, onClick: () => onAnswerChange?.(value) },
          answer === value && h(Icon, { name: "check" }),
          text,
        ),
      ),
    ),
    calendarLabel !== undefined &&
      h(calendarHref === undefined ? "button" : "a", { className: "sd-btn sd-btn-link sd-event-card-add", onClick: onCalendar, ...action }, calendarLabel),
  );
}

/**
 * A checklist posted in a message (`sd-tasklist`). Each of `items` is
 * `{ id, label, checked, by }`; `by` is `{ name, who }` for whoever ticked it
 * (`who` is a CSS color, the person's `--who`). `onCheckedChange(id, checked)`
 * makes the checkboxes live; without it they are read-only. The bar and the
 * done/total count follow `items`. The words are props.
 */
export function TaskList({ label, title, items, onCheckedChange, progressLabel, count, addLabel, onAdd, className, ...props }) {
  const titleId = useId();
  const done = items.filter((item) => item.checked).length;
  return h(
    "section",
    { className: cx("sd-tasklist", className), "aria-labelledby": titleId, ...props },
    h(
      "header",
      { className: "sd-tasklist-head" },
      h("span", { className: "sd-tasklist-label" }, h(Icon, { name: "list-bullet" }), label),
      h("span", { className: "sd-tasklist-count" }, count ?? `${done}/${items.length}`),
    ),
    h("h3", { className: "sd-tasklist-title", id: titleId }, title),
    h("div", {
      className: "sd-progress",
      "data-tone": "success",
      style: { "--value": items.length === 0 ? 0 : Math.round((done * 100) / items.length) },
      role: "progressbar",
      "aria-label": progressLabel,
      "aria-valuemin": 0,
      "aria-valuemax": items.length,
      "aria-valuenow": done,
    }),
    h(
      "ul",
      { className: "sd-tasklist-items" },
      items.map(({ id, label: text, checked, by }) =>
        h(
          "li",
          { key: id },
          h(
            "label",
            null,
            h("input", { type: "checkbox", checked: !!checked, disabled: onCheckedChange === undefined, onChange: (event) => onCheckedChange?.(id, event.currentTarget.checked) }),
            h("span", null, text),
          ),
          by && h("b", { style: { "--who": by.who } }, by.name),
        ),
      ),
    ),
    addLabel !== undefined && h("button", { type: "button", className: "sd-tasklist-add", onClick: onAdd }, h(Icon, { name: "plus" }), addLabel),
  );
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

/** `selected={false}` renders `aria-selected="false"`, so a table of selectable rows keeps room for the edge before any is picked. */
export function TableRow({ selected, ...props }) {
  return h("tr", { "aria-selected": selected, ...props });
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
