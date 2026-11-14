### Changed
- Pointer prediction aims at where a slowing pointer will stop instead of the
  first target on its line, and a hover counts only once the pointer comes to
  rest. A scan down a long list of `data-sd-prefetch` links now prefetches the
  one it stops on, not every link it crosses. `eta` is measured at the rate the
  pointer is slowing.
