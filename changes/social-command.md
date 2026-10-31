### Added
- `sd-command-search`: the palette's search field holds an optional icon at the start and a key hint (`sd-kbd`) at the end of the input. `CommandPalette` takes `icon` and `kbd` for them and always renders the input inside this wrapper.
- `sd-menu-lead`: an element before an option's label, centred on the row. `ListItem.leading` sets it in `Combobox` and `CommandPalette`, and `setOptions()` takes `leading` as text or a node. The lib page's command block gains a quick-switcher example.

### Fixed
- A toned `sd-avatar` inside an `sd-menu` row keeps its own text color instead of taking its fill as the text color, which hid the initials.
