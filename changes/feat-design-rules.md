### Changed
- Gradients are allowed. `signal-design check` no longer fails a CSS gradient,
  as a background or as a mask, and the shell's crumb and action bars fade out
  at their ends again.

### Fixed
- On a touch screen the rail's search item no longer shows "Ctrl K". The
  coarse-pointer rule that hides a shortcut hint now covers a `kbd` directly in
  `.sd-rail-item`, and a rail label that holds only a hint is hidden whole. The
  library pages label that item "Go to a page" and add `aria-keyshortcuts` where
  the page owns Ctrl K. The rule moved from `navigation.css` to `touch.css`.
- The form example's found-server and found-agent rows show a "Model" label over
  their model control, and the agent field's placeholder reads "Optional".
