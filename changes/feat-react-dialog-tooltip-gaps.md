### Changed
- React `DialogHeader` renders its title as an `h2` instead of a `span`, so the dialog has a heading for a screen reader, and `aria-labelledby` still points at it. `as` picks another level (`as="h3"`) or the old plain element (`as="span"`). The new `.sd-dialog-title` class resets the heading's type, margin and case, so the title looks exactly as it did.
- React `Dialog` always writes an `id` on its `<dialog>`: the one you pass, or a generated one.

### Fixed
- `autoFocus` now works inside a React `Dialog`. React focuses an `autoFocus` field as it mounts, which a closed `<dialog>` cannot take, so the browser fell back to the first focusable element. A dialog now opens with focus on the first element inside it that has `autoFocus` or `data-autofocus`, whether it mounts open, opens later, or remounts under `unmountOnClose`. `Button`, `IconButton`, `Input`, `Textarea`, `Select`, `Combobox`, `Checkbox` and `Switch` write `data-autofocus` when given `autoFocus`; with neither attribute the browser's default holds.
