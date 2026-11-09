### Fixed
- A hovered message-menu item no longer loses its label: the hover fill used
  the `background` shorthand, which wiped the shimmer's text-clipped
  `background-image` and left `-webkit-text-fill-color: transparent` painting
  nothing. The fill is `background-color` now, so the shimmer and the hover
  tint compose; the danger item's hover fill too.
