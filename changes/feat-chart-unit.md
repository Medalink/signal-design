### Changed
- Charts: `createChart` accepts `unit` to override the preset's unit on the
  axis, thresholds, events and tooltips, so the `bandwidth` preset plots any
  per-second series (tok/s) without printing Gbps.
- Charts: non-Mbps, non-ms values format compactly (`4.4K/min`,
  `2.1M/min`) instead of up to 4 decimals.
- Charts: the `core` preset's `y1` ticks use the first `y1` series' unit
  instead of a hard-coded ` ms`.
