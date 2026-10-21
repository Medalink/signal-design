### Added
- `sd-schedule`: a resource schedule grid — a roster over hours with a
  resource column, hour plot, `data-status` blocks (`driving`, `planned`,
  `proposed`, `completed`, `conflict`, unmarked off duty), a now line and
  a legend. Blocks, grid, ticks and the now line share one `--start`/`--end`
  hour scale. Rows hover on `--sd-raised`, conflicts tint on
  `--sd-chart-alert`, and `data-chart-theme="mono|spectrum"` switches the
  whole board black/white or full palette via the chart tokens.
