### Added
- `sd-schedule`: a resource schedule grid, a roster over hours with a
  resource column, hour plot, `data-status` blocks (`driving`, `planned`,
  `proposed`, `completed`, `conflict`, unmarked off duty), a now line and
  a legend. Blocks, grid, ticks and the now line share one `--start`/`--end`
  hour scale. Each block has one full-text `sd-schedule-label` that ellipsizes
  at rest. Hover or focus reveals a wrapping label over adjacent slots,
  bounded by the track edges, without moving the time bar or resizing rows.
  Focusable static blocks support keyboard and touch access. Labels collapse
  when both hover and focus leave. Rows highlight on `--sd-raised` for hover
  and focus, conflicts tint on `--sd-chart-alert`, and
  `data-chart-theme="mono|spectrum"` switches the whole board black/white
  or full palette via the chart tokens.
