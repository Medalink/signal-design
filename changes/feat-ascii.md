### Added
- `signal-design/ascii`: `mountAscii(el, piece, { at, look, speed })` plays a
  piece from the optional peer `ascii-magic-art` as DOM text in `sd-ascii`.
  Palette colors become three greys by brightness and `data-tone` colors the
  brightest. It is still by default and plays only while the element or its
  closest `[aria-busy]` ancestor is `aria-busy="true"` (or `busy(true)`), on
  screen, in a visible tab and without `prefers-reduced-motion`. The text
  scales to fit its box and never scrolls sideways.
- An ASCII library page with a look switcher, a job that plays its art while it
  runs, a gallery that plays on hover or focus, an empty state and tones.
