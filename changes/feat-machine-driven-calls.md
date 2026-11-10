### Added
- `sd-machine`: a driven machine can say how a node looks and what happened to
  a token. `machine.set(id, { tone, frozen, label, meta })` retones, freezes
  (muted, dashed) and renames a node live; a `checks` node takes
  `set(id, { items })` to rebuild its chips, `keep: true` to leave a finished
  run's chips until the next run, and a finish outcome with
  `items: { name: "done" | "failed" | "skipped" }` to set chips by name (the
  failed step lights red), with `{ outcome: "fail", items }` adding to a named
  outcome. `machine.status(key, status)` retones a held or moving token (a
  stalled run), `machine.fold(key, intoKey)` glides one token into another and
  merges the counts, and `machine.clear()` empties tokens, dots and counts for
  a replay. A `sink` shows `set(id, { value })` with the flip (a release tag),
  and `machine.emit()` on a sink sends a copy down each of its wires.
- `sd-machine`: a `link` on a node, or on a token passed to `machine.start()`,
  makes it a button; a click or Enter fires an `sd:machine` event
  `{ type: "open", node, key, link }` and the host decides what to open.
