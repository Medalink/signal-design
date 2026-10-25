### Added
- `Sheet side="bottom"` and `sd-sheet-bottom`: a bottom sheet as wide as the screen and as tall as its content up to `--sheet-max` (default 85dvh).
- `DialogHeader closeLabel`: the × button's accessible name, default "Close".
- `Manuscript wrapRef`: a ref to the scroller element around the page (`ref` still reaches the page).
- `Mark kind="find"` and `kind="check"`: a find match is a grey fill and a check match a dashed underline. The current one (`active`, `aria-current`) adds an outline and a heavier line, so it does not depend on color.
- `sd-weighted` and React `WeightedBar`: a bar of segments sized by weight toward a goal. A segment is `drafted`, `current` (outlined) or `planned`, and a trailing `open` segment is what is left to the goal.
- An icon set of 46 square-cap line icons on the 24 grid (history, text formatting, lists, alignment, comment, sparkle, person and account, object and place, edit and delete, copy, external link, sync, warning, chevrons and more). `signal-design/js/icons` exports `ICONS`, `ICON_NAMES` and `icon(name, label?)`, which returns the markup; React gets `<Icon name label>` with `IconName` typed. The component page lists every icon.
- `TreeItem actions`: rename, delete and the like on a tree row. Each action runs from its `key` while the item has focus (`aria-keyshortcuts` lists them) and has a pointer button in the row that is hidden from assistive technology and out of the tab order, so no interactive content sits inside the treeitem. When an action removes the focused item, focus goes to the nearest enabled one.
- `sd-gutter-block`, `sd-gutter-marker` and React `GutterBlock` and `GutterMarker`: a square button in the page margin, level with a block's first line, for a comment or suggestion attached to the block. `kind="suggestion"` draws a dashed edge, `active` (`aria-current`) a heavier edge and a tint of the accent, `resolved` a faint one, and `side="start"` the other margin.

### Changed
- Every optional prop in `signal-design/react` types is `prop?: T | undefined`, so a caller can pass `tone={undefined}` under `exactOptionalPropertyTypes`. `check.mjs` compiles a strict consumer with that option and fails on an optional property that lacks `| undefined`.
