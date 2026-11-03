### Changed
- `sd-flow` on phones (40rem and narrower): no stage is narrower than
  `--stage-w-min` (15rem), whatever `--stage-w` an app sets inline, so a stage
  head has room for its name, meta and count.
- A stage head keeps its name whole and shortens the meta and count first,
  instead of cutting the name to "A…".
