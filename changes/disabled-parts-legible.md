### Fixed
- Disabled plain buttons (no class, not directly inside a Signal part),
  `sd-seg` items, `sd-option` cards, `sd-number` steppers, `sd-chip`,
  `sd-pill` and `sd-tabs` tabs keep their label at `--sd-fg-faint`
  (4.5:1 or better in ink, graphite and paper) instead of fading to 35% or
  50% (about 1.7:1 to 2.4:1). Plain buttons, chips, pills and options also
  drop their fill; a pressed `sd-seg` item or chip keeps its edge. Other
  parts keep the 35% fade as a fallback.
