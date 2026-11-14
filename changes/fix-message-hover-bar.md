### Changed
- `sd-message-actions`: the bar sits on the row's first line (`top: -3px`, centered on a one-line row) instead of 20px above the row. It no longer covers the last line of the message above. It still covers the right end of the row's own first line when that line reaches it.

### Fixed
- `sd-message-actions`: a mouse or touch press inside a message no longer shows the bar. It shows for a pointer that hovers (`@media (hover: hover)`), for keyboard focus inside the row (`:has(:focus-visible)`, so Tab still reaches every button), while one of its buttons has `aria-expanded="true"`, and for `data-hover`. Before, `:focus-within` showed it as soon as a press focused a control in the row, and the bar took the release of a tap on an author name or a reply quote. A touch-only screen now shows the bar only through `data-hover` or the keyboard.
