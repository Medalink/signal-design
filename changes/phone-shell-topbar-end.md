### Added
- `sd-shell-topbar-end`: a slot at the end of the phone top bar, after
  `sd-shell-topbar-label`, for a status or actions.

### Changed
- On phones, the shell header drops out when its `sd-shell-header-end` is
  marked `sd-desktop-only`, instead of leaving an empty bar and gap. Put the
  same status in `sd-shell-topbar-end`.
- The top bar's `sd-wordmark` is at least 44px square, a touch target.
