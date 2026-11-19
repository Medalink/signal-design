### Fixed
- `sd-btn` disabled (`:disabled` or `aria-disabled="true"`): the label is
  `--sd-fg-faint` on a near-empty fill, with no tone, primary fill or
  hairline, instead of 35% opacity. Contrast goes from about 1.8:1 to 5.6:1
  or better in ink, graphite and paper.
- `sd-rail-item` disabled: the label is `--sd-fg-faint` (5.9:1 or better)
  instead of 35% opacity; its icon alone stays dimmed so the item still
  reads as unavailable.
