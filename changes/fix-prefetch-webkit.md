### Fixed
- `data-sd-prefetch` and `prefetch(url)` now load the URL in WebKit (Safari,
  Tauri on macOS and Linux), which ignores `<link rel="prefetch">`: there they
  also run a low-priority `fetch()`.
