/**
 * The Signal App Shell with React as the only writer of its state: the
 * sidebar, the right panel, the phone drawer, the peeking sidebar and the
 * current rail section. `AppShell` renders `data-sidebar`, `data-aside`,
 * `data-drawer` and `data-peek`, makes the page `inert` behind the drawer,
 * closes overlays on Escape and returns focus into the drawer, so none of
 * that needs init(). Layout and breakpoints stay in the CSS.
 */
import { createContext, createElement as h, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { chain, cx, mergeRefs, onPhone, useControllable, useIsomorphicLayoutEffect } from "./util.js";

const ShellContext = createContext(null);

/** The shell's state and setters, for a control that is not one of the parts below. */
export function useShell() {
  return useContext(ShellContext);
}

// Below 75rem the right panel floats over the page, so it closes like the others.
const floatingAside = () => matchMedia("(max-width: 74.99rem)").matches;

export function AppShell({
  sidebar,
  defaultSidebar = "pinned",
  onSidebarChange,
  aside,
  defaultAside = false,
  onAsideChange,
  drawer,
  defaultDrawer = false,
  onDrawerChange,
  section,
  defaultSection,
  onSectionChange,
  className,
  children,
  ref,
  ...props
}) {
  const [sidebarState, setSidebar] = useControllable(sidebar, defaultSidebar, onSidebarChange);
  const [asideOpen, setAside] = useControllable(aside, defaultAside, onAsideChange);
  const [drawerOpen, setDrawer] = useControllable(drawer, defaultDrawer, onDrawerChange);
  const [activeSection, setSection] = useControllable(section, defaultSection, onSectionChange);
  const [peek, setPeek] = useState(false);
  const root = useRef(null);
  const collapsed = sidebarState === "collapsed";

  const closeOverlays = useCallback(() => {
    const closeAside = asideOpen && floatingAside();
    const had = peek || drawerOpen || closeAside;
    setPeek(false);
    if (closeAside) setAside(false);
    if (drawerOpen) setDrawer(false);
    return had;
  }, [peek, asideOpen, drawerOpen, setAside, setDrawer]);

  const toggleSidebar = useCallback(() => {
    setPeek(false);
    // On phones the sidebar lives in the drawer, so its collapse button closes the drawer.
    if (onPhone()) setDrawer(false);
    else setSidebar(collapsed ? "pinned" : "collapsed");
  }, [collapsed, setDrawer, setSidebar]);

  const selectSection = useCallback(
    (name) => {
      setSection(name);
      if (collapsed && !onPhone()) setPeek(true);
    },
    [collapsed, setSection],
  );

  // On the document, like init(): a click on a link does not focus it in Safari, so the key never reaches the shell.
  const closable = peek || asideOpen || drawerOpen;
  useEffect(() => {
    if (!closable) return;
    const onKeyDown = (event) => {
      if (event.key !== "Escape" || event.defaultPrevented || event.target.closest?.("dialog[open], [popover]")) return;
      if (closeOverlays()) event.preventDefault();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [closable, closeOverlays]);

  useEffect(() => {
    if (drawerOpen) root.current.querySelector('.sd-rail-item[aria-current]:not([aria-current="false"])')?.focus();
  }, [drawerOpen]);

  const context = useMemo(
    () => ({ collapsed, asideOpen, drawerOpen, peek, section: activeSection, toggleSidebar, setAside, setDrawer, selectSection, closeOverlays }),
    [collapsed, asideOpen, drawerOpen, peek, activeSection, toggleSidebar, setAside, setDrawer, selectSection, closeOverlays],
  );

  return h(
    ShellContext.Provider,
    { value: context },
    h(
      "div",
      {
        ...props,
        ref: mergeRefs(root, ref),
        className: cx("sd-shell", className),
        "data-sidebar": collapsed ? "collapsed" : undefined,
        "data-aside": asideOpen ? "open" : undefined,
        "data-drawer": drawerOpen ? "" : undefined,
        "data-peek": peek ? "" : undefined,
      },
      children,
      h("div", { className: "sd-shell-scrim", onClick: closeOverlays }),
    ),
  );
}

/** The sidebar, right panel or drawer button. Its `aria-expanded` follows the state. */
export function ShellToggle({ target, pinLabel = "Pin sidebar open", collapseLabel = "Collapse sidebar", onClick, ...props }) {
  const shell = useShell();
  const expanded = { sidebar: !shell.collapsed, aside: shell.asideOpen, drawer: shell.drawerOpen }[target];
  const toggle = {
    sidebar: shell.toggleSidebar,
    aside: () => shell.setAside(!shell.asideOpen),
    drawer: () => shell.setDrawer(!shell.drawerOpen),
  }[target];
  return h("button", {
    type: "button",
    "aria-expanded": expanded,
    "aria-label": target === "sidebar" ? (shell.collapsed ? pinLabel : collapseLabel) : undefined,
    ...props,
    onClick: chain(onClick, toggle),
  });
}

export const ShellTopbar = ({ className, ...props }) => h("header", { className: cx("sd-shell-topbar", className), ...props });

export const Rail = ({ className, ...props }) => h("nav", { className: cx("sd-rail", className), ...props });
export const RailHome = ({ className, ...props }) => h("a", { className: cx("sd-rail-home", className), ...props });
export const RailList = ({ className, ...props }) => h("div", { className: cx("sd-rail-list", className), ...props });
export const RailTools = ({ className, ...props }) => h("div", { className: cx("sd-rail-tools", className), ...props });
export const RailSeparator = ({ className, ...props }) => h("div", { className: cx("sd-rail-sep", className), ...props });

function RailEntry({ kind, section, current, unread, pending, href, onClick, className, ...props }) {
  const shell = useShell();
  const chosen = section !== undefined && shell.section === section;
  return h(href !== undefined ? "a" : "button", {
    href,
    type: href === undefined ? "button" : undefined,
    className: cx(kind, className),
    "aria-current": current ? "page" : chosen ? "true" : undefined,
    "data-unread": unread ? "" : undefined,
    "data-pending": pending ? "" : undefined,
    ...props,
    onClick: (event) => {
      onClick?.(event);
      if (event.defaultPrevented) return;
      if (href === "#") event.preventDefault();
      if (section !== undefined) shell.selectSection(section);
    },
  });
}

/** A rail entry. With `section` it shows that sidebar panel; with `href` it is a link, else a button. */
export const RailItem = (props) => h(RailEntry, { kind: "sd-rail-item", ...props });
/** A square rail tile for a place (a group, a workspace). */
export const RailTile = (props) => h(RailEntry, { kind: "sd-rail-tile", ...props });

export const Sidebar = ({ className, ...props }) => h("aside", { className: cx("sd-sidebar", className), ...props });

/** One panel of the sidebar. With `section` it shows only while that rail section is current. */
export function SidebarPanel({ section, className, ...props }) {
  const shell = useShell();
  return h("div", { className: cx("sd-sidebar-panel", className), "data-section": section, hidden: section !== undefined && section !== shell.section, ...props });
}

export const SidebarHead = ({ className, ...props }) => h("div", { className: cx("sd-sidebar-head", className), ...props });
export const SidebarTitle = ({ className, ...props }) => h("span", { className: cx("sd-sidebar-title", className), ...props });
export const SidebarBody = ({ className, ...props }) => h("nav", { className: cx("sd-sidebar-body", className), ...props });

/** A collapsible group of links. React owns `open`. */
export function SidebarGroup({ title, open, defaultOpen = true, onOpenChange, className, children, ref, onToggle, ...props }) {
  const [isOpen, setOpen] = useControllable(open, defaultOpen, onOpenChange);
  const node = useRef(null);
  const [, rerender] = useReducer((n) => n + 1, 0);

  // Run after every render: a parent that refuses a toggle gets the group put back.
  useIsomorphicLayoutEffect(() => {
    if (node.current.open !== isOpen) node.current.open = isOpen;
  });

  return h(
    "details",
    {
      className: cx("sd-sidebar-group", className),
      open: isOpen,
      ...props,
      ref: mergeRefs(node, ref),
      onToggle: (event) => {
        onToggle?.(event);
        setOpen(event.currentTarget.open);
        rerender();
      },
    },
    h("summary", null, title),
    children,
  );
}

/** A link in the sidebar. Choosing one while the sidebar peeks or the drawer is open closes it, even if `onClick` prevents the default. */
export function SidebarLink({ current, onClick, className, ...props }) {
  const { peek, drawerOpen, closeOverlays } = useShell();
  return h("a", {
    className: cx("sd-sidebar-link", className),
    "aria-current": current ? "page" : undefined,
    ...props,
    onClick: (event) => {
      onClick?.(event);
      // A router link prevents the default, and the sidebar still closes behind it.
      if (peek || drawerOpen) closeOverlays();
    },
  });
}

/** The page. It is `inert` while the drawer is open. */
export function ShellMain({ className, ...props }) {
  const { drawerOpen } = useShell();
  return h("main", { className: cx("sd-shell-main", className), inert: drawerOpen || undefined, ...props });
}
export const ShellHeader = ({ className, ...props }) => h("div", { className: cx("sd-shell-header", className), ...props });
export const ShellBar = ({ className, ...props }) => h("header", { className: cx("sd-shell-bar", className), ...props });
export const ShellContent = ({ className, ...props }) => h("div", { className: cx("sd-shell-content", className), ...props });
export const ShellDock = ({ className, ...props }) => h("div", { className: cx("sd-shell-dock", className), ...props });
export const ShellAside = ({ className, ...props }) => h("aside", { className: cx("sd-shell-aside", className), ...props });
export const Statusbar = ({ className, ...props }) => h("footer", { className: cx("sd-statusbar sd-shell-status", className), ...props });
