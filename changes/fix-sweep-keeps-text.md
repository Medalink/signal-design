### Fixed
- Hover shimmer: an app rule that sets `background` on a link (`.list a:hover { background: … }`) no longer hides the link text while the sweep plays. The sweep's gradient and clip are `!important`; `background-color` stays the app's.
- `sd-uptime`: a `none` cell is a grey square instead of a dashed outline, which disappeared on surfaces close to the line color.
