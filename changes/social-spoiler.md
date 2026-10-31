### Added
- `sd-spoiler`: inline text in a message behind a solid block until the reader opens it. `aria-expanded` is the state, closed text is out of selection, find and screen readers, and a faint fill marks it once open. `data-sd-spoiler` wires click, Enter and Space and fires `sd:spoiler`; React gets `Spoiler` (`open`, `defaultOpen`, `onOpenChange`, `label`). New label `spoiler.label`.
