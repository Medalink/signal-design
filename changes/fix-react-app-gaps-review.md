### Fixed
- A menu opened at a point on mouse down is no longer closed by the release. `place()` keeps a `{ x, y }` point inside the element when it flips above or left of the point or shifts at a viewport edge, overlapping it by 1px (5px above it, which also covers the 4px slide-in), where it used to end exactly at the point and leave the pointer just outside. An explicit positive `offset` still keeps its gap.
- `place()` no longer produces `NaNpx` for a rect with only `left` and `top`; a missing `right` or `bottom` counts as the `left` or `top`.
