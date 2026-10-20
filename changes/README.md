# Changelog fragments

Do not edit `CHANGELOG.md` in a pull request. Add one file here instead, named
after your branch (`feat/level-meter` → `changes/feat-level-meter.md`):

```md
### Added
- `sd-level`: a live level meter (2 to 8 bars) driven by `--level` from 0 to
  1, with `role="meter"`.
```

Headings are `### Added`, `### Changed`, `### Fixed` or `### Removed`; one
file can hold several. CI runs `node scripts/changelog.mjs --check`. At release,
`node scripts/changelog.mjs` moves every fragment under `## Unreleased` in
`CHANGELOG.md` and deletes the files.
