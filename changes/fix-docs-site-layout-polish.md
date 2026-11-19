### Fixed
- `sd-titlebar`: under 48rem the bar keeps only its first `sd-titlebar-metric`, so the metrics no longer run into the centered brand (it still drops them all under 32rem).
- `sd-timeline-bar`: a bar too short for both years keeps the start year and ends the other with an ellipsis instead of cutting a digit at its edge.
