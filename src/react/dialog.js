/**
 * Dialog and sheet on the native <dialog>. React owns `open`; the browser owns
 * the top layer, the focus trap and Escape, and tells React through `close`.
 * Nothing is called while the dialog stays closed, so a closed mount is safe
 * on the server and wherever `showModal` is missing.
 */
import { Fragment, cloneElement, createContext, createElement as h, useContext, useId, useMemo, useReducer, useRef } from "react";
import { closeDialog, openDialog } from "../js/dialog.js";
import { IconButton } from "./button.js";
import { chain, cx, mergeRefs, useControllable, useIsomorphicLayoutEffect } from "./util.js";

const DialogContext = createContext(null);

export function Dialog({ open, defaultOpen = false, onOpenChange, trigger, size, side, static: isStatic, className, children, ref, onClose, onCancel, onClick, ...props }) {
  const [isOpen, setOpen] = useControllable(open, defaultOpen, onOpenChange);
  const titleId = useId();
  const node = useRef(null);
  const [, rerender] = useReducer((n) => n + 1, 0);

  // Run after every render: a parent that refuses a close gets the dialog put back.
  useIsomorphicLayoutEffect(() => {
    const dialog = node.current;
    if (isOpen && !dialog.open) openDialog(dialog);
    else if (!isOpen && dialog.open) closeDialog(dialog);
  });

  const context = useMemo(() => ({ titleId, close: () => setOpen(false) }), [titleId, setOpen]);
  const element = h(
    DialogContext.Provider,
    { value: context },
    h(
      "dialog",
      {
        "aria-labelledby": titleId,
        ...props,
        ref: mergeRefs(node, ref),
        className: cx("sd-dialog", size && `sd-dialog-${size}`, side && "sd-sheet", side === "left" && "sd-sheet-left", side === "bottom" && "sd-sheet-bottom", className),
        "data-sd-static": isStatic ? "" : undefined,
        onClose: (event) => {
          onClose?.(event);
          setOpen(false);
          rerender();
        },
        onCancel: (event) => {
          onCancel?.(event);
          if (isStatic) event.preventDefault();
        },
        onClick: (event) => {
          onClick?.(event);
          // A click that lands on the dialog itself and outside its box is on the backdrop.
          const dialog = event.currentTarget;
          if (isStatic || event.target !== dialog) return;
          const box = dialog.getBoundingClientRect();
          const inside = event.clientX >= box.left && event.clientX <= box.right && event.clientY >= box.top && event.clientY <= box.bottom;
          if (!inside) setOpen(false);
        },
      },
      children,
    ),
  );
  if (!trigger) return element;
  return h(Fragment, null, cloneElement(trigger, { "aria-haspopup": "dialog", onClick: chain(trigger.props.onClick, () => setOpen(true)) }), element);
}

/** A dialog pinned to the right edge, or to the left with `side="left"` or the bottom with `side="bottom"`. */
export function Sheet({ side = "right", ...props }) {
  return h(Dialog, { side, ...props });
}

/** The title row. Its text names the dialog; `closeButton={false}` leaves out the × button and `closeLabel` renames it. */
export function DialogHeader({ closeButton = true, closeLabel = "Close", className, children, ...props }) {
  const { titleId, close } = useContext(DialogContext);
  return h(
    "header",
    { className: cx("sd-dialog-head", className), ...props },
    h("span", { id: titleId }, children),
    closeButton && h(IconButton, { label: closeLabel, variant: "ghost", size: "sm", onClick: close }, "×"),
  );
}

export function DialogBody({ className, ...props }) {
  return h("div", { className: cx("sd-dialog-body", className), ...props });
}

export function DialogFooter({ className, ...props }) {
  return h("footer", { className: cx("sd-dialog-foot", className), ...props });
}

/** Wrap a button to make it close the dialog around it. */
export function DialogClose({ children }) {
  const { close } = useContext(DialogContext);
  return cloneElement(children, { onClick: chain(children.props.onClick, close) });
}
