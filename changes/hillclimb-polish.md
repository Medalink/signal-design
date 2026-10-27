### Fixed
- An `sd-meta` status line that wraps no longer starts its next line with a separator dot.
- Selecting an `sd-table` row no longer pushes its first cell sideways: a table whose rows carry `aria-selected` keeps room for the edge on every row and the header. React `TableRow selected={false}` now renders `aria-selected="false"`.
- Fields side by side in an `sd-form-row` keep their controls at the same height when one field's hint wraps; `sd-field` no longer stretches its control.
- `sd-number` is as tall as an input: its step buttons no longer add the large text line height.
- The remove button in an `sd-chip` is centered on the chip's text.
- A field whose control has `aria-invalid="true"` reddens its label, as `data-invalid` and `:user-invalid` already did.
