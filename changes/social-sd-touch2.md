### Changed
- On a coarse pointer every control is now at least 44px tall: `--sd-touch` is
  `--sd-hit` (44px) there, and stays 40px for a mouse. `sd-btn`, `sd-seg`,
  `sd-pill`, `button.sd-chip`, `.sd-message-actions` and the rest that used
  `--sd-touch` follow. Desktop geometry is unchanged.
- `sd-emoji-grid` on a coarse pointer fills its row with as many 44px cells as
  fit (it was a fixed eight columns), so the grid does not overflow its panel.
