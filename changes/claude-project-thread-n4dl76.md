### Changed
- `sd-message`: a new layout for conversations. A 64px time column on the
  left, then the text; the author's name (`sd-message-author`) opens the first
  line and the text follows inline. A grouped follow-up has no time and no
  name, and every row keeps one rhythm (4px above and below a 24px line), with
  no extra gap when the author changes. Avatars are no longer part of a
  message. Markup written for the avatar layout needs the new structure (see
  the Conversation page).
- Names take the person's color through `--who` and fall back to `extra`: the
  author, an `sd-mention` (text only, no fill), a quoted author and the reply
  bar. AGENTS.md rule 3 says so.
- `data-own` gives the viewer's own messages a grey edge instead of a fill.
- `sd-message-actions`: quick reactions, then Add reaction and Reply with key
  tips (`data-key`), then More. 32px targets, rules between the groups, and it
  is revealed by opacity, so Tab reaches it (it used `display: none`).
- `sd-reactions`: emoji first, a small quiet count, soft hairlines, and an
  `sd-reactions-add` button that shows on hover.
- `sd-typing`: the squares step like a cursor while someone types. AGENTS.md
  rule 6 allows live activity to loop while it lasts.
- `sd-composer`: one + (`sd-composer-add`) opens every content type, the text
  starts right after it, and send stays quiet until there is text.
- Paper: conversation hairlines are lighter.

### Added
- `sd-message-time`, `sd-message-tag`, `sd-message-meta`, `sd-message-timer`,
  `data-reply` with `sd-message-ref` and `sd-message-ref-mark`, `data-editing`
  with `sd-message-edit`, and `data-hover` to hold a row's hover while its menu
  is open.
- `sd-message-menu` (icon, label and key rows), `sd-add-menu` (the + menu)
  and `sd-emoji-picker` (search, categories, grid and a footer that names the
  emoji under the pointer).
- `sd-feed-day` (a day line that sticks to the top of the scroller over
  `--sd-feed-bg`), icons in the time column for `sd-event`, and `sd-feed-jump`
  (Jump to present).
- `sd-composer-reply` (the reply bar) and `sd-composer-status` (the typing
  line above the composer); in an `sd-shell-dock` they share one box.
- `sd-shell-dock[data-flush]` rests the dock on the bottom of the window.
- `sd-roster`: people in a large conversation, one section per role with a
  sticky, collapsible head and online / total, rows by `data-presence`
  (`online`, `offline`, `unresolved`) and an `sd-roster-more` row for paging.
- Motion on state change for conversations: `data-new` entrances for rows,
  events, reactions and status icons, `data-flash` for a jumped-to row and
  `data-leaving` to fold a row out.

### Fixed
- `sd-reply > b` no longer shrinks a name to one letter next to a long quote.
- `sd-composer` no longer overflows a narrow container.
