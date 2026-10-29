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
  themes and is not the value of any `--sd-*` token in any theme, on a text,
  background, border or outline. The rule is `color`. Every element with
  `data-theme` flips along with `<html>`, so a themed subtree or an app root is
  checked too. Tints of a token and a person's `--who` and `--edge` pass. A hex
  copied from a token's value passes; the rule cannot tell it from the token.
- `signal-design check` now fails navigation and headings (`h1`-`h6`, `nav a`,
  sidebar links, rail items, tabs, breadcrumb links, and an icon in one) whose
  text color is a signal role. The rule is `nav-color`. Status inside a
  `data-tone`, badge, count, dot or status, and a person's `--who`, pass.
- `signal-design check` now fails a view with more than one visible
  `sd-btn-primary`. The view is the page, or the open dialog or popover the
  button is in. The rule is `primary`; a gallery that shows variants takes
  `data-sd-check-ignore="primary"`.
- `signal-design check` now fails a visible text field or textarea whose only
  name is its placeholder: it has a placeholder and no `<label>`, `aria-label`,
  `aria-labelledby` or `title`. The rule is `label`. axe accepts a placeholder
  as a name; WCAG 3.3.2 does not, because it disappears when the user types.
  The two size demos on the Fields page now have labels.
- The gate is stricter. A project that passed `signal-design check` before can
  fail now on `type`, `color`, `nav-color`, `primary` or `label`. `--skip <rule>`
  or `data-sd-check-ignore="<rule>"` is the way out while the project fixes it.
- Every finding starts with its rule, so the text changed: `console error:` is
  now `console:`, `horizontal overflow Npx` is `overflow: Npx wider than the
  window`, `font not loaded` is `fonts: not loaded`, and `a11y <id>` is
  `a11y: <id>`. A script that matches the old text needs the new.

### Added
- `signal-design check` names the rule in every finding: `corners`, `shadows`,
  `type`, `color`, `nav-color`, `primary`, `label`, `overflow`, `fonts`,
  `console`, `a11y`. `--skip <rule,...>` (or `--skip=<rule,...>`, repeats add
  up) turns rules off for a run, and an unknown name exits 2 with the list. An
  element with `data-sd-check-ignore="<rule> ..."` is exempt from those rules,
  itself and what it holds.

### Fixed
- On a touch screen the rail's search item no longer shows "Ctrl K". The
  coarse-pointer rule that hides a shortcut hint now covers a `kbd` directly in
  `.sd-rail-item`, and a rail label that holds only a hint is hidden whole. The
  library pages label that item "Go to a page" and add `aria-keyshortcuts` where
  the rail's search owns Ctrl K (a page with its own command palette keeps the
  key for it). The rule moved from `navigation.css` to `touch.css`.
- The form example's found-server and found-agent rows show a "Model" label over
  their model control, and the agent field's placeholder reads "Optional".
