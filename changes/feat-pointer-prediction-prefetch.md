### Added
- Pointer prediction: `data-sd-predict` targets get an `sd:predict` event
  (`via` `path`, `hover`, `touch` or `focus`, and `eta` in ms on a path) when
  the mouse heads for them, once per approach, and `data-sd-predicted` while
  predicted. `data-sd-prefetch` links also add `<link rel="prefetch">` for
  their same-origin URL, skipped under Save-Data. `predict(el, fn)`,
  `prefetch(url)` and `initPredict()` from `signal-design/js`; `init()` calls
  `initPredict()`.
