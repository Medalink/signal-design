### Fixed
- `sd-machine`: a node's accessible name is now the text it shows (its
  `label`, `meta`, note and a checks node's chips), falling back to its id
  when it shows nothing, so it passes Label in Name (WCAG 2.5.3).
- The docs rail tiles, topbar search and link-card examples name their
  controls from their visible text (Label in Name, WCAG 2.5.3), caught by
  axe-core 4.14's default-on `label-content-name-mismatch` rule.
