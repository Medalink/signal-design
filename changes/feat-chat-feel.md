### Added
- `data-sd-follow` on a feed scroller keeps the newest row in view while the
  reader is at the bottom: rows arriving, images loading, a composer or reply
  bar growing under it. Scrolled up, it holds still and shows the
  `sd-feed-jump` bar placed after the scroller; the bar's button rides back
  down in 200ms (at once under reduced motion). A framework that renders the
  jump bar leaves the attribute out.
- `data-joined` on `sd-shell-main` makes the header bar, the content and the
  dock one surface: no gap, no bridges, a hairline under the bar in line with
  the sidebar and aside heads, and the dock inset 16px (8px on phones). A
  composer in a joined dock keeps its own edge, with the typing line over it.

- `initKeyboard()` (called by `init()`): while a phone's on-screen keyboard
  is up it sets `data-sd-keyboard`, `--sd-view-height` and `--sd-view-top`
  on `<html>`, and `sd-shell` fits the screen above the keyboard and moves
  with the page the browser slid up, so the header stays and the composer
  sits on the keyboard. The status bar steps aside while you type. Before,
  iOS slid the whole shell up and the header left the screen. Framework apps
  can call it alone.
- `data-sd-contextmenu` opens its menu on a long press on a touch screen,
  where the finger lifts (iOS sends no right click). The held row carries
  `data-sd-held` and lights like a hover; on a coarse pointer the row starts
  no text selection or system callout.

### Changed
- A count in `sd-icon-btn` sits after the icon instead of over its corner,
  so it no longer covers the glyph.
- The chat example is one joined surface and behaves like a live room: the
  feed follows new messages, Rosa's typing ends in a message, your first two
  messages get an answer, R, E, C and P act on the hovered or focused
  message, Up in an empty composer edits your last message, Escape drops a
  reply, a quoted line jumps to its message, the message menu offers Edit and
  Delete on your own messages and Pin or Unpin on any, Delete folds the row
  out with Undo, and Retry resends in place. Reply uses the reply icon
  everywhere. On a phone, a long press opens the message menu with the quick
  reactions over the message, and the keyboard's return key reads Send
  (`enterkeyhint`).

### Fixed
- In the chat example, clicking anywhere on a message that is itself a reply
  started a reply to it: the action bar's Reply button and the reply state
  both used `data-reply`.
