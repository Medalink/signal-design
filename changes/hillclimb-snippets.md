### Fixed
- `data-sd-edges` keeps the element's own border under its glow, so an edged box's sides never fall below its real edge, reduced motion included.
- Paper's `--sd-line-control` is `#858585`, 3:1 on the shell background too.
- A message author's name and a quoted author take a 40px target on a coarse pointer without changing the line's height.
- Schedule labels keep 4.5:1 on a selected or conflicting row and on spectrum blocks: they lean 30% toward `--sd-fg`.
- On a coarse pointer, window controls keep the title bar's height, message action buttons stay square at 40px, and an inline `sd-message-author` button takes a 40px target without changing its line.
- The resize handles' 24px targets sit 12px each side of their line.
