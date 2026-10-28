### Fixed
- Ornaments in a scrolling box no longer push its rows down when the box has a spacing utility such as `space-y-*`. The sparkle layer is the first child of a scroller, and the utility gave it a margin; it now always has none.
