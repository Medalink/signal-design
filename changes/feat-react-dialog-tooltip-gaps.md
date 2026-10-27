### Changed
- React `DialogHeader` renders its title as an `h2` instead of a `span`, so the dialog has a heading for a screen reader, and `aria-labelledby` still points at it. `as` picks another level (`as="h3"`) or the old plain element (`as="span"`). The new `.sd-dialog-title` class resets the heading's type, margin and case, so the title looks exactly as it did.
