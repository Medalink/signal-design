### Added
- Decision polls: `sd-poll-head` holds the state badge and the time left,
  `data-tone` on `sd-poll` lights its start edge while it waits,
  `data-chosen` marks the picked option (the only one drawn as selected once
  it is set), and `sd-poll-voters` names who tapped an option, each name in
  its `--who`. `sd-poll-foot` is a meta row under the options. A check icon
  (`sd-icon`) in an option's text is spaced and aligned.

### Fixed
- A disabled `sd-poll-option` (a closed or decided poll) keeps full contrast
  and no hover instead of the 35% disabled-button dim. Long questions and
  option text wrap instead of overflowing, and the count keeps its width.
