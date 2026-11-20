### Fixed
- Every disabled Signal part keeps its words at 4.5:1 or better in ink,
  graphite and paper instead of fading to 35-50%: disabled fields (value and
  placeholder, WebKit included), field labels and hints, `sd-check` text,
  `sd-menu` items, tree rows, `sd-item`, `sd-sidebar-link`, `sd-icon-btn`,
  `sd-rail-tile`, roster rows, reactions, thread chips, file and image
  attachments, voice controls, flow jobs, slash commands, gutter markers and
  status bar segments (new `components/disabled.css`). Icons and images
  inside drop to 45%; avatars and status counts keep their color. Emoji
  buttons, checkboxes, radios and ranges keep the fade.
- An `sd-btn` that is busy and disabled no longer fades twice.
