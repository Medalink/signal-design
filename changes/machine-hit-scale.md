### Fixed
- `sd-machine`: a linked token's 24x24 hit area no longer shrinks with the
  canvas. A board whose only pressable parts are linked tokens counts as
  pressable, so a touch screen keeps it full size and scrolls, and on other
  pointers the canvas never scales below 24 divided by the closest rest pitch
  between two linked tokens, so two hits stay 24px apart on screen (WCAG 2.2
  `target-size`). The host's `minScale` still wins.

### Changed
- `sd-machine`: `machine.clear()` re-scales the emptied board, which can
  shrink again once its last linked token is gone.
