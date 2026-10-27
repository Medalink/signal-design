/**
 * Toasts owned by React. `ToastProvider` renders the live region and the
 * toasts; `useToast()` returns the same call as `toast()` from
 * `signal-design/js`. A toast leaves in two steps (`data-leaving` for the
 * 160ms fade, then it is removed), and hovering one holds it on screen. The
 * region is a manual popover, so it paints above a modal dialog; a toast
 * called while one is open lifts it above that dialog. It is still part of the
 * inert page behind the modal, so it can be read there but not clicked.
 */
import { createContext, createElement as h, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Button } from "./button.js";
import { liftManual, showManual, useIsomorphicLayoutEffect } from "./util.js";

const ToastContext = createContext(null);
const LEAVE_MS = 160;

export function useToast() {
  const toast = useContext(ToastContext);
  if (!toast) throw new Error("useToast() needs a <ToastProvider> above the component that calls it.");
  return toast;
}

function Toast({ toast, dismiss }) {
  const { id, message, tone, action, timeout, leaving } = toast;
  const timer = useRef(0);
  const start = useCallback(() => {
    clearTimeout(timer.current);
    if (timeout > 0 && !leaving) timer.current = setTimeout(() => dismiss(id), timeout);
  }, [id, timeout, leaving, dismiss]);

  useEffect(() => {
    start();
    return () => clearTimeout(timer.current);
  }, [start]);

  return h(
    "div",
    { className: "sd-toast", "data-tone": tone, "data-leaving": leaving ? "" : undefined, onPointerEnter: () => clearTimeout(timer.current), onPointerLeave: start },
    message,
    action &&
      h(
        Button,
        {
          size: "sm",
          variant: "ghost",
          onClick: () => {
            action.onClick?.();
            dismiss(id);
          },
        },
        action.label,
      ),
  );
}

export function ToastProvider({ timeout: defaultTimeout = 2400, children }) {
  const [toasts, setToasts] = useState([]);
  const next = useRef(0);
  const region = useRef(null);
  useIsomorphicLayoutEffect(() => showManual(region.current), []);

  const removals = useRef(new Map());
  const remove = useCallback((id) => {
    removals.current.delete(id);
    setToasts((all) => all.filter((t) => t.id !== id));
  }, []);
  const dismiss = useCallback(
    (id) => {
      if (removals.current.has(id)) return;
      setToasts((all) => all.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
      removals.current.set(id, setTimeout(() => remove(id), LEAVE_MS));
    },
    [remove],
  );
  useEffect(() => {
    const pending = removals.current;
    return () => {
      pending.forEach(clearTimeout);
      pending.clear();
    };
  }, []);
  const toast = useCallback(
    (message, { tone, timeout = defaultTimeout, action } = {}) => {
      const id = ++next.current;
      if (document.querySelector("dialog:modal")) liftManual(region.current);
      setToasts((all) => [...all, { id, message, tone, timeout, action }]);
      return () => dismiss(id);
    },
    [defaultTimeout, dismiss],
  );

  return h(
    ToastContext.Provider,
    { value: toast },
    children,
    h("div", { ref: region, className: "sd-toaster", popover: "manual", role: "status", "aria-live": "polite" }, toasts.map((t) => h(Toast, { key: t.id, toast: t, dismiss }))),
  );
}
