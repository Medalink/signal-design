### Changed
- `sd-rain` clears each frame before painting its background, so a
  transparent `--sd-shell-bg` draws rain over whatever is beneath (a camera
  in an OBS overlay) without smearing.
