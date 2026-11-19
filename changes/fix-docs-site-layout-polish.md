### Fixed
- `sd-titlebar`: under 48rem the bar keeps only its first `sd-titlebar-metric`, so the metrics no longer run into the centered brand (it still drops them all under 32rem).
- `sd-timeline-bar`: a bar too short for both years keeps the start year and ends the other with an ellipsis instead of cutting a digit at its edge.
- `sd-code`: a `pre` whose lines scroll shows a shade on its right edge until it is scrolled to the end, and its horizontal scroll no longer chains to the page. The block's fill is now `--sd-code-bg`.
