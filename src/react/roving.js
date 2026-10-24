/**
 * Roving focus: a group of controls with one tab stop. The group is the tab
 * stop until an item has had focus; after that the last focused item is. React
 * owns which item that is, so nothing is written to the DOM behind its back.
 * Items are found in the DOM, in document order, so conditional items need no
 * registration.
 */
import { createContext, useContext, useEffect, useId, useRef, useState } from "react";

const RovingContext = createContext(null);
export const ITEM = "[data-roving]:not(:disabled):not([aria-disabled='true'])";

/**
 * Props for the group element and the context its items read. `keys` maps a
 * key to a step (+1, -1) or to "first" / "last". Steps wrap around the ends
 * unless `wrap` is false. The group hands its tab stop to the item matching
 * `initial` (a selector) when there is one, else the first.
 */
export function useRoving(keys, { wrap = true, initial } = {}) {
  const [active, setActive] = useState(null);
  const group = useRef(null);
  const items = () => [...group.current.querySelectorAll(ITEM)];

  // A tab stop that left the DOM hands the stop back to the group.
  useEffect(() => {
    if (active !== null && !group.current.querySelector(`[data-roving="${CSS.escape(active)}"]`)) setActive(null);
  });

  const props = {
    ref: group,
    tabIndex: active === null ? 0 : -1,
    onFocus: (event) => {
      if (event.target === event.currentTarget) {
        const list = items();
        (initial && list.find((item) => item.matches(initial)) || list[0])?.focus();
        return;
      }
      const id = event.target.closest("[data-roving]")?.dataset.roving;
      if (id !== undefined) setActive(id);
    },
    onKeyDown: (event) => {
      const step = keys[event.key];
      const list = items();
      const at = list.indexOf(event.target);
      if (step === undefined || at < 0 || event.altKey || event.ctrlKey || event.metaKey) return;
      event.preventDefault();
      const to = step === "first" ? 0 : step === "last" ? list.length - 1 : wrap ? (at + step + list.length) % list.length : Math.min(Math.max(at + step, 0), list.length - 1);
      list[to].focus();
    },
  };
  return { props, context: { active } };
}

export const RovingProvider = RovingContext.Provider;

/** The `data-roving` and `tabIndex` props for one item of the nearest group. */
export function useRovingItem() {
  const group = useContext(RovingContext);
  const id = useId();
  if (!group) return {};
  return { "data-roving": id, tabIndex: group.active === id ? 0 : -1 };
}
