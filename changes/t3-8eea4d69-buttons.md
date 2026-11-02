### Changed
- Every hover shimmer plays to the end after the pointer leaves: buttons,
  tabs, menu items, chips and segmented choices too, not only links.
- The shimmer's band is the text's own color pushed toward `--sd-flash`
  (lighter on dark themes, darker on light) instead of `--sd-flash` itself,
  and the text ahead of it is the same color dimmed instead of
  `--sd-fg-subtle`. A toned button now sweeps in its tone.
