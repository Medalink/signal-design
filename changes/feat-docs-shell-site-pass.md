### Fixed
- `sd-kv`: the key column and the gap no longer claim a fixed 8rem and 24px in a
  narrow list. In a list about 250px wide the values had about 100px left and
  broke inside words (`Tailwin` over `d`); the column now yields to 30% of the
  list and the gap to 6%, and a wide list lays out as before.
