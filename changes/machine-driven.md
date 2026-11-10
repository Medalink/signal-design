### Added
- `sd-machine` driven mode: a spec with `driven: true` starts nothing by
  itself, and the host draws its own events with `machine.emit()`,
  `machine.start()`, `machine.finish()` and `machine.land()`, naming tokens
  by a key it picks. `instant: true` draws what is already true without a
  glide, and a driven hold's progress follows `hold` as an estimate until
  `finish()`. A line dot judged failed stays failed when another node judges
  it done.
