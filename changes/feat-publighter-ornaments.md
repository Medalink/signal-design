### Added
- Art ornaments, drawn from Publighter's imagery: name a style next to the placement in `data-sd-ornaments` (`contours`, `lattice`, `waveform`, `dashed`, `book`, `stack`) and that picture replaces the dust. Still, 1px lines and small squares in the theme's text color, kept no louder than the dust (the README lists the contrast budget). `data-sd-ornaments-seed` gives each item its own contours, lattice or waveform.
- `ornamentArt()` and `ORNAMENT_ART` from `signal-design/js`, and the Art ornaments block on the Effects page.
- A check for the art ornaments in Chromium and WebKit: every style, theme and placement renders, is deterministic, adds no node, takes no click, moves nothing, and leaves text its contrast budget.
