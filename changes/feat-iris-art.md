### Added
- `data-sd-ornaments-style="circuit"`: ornaments as circuit traces (square
  runs on the grid that end in pads, with vias), in any corner or edge.
- `sd-art` + `data-sd-art`: pixel art pieces in the theme's ink. Fifteen tech
  pieces (router, switch, server, database, chip, signal, wifi, mast,
  battery, globe, packet, terminal, laptop, shield, gear) and sixteen nature
  pieces (pine, oak, sprout, mountain, sun, moon, cloud, birds, rock, grass,
  flower, mushroom, acorn, leaf, waves, signpost), with `data-tone` on their
  signal cells, `data-flip`, `ART_SETS` and `defineArt()`.
- `sd-mascot` + `data-sd-mascot`: mascots that share eight moods
  (`data-mood`) and one behavior: IRIS, the watcher, and an eagle, a squirrel
  and an elephant. Eyes follow the pointer, a press hops, `aria-busy` runs
  each one's loop (IRIS scans, the eagle beats its wings, the squirrel swishes
  its tail, the elephant flaps its ears), and a rare blink. `setMascot()`,
  `setMood()`, `lookAt()`, `mascotSVG()`, `defineMascot()` and the
  `sd:mascot` event drive it from code. `sd-iris` + `data-sd-iris` is IRIS
  shorthand. `initArt(root)` draws pieces and mascots a framework rendered later.
- `sd-art-scene`: pieces and a mascot placed on one cell grid that scales in
  whole pixels, with `sd-art-horizon` for the ground line.
- Showcase: an Art page with the mascots, their moods and sizes, both piece
  sets, six scenes with a mascot swap, circuit ornaments and an empty state.
