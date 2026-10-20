### Fixed
- `sd-message-body`: the content column is `minmax(0, 1fr)`, so a long
  unbroken author name no longer widens the row past its container.
- `sd-message-head > b` and `sd-reply > b`: author names truncate with an
  ellipsis (at most 60% and 40% of the row) instead of overflowing; the reply
  name was `flex-shrink: 0`.

### Changed
- `sd-message[data-mention]` and `[aria-current]` no longer share a fill with the
  pane or with each other: they use new tokens `--sd-mention-fill` (7% of the
  text color) and `--sd-current-fill` (10%), defined in every theme and
  readable on both `--sd-canvas` and `--sd-surface`. Secondary text on those
  rows is lifted from `--sd-fg-faint` to `--sd-fg-subtle` to keep 4.5:1.
  `data-own` and `data-selected` are unchanged.

### Added
- `sd-panel-wide` (capped at 1024px) and `sd-panel-fluid` (no cap) for
  settings-style pages; `sd-panel` stays at 560px.
- `sd-seg-wrap`: a segmented control whose items flow onto more rows in a
  narrow container. A plain `sd-seg` still keeps one row.
- `sd-kv-plain`: key-value keys in sentence case that truncate with an
  ellipsis instead of widening the grid. `sd-kv` keeps its small-caps keys.
- `sd-sidebar-head-sm`: a 16px title step (the default is 18px) for a sidebar
  head with an action or a longer title, such as "Direct Messages" in a 240px
  sidebar.
