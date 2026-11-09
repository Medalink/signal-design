### Added
- `sd-machine` and `mountMachine(figure, spec)` from `signal-design/js`: a live
  state machine drawn from one JSON spec. Stations (`box`, `press`, `scan`,
  `checks`, `line`, `source`, `sink`, and any kind added with `defineKind()`)
  hold tokens for a while, pick a weighted outcome and send them down
  right-angle wires. Tokens glide with a short trail, wait at a station's
  port, and with `queue: "latest"` fold into the newest waiting token. A node
  with `judge: true` colors the dots of the line its tokens came from. One
  clock drives every frame; it scales with `speed`, stops off screen and in a
  hidden tab, and under reduced motion nothing plays until asked.
  `machine.set(id, patch)` changes a station while it runs and
  `machine.load(spec)` swaps the machine. Status colors follow
  `data-chart-theme`.
- `sd-machine-chain`: static steps joined by arrows, dashed until a
  `data-status` is set.
- A Machine library page, and a Flow example app that runs continuous flow,
  a pull-request loop, the agent-run queue and a kitchen line, with a station
  inspector and a spec editor.
