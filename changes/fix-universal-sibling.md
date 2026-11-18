### Fixed
- Long lists stop restyling every element when a row is added or removed. Seven spacing rules move from `* + *` to `:not(:first-child)`, with the same matches and specificity: `.sd-md`, `.sd-md blockquote`, `.sd-message-meta`, `.sd-manuscript-page`, `.sd-input-group`, `.sd-hovercard` and the `.sd-meta` separator.
- `.sd-manuscript-page`: the 0.5em gap after `h1`, `h2` and `h3` now applies to the blocks an editor writes (`p`, lists, `blockquote`, `pre`, `figure`, `table`, `hr`, `img`, headings, `section`, `aside`, `details`). A `div` after a heading keeps the page's 1em gap.
