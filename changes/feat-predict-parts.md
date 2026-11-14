### Added
- `sd-rail-tile`, `sd-thread-chip`, `button.sd-shot` and `[data-sd-open]` get
  `sd:predict` with no attribute, so an app can load a group, a thread's
  replies, a full image or a dialog's content before the click.
  `data-sd-predict="off"` on a target or an ancestor opts out.
