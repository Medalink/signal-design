/**
 * Types for `signal-design/react`. Props extend the element each component
 * renders, so every native attribute and `ref` (a plain prop in React 19) is
 * accepted and passed through.
 */
import type { IconName } from "../js/icons.js";
import type { ComponentProps, ElementType, HTMLAttributes, MouseEvent, MouseEventHandler, ReactElement, ReactNode, Ref, SyntheticEvent } from "react";

export type Tone = "accent" | "success" | "danger" | "warning" | "pending" | "extra" | "neutral";

/* ---- Buttons ----------------------------------------------------------- */

export type ButtonVariant = "default" | "primary" | "ghost" | "link";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonClassOptions {
  variant?: ButtonVariant | undefined;
  size?: ButtonSize | undefined;
  block?: boolean | undefined;
  className?: string | undefined;
}
/** The `sd-btn` classes, for a link or any other element that should look like a button. */
export function buttonClass(options?: ButtonClassOptions): string;

export interface ButtonProps extends ComponentProps<"button"> {
  variant?: ButtonVariant | undefined;
  size?: ButtonSize | undefined;
  /** Full width. */
  block?: boolean | undefined;
  tone?: Tone | undefined;
  /** Sets `aria-busy`. */
  busy?: boolean | undefined;
}
export function Button(props: ButtonProps): ReactElement;

export interface IconButtonProps extends Omit<ComponentProps<"button">, "aria-label"> {
  /** The accessible name. */
  label: string;
  variant?: ButtonVariant | undefined;
  size?: ButtonSize | undefined;
  tone?: Tone | undefined;
}
export function IconButton(props: IconButtonProps): ReactElement;

/* ---- Icons ------------------------------------------------------------- */

export type { IconName };

export interface IconProps extends Omit<ComponentProps<"svg">, "children"> {
  /** Which icon of the set. */
  name: IconName;
  /** Makes the icon an image with this name. Without it the icon is decorative (`aria-hidden`). */
  label?: string | undefined;
}
/** An icon of the set as an inline SVG sized to the text beside it. Pass `label` only when no text or control names it. */
export function Icon(props: IconProps): ReactElement;

/* ---- Fields and controls ----------------------------------------------- */

export interface FieldProps extends Omit<ComponentProps<"div">, "children"> {
  label?: ReactNode | undefined;
  hint?: ReactNode | undefined;
  /** Shown instead of the hint, marks the control `aria-invalid` and points `aria-describedby` at it. */
  error?: ReactNode | undefined;
  /** Small text beside the label, such as "optional". */
  aside?: ReactNode | undefined;
  /** Passed to the control as `required`. */
  required?: boolean | undefined;
  children: ReactNode;
}
/** Owns the label, hint and error. The `Input`, `Textarea` or `Select` inside takes its id and ARIA from it. */
export function Field(props: FieldProps): ReactElement;

export function Input(props: ComponentProps<"input">): ReactElement;
export function Textarea(props: ComponentProps<"textarea">): ReactElement;
export function Select(props: ComponentProps<"select">): ReactElement;

export interface CheckboxProps extends Omit<ComponentProps<"input">, "type" | "className" | "children"> {
  label: ReactNode;
  description?: ReactNode | undefined;
  /** On the label; `ref` and the other props reach the input. */
  className?: string | undefined;
}
export function Checkbox(props: CheckboxProps): ReactElement;
export function Switch(props: Omit<CheckboxProps, "role">): ReactElement;

/* ---- Static parts ------------------------------------------------------ */

export interface BadgeProps extends ComponentProps<"span"> {
  tone?: Tone | undefined;
  solid?: boolean | undefined;
}
export function Badge(props: BadgeProps): ReactElement;

export interface CountBadgeProps extends Omit<ComponentProps<"span">, "children"> {
  value: number;
  /** Shows `max+` above it. Default 99. */
  max?: number | undefined;
  /** Makes the count read as "label: value". */
  label?: string | undefined;
  tone?: Tone | undefined;
  /** Pin to the corner of a positioned parent. */
  corner?: boolean | undefined;
  hideZero?: boolean | undefined;
}
export function CountBadge(props: CountBadgeProps): ReactElement | null;

export type AvatarStatus = "online" | "away" | "afk" | "busy" | "offline";
export interface AvatarProps extends Omit<ComponentProps<"span">, "children"> {
  /** The accessible name, and the initials when there is no `src`. */
  name: string;
  src?: string | undefined;
  size?: "sm" | "md" | "lg" | "xl" | undefined;
  tone?: Tone | undefined;
  status?: AvatarStatus | undefined;
}
export function Avatar(props: AvatarProps): ReactElement;
export function AvatarStack(props: ComponentProps<"span">): ReactElement;

export interface CardProps extends Omit<ComponentProps<"article">, "ref"> {
  tone?: Tone | undefined;
  /** Makes the whole card a link. */
  href?: string | undefined;
  ref?: Ref<HTMLElement> | undefined;
}
export function Card(props: CardProps): ReactElement;
export function CardHeader(props: ComponentProps<"header">): ReactElement;
export function CardBody(props: ComponentProps<"div">): ReactElement;
export function CardFooter(props: ComponentProps<"footer">): ReactElement;

export interface PanelProps extends ComponentProps<"section"> {
  /** "wide" caps at 1024px, "fluid" does not cap. Default 560px. */
  width?: "wide" | "fluid" | undefined;
}
export function Panel(props: PanelProps): ReactElement;
export function PanelTitle(props: ComponentProps<"h3">): ReactElement;
export function PanelDescription(props: ComponentProps<"p">): ReactElement;

export interface EmptyStateProps extends Omit<ComponentProps<"div">, "title"> {
  title?: ReactNode | undefined;
  action?: ReactNode | undefined;
}
export function EmptyState(props: EmptyStateProps): ReactElement;

export interface TableProps extends ComponentProps<"table"> {
  compact?: boolean | undefined;
  hover?: boolean | undefined;
  /** On the scroll wrapper. `className` and `ref` reach the table. */
  wrapClassName?: string | undefined;
}
export function Table(props: TableProps): ReactElement;
export function TableCaption(props: ComponentProps<"caption">): ReactElement;
export function TableHead(props: ComponentProps<"thead">): ReactElement;
export function TableBody(props: ComponentProps<"tbody">): ReactElement;
export function TableFoot(props: ComponentProps<"tfoot">): ReactElement;
export interface TableRowProps extends ComponentProps<"tr"> {
  /** Sets `aria-selected`. */
  selected?: boolean | undefined;
}
export function TableRow(props: TableRowProps): ReactElement;
export interface TableHeaderProps extends Omit<ComponentProps<"th">, "scope"> {
  numeric?: boolean | undefined;
  /** The arrow to draw. Giving it, or `onSort`, makes the header sortable. */
  sort?: "ascending" | "descending" | "none" | undefined;
  sortable?: boolean | undefined;
  /** Called on click, Enter or Space. Makes the header focusable. */
  onSort?: ((event: SyntheticEvent<HTMLTableCellElement>) => void) | undefined;
}
export function TableHeader(props: TableHeaderProps): ReactElement;
export interface TableCellProps extends ComponentProps<"td"> {
  numeric?: boolean | undefined;
}
export function TableCell(props: TableCellProps): ReactElement;

export type WeightedBarState = "drafted" | "current" | "planned";
export interface WeightedBarSegment {
  /** Its share of the bar. Any positive number, in the same unit as every other weight and the goal. */
  weight: number;
  state: WeightedBarState;
  /** Shown as a tooltip on the segment. */
  label?: string | undefined;
  key?: string | undefined;
}
export interface WeightedBarProps extends Omit<ComponentProps<"div">, "children" | "role" | "aria-label"> {
  /** The bar's accessible name. Say the numbers: the segments are not read. */
  label: string;
  segments: WeightedBarSegment[];
  /** In the weights' unit. What the segments leave of it is a trailing open segment; past it there is none. */
  goal?: number | undefined;
}
/** A bar of segments sized by weight toward a goal, such as drafted, current and planned words. */
export function WeightedBar(props: WeightedBarProps): ReactElement;

/* ---- Dialog and sheet -------------------------------------------------- */

export interface DialogProps extends Omit<ComponentProps<"dialog">, "open"> {
  /** Controlled. Leave out to let the dialog keep its own state. */
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  /** Called when the dialog closes (Escape, backdrop, a close button) or a trigger opens it. */
  onOpenChange?: ((open: boolean) => void) | undefined;
  /** A button that opens the dialog; rendered before it. */
  trigger?: ReactElement<{ onClick?: MouseEventHandler<HTMLElement> | undefined }> | undefined;
  size?: "sm" | "md" | "lg" | undefined;
  /** Pins the dialog to an edge as a sheet: the right, the left or the bottom. */
  side?: "left" | "right" | "bottom" | undefined;
  /** Escape and the backdrop do not close it. */
  static?: boolean | undefined;
}
export function Dialog(props: DialogProps): ReactElement;
export interface SheetProps extends Omit<DialogProps, "side" | "size"> {
  side?: "left" | "right" | "bottom" | undefined;
}
export function Sheet(props: SheetProps): ReactElement;
export interface DialogHeaderProps extends ComponentProps<"header"> {
  /** The × button. Default true. */
  closeButton?: boolean | undefined;
  /** The × button's accessible name, such as "Close inspector". Default "Close". */
  closeLabel?: string | undefined;
}
/** The title row; its text names the dialog. */
export function DialogHeader(props: DialogHeaderProps): ReactElement;
export function DialogBody(props: ComponentProps<"div">): ReactElement;
export function DialogFooter(props: ComponentProps<"footer">): ReactElement;
/** Makes the one child button close the dialog around it. */
export function DialogClose(props: { children: ReactElement<{ onClick?: MouseEventHandler<HTMLElement> | undefined }> }): ReactElement;

/* ---- Popover and menu -------------------------------------------------- */

export interface PopoverProps {
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
  children: ReactNode;
}
export function Popover(props: PopoverProps): ReactElement;
/** The one child (a button) opens and closes the panel and gets `aria-expanded`. */
export function PopoverTrigger(props: { children: ReactElement; haspopup?: "menu" | "dialog" | "listbox" | "tree" | "grid" | undefined }): ReactElement;
export interface PopoverContentProps extends ComponentProps<"div"> {
  side?: "top" | "bottom" | "left" | "right" | undefined;
  align?: "start" | "center" | "end" | undefined;
  /** Adds padding for prose. */
  pad?: boolean | undefined;
  /** Selector of the element to focus when it opens. */
  initialFocus?: string | undefined;
}
export function PopoverContent(props: PopoverContentProps): ReactElement;

export const Menu: typeof Popover;
export function MenuTrigger(props: { children: ReactElement }): ReactElement;
export interface MenuContentProps extends Omit<PopoverContentProps, "initialFocus"> {
  /** The menu's accessible name. */
  label?: string | undefined;
}
export function MenuContent(props: MenuContentProps): ReactElement;
export interface MenuItemProps extends ComponentProps<"button"> {
  tone?: Tone | undefined;
  disabled?: boolean | undefined;
  /** Shortcut text at the end of the row. */
  hint?: ReactNode | undefined;
  /** Called when chosen. `preventDefault()` keeps the menu open. */
  onSelect?: ((event: MouseEvent<HTMLButtonElement>) => void) | undefined;
}
export function MenuItem(props: MenuItemProps): ReactElement;
export interface MenuItemCheckboxProps extends Omit<MenuItemProps, "role" | "aria-checked"> {
  checked: boolean;
  onCheckedChange?: ((checked: boolean) => void) | undefined;
}
/** An item that is on or off. Choosing it leaves the menu open, so several can be set in a row. */
export function MenuItemCheckbox(props: MenuItemCheckboxProps): ReactElement;
export interface MenuRadioGroupProps extends Omit<ComponentProps<"div">, "role" | "aria-label" | "defaultValue"> {
  /** The group's accessible name. */
  label: string;
  value?: string | null | undefined;
  defaultValue?: string | null | undefined;
  onValueChange?: ((value: string) => void) | undefined;
}
export function MenuRadioGroup(props: MenuRadioGroupProps): ReactElement;
export interface MenuItemRadioProps extends Omit<MenuItemProps, "role" | "aria-checked"> {
  value: string;
}
/** One choice of a `MenuRadioGroup`. Choosing it checks it and closes the menu. */
export function MenuItemRadio(props: MenuItemRadioProps): ReactElement;
export function MenuLabel(props: ComponentProps<"div">): ReactElement;
export function MenuSeparator(props: ComponentProps<"hr">): ReactElement;

/* ---- Radio group and segmented control ---------------------------------- */

export interface RadioGroupProps extends Omit<ComponentProps<"div">, "role" | "aria-label" | "defaultValue" | "onChange"> {
  /** The group's accessible name. */
  label: string;
  value?: string | null | undefined;
  defaultValue?: string | null | undefined;
  onValueChange?: ((value: string) => void) | undefined;
  /** Submits the choice with a form. Generated when left out. */
  name?: string | undefined;
  disabled?: boolean | undefined;
}
export function RadioGroup(props: RadioGroupProps): ReactElement;
export interface RadioProps extends Omit<ComponentProps<"input">, "type" | "value" | "name" | "checked" | "defaultChecked" | "autoFocus" | "onChange" | "className" | "children"> {
  value: string;
  label: ReactNode;
  description?: ReactNode | undefined;
  /** On the label; `ref` and the other props reach the input. */
  className?: string | undefined;
}
/** One radio with its label. Arrows move and choose, and the group has one tab stop. */
export function Radio(props: RadioProps): ReactElement;
export interface SegmentedControlProps extends RadioGroupProps {
  /** Shrinks the bar to its content. */
  inline?: boolean | undefined;
  /** Lets the segments flow onto more rows in a narrow container. */
  wrap?: boolean | undefined;
  size?: "sm" | undefined;
}
export function SegmentedControl(props: SegmentedControlProps): ReactElement;
export interface SegmentProps extends Omit<ComponentProps<"input">, "type" | "value" | "name" | "checked" | "defaultChecked" | "autoFocus" | "onChange" | "children"> {
  value: string;
  /** The segment's label. */
  children: ReactNode;
}
export function Segment(props: SegmentProps): ReactElement;

/* ---- Tooltip, tabs, toast ---------------------------------------------- */

export interface TooltipProps {
  content: ReactNode;
  side?: "top" | "bottom" | "left" | "right" | undefined;
  /** The one element the tooltip describes. */
  children: ReactElement;
}
export function Tooltip(props: TooltipProps): ReactElement;

type TabsBase = Omit<ComponentProps<"div">, "defaultValue" | "onChange">;
export type TabsProps = TabsBase &
  (
    | { value: string; defaultValue?: undefined; onValueChange: (value: string) => void }
    | { value?: undefined; defaultValue: string; onValueChange?: ((value: string) => void) | undefined }
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
  tone?: Tone | undefined;
  /** Milliseconds on screen, 0 to stay until dismissed. Default is the provider's `timeout`. */
  timeout?: number | undefined;
  action?: { label: string; onClick?: (() => void) | undefined } | undefined;
}
/** Shows a toast and returns a function that dismisses it. */
export type ToastFunction = (message: ReactNode, options?: ToastOptions) => () => void;
export function ToastProvider(props: { /** Default milliseconds on screen. Default 2400. */ timeout?: number | undefined; children?: ReactNode | undefined }): ReactElement;
export function useToast(): ToastFunction;

/* ---- App shell --------------------------------------------------------- */

export interface AppShellProps extends ComponentProps<"div"> {
  sidebar?: "pinned" | "collapsed" | undefined;
  defaultSidebar?: "pinned" | "collapsed" | undefined;
  onSidebarChange?: ((sidebar: "pinned" | "collapsed") => void) | undefined;
  /** The right panel. */
  aside?: boolean | undefined;
  defaultAside?: boolean | undefined;
  onAsideChange?: ((open: boolean) => void) | undefined;
  /** The phone drawer. */
  drawer?: boolean | undefined;
  defaultDrawer?: boolean | undefined;
  onDrawerChange?: ((open: boolean) => void) | undefined;
  /** The current rail section, matched by `RailItem` and `SidebarPanel` `section`. */
  section?: string | undefined;
  defaultSection?: string | undefined;
  onSectionChange?: ((section: string) => void) | undefined;
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
  section?: string | undefined;
  /** Marks it as the current page instead of the current section. */
  current?: boolean | undefined;
  unread?: boolean | undefined;
  pending?: boolean | undefined;
  /** A link when given, a button otherwise. */
  href?: string | undefined;
  onClick?: MouseEventHandler<HTMLElement> | undefined;
  ref?: Ref<HTMLElement> | undefined;
}
export function RailItem(props: RailEntryProps): ReactElement;
export function RailTile(props: RailEntryProps): ReactElement;
export function Sidebar(props: ComponentProps<"aside">): ReactElement;
export interface SidebarPanelProps extends ComponentProps<"div"> {
  /** Shown only while this rail section is current. */
  section?: string | undefined;
}
export function SidebarPanel(props: SidebarPanelProps): ReactElement;
export function SidebarHead(props: ComponentProps<"div">): ReactElement;
export function SidebarTitle(props: ComponentProps<"span">): ReactElement;
export function SidebarBody(props: ComponentProps<"nav">): ReactElement;
export interface SidebarGroupProps extends Omit<ComponentProps<"details">, "open" | "title"> {
  title: ReactNode;
  open?: boolean | undefined;
  /** Default true. */
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
}
export function SidebarGroup(props: SidebarGroupProps): ReactElement;
export interface SidebarLinkProps extends ComponentProps<"a"> {
  current?: boolean | undefined;
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
  label?: string | undefined;
}
export function ToolbarGroup(props: ToolbarGroupProps): ReactElement;
export function ToolbarSeparator(props: ComponentProps<"span">): ReactElement;
type ToolbarToggle =
  | { pressed: boolean; onPressedChange: (pressed: boolean) => void }
  | { pressed?: undefined; onPressedChange?: undefined };
export type ToolbarButtonProps = Omit<ComponentProps<"button">, "aria-label" | "aria-pressed"> &
  ToolbarToggle & {
    /** Makes it a square icon button and names it. Leave out for a text button. */
    label?: string | undefined;
    variant?: ButtonVariant | undefined;
  };
/** A button in the row. `pressed` makes it a toggle; `onPressedChange` hears the next value. */
export function ToolbarButton(props: ToolbarButtonProps): ReactElement;
export interface ToolbarMoreProps {
  /** The trigger's accessible name. Default "More". */
  label?: string | undefined;
  /** The trigger's content. Default "…". */
  icon?: ReactNode | undefined;
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
  /** `MenuItem`, `MenuItemCheckbox` and the rest of the menu parts. */
  children: ReactNode;
}
/** The overflow menu: a trigger in the row and the actions you folded away. */
export function ToolbarMore(props: ToolbarMoreProps): ReactElement;

export interface ManuscriptProps extends ComponentProps<"article"> {
  /** The page width, any CSS length. Default 40rem, about 66 characters. */
  measure?: string | undefined;
  /** "reading" sets the page in the reading serif (Literata); "mono" in Source Code Pro. */
  face?: "reading" | "mono" | undefined;
  /** On the scroller around the page. `className` and `ref` reach the page. */
  wrapClassName?: string | undefined;
  /** The scroller element (`overflow: auto`), for scroll position and typewriter scrolling. `ref` reaches the page. */
  wrapRef?: Ref<HTMLDivElement> | undefined;
}
/** The writing surface: a scroller on the canvas holding one page at a reading measure. */
export function Manuscript(props: ManuscriptProps): ReactElement;
interface StatusSegmentBase extends Omit<ComponentProps<"button">, "type" | "disabled"> {
  /** A colored dot before the text. */
  tone?: Tone | undefined;
  /** Pushes the segment to the far side. */
  end?: boolean | undefined;
  /** Makes it a toggle button. */
  pressed?: boolean | undefined;
  /** Renders a link. */
  href?: string | undefined;
}
export type StatusSegmentProps =
  | (StatusSegmentBase & { href?: undefined; disabled?: boolean | undefined } & ({ onClick: MouseEventHandler<HTMLButtonElement> } | { pressed: boolean }))
  | (StatusSegmentBase & { disabled?: never | undefined });
/** A fact in the status bar: text, or a button with `onClick` or `pressed`, or a link with `href`. */
export function StatusSegment(props: StatusSegmentProps): ReactElement;

/* ---- Marks and hover card ---------------------------------------------- */

export type MarkKind = "comment" | "insert" | "delete" | "mention" | "entity" | "find" | "check";
export interface MarkProps extends ComponentProps<"span"> {
  kind: MarkKind;
  /** The open comment, or the current find or check match: sets `aria-current`. A comment takes the accent; a find or check match adds an outline and a heavier line. */
  active?: boolean | undefined;
  /** A settled comment: the fill goes and the underline dots. */
  resolved?: boolean | undefined;
  /** A mention's color, any CSS color or `var(--sd-success)`. Default is the `extra` role. */
  who?: string | undefined;
  /** Renders a link. */
  href?: string | undefined;
}
/** A span of text something is attached to. `onClick` without `href` makes it a button. */
export function Mark(props: MarkProps): ReactElement;

export interface GutterMarkerProps extends Omit<ComponentProps<"button">, "aria-label"> {
  /** A suggestion draws a dashed edge. Default "comment". */
  kind?: "comment" | "suggestion" | undefined;
  /** Shown when there are no children, such as the number of comments. */
  count?: number | undefined;
  /** The open one: sets `aria-current`. */
  active?: boolean | undefined;
  /** A settled one: drawn faint. */
  resolved?: boolean | undefined;
  /** The accessible name, such as "2 comments". */
  label: string;
}
/** A square in the margin beside a block for what is attached to the block as a whole. */
export function GutterMarker(props: GutterMarkerProps): ReactElement;

export interface GutterBlockProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  /** The element to render. Default `div`. */
  as?: ElementType | undefined;
  /** "start" puts the marker in the leading margin. Default is the trailing one. */
  side?: "start" | "end" | undefined;
  /** Props for the block's `GutterMarker`; none, no marker. */
  marker?: GutterMarkerProps | undefined;
  children?: ReactNode | undefined;
  ref?: Ref<HTMLElement> | undefined;
}
/** A block of a manuscript page that can carry a `GutterMarker`. */
export function GutterBlock(props: GutterBlockProps): ReactElement;

export interface HoverCardProps {
  /** What the card shows. */
  content: ReactNode;
  /** The card's accessible name. Default "Preview". */
  label?: string | undefined;
  side?: "top" | "bottom" | "left" | "right" | undefined;
  align?: "start" | "center" | "end" | undefined;
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
  /** Milliseconds the pointer rests on the trigger before it opens. Default 300. Focus opens it at once. */
  openDelay?: number | undefined;
  /** Milliseconds after the pointer leaves the trigger and the card before it closes. Default 150. */
  closeDelay?: number | undefined;
  /** On the card. */
  className?: string | undefined;
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
  selected?: string | null | undefined;
  defaultSelected?: string | null | undefined;
  onSelectedChange?: ((id: string) => void) | undefined;
  /** The `id`s of the open branches. */
  expanded?: string[] | undefined;
  defaultExpanded?: string[] | undefined;
  onExpandedChange?: ((expanded: string[]) => void) | undefined;
  /**
   * Reordering is reported, not done: reorder your own data in here. Giving it
   * makes items draggable and turns on Alt+ArrowUp and Alt+ArrowDown.
   */
  onMove?: ((move: TreeMove) => void) | undefined;
  children?: ReactNode | undefined;
}
/** One tab stop; arrows, Home and End move, Right and Left open and close, Enter selects. */
export function Tree(props: TreeProps): ReactElement;
export interface TreeItemProps extends Omit<ComponentProps<"li">, "id" | "role" | "children"> {
  /** Names the item in the tree's state and in `onMove`. Unique in the tree. */
  id: string;
  label: ReactNode;
  icon?: ReactNode | undefined;
  /** Small text at the end of the row, such as a count. */
  meta?: ReactNode | undefined;
  disabled?: boolean | undefined;
  /** More `TreeItem`s: makes this a branch. */
  children?: ReactNode | undefined;
}
export function TreeItem(props: TreeItemProps): ReactElement;

/* ---- Combobox and command palette -------------------------------------- */

export interface ListItem {
  /** The id of the item: what the combobox hands to `onValueChange`, what the palette hands to `onSelect`. Unique in the list. */
  value: string;
  label: string;
  /** Extra text the default filter also matches. */
  keywords?: string | undefined;
  /** A label above the first item of each run with the same group. */
  group?: string | undefined;
  /** Text at the end of the row, such as a shortcut. */
  hint?: string | undefined;
  /** Renders the option as a link. */
  href?: string | undefined;
  disabled?: boolean | undefined;
}
/** `false` shows the items as given, for results you fetched yourself; a function replaces the default match on label, keywords and value. */
export type ListFilter = false | ((item: ListItem, query: string) => boolean);

export interface ComboboxProps extends Omit<ComponentProps<"input">, "value" | "defaultValue" | "role" | "type" | "onChange"> {
  items: ListItem[];
  /** The chosen item's `value`; null for none. */
  value?: string | null | undefined;
  defaultValue?: string | null | undefined;
  onValueChange?: ((value: string) => void) | undefined;
  /** The text in the box. Leave out and it follows the chosen item's label. */
  inputValue?: string | undefined;
  defaultInputValue?: string | undefined;
  onInputValueChange?: ((text: string) => void) | undefined;
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
  filter?: ListFilter | undefined;
  /** Sets `aria-busy` on the list and shows "Loading" when there are no items. */
  busy?: boolean | undefined;
  /** Shown when nothing matches. Default "No matches". */
  emptyText?: string | undefined;
  /** The list's accessible name. Default "Suggestions". */
  listLabel?: string | undefined;
  /** Adds a hidden input carrying the chosen value to a form. */
  name?: string | undefined;
  onChange?: ComponentProps<"input">["onChange"] | undefined;
}
/** A searchable select: type to filter, arrows and Enter to choose, Escape to close. Use it inside `Field`. */
export function Combobox(props: ComboboxProps): ReactElement;

export interface CommandPaletteProps extends Omit<DialogProps, "open" | "defaultOpen" | "onOpenChange" | "trigger" | "size" | "side" | "static" | "children" | "onSelect"> {
  items: ListItem[];
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
  /** What has been typed. It is cleared when the palette closes. */
  query?: string | undefined;
  defaultQuery?: string | undefined;
  onQueryChange?: ((query: string) => void) | undefined;
  /** Called when an item is chosen; the palette closes after. A link follows its `href` unless you call `event.preventDefault()`, as a router does. */
  onSelect?: ((item: ListItem, event: MouseEvent<HTMLElement>) => void) | undefined;
  filter?: ListFilter | undefined;
  busy?: boolean | undefined;
  emptyText?: string | undefined;
  /** The palette's name and its search box's. Default "Search". */
  label?: string | undefined;
  placeholder?: string | undefined;
  /** The list's accessible name. Default "Results". */
  listLabel?: string | undefined;
  /** A line under the list, such as the keys. */
  foot?: ReactNode | undefined;
}
/** A command palette: a search box over a filtered list, on a modal dialog. */
export function CommandPalette(props: CommandPaletteProps): ReactElement;
