### Added
- Stream scenes for OBS browser sources: `sd-scene`, a 16:9 frame laid out in
  1920×1080 units (`--sd-u`), with a masked fade, copy (kicker, title, count,
  line), a bottom bar of latest-event labels and socials, a webcam frame with
  a name tag, a goal in square cells, rolling credits and `sd-live`.
- `sd-stream-alert` and `mountStream(scene)`: queued follow, sub, raid and bits
  alerts in their tones, with a burst of flat square particles, a one-pass
  shimmer on the name, `sd:alert` events, and labels, goals and timers that
  update themselves.
- The Stream example: starting soon, in game, BRB and ending scenes on the
  rain field. `stream.html?scene=start|game|brb|end` is one scene alone, ready
  to add to OBS at 1920×1080; `&demo` plays sample alerts.
