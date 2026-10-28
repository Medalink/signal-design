/**
 * Dialog and sheet on the native <dialog>. React owns `open`; the browser owns
 * the top layer, the focus trap and Escape, and tells React through `close`.
 * Nothing is called while the dialog stays closed, so a closed mount is safe
 * on the server and wherever `showModal` is missing. A `DialogHeader` names
 * the dialog; without one, `aria-label` or `aria-labelledby` does.
 * `unmountOnClose` drops the children once the dialog has faded out.
 */
import { Children, Fragment, cloneElement, createContext, createElement as h, isValidElement, useContext, useId, useMemo, useReducer, useRef, useState } from "react";
import { closeDialog, openDialog } from "../js/dialog.js";
import { IconButton } from "./button.js";
import { chain, cx, mergeRefs, useControllable, useIsomorphicLayoutEffect } from "./util.js";

const DialogContext = createContext(null);

/** Whether a `DialogHeader` is among these children, directly or in fragments, so the name is known on the server. */
function hasHeader(children) {
  return Children.toArray(children).some((child) => isValidElement(child) && (child.type === DialogHeader || (child.type === Fragment && hasHeader(child.props.children))));
}

/** Open the dialog, then focus the first `data-autofocus` that is its own: `showModal()` knows only the native `autofocus`, which React does not write. */
function reveal(dialog) {
  openDialog(dialog);
  [...dialog.querySelectorAll("[data-autofocus]")].find((mark) => mark.closest("dialog") === dialog)?.focus();
}

/**
 * The first child of the dialog. React focuses an `autoFocus` field as it mounts, which a closed dialog
 * cannot take, so this opens the dialog in the same commit, before the children after it mount. The
 * dialog's ref is set after its children's effects have run, so it is there for every opening after the
 * first commit; only a dialog that mounts open is found by its id.
 */
function Opener({ open, id, node }) {
  useIsomorphicLayoutEffect(() => {
    const dialog = node.current ?? document.getElementById(id);
    if (open && dialog && !dialog.open) reveal(dialog);
  }, [open, id, node]);
  return null;
}

export function Dialog({ open, defaultOpen = false, onOpenChange, trigger, size, side, static: isStatic, id: idProp, closeOnEscape, closeOnBackdrop, unmountOnClose, className, children, ref, onClose, onCancel, onClick, ...props }) {
  const [isOpen, setOpen] = useControllable(open, defaultOpen, onOpenChange);
  const titleId = useId();
  const generated = useId();
  const id = idProp ?? generated;
  const node = useRef(null);
  const [, rerender] = useReducer((n) => n + 1, 0);
  const [titled, setTitled] = useState(false);
  const [present, setPresent] = useState(isOpen);
  const wasOpen = useRef(false);
  // Stable, so React leaves it attached between renders: the Opener reads it before a new ref would be set.
  const setNode = useMemo(() => mergeRefs(node, ref), [ref]);

  // Run after every render: a parent that refuses a close gets the dialog put back, with focus where it was.
  useIsomorphicLayoutEffect(() => {
    const dialog = node.current;
    if (isOpen && !dialog.open) (wasOpen.current ? openDialog : reveal)(dialog);
    else if (!isOpen && dialog.open) closeDialog(dialog);
    wasOpen.current = isOpen;
  });

  // Closing keeps the children until the fade has run, so the box does not empty while it fades.
  useIsomorphicLayoutEffect(() => {
    if (!unmountOnClose) return;
    if (isOpen) {
      setPresent(true);
      return;
    }
    let live = true;
    const fades = node.current.getAnimations?.() ?? [];
    Promise.allSettled(fades.map((fade) => fade.finished)).then(() => live && setPresent(false));
    return () => {
      live = false;
    };
  }, [isOpen, unmountOnClose]);

  // `static` turns both off; either prop turns its own back on or off.
  const escapeCloses = closeOnEscape ?? !isStatic;
  const backdropCloses = closeOnBackdrop ?? !isStatic;
  const context = useMemo(() => ({ titleId, close: () => setOpen(false), setTitled }), [titleId, setOpen]);
  const mounted = !unmountOnClose || isOpen || present;
  // A header the server can see by type names the dialog in the first render. One nested in a component
  // of its own is found by its layout effect (`titled`), so it names the dialog only once the page has hydrated.
  const named = mounted && (titled || hasHeader(children));
  const element = h(
    DialogContext.Provider,
    { value: context },
    h(
      "dialog",
      {
        id,
        "aria-labelledby": named && props["aria-label"] === undefined ? titleId : undefined,
        ...props,
        ref: setNode,
        className: cx("sd-dialog", size && `sd-dialog-${size}`, side && "sd-sheet", side === "left" && "sd-sheet-left", side === "bottom" && "sd-sheet-bottom", className),
        // The vanilla handlers read this: empty switches both off, a name only that one.
        "data-sd-static": !escapeCloses ? (backdropCloses ? "escape" : "") : backdropCloses ? undefined : "backdrop",
        onClose: (event) => {
          onClose?.(event);
          setOpen(false);
          rerender();
        },
        onCancel: (event) => {
          onCancel?.(event);
          if (!escapeCloses) event.preventDefault();
        },
        onClick: (event) => {
          onClick?.(event);
          // A click that lands on the dialog itself and outside its box is on the backdrop.
          const dialog = event.currentTarget;
          if (!backdropCloses || event.target !== dialog) return;
          const box = dialog.getBoundingClientRect();
          const inside = event.clientX >= box.left && event.clientX <= box.right && event.clientY >= box.top && event.clientY <= box.bottom;
          if (!inside) setOpen(false);
        },
      },
      h(Opener, { open: isOpen, id, node }),
      mounted ? children : null,
    ),
  );
  if (!trigger) return element;
  return h(Fragment, null, cloneElement(trigger, { "aria-haspopup": "dialog", onClick: chain(trigger.props.onClick, () => setOpen(true)) }), element);
}

/** A dialog pinned to the right edge, or to the left with `side="left"` or the bottom with `side="bottom"`. */
export function Sheet({ side = "right", ...props }) {
  return h(Dialog, { side, ...props });
}

/** The title row. Its text names the dialog and is its heading, an `h2` unless `as` says otherwise; `closeButton={false}` leaves out the × button and `closeLabel` renames it. */
export function DialogHeader({ as = "h2", closeButton = true, closeLabel = "Close", className, children, ...props }) {
  const { titleId, close, setTitled } = useContext(DialogContext);
  useIsomorphicLayoutEffect(() => {
    setTitled(true);
    return () => setTitled(false);
  }, [setTitled]);
  return h(
    "header",
    { className: cx("sd-dialog-head", className), ...props },
    h(as, { id: titleId, className: "sd-dialog-title" }, children),
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
