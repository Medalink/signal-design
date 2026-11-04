### Changed
- Regions and boxes are told apart by background tone instead of borders. New
  tokens: `--sd-tone-0` to `--sd-tone-3` (chrome, side panels, content,
  raised), `--sd-field-fill` (a field, chip or plain button: the fg mixed in at
  4% over its parent), the edge shadows `--sd-edge-below`, `-above`, `-left`
  and `-right` where a bar or panel meets what scrolls beside it, and
  `--sd-lift` for menus, popovers and dialogs. Tailwind gets `bg-tone-0` to
  `bg-tone-3`.
- The shell: the rail, sidebar, header, dock, aside, titlebar and status bar
  lose their hairlines for tone and edge shadows; rail tiles are filled. The
  main content box keeps its edge.
- Fields, selects, segmented controls, default buttons, chips, cards, polls,
  previews, tables and code blocks are filled, not outlined. Focus, status
  colors, selection markers, dashed drop zones, chart axes, the timeline and
  the checkbox, radio, switch and slider outlines keep their lines.
- `--sd-container` is now `--sd-tone-2`, and `--sd-fg-faint` is a step
  lighter in ink and graphite and a step darker in paper, so it keeps 4.5:1 on
  a field inside a card.
