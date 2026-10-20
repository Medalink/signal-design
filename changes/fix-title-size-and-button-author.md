### Fixed
- `sd-sidebar-title` takes its size from its head (`font-size: inherit`), so
  on an `h2` the base heading size no longer overrides `sd-sidebar-head-sm`.
- `sd-message-head > b` and `sd-reply > b`: an author rendered as a `button` or
  `a` inside the `<b>` now truncates with an ellipsis. `<b>` clipped the
  atomic inline-block without one.
