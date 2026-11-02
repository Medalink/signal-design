### Fixed
- Hover shimmer: text no longer disappears while a sweep plays on after the
  pointer leaves. Segmented buttons, breadcrumb links and the current sidebar
  and rail items reset their own `background`, which dropped the sweep's
  gradient but kept its transparent text fill.
