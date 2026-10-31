### Added
- `sd-suggest-command`: a slash-command row for the composer's suggestion list, with the command in mono and its arguments faint on the right. `data-sd-trigger-start="/"` opens the list only when the text starts with `/`, so `@` mentions keep working on the same textarea, and `data-trigger` on an option keeps it to one trigger character.

### Changed
- The suggestion list now sets `aria-selected="true"` on the active option (as the README already said), so it shows the menu's current marker. A command row is filtered by its name, not by its argument hint.
