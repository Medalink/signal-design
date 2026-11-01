### Added
- React `Art`: a pixel art piece drawn as React elements, with `tone`,
  `muted`, `flip` and `label`, so a React app needs no `initArt()` and no
  markup strings. `artRects()` from `signal-design/js` gives any framework the
  same rects `artSVG()` draws.

### Fixed
- A chart destroyed in the frame after a theme change no longer repaints and
  throws: the queued theme repaint is cancelled on `destroy()`.
