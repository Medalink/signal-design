### Fixed
- `sd-chip`: the remove button's press box is 24px square (44px on a coarse
  pointer) around its 16px glyph. The chip keeps its size on a mouse and is 44px
  tall on a phone, where it was 52px.
- `sd-check-bare`: a bare checkbox or radio is its label's whole target, so the
  label is 24px square (44px on a coarse pointer) with the 16px box centered.
  The box sits 4px further in than before.
- `sd-message-edit-hint`: the Esc and Enter keys are 24px tall targets that keep
  the hint's line height.
