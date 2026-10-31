### Fixed
- `sd-message-menu`: on a coarse pointer each row is at least `--sd-touch`
  (44px) tall. They stayed at 34px because the menu's own row rule outranked
  the touch rule.
