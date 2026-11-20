### Fixed
- `sd-machine`: a linked token keeps its drawn size and gains a real 24x24
  hit target (`sd-machine-hit`, the button that carries its name and focus),
  so a machine with several linked tokens in one box passes axe's
  `target-size` rule (WCAG 2.2 AA) instead of failing on its small token.

### Changed
- `sd-machine`: where the engine picks the slot grid itself, it keeps token
  slots (and queued tokens at a port) at least 24px apart, so crowded linked
  tokens' hit areas never overlap; a node too small to hold its capacity at
  that pitch keeps today's layout.
