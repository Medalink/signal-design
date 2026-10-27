/**
 * Fields and controls. `Field` owns the label, hint and error and hands the id
 * and ARIA wiring to the control inside it through context, so the control
 * can be any component that renders one of these.
 */
import { createContext, createElement as h, useContext, useId, useMemo } from "react";
import { cx } from "./util.js";

const FieldContext = createContext(null);

export function Field({ label, hint, error, aside, required, id, className, children, ...props }) {
  const generated = useId();
  const controlId = id ?? generated;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const wiring = useMemo(
    () => ({ id: controlId, describedBy: errorId ?? hintId, invalid: Boolean(error), required }),
    [controlId, errorId, hintId, error, required],
  );
  return h(
    FieldContext.Provider,
    { value: wiring },
    h(
      "div",
      { className: cx("sd-field", className), "data-invalid": error ? "" : undefined, ...props },
      label && h("label", { className: "sd-field-label", htmlFor: controlId }, label, aside && h("span", { className: "sd-field-aside" }, aside)),
      children,
      hint && h("p", { id: hintId, className: "sd-field-hint" }, hint),
      error && h("p", { id: errorId, className: "sd-field-error" }, error),
    ),
  );
}

/** What a control takes from its Field: an id, the description it points at, invalid and required. */
export function useControl(props) {
  const field = useContext(FieldContext);
  if (!field) return props;
  const describedBy = cx(props["aria-describedby"], field.describedBy) || undefined;
  return {
    ...props,
    id: props.id ?? field.id,
    "aria-describedby": describedBy,
    "aria-invalid": props["aria-invalid"] ?? (field.invalid || undefined),
    required: props.required ?? (field.required || undefined),
  };
}

export function Input(props) {
  return h("input", useControl(props));
}

export function Textarea(props) {
  return h("textarea", useControl(props));
}

export function Select(props) {
  return h("select", useControl(props));
}

/** Whether React draws anything for a label or description: not nothing, a boolean or an empty string, but `0` is a label. */
const drawn = (node) => node !== undefined && node !== null && typeof node !== "boolean" && node !== "";

function Check({ role, label, description, className, ...props }) {
  const text = drawn(label) || drawn(description);
  return h(
    "label",
    { className: cx("sd-check", !text && "sd-check-bare", className) },
    h("input", { type: "checkbox", role, ...props }),
    text && h("span", { className: "sd-check-text" }, label, drawn(description) && h("span", { className: "sd-check-desc" }, description)),
  );
}

/** A checkbox with its label and optional description, or with just an `aria-label` or `aria-labelledby` and no text. `ref` reaches the input. */
export function Checkbox(props) {
  return h(Check, props);
}

/** A checkbox rendered as a switch (`role="switch"`). */
export function Switch(props) {
  return h(Check, { ...props, role: "switch" });
}
