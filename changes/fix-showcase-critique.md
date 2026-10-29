### Changed
- The docs now say what `accent` does in the CSS: selected, active, now.
  Focus rings and the current item (`aria-current`) have always used `fg`,
  but `AGENTS.md`, the README, the Cursor rule, the token descriptions and
  the color page said accent was for focus. Hard rule 3 now reads "status and
  selection".
- The accent demos in the showcase read "Select" and "Active" instead of
  "Focus" and "Current".
- On phones `sd-breadcrumb` keeps only the current crumb, with no chevron,
  instead of cutting every crumb to its first letter. A trail with no
  current crumb stays whole.
- On touch screens a key hint goes away: a `kbd` inside `sd-btn`, `sd-pill`,
  `sd-marker-end` or a menu item, and a status bar cluster that is only a
  hint. A `kbd` in a sentence or in `sd-shortcuts` stays.
- On phones `sd-row-title` wraps to two lines before it is cut.
- A field's control keeps `5rem` of scroll margin, so focusing it from a
  failed submit leaves its label and message in view.
- The Cursor rule states the type rule as it is: two weights, 400 and 500,
  and families through `font-sans`, `font-mono` and `font-reading`.

### Fixed
- Muted sidebar links and muted item avatars fell to 2.6:1 and 3.9:1. Both
  are now muted by color (`--sd-fg-faint`) instead of opacity and a filter,
  and read at 4.5:1 or better in every theme; a muted link returns to `fg`
  on hover and when current. A muted avatar photo is still shown in grey.
- A checkbox or radio with `aria-invalid="true"` now gets the danger border,
  as `:user-invalid` already did.
- The form example lands a failed submit on the first bad field with its
  label in view, keeps a danger banner with a live count at the top, and
  ties every error to its control with `aria-describedby`.
- The shell, chat and landing examples fit a phone: no stacked window
  chrome on chat, a header menu on the landing, a shorter header on shell.

### Added
- `PRODUCT.md` and `DESIGN.md`: the product record and the visual system
  (tokens in front matter, named rules, components) for design agents, with
  `.impeccable/design.json` as its sidecar.
- Checks: `muted-rows` (contrast of muted rows in every theme),
  `form-errors` (a failed submit, in its own tab) and `phone-chrome`
  (breadcrumb, key hints and row titles on a touch phone).
