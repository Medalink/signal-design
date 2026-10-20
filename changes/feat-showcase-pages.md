### Changed
- Showcase: the single components page is now an overview plus one page per
  section (Tokens, Elements, Components, Conversation, Inputs, Charts, Effects,
  JS). The overview has a card for every page, and old `#section` links
  redirect to the page that holds them. `showcase/pages.js` is the one list of
  pages; the rail, nav palette, vite inputs and check scripts read it.
- Showcase: every page, library and example, has a bar at the top. It links back
  to the library, says where you are (a grey Mock badge on example apps), lists
  every page in a menu, and holds the theme, the width switch and a settings
  popover for chart colors, scrollbars and digital rain. It is compact on
  phones. The scrollbars choice is now remembered like the theme.
- Behavior checks in `scripts/checks/` declare the page they run on with
  `export const page = "<id>"`. See `CONTRIBUTING.md`.

### Added
- Showcase: each library page opens with what the section is for, its
  principles, and when to use it or leave it out, before the blocks.
- Showcase: a Themes side by side block on the Tokens page.
- `scripts/check-showcase-pages.mjs` and `scripts/check-showcase-bar.mjs`: checks
  for the page chrome, hash redirects and the bar, run by `scripts/check.mjs`.
