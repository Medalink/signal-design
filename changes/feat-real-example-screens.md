### Added
- Icons: `hash`, `lock`, `reply`, `send`, `pin`, `people`, `settings`,
  `bell`, `smile`, `download`, `minimize`, `maximize`, `restore`,
  `container`, `chart`, `database`, `sliders`, `logs`, `theme` and `rain`.
- `.sd-rail-item:disabled` (and `aria-disabled="true"`) dims a rail section
  that is not available, like a disabled button.
- Checks: `shell-no-sidebar`, `shell-phone-label`, `table-sort-num`,
  `flat-masks` and `chart-teardown`.

### Changed
- The five example apps are real app screens instead of ACME demos.
  `shell.html` is a container dashboard: rows open to Restart, Follow logs
  and a Remove that asks first. `chat.html` is a group channel in the full
  app frame: group rail, resizable channel sidebar, a poll, replies, and
  members by role. `form.html` is AI settings: connected servers, a found server,
  command-line agents, and an add-a-server form that validates on blur and
  says why Detect and Connect are off. `charts.html` is a usage stats screen:
  range, tiles, CPU and memory plots with a limit line, and a per-container
  table. `landing.html` is a one-screen download page for a desktop app.
- The chart gallery and the formatting table moved from `charts.html` to the
  charts library page.
- `AGENTS.md` and the README point at `showcase/chat.html` for the whole app
  frame, and at `showcase/shell.html` for a shell with no sidebar.
- The shell's crumb bar and action bar are closed boxes as wide as their
  contents, instead of fading out with a gradient mask.
- `signal-design check` fails a gradient used as a mask, as it already did
  for a gradient used as a background.

### Fixed
- An `sd-shell` with no `sd-sidebar` kept four grid tracks on phones and
  squeezed `sd-shell-main` to about 96px. It now gets the full width.
- A sortable header with `sd-num` or `data-num` now aligns to the end like
  its cells. `th[data-sort]` used to reset it to the start.
- On phones the page name showed twice: in the top bar label and in the
  crumb chip under it. The chip and its bridge now hide when the top bar
  has a label.
- A chart destroyed before its font loaded threw an unhandled rejection
  when the font arrived.
