/** Tabs with roving focus. React owns the selected tab; arrows, Home and End select as they move, like init() does. */
import { createContext, createElement as h, useContext, useId, useMemo } from "react";
import { chain, cx, useControllable } from "./util.js";

const TabsContext = createContext(null);
const part = (base, kind, value) => `${base}-${kind}-${String(value).replace(/[^\w-]/g, "_")}`;

export function Tabs({ value, defaultValue, onValueChange, ...props }) {
  const [selected, select] = useControllable(value, defaultValue, onValueChange);
  const base = useId();
  const context = useMemo(() => ({ base, selected, select }), [base, selected, select]);
  return h(TabsContext.Provider, { value: context }, h("div", props));
}

export function TabList({ label, className, onKeyDown, ...props }) {
  return h("div", {
    role: "tablist",
    "aria-label": label,
    className: cx("sd-tabs", className),
    onKeyDown: (event) => {
      onKeyDown?.(event);
      if (event.defaultPrevented) return;
      const tabs = [...event.currentTarget.querySelectorAll('[role="tab"]:not(:disabled)')];
      const at = tabs.indexOf(document.activeElement);
      const to = { ArrowRight: at + 1, ArrowLeft: at - 1, Home: 0, End: tabs.length - 1 }[event.key];
      if (to === undefined || at < 0) return;
      event.preventDefault();
      const tab = tabs[(to + tabs.length) % tabs.length];
      tab.focus();
      tab.click();
    },
    ...props,
  });
}

export function Tab({ value, onClick, ...props }) {
  const { base, selected, select } = useContext(TabsContext);
  const on = selected === value;
  return h("button", {
    type: "button",
    role: "tab",
    id: part(base, "tab", value),
    "aria-controls": part(base, "panel", value),
    "aria-selected": on,
    tabIndex: on ? 0 : -1,
    onClick: chain(onClick, () => select(value)),
    ...props,
  });
}

export function TabPanel({ value, className, ...props }) {
  const { base, selected } = useContext(TabsContext);
  return h("div", {
    role: "tabpanel",
    id: part(base, "panel", value),
    "aria-labelledby": part(base, "tab", value),
    hidden: selected !== value,
    className: cx("sd-tabpanel", className),
    ...props,
  });
}
