### Added
- Font picker: `data-font="system | leon-sans | source-code-pro"` on `<html>`
  or any element sets the text face; `setFont`, `getFont`, `restoreFont`,
  `FONTS`, `data-sd-font` and the `sd:font` event drive it. `system` (SF Pro)
  stays the default. Code, charts and the rain keep Source Code Pro.
- Leon Sans (OFL, 400-500, 115 KB) and a medium Source Code Pro text face are
  bundled. Each is fetched only when picked.
- Font tokens `--sd-font-sans`, `--sd-font-mono` and `--sd-font-system`.

### Changed
- `font-sans` and `font-mono` now read `--sd-font-sans` and `--sd-font-mono`,
  so Tailwind utilities follow the picker. Charts and the digital rain read
  the code face from `--sd-font-mono` instead of naming it.
