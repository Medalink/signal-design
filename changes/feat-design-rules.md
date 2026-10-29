### Changed
- Gradients are allowed. `signal-design check` no longer fails a CSS gradient,
  as a background or as a mask, and the shell's crumb and action bars fade out
  at their ends again.
- Loops are allowed, decoration included. Rule 6 now asks only that transitions
  run 120–200ms.
- `signal-design check` now fails text in a weight other than 400 and 500 (600
  in the reading face), or in a font family that is not `--sd-font-sans`,
  `--sd-font-mono` or `--sd-font-reading` on that element. The rule is `type`.
- `signal-design check` now fails a color that is the same in the ink and paper
  themes and is not the value of any `--sd-*` token, on a text, background,
  border or outline. The rule is `color`. Tints of a token, a person's `--who`
  and `--edge`, and a subtree with its own `data-theme` pass.
- `signal-design check` now fails navigation and headings (`h1`-`h6`, `nav a`,
  sidebar links, rail items, tabs, breadcrumb links, and an icon in one) whose
  text color is a signal role. The rule is `nav-color`. Status inside a
  `data-tone`, badge, count, dot or status, and a person's `--who`, pass.

### Added
- `signal-design check` names the rule in every finding: `corners`, `shadows`,
  `type`, `color`, `nav-color`, `overflow`, `fonts`, `console`, `a11y`. `--skip <rule,...>`
  turns rules off for a run, and an unknown name exits 2 with the list. An
  element with `data-sd-check-ignore="<rule> ..."` is exempt from those rules,
  itself and what it holds.

### Fixed
- On a touch screen the rail's search item no longer shows "Ctrl K". The
  coarse-pointer rule that hides a shortcut hint now covers a `kbd` directly in
  `.sd-rail-item`, and a rail label that holds only a hint is hidden whole. The
  library pages label that item "Go to a page" and add `aria-keyshortcuts` where
  the page owns Ctrl K. The rule moved from `navigation.css` to `touch.css`.
- The form example's found-server and found-agent rows show a "Model" label over
  their model control, and the agent field's placeholder reads "Optional".
