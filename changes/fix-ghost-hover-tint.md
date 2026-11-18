### Fixed
- `sd-btn-ghost`: the hover fill is a 6% `--sd-fg` tint over whatever the
  button sits on, so it shows on a raised card (`--sd-tone-3`) and on a toolbar
  where `--sd-raised` was the same grey or one faint step off. The composer's
  icon buttons take the same tint, and a dismiss or play button over link-card
  media keeps an opaque fill on hover.
