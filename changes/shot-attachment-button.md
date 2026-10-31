### Added
- `button.sd-shot` as an image attachment: the border strengthens on hover and focus, and `sd-shot-hint` (a decorative icon) fades in then.
- `sd-shot[aria-busy="true"]` shows `sd-shot-status` (a Downloading chip) and hides the hint; `sd-shot[data-failed]` shows `sd-shot-note` (a danger reason) in place of the media, with a dashed border.

### Changed
- `sd-shot` has `max-width: 100%`, so a frame with a set width never overflows a narrow column.
