### Fixed
- The warm-window hover check survives the same one-off WebKit hiccup the
  Escape sequence already re-runs for: the pointerleave that starts the
  window's 300 ms can arrive so late that the hover lands inside it. The
  hover re-runs, and a hover that always shows a tip still fails.
