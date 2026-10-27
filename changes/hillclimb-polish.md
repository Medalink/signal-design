### Fixed
- An `sd-meta` status line that wraps no longer starts its next line with a separator dot.
- Selecting an `sd-table` row no longer pushes its first cell sideways: a table whose rows carry `aria-selected` keeps room for the edge on every row and the header. React `TableRow selected={false}` now renders `aria-selected="false"`.
