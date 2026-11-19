### Fixed
- `sd-key` and `sd-heatmap-key` swatches show their colors: the chart tokens now reach the legends, not only the
  charts, in mono and spectrum on every theme.
- `createChart` with `type: "hbar"` widens its category axis to the longest label, so a narrow ranking chart no
  longer cuts off the start of a long label.
