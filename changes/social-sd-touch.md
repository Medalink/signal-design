### Fixed
- Icon buttons are 44 by 44 px on a coarse pointer. `sd-icon-btn` measured 36 by
  40, so the Remove and Mark read buttons in `sd-item-actions` were hard to hit.
  The same floor now covers `sd-btn-icon` (the composer buttons, the link card
  dismiss, `sd-voice-play`) and `sd-voice-speed`; a chip's dismiss button keeps
  its 16 px glyph and gains a transparent 44 by 44 hit area. A new `--sd-hit`
  token holds the 44 px. A mouse keeps the desktop sizes.
