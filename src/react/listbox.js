/**
 * What the combobox and the command palette share: filtering a list of items
 * passed in, the highlighted item, and the options themselves. Nothing here
 * fetches. For results that come from a server, give `filter={false}`, watch
 * the query, and pass the items you got back.
 */
import { createElement as h, Fragment, useEffect, useMemo, useState } from "react";

const haystack = (item) => `${item.label} ${item.keywords ?? ""} ${item.value}`.toLowerCase();

/** The items that match `query`: all of them when `filter` is false or the query is empty. */
export function useMatches(items, query, filter) {
  return useMemo(() => {
    const text = query.trim().toLowerCase();
    if (filter === false || !text) return items;
    return items.filter(typeof filter === "function" ? (item) => filter(item, query) : (item) => haystack(item).includes(text));
  }, [items, query, filter]);
}

/** The highlighted item: the one last moved to if it is still listed, else the first that is not disabled. */
export function useHighlight(matches) {
  const [value, setValue] = useState(null);
  const enabled = matches.filter((item) => !item.disabled);
  const active = enabled.find((item) => item.value === value) ?? enabled[0] ?? null;
  const move = (delta) => {
    if (!enabled.length) return;
    setValue(enabled[(enabled.indexOf(active) + delta + enabled.length) % enabled.length].value);
  };
  return { active, setActive: setValue, move };
}

/** The id of an option, for `aria-activedescendant`. */
export const optionId = (base, matches, item) => `${base}-o${matches.indexOf(item)}`;

/**
 * The listbox's children: a label where the group changes, an option per item
 * and a label when nothing matches. An item with `href` is a link.
 */
export function Options({ base, matches, active, chosen, emptyText, busy, busyText = "Loading", onPick, onActive }) {
  let group;
  const rows = matches.flatMap((item) => {
    const heading = item.group && item.group !== group ? h("div", { key: `group-${item.group}`, className: "sd-menu-label", role: "presentation" }, item.group) : null;
    group = item.group;
    const props = {
      key: item.value,
      id: optionId(base, matches, item),
      role: "option",
      "aria-selected": item === active,
      "aria-disabled": item.disabled || undefined,
      "data-active": item === active ? "" : undefined,
      "data-chosen": item.value === chosen ? "" : undefined,
      onClick: (event) => !item.disabled && onPick(item, event),
      onPointerMove: () => !item.disabled && item !== active && onActive(item.value),
    };
    const content = [item.label, item.hint && h("span", { key: "hint", className: "sd-menu-hint" }, item.hint)];
    const option = item.href !== undefined ? h("a", { ...props, href: item.href }, content) : h("button", { ...props, type: "button" }, content);
    return heading ? [heading, option] : [option];
  });
  if (!matches.length) rows.push(h("p", { key: "empty", className: "sd-menu-label", role: "presentation" }, busy ? busyText : emptyText));
  return h(Fragment, null, rows);
}

/** Scroll the highlighted option into view when it changes. */
export function useScrollToActive(id, on = true) {
  useEffect(() => {
    if (on && id) document.getElementById(id)?.scrollIntoView({ block: "nearest" });
  }, [id, on]);
}
