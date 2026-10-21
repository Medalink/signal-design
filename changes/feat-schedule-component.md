### Added
- `sd-schedule`: a resource schedule grid — a roster over hours with a
  resource column, hour plot, `data-status` blocks (`driving`, `planned`,
  `proposed`, `completed`, `conflict`, unmarked off duty), a now line and
  a legend. Blocks, grid, ticks and the now line share one `--start`/`--end`
  hour scale. Labels rest short (a `sd-schedule-more` suffix stays hidden)
  and ellipsize; hovering a block expands it over later slots to read the
  full label, capped at the board end, and collapses on mouse-out. Rows
  hover on `--sd-raised`, conflicts tint on `--sd-chart-alert`, and
  `data-chart-theme="mono|spectrum"` switches the whole board black/white
  or full palette via the chart tokens.
