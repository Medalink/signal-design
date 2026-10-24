/**
 * Document tree: nested items, one tab stop, the arrow keys of the ARIA tree
 * pattern, and reordering as callbacks. React owns what is selected and what
 * is expanded; a collapsed branch does not render its children. Reordering
 * is reported, never done: the drop (or Alt+ArrowUp / Alt+ArrowDown) calls
 * `onMove` and the app reorders its own data. No drag library; the drag is
 * the browser's own.
 */
import { Children, createContext, createElement as h, useCallback, useContext, useMemo, useRef, useState } from "react";
import { RovingProvider, useRoving, useRovingItem } from "./roving.js";
import { cx, mergeRefs, useControllable, useIsomorphicLayoutEffect } from "./util.js";

const TreeContext = createContext(null);
const LevelContext = createContext(0);
const KEYS = { ArrowDown: 1, ArrowUp: -1, Home: "first", End: "last" };
const own = (id) => `[data-tree-id="${CSS.escape(id)}"]`;

/** Where in a row a pointer is: the top quarter drops before it, the bottom quarter after it, the rest inside it. */
function positionIn(row, clientY) {
  const box = row.getBoundingClientRect();
  const at = (clientY - box.top) / box.height;
  return at < 0.25 ? "before" : at > 0.75 ? "after" : "inside";
}

export function Tree({
  label,
  selected,
  defaultSelected,
  onSelectedChange,
  expanded,
  defaultExpanded = [],
  onExpandedChange,
  onMove,
  className,
  onFocus,
  onKeyDown,
  ref,
  ...props
}) {
  const [current, select] = useControllable(selected, defaultSelected ?? null, onSelectedChange);
  const [open, setOpen] = useControllable(expanded, defaultExpanded, onExpandedChange);
  const [drag, setDrag] = useState(null);
  const roving = useRoving(KEYS, { wrap: false, initial: '[aria-selected="true"]' });
  const restore = useRef(null);

  const isOpen = useCallback((id) => open.includes(id), [open]);
  const toggle = useCallback((id, next = !open.includes(id)) => setOpen(next ? [...open, id] : open.filter((x) => x !== id)), [open, setOpen]);

  // A move that reorders the DOM can drop focus; give it back to the item that moved.
  useIsomorphicLayoutEffect(() => {
    const id = restore.current;
    if (id === null) return;
    restore.current = null;
    const root = roving.props.ref.current;
    if (!root.contains(document.activeElement)) root.querySelector(own(id))?.focus();
  });

  const context = useMemo(
    () => ({ current, select, isOpen, toggle, drag, setDrag, onMove, draggable: Boolean(onMove) }),
    [current, select, isOpen, toggle, drag, onMove],
  );

  const keyDown = (event) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    const item = event.target.closest('[role="treeitem"]');
    if (!item || event.target !== item || event.ctrlKey || event.metaKey) return;
    const id = item.dataset.treeId;
    const branch = item.hasAttribute("aria-expanded");
    const expandedNow = item.getAttribute("aria-expanded") === "true";
    if (event.altKey) {
      if (!onMove || (event.key !== "ArrowUp" && event.key !== "ArrowDown")) return;
      const up = event.key === "ArrowUp";
      const sibling = up ? item.previousElementSibling : item.nextElementSibling;
      if (!sibling) return;
      event.preventDefault();
      restore.current = id;
      onMove({ id, targetId: sibling.dataset.treeId, position: up ? "before" : "after" });
      return;
    }
    if (event.key === "ArrowRight" && branch) {
      event.preventDefault();
      if (!expandedNow) toggle(id, true);
      else item.querySelector('[role="treeitem"]')?.focus();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      if (branch && expandedNow) toggle(id, false);
      else item.parentElement.closest('[role="treeitem"]')?.focus();
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (item.getAttribute("aria-disabled") !== "true") select(id);
    } else roving.props.onKeyDown(event);
  };

  return h(
    TreeContext.Provider,
    { value: context },
    h(
      RovingProvider,
      { value: roving.context },
      h("ul", {
        role: "tree",
        "aria-label": label,
        className: cx("sd-tree", className),
        ...props,
        ref: mergeRefs(roving.props.ref, ref),
        tabIndex: roving.props.tabIndex,
        onFocus: (event) => {
          onFocus?.(event);
          roving.props.onFocus(event);
        },
        onKeyDown: keyDown,
      }),
    ),
  );
}

/**
 * One item. Give it children (more `TreeItem`s) and it is a branch with
 * `aria-expanded`. `id` names it in the tree's state and in `onMove`.
 */
export function TreeItem({ id, label, icon, meta, disabled, className, children, ...props }) {
  const tree = useContext(TreeContext);
  const level = useContext(LevelContext) + 1;
  const item = useRovingItem();
  const row = useRef(null);
  const branch = Children.toArray(children).length > 0;
  const expanded = branch && tree.isOpen(id);
  const selected = tree.current === id;
  const { drag } = tree;
  const dropHere = drag?.over === id ? drag.position : undefined;

  const dragProps = tree.draggable && !disabled && {
    draggable: true,
    onDragStart: (event) => {
      event.stopPropagation();
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", id);
      tree.setDrag({ id, over: null, position: null });
    },
    onDragOver: (event) => {
      if (!drag || drag.id === id || row.current.closest("li").closest(own(drag.id))) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      const position = positionIn(row.current, event.clientY);
      if (drag.over !== id || drag.position !== position) tree.setDrag({ ...drag, over: id, position });
    },
    onDragLeave: (event) => {
      if (drag?.over === id && !row.current.contains(event.relatedTarget)) tree.setDrag({ ...drag, over: null, position: null });
    },
    onDrop: (event) => {
      if (!drag || drag.over !== id) return;
      event.preventDefault();
      tree.onMove({ id: drag.id, targetId: id, position: drag.position });
      tree.setDrag(null);
    },
    onDragEnd: () => tree.setDrag(null),
  };

  return h(
    "li",
    {
      role: "treeitem",
      "data-tree-id": id,
      "aria-level": level,
      "aria-expanded": branch ? expanded : undefined,
      "aria-selected": selected,
      "aria-disabled": disabled || undefined,
      className: cx("sd-tree-item", className),
      ...item,
      ...props,
    },
    h(
      "div",
      {
        ref: row,
        className: "sd-tree-row",
        style: { "--level": level - 1 },
        "data-dragging": drag?.id === id ? "" : undefined,
        "data-drop": dropHere,
        onClick: (event) => {
          if (!disabled && !event.defaultPrevented) tree.select(id);
        },
        ...dragProps,
      },
      h("span", {
        className: "sd-tree-toggle",
        "aria-hidden": "true",
        "data-leaf": branch ? undefined : "",
        onClick: (event) => {
          if (!branch || disabled) return;
          event.stopPropagation();
          tree.toggle(id);
        },
      }),
      icon,
      h("span", { className: "sd-tree-label" }, label),
      meta && h("span", { className: "sd-tree-meta" }, meta),
    ),
    expanded && h(LevelContext.Provider, { value: level }, h("ul", { role: "group", className: "sd-tree-group" }, children)),
  );
}
