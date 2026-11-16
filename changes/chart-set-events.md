### Added
- Charts: `setEvents(events)` replaces the surge and drop markers of a live chart in place, the way `setRanges` replaces its ranges. Before, a host had to destroy the chart and create it again to change its markers, which repainted the canvas over several frames.
