### Fixed
- `sd-flow-board` fades its right edge while stages run past it, and the fade is gone once scrolled to the end
  (browsers with scroll-driven animations; others show the plain edge).
- `sd-dialog-head`: a close button (`data-sd-close`, or the React `DialogHeader` icon button) has a 32px target at
  every size class; the head keeps its height.
