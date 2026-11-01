### Fixed
- `sd-message`: a tap on a touch screen no longer tints the row, reveals its `sd-message-actions` bar or swallows the first tap on a button inside it (a thread chip took two taps on iOS). The `:hover` reveal now applies under `@media (hover: hover)`; `:focus-within` and `data-hover` still show the bar, and `sd-reactions-add` stays visible where nothing hovers.
