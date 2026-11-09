### Changed
- The docs sidebar is an `aside` landmark now ("Library navigation"), so the
  filter field, the tier radios and the release link sit inside a landmark and
  the axe `region` rule passes on every library page.

### Fixed
- The hard-rule sweep no longer loses clicks to mid-transition layouts: the
  shell and chat checks wait out the finite animations of what they just
  toggled or hovered before the next click, and a busy run now warms every
  showcase page once before the pool, so a cold dev-server compile burst
  cannot push a page load past its timeout. A failed step names the locator
  from Playwright's call log, so a lab incident says what did not click.
