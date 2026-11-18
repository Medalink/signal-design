### Fixed
- `mountMachine`: on a touch screen, a machine with pressable nodes (`select:
  true` or a node `link`) no longer shrinks to half size to fit the board. It
  stays at full size and the board scrolls, so a finger can hit a node and its
  labels stay readable. `minScale` still wins when set.
