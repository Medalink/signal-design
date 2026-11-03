### Fixed
- On phones, choosing a page link in the drawer's rail (`sd-rail-item` or
  `sd-rail-home` with an `href`) now closes the drawer, in `init()` and in the
  React `RailItem` and `RailHome`. A rail item with `data-sd-section` still
  only opens its sidebar panel. Apps no longer need `data-sd-shell="close"` on
  every rail link.
