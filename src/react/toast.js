/**
 * Toasts owned by React. `ToastProvider` renders the live region and the
 * toasts; `useToast()` returns the same call as `toast()` from
 * `signal-design/js`. A toast leaves in two steps (`data-leaving` for the
 * 160ms fade, then it is removed), and hovering one holds it on screen.
 */
import { createContext, createElement as h, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Button } from "./button.js";

const ToastContext = createContext(null);
const LEAVE_MS = 160;

export function useToast() {
  return useContext(ToastContext);
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

  const remove = useCallback((id) => setToasts((all) => all.filter((t) => t.id !== id)), []);
  const dismiss = useCallback(
    (id) => {
      setToasts((all) => all.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
      setTimeout(() => remove(id), LEAVE_MS);
    },
    [remove],
  );
  const toast = useCallback(
    (message, { tone, timeout = defaultTimeout, action } = {}) => {
      const id = ++next.current;
      setToasts((all) => [...all, { id, message, tone, timeout, action }]);
      return () => dismiss(id);
    },
    [defaultTimeout, dismiss],
  );

  return h(
    ToastContext.Provider,
    { value: toast },
    children,
    h("div", { className: "sd-toaster", role: "status", "aria-live": "polite" }, toasts.map((t) => h(Toast, { key: t.id, toast: t, dismiss }))),
  );
}
