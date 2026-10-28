### Added
- `setLabels`, `getLabel` and `DEFAULT_LABELS` in `signal-design/js`: one table for the words the JS writes into the page (copy toasts, tag remove, sparkline trend, fps, table resize, sidebar toggle, window controls, countdown value text, stream alert defaults). English stays the default; `data-sd-empty` and an `aria-label` on the element still win. README "Translating labels" lists the keys.
- React: `busyText` on `Combobox` and `CommandPalette` (the Loading row), `pinLabel` and `collapseLabel` on `ShellToggle`, and `title` on a `TreeAction`.
- Charts: `locale` (a BCP-47 tag, default `"en"`) and `text` options on `createChart`, `setChartDefaults({ locale, text })`, `DEFAULT_CHART_TEXT`, and an optional `locale` argument on `formatTime`. Month names, am/pm and the 12 or 24 hour clock follow the locale.
- CSS: `--sd-tile-muted-label` replaces the `muted` mark a call tile draws (`sd-tile[data-muted]`).

### Changed
- The time axis date adapter reads the locale from the chart's options. With no locale set, ticks and tooltips are the same strings as before.
