/**
 * Types for `signal-design/react`. Props extend the element each component
 * renders, so every native attribute and `ref` (a plain prop in React 19) is
 * accepted and passed through.
 */
import type { ComponentProps, HTMLAttributes, MouseEvent, MouseEventHandler, ReactElement, ReactNode, Ref, SyntheticEvent } from "react";

export type Tone = "accent" | "success" | "danger" | "warning" | "pending" | "extra" | "neutral";

/* ---- Buttons ----------------------------------------------------------- */

export type ButtonVariant = "default" | "primary" | "ghost" | "link";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonClassOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  className?: string;
}
/** The `sd-btn` classes, for a link or any other element that should look like a button. */
export function buttonClass(options?: ButtonClassOptions): string;

export interface ButtonProps extends ComponentProps<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Full width. */
  block?: boolean;
  tone?: Tone;
  /** Sets `aria-busy`. */
  busy?: boolean;
}
export function Button(props: ButtonProps): ReactElement;

export interface IconButtonProps extends Omit<ComponentProps<"button">, "aria-label"> {
  /** The accessible name. */
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  tone?: Tone;
}
export function IconButton(props: IconButtonProps): ReactElement;

/* ---- Fields and controls ----------------------------------------------- */

export interface FieldProps extends Omit<ComponentProps<"div">, "children"> {
  label?: ReactNode;
  hint?: ReactNode;
  /** Shown instead of the hint, marks the control `aria-invalid` and points `aria-describedby` at it. */
  error?: ReactNode;
  /** Small text beside the label, such as "optional". */
  aside?: ReactNode;
  /** Passed to the control as `required`. */
  required?: boolean;
  children: ReactNode;
}
/** Owns the label, hint and error. The `Input`, `Textarea` or `Select` inside takes its id and ARIA from it. */
export function Field(props: FieldProps): ReactElement;

export function Input(props: ComponentProps<"input">): ReactElement;
export function Textarea(props: ComponentProps<"textarea">): ReactElement;
export function Select(props: ComponentProps<"select">): ReactElement;

export interface CheckboxProps extends Omit<ComponentProps<"input">, "type" | "className" | "children"> {
  label: ReactNode;
  description?: ReactNode;
  /** On the label; `ref` and the other props reach the input. */
  className?: string;
}
export function Checkbox(props: CheckboxProps): ReactElement;
export function Switch(props: Omit<CheckboxProps, "role">): ReactElement;

/* ---- Static parts ------------------------------------------------------ */

export interface BadgeProps extends ComponentProps<"span"> {
  tone?: Tone;
  solid?: boolean;
}
export function Badge(props: BadgeProps): ReactElement;

export interface CountBadgeProps extends Omit<ComponentProps<"span">, "children"> {
  value: number;
  /** Shows `max+` above it. Default 99. */
  max?: number;
  /** Makes the count read as "label: value". */
  label?: string;
  tone?: Tone;
  /** Pin to the corner of a positioned parent. */
  corner?: boolean;
  hideZero?: boolean;
}
export function CountBadge(props: CountBadgeProps): ReactElement | null;

export type AvatarStatus = "online" | "away" | "afk" | "busy" | "offline";
export interface AvatarProps extends Omit<ComponentProps<"span">, "children"> {
  /** The accessible name, and the initials when there is no `src`. */
  name: string;
  src?: string;
  size?: "sm" | "md" | "lg" | "xl";
  tone?: Tone;
  status?: AvatarStatus;
}
export function Avatar(props: AvatarProps): ReactElement;
export function AvatarStack(props: ComponentProps<"span">): ReactElement;

export interface CardProps extends Omit<ComponentProps<"article">, "ref"> {
  tone?: Tone;
  /** Makes the whole card a link. */
  href?: string;
  ref?: Ref<HTMLElement>;
}
export function Card(props: CardProps): ReactElement;
export function CardHeader(props: ComponentProps<"header">): ReactElement;
export function CardBody(props: ComponentProps<"div">): ReactElement;
export function CardFooter(props: ComponentProps<"footer">): ReactElement;

export interface PanelProps extends ComponentProps<"section"> {
  /** "wide" caps at 1024px, "fluid" does not cap. Default 560px. */
  width?: "wide" | "fluid";
}
export function Panel(props: PanelProps): ReactElement;
export function PanelTitle(props: ComponentProps<"h3">): ReactElement;
export function PanelDescription(props: ComponentProps<"p">): ReactElement;

export interface EmptyStateProps extends Omit<ComponentProps<"div">, "title"> {
  title?: ReactNode;
  action?: ReactNode;
}
export function EmptyState(props: EmptyStateProps): ReactElement;

export interface TableProps extends ComponentProps<"table"> {
  compact?: boolean;
  hover?: boolean;
  /** On the scroll wrapper. `className` and `ref` reach the table. */
  wrapClassName?: string;
}
export function Table(props: TableProps): ReactElement;
export function TableCaption(props: ComponentProps<"caption">): ReactElement;
export function TableHead(props: ComponentProps<"thead">): ReactElement;
export function TableBody(props: ComponentProps<"tbody">): ReactElement;
export function TableFoot(props: ComponentProps<"tfoot">): ReactElement;
export interface TableRowProps extends ComponentProps<"tr"> {
  /** Sets `aria-selected`. */
  selected?: boolean;
}
export function TableRow(props: TableRowProps): ReactElement;
export interface TableHeaderProps extends Omit<ComponentProps<"th">, "scope"> {
  numeric?: boolean;
  /** The arrow to draw. Giving it, or `onSort`, makes the header sortable. */
  sort?: "ascending" | "descending" | "none";
  sortable?: boolean;
  /** Called on click, Enter or Space. Makes the header focusable. */
  onSort?: (event: SyntheticEvent<HTMLTableCellElement>) => void;
}
export function TableHeader(props: TableHeaderProps): ReactElement;
export interface TableCellProps extends ComponentProps<"td"> {
  numeric?: boolean;
}
export function TableCell(props: TableCellProps): ReactElement;

/* ---- Dialog and sheet -------------------------------------------------- */

export interface DialogProps extends Omit<ComponentProps<"dialog">, "open"> {
  /** Controlled. Leave out to let the dialog keep its own state. */
  open?: boolean;
  defaultOpen?: boolean;
  /** Called when the dialog closes (Escape, backdrop, a close button) or a trigger opens it. */
  onOpenChange?: (open: boolean) => void;
  /** A button that opens the dialog; rendered before it. */
  trigger?: ReactElement<{ onClick?: MouseEventHandler<HTMLElement> }>;
  size?: "sm" | "md" | "lg";
  /** Pins the dialog to an edge as a sheet. */
  side?: "left" | "right";
  /** Escape and the backdrop do not close it. */
  static?: boolean;
}
export function Dialog(props: DialogProps): ReactElement;
export interface SheetProps extends Omit<DialogProps, "side" | "size"> {
  side?: "left" | "right";
}
export function Sheet(props: SheetProps): ReactElement;
export interface DialogHeaderProps extends ComponentProps<"header"> {
  /** The × button. Default true. */
  closeButton?: boolean;
}
/** The title row; its text names the dialog. */
export function DialogHeader(props: DialogHeaderProps): ReactElement;
export function DialogBody(props: ComponentProps<"div">): ReactElement;
export function DialogFooter(props: ComponentProps<"footer">): ReactElement;
/** Makes the one child button close the dialog around it. */
export function DialogClose(props: { children: ReactElement<{ onClick?: MouseEventHandler<HTMLElement> }> }): ReactElement;

/* ---- Popover and menu -------------------------------------------------- */

export interface PopoverProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}
export function Popover(props: PopoverProps): ReactElement;
/** The one child (a button) opens and closes the panel and gets `aria-expanded`. */
export function PopoverTrigger(props: { children: ReactElement; haspopup?: "menu" | "dialog" | "listbox" | "tree" | "grid" }): ReactElement;
export interface PopoverContentProps extends ComponentProps<"div"> {
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  /** Adds padding for prose. */
  pad?: boolean;
  /** Selector of the element to focus when it opens. */
  initialFocus?: string;
}
export function PopoverContent(props: PopoverContentProps): ReactElement;

export const Menu: typeof Popover;
export function MenuTrigger(props: { children: ReactElement }): ReactElement;
export interface MenuContentProps extends Omit<PopoverContentProps, "initialFocus"> {
  /** The menu's accessible name. */
  label?: string;
}
export function MenuContent(props: MenuContentProps): ReactElement;
export interface MenuItemProps extends ComponentProps<"button"> {
  tone?: Tone;
  disabled?: boolean;
  /** Shortcut text at the end of the row. */
  hint?: ReactNode;
  /** Called when chosen. `preventDefault()` keeps the menu open. */
  onSelect?: (event: MouseEvent<HTMLButtonElement>) => void;
}
export function MenuItem(props: MenuItemProps): ReactElement;
export function MenuLabel(props: ComponentProps<"div">): ReactElement;
export function MenuSeparator(props: ComponentProps<"hr">): ReactElement;

/* ---- Tooltip, tabs, toast ---------------------------------------------- */

export interface TooltipProps {
  content: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  /** The one element the tooltip describes. */
  children: ReactElement;
}
export function Tooltip(props: TooltipProps): ReactElement;

type TabsBase = Omit<ComponentProps<"div">, "defaultValue" | "onChange">;
export type TabsProps = TabsBase &
  (
    | { value: string; defaultValue?: undefined; onValueChange: (value: string) => void }
    | { value?: undefined; defaultValue: string; onValueChange?: (value: string) => void }
  );
export function Tabs(props: TabsProps): ReactElement;
export interface TabListProps extends Omit<ComponentProps<"div">, "aria-label"> {
  /** The tab list's accessible name. */
  label: string;
}
export function TabList(props: TabListProps): ReactElement;
export interface TabProps extends Omit<ComponentProps<"button">, "value"> {
  value: string;
}
export function Tab(props: TabProps): ReactElement;
export interface TabPanelProps extends Omit<ComponentProps<"div">, "value"> {
  value: string;
}
export function TabPanel(props: TabPanelProps): ReactElement;

export interface ToastOptions {
  tone?: Tone;
  /** Milliseconds on screen, 0 to stay until dismissed. Default is the provider's `timeout`. */
  timeout?: number;
  action?: { label: string; onClick?: () => void };
}
/** Shows a toast and returns a function that dismisses it. */
export type ToastFunction = (message: ReactNode, options?: ToastOptions) => () => void;
export function ToastProvider(props: { /** Default milliseconds on screen. Default 2400. */ timeout?: number; children?: ReactNode }): ReactElement;
export function useToast(): ToastFunction;

/* ---- App shell --------------------------------------------------------- */

export interface AppShellProps extends ComponentProps<"div"> {
  sidebar?: "pinned" | "collapsed";
  defaultSidebar?: "pinned" | "collapsed";
  onSidebarChange?: (sidebar: "pinned" | "collapsed") => void;
  /** The right panel. */
  aside?: boolean;
  defaultAside?: boolean;
  onAsideChange?: (open: boolean) => void;
  /** The phone drawer. */
  drawer?: boolean;
  defaultDrawer?: boolean;
  onDrawerChange?: (open: boolean) => void;
  /** The current rail section, matched by `RailItem` and `SidebarPanel` `section`. */
  section?: string;
  defaultSection?: string;
  onSectionChange?: (section: string) => void;
}
/** Renders the shell and owns its state. Must wrap every other shell part. */
export function AppShell(props: AppShellProps): ReactElement;

export interface ShellState {
  collapsed: boolean;
  asideOpen: boolean;
  drawerOpen: boolean;
  /** The sidebar is peeking over the page because a section was picked while it was collapsed. */
  peek: boolean;
  section: string | undefined;
  /** Collapses or pins the sidebar; on phones it closes the drawer. */
  toggleSidebar: () => void;
  setAside: (open: boolean) => void;
  setDrawer: (open: boolean) => void;
  selectSection: (section: string) => void;
  /** Closes the peek, the drawer and a floating right panel; true when one was open. */
  closeOverlays: () => boolean;
}
export function useShell(): ShellState;

export interface ShellToggleProps extends ComponentProps<"button"> {
  target: "sidebar" | "aside" | "drawer";
}
/** A button that toggles part of the shell and keeps `aria-expanded` current. */
export function ShellToggle(props: ShellToggleProps): ReactElement;

export function ShellTopbar(props: ComponentProps<"header">): ReactElement;
export function Rail(props: ComponentProps<"nav">): ReactElement;
export function RailHome(props: ComponentProps<"a">): ReactElement;
export function RailList(props: ComponentProps<"div">): ReactElement;
export function RailTools(props: ComponentProps<"div">): ReactElement;
export function RailSeparator(props: ComponentProps<"div">): ReactElement;
export interface RailEntryProps extends Omit<HTMLAttributes<HTMLElement>, "onClick"> {
  /** Picking it shows the `SidebarPanel` with the same `section`. */
  section?: string;
  /** Marks it as the current page instead of the current section. */
  current?: boolean;
  unread?: boolean;
  pending?: boolean;
  /** A link when given, a button otherwise. */
  href?: string;
  onClick?: MouseEventHandler<HTMLElement>;
  ref?: Ref<HTMLElement>;
}
export function RailItem(props: RailEntryProps): ReactElement;
export function RailTile(props: RailEntryProps): ReactElement;
export function Sidebar(props: ComponentProps<"aside">): ReactElement;
export interface SidebarPanelProps extends ComponentProps<"div"> {
  /** Shown only while this rail section is current. */
  section?: string;
}
export function SidebarPanel(props: SidebarPanelProps): ReactElement;
export function SidebarHead(props: ComponentProps<"div">): ReactElement;
export function SidebarTitle(props: ComponentProps<"span">): ReactElement;
export function SidebarBody(props: ComponentProps<"nav">): ReactElement;
export interface SidebarGroupProps extends Omit<ComponentProps<"details">, "open" | "title"> {
  title: ReactNode;
  open?: boolean;
  /** Default true. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}
export function SidebarGroup(props: SidebarGroupProps): ReactElement;
export interface SidebarLinkProps extends ComponentProps<"a"> {
  current?: boolean;
}
export function SidebarLink(props: SidebarLinkProps): ReactElement;
export function ShellMain(props: ComponentProps<"main">): ReactElement;
export function ShellHeader(props: ComponentProps<"div">): ReactElement;
export function ShellBar(props: ComponentProps<"header">): ReactElement;
export function ShellContent(props: ComponentProps<"div">): ReactElement;
export function ShellDock(props: ComponentProps<"div">): ReactElement;
export function ShellAside(props: ComponentProps<"aside">): ReactElement;
export function Statusbar(props: ComponentProps<"footer">): ReactElement;

/* ---- Toolbar, manuscript, status segments ------------------------------ */

export interface ToolbarProps extends Omit<ComponentProps<"div">, "role" | "aria-label" | "aria-orientation" | "tabIndex"> {
  /** The toolbar's accessible name. */
  label: string;
}
/** One tab stop for the row; arrows, Home and End move between its buttons. */
export function Toolbar(props: ToolbarProps): ReactElement;
export interface ToolbarGroupProps extends Omit<ComponentProps<"div">, "role" | "aria-label"> {
  /** The group's accessible name. */
  label?: string;
}
export function ToolbarGroup(props: ToolbarGroupProps): ReactElement;
export function ToolbarSeparator(props: ComponentProps<"span">): ReactElement;
type ToolbarToggle =
  | { pressed: boolean; onPressedChange: (pressed: boolean) => void }
  | { pressed?: undefined; onPressedChange?: undefined };
export type ToolbarButtonProps = Omit<ComponentProps<"button">, "aria-label" | "aria-pressed"> &
  ToolbarToggle & {
    /** Makes it a square icon button and names it. Leave out for a text button. */
    label?: string;
    variant?: ButtonVariant;
  };
/** A button in the row. `pressed` makes it a toggle; `onPressedChange` hears the next value. */
export function ToolbarButton(props: ToolbarButtonProps): ReactElement;
export interface ToolbarMoreProps {
  /** The trigger's accessible name. Default "More". */
  label?: string;
  /** The trigger's content. Default "…". */
  icon?: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** `MenuItem`, `MenuItemCheckbox` and the rest of the menu parts. */
  children: ReactNode;
}
/** The overflow menu: a trigger in the row and the actions you folded away. */
export function ToolbarMore(props: ToolbarMoreProps): ReactElement;

export interface ManuscriptProps extends ComponentProps<"article"> {
  /** The page width, any CSS length. Default 40rem, about 66 characters. */
  measure?: string;
  /** "mono" sets the page in Source Code Pro. */
  face?: "mono";
  /** On the scroller around the page. `className` and `ref` reach the page. */
  wrapClassName?: string;
}
/** The writing surface: a scroller on the canvas holding one page at a reading measure. */
export function Manuscript(props: ManuscriptProps): ReactElement;
export interface StatusSegmentProps extends Omit<ComponentProps<"button">, "type"> {
  /** A colored dot before the text. */
  tone?: Tone;
  /** Pushes the segment to the far side. */
  end?: boolean;
  /** Makes it a toggle button. */
  pressed?: boolean;
  /** Renders a link. */
  href?: string;
}
/** A fact in the status bar: text, or a button with `onClick` or `pressed`, or a link with `href`. */
export function StatusSegment(props: StatusSegmentProps): ReactElement;

/* ---- Marks and hover card ---------------------------------------------- */

export type MarkKind = "comment" | "insert" | "delete" | "mention" | "entity";
export interface MarkProps extends ComponentProps<"span"> {
  kind: MarkKind;
  /** The open comment: sets `aria-current` and the accent. */
  active?: boolean;
  /** A settled comment: the fill goes and the underline dots. */
  resolved?: boolean;
  /** A mention's color, any CSS color or `var(--sd-success)`. Default is the `extra` role. */
  who?: string;
  /** Renders a link. */
  href?: string;
}
/** A span of text something is attached to. `onClick` without `href` makes it a button. */
export function Mark(props: MarkProps): ReactElement;

export interface HoverCardProps {
  /** What the card shows. */
  content: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Milliseconds the pointer rests on the trigger before it opens. Default 300. Focus opens it at once. */
  openDelay?: number;
  /** Milliseconds after the pointer leaves the trigger and the card before it closes. Default 150. */
  closeDelay?: number;
  /** On the card. */
  className?: string;
  /** The one focusable element the card describes, usually a `Mark`. */
  children: ReactElement;
}
/** A preview beside its trigger on hover or focus; Escape closes it. */
export function HoverCard(props: HoverCardProps): ReactElement;

/* ---- Document tree ----------------------------------------------------- */

export interface TreeMove {
  /** The item that was dragged, or moved with Alt+ArrowUp / Alt+ArrowDown. */
  id: string;
  /** The item it was dropped on, or the sibling it stepped past. */
  targetId: string;
  /** Before or after `targetId` as a sibling, or inside it as its child. */
  position: "before" | "after" | "inside";
}
export interface TreeProps extends Omit<ComponentProps<"ul">, "role" | "aria-label" | "tabIndex" | "children"> {
  /** The tree's accessible name. */
  label: string;
  /** The selected item's `id`; null for none. */
  selected?: string | null;
  defaultSelected?: string | null;
  onSelectedChange?: (id: string) => void;
  /** The `id`s of the open branches. */
  expanded?: string[];
  defaultExpanded?: string[];
  onExpandedChange?: (expanded: string[]) => void;
  /**
   * Reordering is reported, not done: reorder your own data in here. Giving it
   * makes items draggable and turns on Alt+ArrowUp and Alt+ArrowDown.
   */
  onMove?: (move: TreeMove) => void;
  children?: ReactNode;
}
/** One tab stop; arrows, Home and End move, Right and Left open and close, Enter selects. */
export function Tree(props: TreeProps): ReactElement;
export interface TreeItemProps extends Omit<ComponentProps<"li">, "id" | "role" | "children"> {
  /** Names the item in the tree's state and in `onMove`. Unique in the tree. */
  id: string;
  label: ReactNode;
  icon?: ReactNode;
  /** Small text at the end of the row, such as a count. */
  meta?: ReactNode;
  disabled?: boolean;
  /** More `TreeItem`s: makes this a branch. */
  children?: ReactNode;
}
export function TreeItem(props: TreeItemProps): ReactElement;
