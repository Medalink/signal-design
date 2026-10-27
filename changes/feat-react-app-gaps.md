### Added
- `initScrollbars(mode)` in `signal-design/js`: turns on the auto-hiding scrollbars without `init()`. It sets `data-sd-scrollbars` on `<html>`, starts the scroll listener once however often it is called, and is safe beside React.
- `anchor` on `PopoverContent` and `MenuContent`: open a panel at a `{ x, y }` point, a rect, or an element or object with `getBoundingClientRect`, with no trigger. A context menu keeps the pointer in state and passes it as `anchor`. The corner sits on the point. The menu flips or shifts at the viewport edge and then overlaps the point by a few pixels, so a menu opened on mouse down is not light dismissed by the release. Light dismiss, Escape, the arrow keys and focus return all work. `place()` takes the same anchors.
- `Tooltip` props `delay` (milliseconds the pointer must rest before the tip shows; focus shows it at once), `className` (added to the tip) and `onOpenChange`.
- `Switch` and `Checkbox` can go without a `label` when `aria-label` or `aria-labelledby` names them. They render no text span and are only as wide as the control. `CheckboxProps` is unchanged, an interface with a required `label`; `BareCheckboxProps` is the bare shape and `SwitchProps` covers both, and both are exported.
- `Dialog` prop `unmountOnClose`: mounts the children only while the dialog is open and drops them after the fade-out. The default still keeps them mounted.

### Changed
- `ToastProvider`'s `.sd-toaster` and `Tooltip`'s tip are manual popovers, so they paint above an open modal `<dialog>`. Their look is unchanged. A toast called while a dialog is open lifts the region above it. A toast over a modal can be read but not used: the page behind a modal is inert, so a click on a toast lands on the dialog (a centered `Dialog` closes on it unless it is `static`, a `Sheet` ignores it), and its action and hover hold work only once the dialog closes.

### Fixed
- `place()` no longer throws when the element or the anchor is null.
- A `Dialog` with no `DialogHeader` no longer writes an `aria-labelledby` that points at nothing, and a passed `aria-label` now names a dialog that has a header.
