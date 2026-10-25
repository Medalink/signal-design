### Added
- Reading face: Literata (OFL, variable, weights 400 to 600, regular and italic, Latin and Latin Extended, 130 KB in four files) with `--sd-font-reading` and the `font-reading` utility. `<Manuscript face="reading">` (`data-face="reading"` on `sd-manuscript-page`) and the new `sd-reading` class set prose in it, with real italics and a semibold for `strong`. Interface text never uses it, and `data-font` does not change it.
- Font opt-out: `signal-design/css/core` (and `dist/signal-core.css`) is the whole library with no `@font-face`. Each face is its own file: `signal-design/css/fonts/source-code-pro`, `leon-sans` and `literata` (and `dist/font-<family>.css`). An app imports the core and the faces it uses, and the bundler copies only those files.

### Changed
- The `@font-face` rules moved out of `tokens.css` into `font-<family>.css`. `signal-design`, `signal-design/css` and `dist/signal.css` still declare every face, so existing consumers get the same stylesheet plus the Literata faces, `--sd-font-reading` and the `sd-reading` rules.
