### Added
- `sd-link-card-media`: a link card that is only an image, GIF or `<video>`, shown whole (up to 20rem, `--sd-media-max`, or `sd-link-card-compact` for 6rem) with no padding classes.
- `sd-link-card-dismiss`: a button slot that removes a preview. It holds the top of the end column and floats over the corner of a hero or media card.
- `sd-link-card-thumb-label` and `sd-link-card-thumb-action`: a label and a button over the corners of a media thumb, such as Paused and Play on a GIF.

### Changed
- `.sd-link-card[role="link"]` hovers like `a.sd-link-card` (the start edge turns `fg`) and takes the pointer cursor, so an app that opens the card itself can render a `<div>`. `sd-link-card` is now `position: relative`.
