### Fixed
- Windows contrast themes (`forced-colors: active`) no longer hide state. The
  system repaints every fill and drops every shadow, so a pressed segment, the
  current sidebar link, the selected tab and a ticked checkbox looked like their
  neighbours. The selected, pressed or current item now takes the system
  selection colors (`Highlight`, `HighlightText`) in `sd-seg`, `sd-chip`,
  `sd-btn` and `sd-icon-btn` with `aria-pressed`, `sd-tabs`, `sd-nav`,
  `sd-sidenav`, `sd-sidebar-link`, `sd-rail-item`, `sd-item`, `sd-pagination`,
  `sd-reactions`, the emoji picker, `sd-grid-picker`, a selected table or tree
  row, and the focused or active row of an `sd-menu`. A chosen `sd-poll-option`
  and a selected `sd-message` take a `Highlight` frame; the current
  `sd-rail-tile`, `sd-row`, step and option card show their marker.
- In a contrast theme a checkbox shows its tick or dash, a radio its inner
  square and a switch its thumb; a slider shows its track and thumb, and
  `progress` and `meter` show a framed track with the value filled. They were
  blank boxes, and the slider and progress bar were invisible.
- `sd-sidebar-link`, `sd-sidenav` rows and `sd-item` no longer all show the
  current-item edge in a contrast theme.

Nothing changes outside forced colors: every rule is in
`src/components/contrast.css` under `@media (forced-colors: active)`.
