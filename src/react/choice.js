/**
 * Choosing one of several: a radio group and a segmented control. Both are
 * native radios, so the browser gives them one tab stop, the arrow keys that
 * move and select, and form submission. React owns `value`.
 */
import { createContext, createElement as h, useContext, useId, useMemo } from "react";
import { cx, useControllable } from "./util.js";

const GroupContext = createContext(null);

function useGroup(value, defaultValue, onValueChange, name, disabled) {
  const [current, select] = useControllable(value, defaultValue ?? null, onValueChange);
  const generated = useId();
  return useMemo(() => ({ name: name ?? generated, current, select, disabled }), [name, generated, current, select, disabled]);
}

function Group({ role = "radiogroup", label, value, defaultValue, onValueChange, name, disabled, className, base, ...props }) {
  const group = useGroup(value, defaultValue, onValueChange, name, disabled);
  return h(GroupContext.Provider, { value: group }, h("div", { role, "aria-label": label, "aria-disabled": disabled || undefined, className: cx(base, className), ...props }));
}

function useRadio(value, disabled) {
  const group = useContext(GroupContext);
  return {
    name: group.name,
    value,
    checked: group.current === value,
    disabled: disabled ?? group.disabled,
    onChange: () => group.select(value),
  };
}

/** A set of radios. `label` is its accessible name; use `name` to submit it with a form. */
export function RadioGroup(props) {
  return h(Group, { base: "sd-choices", ...props });
}

/** One radio with its label and optional description. `ref` and the other props reach the input. */
export function Radio({ value, label, description, disabled, className, ...props }) {
  const radio = useRadio(value, disabled);
  return h(
    "label",
    { className: cx("sd-check", className) },
    h("input", { type: "radio", ...props, ...radio }),
    h("span", { className: "sd-check-text" }, label, description && h("span", { className: "sd-check-desc" }, description)),
  );
}

/** A segmented control: the same radios drawn as one joined bar. `wrap` lets the segments flow onto more rows, `inline` shrinks it to its content and `size="sm"` makes it compact. */
export function SegmentedControl({ inline, wrap, size, className, ...props }) {
  return h(Group, { base: cx("sd-seg", inline && "sd-seg-inline", wrap && "sd-seg-wrap", size === "sm" && "sd-seg-sm"), className, ...props });
}

/** One segment. Its children are its label. */
export function Segment({ value, disabled, children, ...props }) {
  const radio = useRadio(value, disabled);
  return h("label", null, h("input", { type: "radio", ...props, ...radio }), children);
}
