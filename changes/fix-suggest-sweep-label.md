### Fixed
- A hovered or keyboard-active suggest row (commands, mentions) no longer
  loses its label: the row's fill used the `background` shorthand, which
  wiped the hover shimmer's text-clipped `background-image` and left
  `-webkit-text-fill-color: transparent` painting nothing. The fill is
  `background-color` now, so the shimmer and the tint compose.
