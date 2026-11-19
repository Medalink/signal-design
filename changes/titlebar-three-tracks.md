### Fixed
- `sd-titlebar`: a three-track grid keeps the centered brand clear of the
  start and end groups at any width and brand length. Metrics in
  `sd-titlebar-end` that do not fit drop out whole, from the left, which
  replaces the 48rem rule that kept only the first metric. A brand inside
  `sd-titlebar-start` stays at the left edge. The window controls' focus
  ring draws inside the button.
