### Fixed
- `sd-voice-wave`: the seek slider is `--sd-touch` tall on a coarse pointer
  (44 px on a phone) instead of 28 px. The bars keep their height: they now size
  from `--wave-h` (28 px), so set `--wave-h` rather than `height` to change it.
