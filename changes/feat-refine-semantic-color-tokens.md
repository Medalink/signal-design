### Changed
- Paper: tone outlines (`sd-badge`, `sd-note`, toned `sd-btn`) are 20 points
  stronger and tone tints under plain text (`sd-mark`, `sd-diff`, the gutter
  marker) 4 points stronger, through the new `--sd-outline-boost` and
  `--sd-tint-boost` tokens (0% in ink and graphite). A toned button's hover
  fill keeps 8%, so its text stays at 4.5:1.
- `warning` is a deeper orange (`#ff6a00`, paper `#ad3f00`) and `pending` a
  gold (`#ffb800`, paper `#7a5c00`): 18° apart in hue in ink and graphite
  (was 8°) and 23° in paper (was 13°). Every role still reads at 4.5:1 on
  canvas, surface and raised in all three themes.
- Pending reads apart from warning without color: a pending `sd-dot` (with no
  `data-shape`) and `sd-status` square is ringed with a centre pip, and a
  pending `sd-badge` has a dashed edge.
- Selection markers are `accent`: the bar beside the current `sd-rail-tile`,
  the edge and corner of a chosen `sd-option`, and a 2px start edge on the
  command palette's active result. Nav links, tabs and focus rings stay `fg`.
- Spectrum charts: categorical series `--sd-chart-1…6` are cyan, violet,
  light grey, blue, fuchsia and mid grey, so no category looks like success,
  danger, warning or pending. A marker with `tone: "warning"` draws in the
  warning orange instead of the pending amber, in mono and spectrum.
