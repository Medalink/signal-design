### Fixed
- `sd-message-body`: the content column is `minmax(0, 1fr)`, so a long
  unbroken author name no longer widens the row past its container.
- `sd-message-head > b` and `sd-reply > b`: author names truncate with an
  ellipsis (at most 60% and 40% of the row) instead of overflowing; the reply
  name was `flex-shrink: 0`.
