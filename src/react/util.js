/**
 * Internals shared by the React bindings. Nothing here touches `window` or
 * `document`, so every module is safe to import during server rendering.
 */
import { Fragment, isValidElement, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

/** `useLayoutEffect` in the browser; `useEffect` on the server, where layout effects only warn. */
export const useIsomorphicLayoutEffect = typeof document === "undefined" ? useEffect : useLayoutEffect;

export const cx = (...parts) => parts.filter(Boolean).join(" ");

/** Whether React draws anything for a label or description: not nothing, a boolean, an empty string, or an array or fragment of those, but `0` is text. */
export const drawn = (node) =>
  Array.isArray(node) ? node.some(drawn) : isValidElement(node) && node.type === Fragment ? drawn(node.props.children) : node !== undefined && node !== null && typeof node !== "boolean" && node !== "";

/**
 * State that is controlled when `value` is given and lives here otherwise.
 * `set` skips a no-op and tells `onChange` about every real change, in both modes.
 */
export function useControllable(value, defaultValue, onChange) {
  const [inner, setInner] = useState(defaultValue);
  const controlled = value !== undefined;
  const current = controlled ? value : inner;
  const latest = useRef({ current, controlled, onChange });
  latest.current = { current, controlled, onChange };
  const set = useCallback((next) => {
    const { current, controlled, onChange } = latest.current;
    if (Object.is(next, current)) return;
    if (!controlled) setInner(next);
    onChange?.(next);
  }, []);
  return [current, set];
}

/** One ref callback for several refs (callback or object). */
export function mergeRefs(...refs) {
  return (node) => {
    const cleanups = refs.map((ref) => {
      if (typeof ref === "function") return ref(node);
      if (ref) ref.current = node;
    });
    return () => {
      refs.forEach((ref, i) => {
        if (typeof cleanups[i] === "function") cleanups[i]();
        else if (typeof ref === "function") ref(null);
        else if (ref) ref.current = null;
      });
    };
  };
}

/** Run a child's own handler first, then ours unless it prevented the default. */
export const chain = (own, ours) => (event) => {
  own?.(event);
  if (!event.defaultPrevented) ours(event);
};

/** True on phones, where the sidebar lives in a drawer. Read at event time, never during render. */
export const onPhone = () => matchMedia("(max-width: 47.99rem)").matches;

/** Show a manual popover. Showing one that is open already does nothing, and neither does a missing Popover API. */
export const showManual = (node) => node?.showPopover?.();

/** Hide and show a manual popover in one task: it moves above whatever entered the top layer since, and paints nothing between. */
export function liftManual(node) {
  node?.hidePopover?.();
  node?.showPopover?.();
}
