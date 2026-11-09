// Types for signal-design/js.

export type Theme = "ink" | "graphite" | "paper" | "auto";
/** "light" is the older name for "paper" and is still accepted. */
export type ThemeName = Theme | "light";
export type Font = "system" | "leon-sans" | "source-code-pro";
export type Tone = "accent" | "success" | "danger" | "warning" | "pending" | "extra" | "neutral";

/** Wire up every behavior (delegated, so later markup works too). Call once. */
export function init(options?: {
  /** Restore the remembered theme. Default true. */
  theme?: boolean;
  /** Restore the remembered text font. Default true. */
  font?: boolean;
  /** "auto" hides scrollbars 2s after scrolling stops. Default "auto". */
  scrollbars?: "auto" | "always";
  /** Key combo that steps the theme; false turns it off. Default "shift+t". */
  themeKey?: string | false;
}): void;

/* Dialogs */
export function openDialog(target: string | HTMLDialogElement): HTMLDialogElement | null;
export function closeDialog(target: string | HTMLDialogElement, returnValue?: string): HTMLDialogElement | null;

/* Labels: the words Signal's JS writes into the page. English by default. */
export type LabelKey =
  | "copy.done"
  | "copy.failed"
  | "list.empty"
  | "tags.remove"
  | "spark.trend"
  | "fps.value"
  | "table.resize"
  | "table.width"
  | "shell.pin"
  | "shell.collapse"
  | "window.maximize"
  | "window.restore"
  | "spoiler.label"
  | "countdown.remaining"
  | "countdown.running"
  | "countdown.paused"
  | "countdown.complete"
  | `stream.${AlertKind}.${"label" | "detail"}`;
/** A string with `{name}` placeholders, or a function of the values (for plurals). */
export type LabelValue = string | ((vars: Record<string, string | number>) => string);
/** The English defaults. Read-only; `setLabels` does not change it. */
export const DEFAULT_LABELS: Readonly<Record<LabelKey, LabelValue>>;
/**
 * Replace some labels, once at startup. Unknown keys throw. A value of
 * `undefined` restores that key's English default. `data-sd-empty` and an
 * `aria-label` on the element still win over the table.
 * Placeholders: `tags.remove` {value}; `spark.trend` {values}; `fps.value`
 * {value}; `table.width` {value}; `countdown.remaining` {count} {state}.
 */
export function setLabels(labels: { [K in LabelKey]?: LabelValue | undefined }): void;
/** The label for `key` with placeholders filled from `vars`. */
export function getLabel(key: LabelKey, vars?: Record<string, string | number>): string;

/* Tabs, expand */
export function selectTab(tab: HTMLElement): void;
export function setExpanded(target: string | HTMLElement, open?: boolean): void;

/* Toast */
export function toast(
  message: string | Node,
  options?: { tone?: Tone; timeout?: number; action?: { label: string; onClick?: () => void } },
): () => void;

/* Keyboard */
export function hotkeys(
  map: Record<string, (event: KeyboardEvent) => void>,
  options?: {
    target?: EventTarget;
    /** Milliseconds between sequence keys, such as "g t". Default 900. */
    sequenceTimeout?: number;
    /** Allow repeated single-key bindings. Default true. Sequences never repeat. */
    repeat?: boolean;
    enabled?: boolean | ((event: KeyboardEvent) => boolean);
  },
): () => void;
export function keyOf(event: KeyboardEvent): string;

/* Countdowns */
export interface CountdownState {
  state: "running" | "paused" | "complete";
  remainingMs: number;
  running: boolean;
}
export interface CountdownMount {
  /** Supply authoritative time. Zero or negative time completes the display. */
  set(value: { remainingMs: number; running: boolean }): void;
  /** Stop future updates. Later set() calls have no effect. */
  dispose(): void;
}
/** Explicit mount, independent of init(). Progress uses the largest remaining
 * time since mount or the last completion as its duration. Remount for a new task. */
export function mountCountdown(root: HTMLElement): CountdownMount;

/* Stream scenes */
export type AlertKind = "follow" | "sub" | "raid" | "bits";
export interface StreamAlert {
  /** follow, sub, raid and bits have default tones and labels; any other string needs `tone`. */
  kind: AlertKind | (string & {});
  name: string;
  detail?: string;
  label?: string;
  tone?: Tone;
  size?: "big";
  /** Added to a matching [data-sd-goal]. Default 1. */
  amount?: number;
  /** Milliseconds on screen. */
  hold?: number;
}
export const ALERT_KINDS: Record<AlertKind, { tone: Tone; label: string; detail: string; size?: "big" }>;
export interface StreamMount {
  /** Queue an alert; each shows in turn. Dispatches `sd:alert` on the scene. */
  alert(alert: StreamAlert): void;
  readonly pending: number;
  dispose(): void;
}
/** Alerts, latest-event labels, goals and timers for an `.sd-scene`. */
export function mountStream(scene: HTMLElement, options?: { hold?: number; burst?: boolean }): StreamMount;

/* Live feeds */
export interface FeedState {
  activeId: string | null;
  /** Rows entirely above the viewport. */
  aboveCount: number;
  returnPending: boolean;
}
export interface FeedNavigation {
  scroll?: boolean;
  /** Smooth movement takes 180ms, or is immediate under reduced motion. */
  behavior?: "auto" | "smooth";
}
export interface FeedMount {
  select(id: string, options?: FeedNavigation): void;
  /** Move in DOM order, clamped at either end. */
  move(delta: number, options?: FeedNavigation): void;
  /** Select the lowest or highest numeric data-order. */
  oldest(options?: FeedNavigation): void;
  newest(options?: FeedNavigation): void;
  /** Bracket a synchronous DOM change with beforeUpdate() and afterUpdate(). */
  beforeUpdate(): void;
  afterUpdate(): void;
  refresh(): void;
  suspend(value?: boolean): void;
  dispose(): void;
}
export function mountFeed(root: HTMLElement, options?: {
  itemSelector?: string;
  activeId?: string | null;
  /** A row ID or marker element. No idle return without a target. */
  returnTarget?: () => string | HTMLElement | null;
  /** Default blocks return while a descendant has aria-expanded="true". */
  canReturn?: () => boolean;
  idleMs?: number;
  returnDistance?: number;
  /** Target position as a fraction of viewport height. Default 0.45. */
  align?: number;
}): FeedMount;

/* Machines */
/** A point on the machine's grid, in cells (spec.cell px each). */
export type MachineCell = [number, number];
/** Seconds of machine time: one value, or a range picked at random. */
export type MachineSpan = number | [number, number];
export type MachineStatus = "done" | "running" | "waiting" | "failed" | (string & {});
export interface MachineOutcome {
  /** The node the token goes to next; a list sends a copy to each; none ends it. */
  to?: string | string[];
  /** Relative chance. Default 1. */
  weight?: number;
  /** Written to the token, and to the line's dots when the node has judge: true. */
  status?: MachineStatus;
}
export interface MachineNode {
  id: string;
  /** box (default), press, scan, checks, line, source, sink, or a kind from defineKind(). */
  kind?: string;
  at: MachineCell;
  size: MachineCell;
  label?: string;
  /** Mono text after the label; {in}, {done}, {failed}, {queue} and {busy} fill in live. */
  meta?: string;
  note?: string;
  /** The note by the line's status (line only). */
  notes?: Partial<Record<MachineStatus, string>>;
  noteTone?: Tone;
  labelSide?: "top" | "top-start" | "bottom" | "left" | "right";
  /** How long a token stays in a slot. */
  hold?: MachineSpan;
  /** Slots that hold at once (box). Default 1. */
  capacity?: number;
  /** Slot columns (box). */
  cols?: number;
  /** "latest" keeps one waiting token and folds every later arrival into it. */
  queue?: "fifo" | "latest";
  /** Color the line dots this node's tokens came from with each outcome's status. */
  judge?: boolean;
  /** Where a finished token goes: a node id, or outcomes by name. */
  out?: string | Record<string, string | MachineOutcome>;
  /** source: workers, how often each writes, and where it sends what it wrote. */
  agents?: number;
  every?: MachineSpan;
  to?: string;
  /** checks: the names of the checks. */
  items?: string[];
  /** line: px between dots. sink: the counter's text, with {n}, and its first value. */
  gap?: number;
  format?: string;
  start?: number;
  bare?: boolean;
  ports?: boolean;
  tone?: Tone;
  [key: string]: unknown;
}
export interface MachineWire {
  from: string;
  to: string;
  /** Override the ports: the wire's first and last point. */
  start?: MachineCell;
  end?: MachineCell;
  /** Corners to pass through; between points the wire runs in right angles. */
  via?: MachineCell[];
  dashed?: boolean;
}
export interface MachineSpec {
  seed?: number;
  /** px per grid cell. Default 20. */
  cell?: number;
  size: MachineCell;
  /** How fast tokens travel, px per machine second. Default 300. */
  travel?: number;
  /** One turn of the .sd-machine-clock hand, in machine seconds. Default 60. */
  clock?: { period?: number };
  nodes: MachineNode[];
  wires?: MachineWire[];
  text?: { at: MachineCell; lines: string | string[]; align?: "left" | "center" | "right"; tone?: Tone }[];
}
export interface MachineEvent {
  type: "emit" | "enter" | "start" | "finish" | "fold" | "land" | "select" | "state" | "load";
  /** Machine time in seconds. */
  t: number;
  node?: string | null;
  outcome?: string;
  token?: { id: number; label: string; status: string; count: number };
  playing?: boolean;
  speed?: number;
  nodes?: string[];
}
export interface MachineNodeInfo {
  id: string;
  spec: MachineNode;
  count: { in: number; done: number; failed: number };
  queue: number;
  busy: number;
  capacity: number;
  state: Record<string, unknown>;
}
export interface Machine {
  readonly time: number;
  readonly playing: boolean;
  /** 1 is real time; 0.25 is slow motion. */
  speed: number;
  /** A copy of the running spec, with every set() applied. */
  readonly spec: MachineSpec;
  readonly selected: string | null;
  play(): void;
  pause(): void;
  toggle(): void;
  /** Run machine time forward, playing or not. */
  advance(seconds?: number): void;
  /** Swap the whole machine. */
  load(spec: MachineSpec): void;
  /** Change one node's behavior while it runs. */
  set(id: string, patch: Partial<MachineNode>): void;
  node(id: string): MachineNodeInfo | undefined;
  select(id: string | null): void;
  destroy(): void;
}
/** A node kind: every hook is optional. See src/js/machine-kinds.js. */
export interface MachineKind {
  ports?: boolean;
  build?(node: any, helpers: any): void;
  capacity?(node: any): number;
  slots?(node: any, count: number): [number, number][];
  decorate?(node: any, helpers: any): void;
  ready?(node: any, helpers: any): void;
  accept?(node: any, token: any, helpers: any): boolean | void;
  start?(node: any, slot: any, token: any, helpers: any): void;
  progress?(node: any, slot: any, p: number, helpers: any): void;
  finish?(node: any, slot: any, token: any, outcome: MachineOutcome & { key: string }, helpers: any): void;
  tick?(node: any, helpers: any): void;
  patch?(node: any, patch: Partial<MachineNode>, helpers: any): void;
  judged?(node: any, helpers: any): void;
}
/** Draw a spec into a .sd-machine figure (or its .sd-machine-board). Plays at once unless the user asks for reduced motion. */
export function mountMachine(root: HTMLElement, spec: MachineSpec, options?: {
  autoplay?: boolean;
  speed?: number;
  /** Nodes become buttons with aria-pressed; a click selects one and fires a select event. */
  select?: boolean;
  /** The smallest scale before the board scrolls instead. Default 0.5. */
  minScale?: number;
}): Machine;
export function defineKind(name: string, kind: MachineKind): void;
export function machineKinds(): string[];

/* Living tables */
export interface LivingTableState {
  width: number;
  collapsed: string[];
}
export interface LivingTableMount {
  toggle(id: string, open?: boolean): void;
  /** Width in CSS pixels. null restores fluid parent width. */
  resize(value: { width: number | null }): void;
  /** Reconcile rows, groups, and parent width after moving containers. Remount after changing the column schema. */
  refresh(): void;
  /** Restore authored markup. Later calls have no effect. */
  dispose(): void;
}
/** Explicit mount, independent of init(). Duplicate live mounts throw. */
export function mountLivingTable(root: HTMLElement): LivingTableMount;

/* Theme */
export const THEMES: readonly Theme[];
export function setTheme(name: ThemeName, options?: { persist?: boolean }): void;
export function getTheme(): Theme;
export function restoreTheme(fallback?: ThemeName): void;
/** Step to the next theme: ink → graphite → paper → auto. */
export function cycleTheme(): void;

/* Font */
export const FONTS: readonly Font[];
/** Resolves once the font applies (after its face loads, or a short wait). The last overlapping call wins. */
export function setFont(name: Font, options?: { persist?: boolean }): Promise<void>;
export function getFont(): Font;
export function restoreFont(fallback?: Font): void;

/* Positioning */
/**
 * What an element can be placed beside: an element, anything with `getBoundingClientRect`, a rect, or a `{ x, y }` point.
 * A rect needs `left` and `top`. A missing `right` or `bottom` is `left` or `top` plus `width` or `height`, or just `left` or `top` when there is none.
 */
export type PlaceAnchor =
  | { getBoundingClientRect(): { left: number; top: number; right: number; bottom: number } }
  | { left: number; top: number; right?: number | undefined; bottom?: number | undefined; width?: number | undefined; height?: number | undefined }
  | { x: number; y: number };
/**
 * Places a `position: fixed` element beside the anchor, flipped to the other side at the viewport edge.
 * A point has no size, so its default `offset` is 0 and the element's corner sits on it (6 otherwise).
 * Where the element flips above or left of the point or shifts at an edge it overlaps the point by a few pixels, so it always contains it.
 * Nothing happens when the element or the anchor is null.
 */
export function place(
  floating: HTMLElement | null,
  anchor: PlaceAnchor | null,
  options?: { side?: "top" | "bottom" | "left" | "right"; align?: "start" | "center" | "end"; offset?: number },
): void;

/* App shell */
export function setSidebar(shell: HTMLElement, state: "pinned" | "collapsed"): void;
/** Set the sidebar width in CSS px, clamped to the resize handle's aria-valuemin and aria-valuemax, and remember it; null returns to the width the page was authored with. `target` is the .sd-shell, or a .sd-sidebar used on its own; only a shell fires sd:shell. */
export function setSidebarWidth(target: HTMLElement, width: number | null): void;
export function setAside(shell: HTMLElement, open: boolean): void;
export function setDrawer(shell: HTMLElement, open: boolean): void;
export function selectSection(shell: HTMLElement, name: string): void;
export function windowAction(action: "minimize" | "maximize" | "close", titlebar?: HTMLElement | null): Promise<void>;

/* Digital rain */
export interface RainMount {
  readonly canvas: HTMLCanvasElement;
  readonly playing: boolean;
  play(): void;
  pause(): void;
  update(options: Record<string, unknown>): void;
  destroy(): void;
}
export function mountRain(canvas: HTMLCanvasElement, options?: { playing?: boolean; style?: "glyphs" | "squares" }): RainMount;
export const rain: {
  play(): void;
  pause(): void;
  /** The user's switch, remembered across visits. */
  toggle(): void;
  /** Work started or finished; respects the user's explicit on or off. */
  busy(isBusy: boolean): void;
};

/* FPS */
export const fps: {
  readonly value: number;
  subscribe(listener: (value: number) => void): () => void;
};

/* Ornaments */
export const ORNAMENT_STYLES: Record<"blocks" | "dust" | "circuit", { cell: number; metric: string; falloff: number; merge: number; mix: number[] }>;
export function ornamentShapes(options?: {
  size?: number;
  width?: number;
  edge?: boolean;
  color?: string;
  seed?: number;
  strength?: number;
  style?: "blocks" | "dust" | "circuit";
}): string;
export type OrnamentArtStyle = "contours" | "lattice" | "waveform" | "dashed" | "book" | "stack";
export const ORNAMENT_ART: Record<OrnamentArtStyle, { crisp: boolean; figure: boolean; gain: number }>;
export function ornamentArt(options?: {
  style?: OrnamentArtStyle;
  size?: number;
  width?: number;
  edge?: boolean;
  center?: boolean;
  right?: boolean;
  bottom?: boolean;
  color?: string;
  seed?: number;
  strength?: number;
}): string;
export function paintOrnaments(element: HTMLElement): void;

/* Art, mascots and scenes */
/** A pixel piece: each layer is rows of cells ("#" ink, "+" mid, ":" faint, "o" signal/tone, "." empty). */
export interface ArtPiece {
  w: number;
  h: number;
  layers: Record<string, string[]>;
}
export type MascotMood = "idle" | "calm" | "happy" | "curious" | "focused" | "sleepy" | "alert" | "offline";
/** @deprecated use MascotMood */
export type IrisMood = MascotMood;
export type MascotName = "iris" | "eagle" | "squirrel" | "elephant" | (string & {});
/** A character on the 15 by 15 grid. See src/js/art-mascots.js for the cell format. */
export interface Mascot {
  label: string;
  body: string[];
  ground?: string[];
  busy?: "scan" | "alt";
  alt?: string[];
  /** Full faces (11 by 7, "e" eyes, "m" mouth) placed at `face`, as IRIS has. */
  face?: [number, number];
  faces?: Partial<Record<MascotMood, string[]>>;
  /** Eye centres: two for a front view, one for a profile facing right. */
  eyes?: [number, number][];
  mouth?: [number, number] | null;
  flipMarks?: boolean;
}
export const ART: Record<string, ArtPiece>;
export const ART_SETS: { tech: string[]; nature: string[] };
export const MASCOTS: Record<string, Mascot>;
export const MASCOT_MOODS: MascotMood[];
/** @deprecated use MASCOT_MOODS */
export const IRIS_MOODS: MascotMood[];
/** SVG markup for a piece, by name or as a piece. */
/** Draws every [data-sd-art] and [data-sd-mascot] under root (init() does this). */
export function initArt(root?: ParentNode): void;
export function artSVG(piece: string | ArtPiece): string;
/** One merged run of cells: `signal` cells take the tone, the rest are ink at `opacity`. */
export interface ArtRect {
  x: number;
  y: number;
  width: number;
  signal: boolean;
  opacity: number;
}
/** A piece as data, for frameworks that render their own elements: the rects artSVG draws, per layer. Null for an unknown name. */
export function artRects(piece: string | ArtPiece): { w: number; h: number; layers: { layer: string; rects: ArtRect[] }[] } | null;
/** Register a piece for data-sd-art="name": an array of rows, or named layers. */
export function defineArt(name: string, rows: string[] | Record<string, string[]>): ArtPiece;
/** Register a mascot for data-sd-mascot="name". */
export function defineMascot(name: string, mascot: Mascot): Mascot;
/** A mascot as SVG markup, for frameworks that render it themselves. */
export function mascotSVG(name?: MascotName, mood?: MascotMood): string;
/** IRIS as SVG markup. */
export function irisSVG(mood?: MascotMood): string;
/** Set a mascot's mood (writes data-mood, redraws the face, fires sd:mascot). */
export function setMood(element: HTMLElement, mood: MascotMood): void;
/** Swap the character; the mood stays (writes data-sd-mascot, fires sd:mascot). */
export function setMascot(element: HTMLElement, name: MascotName): void;
/** Turn a mascot's eyes by -1, 0 or 1 cells (sets --sd-mascot-x and --sd-mascot-y). */
export function lookAt(element: HTMLElement, x?: number, y?: number): void;

/* Scrollbars */
export function setScrollbars(mode?: "auto" | "always"): void;
/**
 * The auto-hiding scrollbars without `init()`: sets `data-sd-scrollbars` on
 * `<html>` and starts the scroll listener once. Safe to call again to change
 * the mode, and beside React, since it writes only that attribute and
 * `data-sd-scrolling` on whatever scrolls. Does nothing without a `document`, and
 * `signal-design/js` imports in Node, so a client entry that is also run on the server does not throw. Default "auto".
 */
export function initScrollbars(mode?: "auto" | "always"): void;

/* On-screen keyboard */
/**
 * Keeps a full-height app in view while the phone keyboard is up: sets
 * `data-sd-keyboard`, `--sd-view-height` and `--sd-view-top` on `<html>`, and
 * `sd-shell` fits the part of the screen above the keyboard. `init()` calls
 * it; a framework app can call it on its own, since it writes only those.
 * Does nothing without `visualViewport`.
 */
export function initKeyboard(): void;

/**
 * Let every hover shimmer play to the end, and anything with
 * `data-sd-sweep="hold"`: it sets `data-sd-sweeping` on pointerover and
 * clears it when the sweep ends. `init()` calls it; a framework app can call
 * it on its own, since it writes only that attribute.
 */
export function initSweep(): void;

/* Listboxes: palette and combobox */
export interface PaletteOption {
  label: string;
  hint?: string;
  group?: string;
  href?: string;
  keywords?: string;
  run?: (event: MouseEvent) => void;
}
export function setOptions(palette: HTMLDialogElement, options: PaletteOption[]): void;
export function filterList(list: HTMLElement, query: string): number;

/* Charts */
export function drawSpark(element: HTMLElement): void;

/* Events the library dispatches */
declare global {
  interface HTMLElementEventMap {
    "sd:living-table": CustomEvent<LivingTableState>;
    "sd:countdown": CustomEvent<CountdownState>;
    "sd:feed": CustomEvent<FeedState>;
    "sd:machine": CustomEvent<MachineEvent>;
  }
  interface DocumentEventMap {
    "sd:living-table": CustomEvent<LivingTableState>;
    "sd:countdown": CustomEvent<CountdownState>;

    "sd:feed": CustomEvent<FeedState>;
    "sd:machine": CustomEvent<MachineEvent>;
    "sd:theme": CustomEvent<{ theme: Theme }>;
    "sd:font": CustomEvent<{ font: Font }>;
    "sd:shell": CustomEvent<{ sidebar: "pinned" | "collapsed"; aside: "open" | "closed"; drawer: boolean; section?: string; width?: number }>;
    "sd:window": CustomEvent<{ action: "minimize" | "maximize" | "close" }>;
    "sd:reaction": CustomEvent<{ on: boolean }>;
    "sd:spoiler": CustomEvent<{ open: boolean }>;
    "sd:cw": CustomEvent<{ open: boolean }>;
    "sd:contextmenu": CustomEvent<{ target: HTMLElement }>;
    "sd:tab": CustomEvent<{ tab: HTMLElement }>;
  }
}
