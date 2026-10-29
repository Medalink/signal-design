/** Names of the icons in the Signal icon set. */
export type IconName =
  | "account"
  | "align-center"
  | "align-justify"
  | "align-left"
  | "align-right"
  | "bold"
  | "bookmark"
  | "check"
  | "chevron-down"
  | "chevron-left"
  | "chevron-right"
  | "chevron-up"
  | "chevrons-left"
  | "chevrons-right"
  | "close"
  | "comment"
  | "contract"
  | "copy"
  | "delete"
  | "edit"
  | "expand"
  | "external"
  | "history"
  | "italic"
  | "link"
  | "list-bullet"
  | "list-number"
  | "menu"
  | "minus"
  | "more"
  | "object"
  | "pause"
  | "person"
  | "place"
  | "play"
  | "plus"
  | "publish"
  | "redo"
  | "search"
  | "sparkle"
  | "strike"
  | "sync"
  | "underline"
  | "undo"
  | "unlink"
  | "view"
  | "warning"
  | "write";

/** The `d` of each icon's path, on the 24 grid, drawn with a 1.5 stroke and square caps. */
export const ICONS: Readonly<Record<IconName, string>>;

export const ICON_NAMES: readonly IconName[];

/**
 * The markup of one icon (an `svg.sd-icon`), ready for `innerHTML`. Without
 * `label` it is decorative (`aria-hidden`); with one it is an image with that name.
 * Throws for a name that is not in the set.
 */
export function icon(name: IconName, label?: string): string;
