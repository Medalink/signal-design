### Fixed
- The React overlays check survives a one-off WebKit hiccup that shows a tip
  inside the warm window: the Escape sequence re-runs, and a run that never
  waits still fails.
- Running the check alone no longer fails the tooltip hovers in WebKit: the
  standalone runner injects the render-whole style the sweep adds, without
  which WebKit will not scroll a skipped content-visibility demo into view.
